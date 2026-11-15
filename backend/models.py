from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"
    user_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(Enum("admin", "user"), default="user", server_default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    price_records: Mapped[List["PriceRecord"]] = relationship(back_populates="submitter")


class Category(Base):
    __tablename__ = "categories"
    category_id: Mapped[int] = mapped_column(primary_key=True)
    category_name: Mapped[str] = mapped_column(String(80), unique=True)

    products: Mapped[List["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"
    product_id: Mapped[int] = mapped_column(primary_key=True)
    product_name: Mapped[str] = mapped_column(String(150))
    brand: Mapped[str] = mapped_column(String(100))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.category_id"))
    unit: Mapped[str] = mapped_column(String(30))
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    category: Mapped["Category"] = relationship(back_populates="products")
    price_records: Mapped[List["PriceRecord"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", passive_deletes=True
    )


class Shop(Base):
    __tablename__ = "shops"
    shop_id: Mapped[int] = mapped_column(primary_key=True)
    shop_name: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(200))
    contact: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    price_records: Mapped[List["PriceRecord"]] = relationship(
        back_populates="shop", cascade="all, delete-orphan", passive_deletes=True
    )


class PriceRecord(Base):
    __tablename__ = "price_records"
    price_id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id", ondelete="CASCADE"))
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.shop_id", ondelete="CASCADE"))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    recorded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    submitted_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )

    product: Mapped["Product"] = relationship(back_populates="price_records")
    shop: Mapped["Shop"] = relationship(back_populates="price_records")
    submitter: Mapped[Optional["User"]] = relationship(back_populates="price_records")
