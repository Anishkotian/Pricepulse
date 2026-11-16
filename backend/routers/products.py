from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import Category, Product
from schemas import ProductIn, ProductOut
from services import pricing

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[ProductOut])
def list_products(
    q: Optional[str] = Query(None, max_length=100),
    category_id: Optional[int] = None,
    sort: str = Query("name", pattern="^(name|price_asc|price_desc)$"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return pricing.list_products(db, q, category_id, sort, limit, offset)


@router.get("/featured", response_model=List[ProductOut])
def featured(limit: int = Query(8, ge=1, le=24), db: Session = Depends(get_db)):
    return pricing.featured_products(db, limit)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return pricing.get_product(db, product_id)


@router.post("", response_model=ProductOut, status_code=201, dependencies=[Depends(require_admin)])
def create_product(payload: ProductIn, db: Session = Depends(get_db)):
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(422, "Selected category does not exist")
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This product (same name, brand and unit) already exists")
    return pricing.get_product(db, product.product_id)


@router.put("/{product_id}", response_model=ProductOut, dependencies=[Depends(require_admin)])
def update_product(product_id: int, payload: ProductIn, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Product not found")
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(422, "Selected category does not exist")
    for k, v in payload.model_dump().items():
        setattr(product, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This product (same name, brand and unit) already exists")
    return pricing.get_product(db, product_id)


@router.delete("/{product_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(404, "Product not found")
    db.delete(product)  # its price records are removed by ON DELETE CASCADE
    db.commit()