from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from models import PriceRecord, Product, Shop, User
from schemas import PriceRecordOut

NOTE = (
    "Demonstration data: prices are sample / manually entered values shown with the "
    "date they were recorded. They are not live or verified prices."
)


def _latest_cte(single: bool = False) -> str:
    """Latest price per (product, shop): rank each shop's records newest-first, keep rank 1."""
    where = "WHERE pr.product_id = :pid" if single else ""
    return f"""
    WITH latest AS (
        SELECT pr.product_id, pr.shop_id, pr.price, pr.recorded_at,
               ROW_NUMBER() OVER (
                   PARTITION BY pr.product_id, pr.shop_id
                   ORDER BY pr.recorded_at DESC, pr.price_id DESC
               ) AS rn
        FROM price_records pr
        {where}
    )
    """


_PRODUCT_SELECT = """
SELECT p.product_id, p.product_name, p.brand, p.category_id, c.category_name,
       p.unit, p.image_url,
       MIN(l.price) AS lowest_price,
       MAX(l.price) AS highest_price,
       COUNT(l.shop_id) AS shop_count
FROM products p
JOIN categories c ON c.category_id = p.category_id
LEFT JOIN latest l ON l.product_id = p.product_id AND l.rn = 1
"""

_GROUP = """
GROUP BY p.product_id, p.product_name, p.brand, p.category_id, c.category_name, p.unit, p.image_url
"""

_SORTS = {
    "name": "p.product_name ASC",
    "price_asc": "(MIN(l.price) IS NULL), MIN(l.price) ASC, p.product_name ASC",
    "price_desc": "MIN(l.price) DESC, p.product_name ASC",
}


def _product_dict(row) -> dict:
    d = dict(row._mapping)
    for k in ("lowest_price", "highest_price"):
        if d[k] is not None:
            d[k] = float(d[k])
    return d


def list_products(db: Session, q=None, category_id=None, sort="name", limit=50, offset=0):
    where, params = [], {"limit": limit, "offset": offset}
    if q:
        where.append("(p.product_name LIKE :q OR p.brand LIKE :q)")
        params["q"] = f"%{q.strip()}%"
    if category_id:
        where.append("p.category_id = :cid")
        params["cid"] = category_id
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""
    order = _SORTS.get(sort, _SORTS["name"])
    sql = (
        _latest_cte() + _PRODUCT_SELECT + where_sql + _GROUP
        + f" ORDER BY {order} LIMIT :limit OFFSET :offset"
    )
    return [_product_dict(r) for r in db.execute(text(sql), params)]


def featured_products(db: Session, limit=8):
    """Products with the biggest gap between cheapest and dearest shop (GROUP BY + HAVING)."""
    sql = (
        _latest_cte() + _PRODUCT_SELECT + _GROUP
        + " HAVING COUNT(l.shop_id) >= 2"
        + " ORDER BY (MAX(l.price) - MIN(l.price)) DESC, p.product_name ASC LIMIT :limit"
    )
    return [_product_dict(r) for r in db.execute(text(sql), {"limit": limit})]


def get_product(db: Session, product_id: int) -> dict:
    sql = _latest_cte(single=True) + _PRODUCT_SELECT + "WHERE p.product_id = :pid" + _GROUP
    row = db.execute(text(sql), {"pid": product_id}).first()
    if row is None:
        raise HTTPException(404, "Product not found")
    return _product_dict(row)


def compare_prices(db: Session, product_id: int) -> dict:
    product = get_product(db, product_id)
    sql = _latest_cte(single=True) + """
    SELECT s.shop_id, s.shop_name, s.location, s.contact, l.price, l.recorded_at
    FROM latest l
    JOIN shops s ON s.shop_id = l.shop_id
    WHERE l.rn = 1
    ORDER BY l.price ASC, s.shop_name ASC
    """
    rows = db.execute(text(sql), {"pid": product_id}).all()
    prices = [float(r.price) for r in rows]
    lowest = min(prices) if prices else None
    out = []
    for r in rows:
        price = float(r.price)
        out.append(
            {
                "shop_id": r.shop_id,
                "shop_name": r.shop_name,
                "location": r.location,
                "contact": r.contact,
                "price": price,
                "recorded_at": r.recorded_at,
                "is_cheapest": price == lowest,
                "extra_vs_cheapest": round(price - lowest, 2),
            }
        )
    return {
        "product": product,
        "prices": out,
        "shop_count": len(out),
        "cheapest_shop": out[0]["shop_name"] if out else None,
        "lowest_price": lowest,
        "highest_price": max(prices) if prices else None,
        "average_price": round(sum(prices) / len(prices), 2) if prices else None,
        "difference": round(max(prices) - lowest, 2) if prices else None,
        "note": NOTE,
    }


