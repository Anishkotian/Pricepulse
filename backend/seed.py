"""Creates demo accounts. Run AFTER loading database/schema.sql and sample_data.sql."""
from sqlalchemy import func, select

from auth import hash_password
from database import SessionLocal
from models import Category, PriceRecord, Product, Shop, User

DEMO_USERS = [
    ("PricePulse Admin", "admin@pricepulse.com", "Admin@123", "admin"),
    ("Demo User", "user@pricepulse.com", "User@123", "user"),
]


def run():
    db = SessionLocal()
    try:
        for name, email, password, role in DEMO_USERS:
            user = db.scalar(select(User).where(User.email == email))
            if user:
                user.name, user.password_hash, user.role = name, hash_password(password), role
                action = "updated"
            else:
                db.add(User(name=name, email=email, password_hash=hash_password(password), role=role))
                action = "created"
            print(f"{action}: {email} ({role})")
        db.commit()

        for label, model in [
            ("users", User),
            ("categories", Category),
            ("shops", Shop),
            ("products", Product),
            ("price records", PriceRecord),
        ]:
            print(f"{label}: {db.scalar(select(func.count()).select_from(model))}")
    finally:
        db.close()


if __name__ == "__main__":
    run()