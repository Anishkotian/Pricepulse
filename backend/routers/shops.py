from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import PriceRecord, Shop
from schemas import ShopIn, ShopOut

router = APIRouter(prefix="/shops", tags=["Shops"])


def _out(db: Session, shop_id: int) -> ShopOut:
    row = db.execute(
        select(Shop, func.count(PriceRecord.price_id))
        .outerjoin(PriceRecord, PriceRecord.shop_id == Shop.shop_id)
        .where(Shop.shop_id == shop_id)
        .group_by(Shop.shop_id)
    ).first()
    s, n = row
    return ShopOut(shop_id=s.shop_id, shop_name=s.shop_name, location=s.location, contact=s.contact, price_count=n)


@router.get("", response_model=List[ShopOut])
def list_shops(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Shop, func.count(PriceRecord.price_id))
        .outerjoin(PriceRecord, PriceRecord.shop_id == Shop.shop_id)
        .group_by(Shop.shop_id)
        .order_by(Shop.shop_name)
    ).all()
    return [
        ShopOut(shop_id=s.shop_id, shop_name=s.shop_name, location=s.location, contact=s.contact, price_count=n)
        for s, n in rows
    ]


@router.post("", response_model=ShopOut, status_code=201, dependencies=[Depends(require_admin)])
def create_shop(payload: ShopIn, db: Session = Depends(get_db)):
    shop = Shop(**payload.model_dump())
    db.add(shop)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A shop with this name and location already exists")
    return _out(db, shop.shop_id)


@router.put("/{shop_id}", response_model=ShopOut, dependencies=[Depends(require_admin)])
def update_shop(shop_id: int, payload: ShopIn, db: Session = Depends(get_db)):
    shop = db.get(Shop, shop_id)
    if shop is None:
        raise HTTPException(404, "Shop not found")
    for k, v in payload.model_dump().items():
        setattr(shop, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A shop with this name and location already exists")
    return _out(db, shop_id)


@router.delete("/{shop_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.get(Shop, shop_id)
    if shop is None:
        raise HTTPException(404, "Shop not found")
    db.delete(shop)  # its price records are removed by ON DELETE CASCADE
    db.commit()