def savings(db: Session, product_id: int, quantity: int) -> dict:
    data = compare_prices(db, product_id)
    if not data["prices"]:
        raise HTTPException(404, "No prices recorded for this product yet")
    cheapest, dearest = data["prices"][0], data["prices"][-1]
    return {
        "product_id": product_id,
        "quantity": quantity,
        "cheapest_shop": cheapest["shop_name"],
        "cheapest_price": cheapest["price"],
        "highest_shop": dearest["shop_name"],
        "highest_price": dearest["price"],
        "total_at_cheapest": round(cheapest["price"] * quantity, 2),
        "total_at_highest": round(dearest["price"] * quantity, 2),
        # Savings = (Highest Price - Lowest Price) x Quantity
        "savings": round((dearest["price"] - cheapest["price"]) * quantity, 2),
    }


def price_history(db: Session, product_id: int, shop_id: Optional[int] = None) -> dict:
    product = get_product(db, product_id)
    params = {"pid": product_id}
    shop_filter = ""
    if shop_id:
        shop_filter = "AND pr.shop_id = :sid"
        params["sid"] = shop_id

    points = db.execute(
        text(f"""
        SELECT pr.price_id, pr.shop_id, s.shop_name, pr.price, pr.recorded_at
        FROM price_records pr
        JOIN shops s ON s.shop_id = pr.shop_id
        WHERE pr.product_id = :pid {shop_filter}
        ORDER BY pr.recorded_at ASC, pr.price_id ASC
        """),
        params,
    ).all()

    stats = db.execute(
        text(f"""
        SELECT MIN(pr.price) AS min_price, MAX(pr.price) AS max_price,
               AVG(pr.price) AS avg_price, COUNT(*) AS record_count
        FROM price_records pr
        WHERE pr.product_id = :pid {shop_filter}
        """),
        params,
    ).first()

    per_shop = db.execute(
        text(f"""
        SELECT pr.shop_id, s.shop_name,
               MIN(pr.price) AS min_price, MAX(pr.price) AS max_price,
               AVG(pr.price) AS avg_price, COUNT(*) AS record_count,
               MAX(pr.recorded_at) AS last_recorded_at
        FROM price_records pr
        JOIN shops s ON s.shop_id = pr.shop_id
        WHERE pr.product_id = :pid {shop_filter}
        GROUP BY pr.shop_id, s.shop_name
        ORDER BY s.shop_name
        """),
        params,
    ).all()

    def f(x):
        return None if x is None else round(float(x), 2)

    return {
        "product": product,
        "points": [
            {
                "price_id": p.price_id,
                "shop_id": p.shop_id,
                "shop_name": p.shop_name,
                "price": float(p.price),
                "recorded_at": p.recorded_at,
            }
            for p in points
        ],
        "stats": {
            "min_price": f(stats.min_price),
            "max_price": f(stats.max_price),
            "avg_price": f(stats.avg_price),
            "record_count": stats.record_count,
        },
        "per_shop": [
            {
                "shop_id": r.shop_id,
                "shop_name": r.shop_name,
                "min_price": f(r.min_price),
                "max_price": f(r.max_price),
                "avg_price": f(r.avg_price),
                "record_count": r.record_count,
                "last_recorded_at": r.last_recorded_at,
            }
            for r in per_shop
        ],
        "note": NOTE,
    }


def list_price_records(db: Session, product_id=None, shop_id=None, limit=50, offset=0):
    stmt = (
        select(PriceRecord, Product.product_name, Product.unit, Shop.shop_name, User.name)
        .join(Product, Product.product_id == PriceRecord.product_id)
        .join(Shop, Shop.shop_id == PriceRecord.shop_id)
        .outerjoin(User, User.user_id == PriceRecord.submitted_by)
        .order_by(PriceRecord.recorded_at.desc(), PriceRecord.price_id.desc())
        .limit(limit)
        .offset(offset)
    )
    if product_id:
        stmt = stmt.where(PriceRecord.product_id == product_id)
    if shop_id:
        stmt = stmt.where(PriceRecord.shop_id == shop_id)
    return [
        PriceRecordOut(
            price_id=pr.price_id,
            product_id=pr.product_id,
            product_name=pname,
            unit=unit,
            shop_id=pr.shop_id,
            shop_name=sname,
            price=float(pr.price),
            recorded_at=pr.recorded_at,
            submitted_by_name=uname,
        )
        for pr, pname, unit, sname, uname in db.execute(stmt).all()
    ]


def now_seconds() -> datetime:
    return datetime.now().replace(microsecond=0)