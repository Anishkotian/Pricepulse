from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import Category, Product
from schemas import CategoryIn, CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])


def _out(db: Session, category_id: int) -> CategoryOut:
    row = db.execute(
        select(Category.category_id, Category.category_name, func.count(Product.product_id))
        .outerjoin(Product, Product.category_id == Category.category_id)
        .where(Category.category_id == category_id)
        .group_by(Category.category_id, Category.category_name)
    ).first()
    return CategoryOut(category_id=row[0], category_name=row[1], product_count=row[2])


@router.get("", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Category.category_id, Category.category_name, func.count(Product.product_id))
        .outerjoin(Product, Product.category_id == Category.category_id)
        .group_by(Category.category_id, Category.category_name)
        .order_by(Category.category_name)
    ).all()
    return [CategoryOut(category_id=r[0], category_name=r[1], product_count=r[2]) for r in rows]


@router.post("", response_model=CategoryOut, status_code=201, dependencies=[Depends(require_admin)])
def create_category(payload: CategoryIn, db: Session = Depends(get_db)):
    cat = Category(category_name=payload.category_name)
    db.add(cat)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A category with this name already exists")
    return _out(db, cat.category_id)


@router.put("/{category_id}", response_model=CategoryOut, dependencies=[Depends(require_admin)])
def update_category(category_id: int, payload: CategoryIn, db: Session = Depends(get_db)):
    cat = db.get(Category, category_id)
    if cat is None:
        raise HTTPException(404, "Category not found")
    cat.category_name = payload.category_name
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A category with this name already exists")
    return _out(db, category_id)


@router.delete("/{category_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.get(Category, category_id)
    if cat is None:
        raise HTTPException(404, "Category not found")
    in_use = db.scalar(select(func.count()).select_from(Product).where(Product.category_id == category_id))
    if in_use:
        raise HTTPException(409, f"Cannot delete: {in_use} product(s) use this category")
    db.delete(cat)
    db.commit()