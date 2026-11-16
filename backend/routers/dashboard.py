from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import Category, PriceRecord, Product, Shop, User
from services import pricing

router = APIRouter(prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(require_admin)])


def _count(db: Session, model) -> int:
    return db.scalar(select(func.count()).select_from(model))


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    week_ago = datetime.now() - timedelta(days=7)
    per_category = db.execute(
        select(Category.category_name, func.count(Product.product_id))
        .outerjoin(Product, Product.category_id == Category.category_id)
        .group_by(Category.category_id, Category.category_name)
        .order_by(Category.category_name)
    ).all()
    return {
        "total_products": _count(db, Product),
        "total_shops": _count(db, Shop),
        "total_categories": _count(db, Category),
        "total_price_records": _count(db, PriceRecord),
        "total_users": _count(db, User),
        "records_last_7_days": db.scalar(
            select(func.count()).select_from(PriceRecord).where(PriceRecord.recorded_at >= week_ago)
        ),
        "products_per_category": [{"category": n, "count": c} for n, c in per_category],
        "recent_prices": [r.model_dump(mode="json") for r in pricing.list_price_records(db, limit=10)],
    }