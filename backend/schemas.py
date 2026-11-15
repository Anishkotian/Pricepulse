from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def _naive(v: Optional[datetime]) -> Optional[datetime]:
    return v.replace(tzinfo=None) if v is not None else v


# ---------- Auth ----------
class UserCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    name: str
    email: str
    role: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Categories / Shops ----------
class CategoryIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    category_name: str = Field(min_length=2, max_length=80)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    category_id: int
    category_name: str
    product_count: int = 0


class ShopIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    shop_name: str = Field(min_length=2, max_length=120)
    location: str = Field(min_length=2, max_length=200)
    contact: Optional[str] = Field(default=None, max_length=30)

    @field_validator("contact")
    @classmethod
    def blank_contact(cls, v):
        return v or None


class ShopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    shop_id: int
    shop_name: str
    location: str
    contact: Optional[str] = None
    price_count: int = 0


# ---------- Products ----------
class ProductIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    product_name: str = Field(min_length=2, max_length=150)
    brand: str = Field(min_length=1, max_length=100)
    category_id: int
    unit: str = Field(min_length=1, max_length=30)
    image_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator("image_url")
    @classmethod
    def valid_url(cls, v):
        if not v:
            return None
        if not v.startswith(("http://", "https://")):
            raise ValueError("Image URL must start with http:// or https://")
        return v


class ProductOut(BaseModel):
    product_id: int
    product_name: str
    brand: str
    category_id: int
    category_name: str
    unit: str
    image_url: Optional[str] = None
    lowest_price: Optional[float] = None
    highest_price: Optional[float] = None
    shop_count: int = 0


# ---------- Prices ----------
class PriceItem(BaseModel):
    shop_id: int
    price: Decimal = Field(gt=0, le=1000000, max_digits=10, decimal_places=2)


class PriceCreate(PriceItem):
    product_id: int
    recorded_at: Optional[datetime] = None

    @field_validator("recorded_at")
    @classmethod
    def strip_tz(cls, v):
        return _naive(v)


class PriceBulkCreate(BaseModel):
    product_id: int
    items: List[PriceItem] = Field(min_length=1, max_length=20)
    recorded_at: Optional[datetime] = None

    @field_validator("recorded_at")
    @classmethod
    def strip_tz(cls, v):
        return _naive(v)

    @field_validator("items")
    @classmethod
    def unique_shops(cls, v):
        ids = [i.shop_id for i in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Each shop can appear only once")
        return v


class PriceInsertResult(BaseModel):
    inserted: int
    recorded_at: datetime


class PriceRecordOut(BaseModel):
    price_id: int
    product_id: int
    product_name: str
    unit: str
    shop_id: int
    shop_name: str
    price: float
    recorded_at: datetime
    submitted_by_name: Optional[str] = None


class ShopPriceOut(BaseModel):
    shop_id: int
    shop_name: str
    location: str
    contact: Optional[str] = None
    price: float
    recorded_at: datetime
    is_cheapest: bool
    extra_vs_cheapest: float


class ComparisonOut(BaseModel):
    product: ProductOut
    prices: List[ShopPriceOut]
    shop_count: int
    cheapest_shop: Optional[str] = None
    lowest_price: Optional[float] = None
    highest_price: Optional[float] = None
    average_price: Optional[float] = None
    difference: Optional[float] = None
    note: str


class SavingsOut(BaseModel):
    product_id: int
    quantity: int
    cheapest_shop: str
    cheapest_price: float
    highest_shop: str
    highest_price: float
    total_at_cheapest: float
    total_at_highest: float
    savings: float


class HistoryPoint(BaseModel):
    price_id: int
    shop_id: int
    shop_name: str
    price: float
    recorded_at: datetime


class PriceStats(BaseModel):
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    avg_price: Optional[float] = None
    record_count: int = 0


class ShopStats(PriceStats):
    shop_id: int
    shop_name: str
    last_recorded_at: datetime


class HistoryOut(BaseModel):
    product: ProductOut
    points: List[HistoryPoint]
    stats: PriceStats
    per_shop: List[ShopStats]
    note: str