from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import PriceRecord, Product, Shop, User
from schemas import (
    ComparisonOut, HistoryOut, PriceBulkCreate, PriceCreate, PriceInsertResult,
    PriceRecordOut, SavingsOut,
)
from services import pricing

router = APIRouter(prefix="/prices", tags=["Prices"])


@router.get("", response_model=List[PriceRecordOut], dependencies=[Depends(require_admin)])
def list_prices(
    product_id: Optional[int] = None,
    shop_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return pricing.list_price_records(db, product_id, shop_id, limit, offset)


@router.post("", response_model=PriceInsertResult, status_code=201)
def add_price(payload: PriceCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.get(Product, payload.product_id) is None:
        raise HTTPException(404, "Product not found")
    if db.get(Shop, payload.shop_id) is None:
        raise HTTPException(404, "Shop not found")
    when = payload.recorded_at or pricing.now_seconds()
    # Always INSERT a new row; old prices stay as history.
    db.add(PriceRecord(
        product_id=payload.product_id, shop_id=payload.shop_id,
        price=payload.price, recorded_at=when, submitted_by=admin.user_id,
    ))
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(500, "Could not save the price")
    return PriceInsertResult(inserted=1, recorded_at=when)


@router.post("/bulk", response_model=PriceInsertResult, status_code=201)
def add_prices_bulk(payload: PriceBulkCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.get(Product, payload.product_id) is None:
        raise HTTPException(404, "Product not found")
    ids = [i.shop_id for i in payload.items]
    found = set(db.scalars(select(Shop.shop_id).where(Shop.shop_id.in_(ids))).all())
    missing = [i for i in ids if i not in found]
    if missing:
        raise HTTPException(404, f"Shop(s) not found: {missing}")
    when = payload.recorded_at or pricing.now_seconds()
    try:
        # One transaction: all rows are saved together, or none are.
        db.add_all([
            PriceRecord(product_id=payload.product_id, shop_id=i.shop_id, price=i.price,
                        recorded_at=when, submitted_by=admin.user_id)
            for i in payload.items
        ])
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(500, "Could not save prices; nothing was changed")
    return PriceInsertResult(inserted=len(payload.items), recorded_at=when)


@router.delete("/record/{price_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_price_record(price_id: int, db: Session = Depends(get_db)):
    rec = db.get(PriceRecord, price_id)
    if rec is None:
        raise HTTPException(404, "Price record not found")
    db.delete(rec)
    db.commit()


@router.get("/{product_id}", response_model=ComparisonOut)
def compare(product_id: int, db: Session = Depends(get_db)):
    return pricing.compare_prices(db, product_id)


@router.get("/{product_id}/savings", response_model=SavingsOut)
def savings(product_id: int, quantity: int = Query(1, ge=1, le=10000), db: Session = Depends(get_db)):
    return pricing.savings(db, product_id, quantity)


@router.get("/{product_id}/history", response_model=HistoryOut)
def history(product_id: int, shop_id: Optional[int] = None, db: Session = Depends(get_db)):
    return pricing.price_history(db, product_id, shop_id)