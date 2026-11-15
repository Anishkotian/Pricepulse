"""Generates sample_data.sql. DEMONSTRATION DATA ONLY: prices are made-up sample
values, not live, verified or current market prices."""
import os
import random
from datetime import datetime, timedelta
from urllib.parse import quote_plus

ANCHOR = datetime(2026, 11, 15, 10, 0, 0)   # "now" for the demo data
rng = random.Random(42)

CATEGORIES = [
    (1, "Dairy & Beverages"),
    (2, "Staples & Grocery"),
    (3, "Snacks & Biscuits"),
    (4, "Personal Care & Household"),
    (5, "Stationery"),
]

# id, name, location, contact, price factor (some shops are cheaper on average)
SHOPS = [
    (1, "Sri Lakshmi Provisions", "Saraswathipuram, Mysuru", "+91 90000 00001", 1.00),
    (2, "Annapurna Super Bazaar", "Vijayanagar, Mysuru", "+91 90000 00002", 0.97),
    (3, "Gokulam Mart", "Gokulam, Mysuru", "+91 90000 00003", 1.02),
    (4, "Kaveri Fresh Store", "Kuvempunagar, Mysuru", "+91 90000 00004", 0.95),
    (5, "Chamundi Kirana & General", "Hebbal, Mysuru", "+91 90000 00005", 1.04),
    (6, "Mysore Daily Needs", "Lakshmipuram, Mysuru", "+91 90000 00006", 0.99),
    (7, "Hoysala Value Market", "Bogadi, Mysuru", "+91 90000 00007", 0.93),
    (8, "Basavanna Stores", "Nazarbad, Mysuru", "+91 90000 00008", 1.05),
    (9, "Sapna Family Supermart", "Jayalakshmipuram, Mysuru", "+91 90000 00009", 0.98),
    (10, "Vinayaka Trading Co.", "Devaraja Market, Mysuru", "+91 90000 00010", 1.01),
]

# (category_id, name, brand, unit, base price in INR). Product id = position (1..50)
PRODUCTS = [
    # 1 Dairy & Beverages (ids 1-10)
    (1, "Amul Taaza Toned Milk", "Amul", "1 L", 56),
    (1, "Nandini Toned Milk", "Nandini", "500 ml", 25),
    (1, "Amul Butter", "Amul", "500 g", 285),
    (1, "Amul Masti Dahi", "Amul", "400 g", 35),
    (1, "Amul Fresh Paneer", "Amul", "200 g", 95),
    (1, "Tata Tea Gold", "Tata Tea", "500 g", 295),
    (1, "Red Label Tea", "Brooke Bond", "500 g", 265),
    (1, "Nescafe Classic Coffee", "Nescafe", "100 g", 330),
    (1, "Bru Instant Coffee", "Bru", "100 g", 285),
    (1, "Real Mixed Fruit Juice", "Real", "1 L", 120),
    # 2 Staples & Grocery (ids 11-20)
    (2, "Tata Salt", "Tata", "1 kg", 28),
    (2, "Aashirvaad Whole Wheat Atta", "Aashirvaad", "5 kg", 275),
    (2, "Fortune Sunflower Oil", "Fortune", "1 L", 145),
    (2, "India Gate Basmati Rice", "India Gate", "5 kg", 680),
    (2, "Sona Masoori Rice", "Local Brand", "10 kg", 560),
    (2, "Madhur Sugar", "Madhur", "1 kg", 50),
    (2, "Tata Sampann Toor Dal", "Tata Sampann", "1 kg", 175),
    (2, "Tata Sampann Moong Dal", "Tata Sampann", "1 kg", 140),
    (2, "Everest Turmeric Powder", "Everest", "200 g", 78),
    (2, "Saffola Gold Oil", "Saffola", "1 L", 190),
    # 3 Snacks & Biscuits (ids 21-30)
    (3, "Parle-G Biscuits", "Parle", "800 g", 85),
    (3, "Britannia Good Day Cashew", "Britannia", "250 g", 55),
    (3, "Britannia Marie Gold", "Britannia", "250 g", 40),
    (3, "Sunfeast Dark Fantasy Choco Fills", "Sunfeast", "300 g", 150),
    (3, "Oreo Chocolate Creme Biscuits", "Cadbury", "120 g", 40),
    (3, "Lay's Classic Salted Chips", "Lay's", "52 g", 20),
    (3, "Kurkure Masala Munch", "Kurkure", "90 g", 20),
    (3, "Haldiram's Aloo Bhujia", "Haldiram's", "400 g", 115),
    (3, "Maggi 2-Minute Noodles", "Maggi", "420 g", 96),
    (3, "Kissan Mixed Fruit Jam", "Kissan", "500 g", 165),
    # 4 Personal Care & Household (ids 31-40)
    (4, "Lux Soft Touch Soap", "Lux", "4 x 100 g", 150),
    (4, "Dettol Original Soap", "Dettol", "3 x 125 g", 135),
    (4, "Dove Cream Beauty Bar", "Dove", "100 g", 68),
    (4, "Head & Shoulders Anti-Dandruff Shampoo", "Head & Shoulders", "340 ml", 340),
    (4, "Clinic Plus Shampoo", "Clinic Plus", "340 ml", 190),
    (4, "Colgate Strong Teeth Toothpaste", "Colgate", "200 g", 108),
    (4, "Surf Excel Easy Wash Detergent", "Surf Excel", "1 kg", 135),
    (4, "Vim Dishwash Liquid", "Vim", "500 ml", 105),
    (4, "Harpic Toilet Cleaner", "Harpic", "500 ml", 99),
    (4, "Parachute Coconut Oil", "Parachute", "500 ml", 225),
    # 5 Stationery (ids 41-50)
    (5, "Classmate Single Line Notebook", "Classmate", "172 pages", 72),
    (5, "Classmate Spiral Notebook", "Classmate", "240 pages", 98),
    (5, "Navneet Youva Notebook", "Navneet", "200 pages", 68),
    (5, "Camlin Drawing Book", "Camlin", "40 pages", 45),
    (5, "Reynolds Trimax Ball Pen", "Reynolds", "10 pcs", 100),
    (5, "Cello Butterflow Pen", "Cello", "10 pcs", 90),
    (5, "Apsara Platinum Pencils", "Apsara", "10 pcs", 50),
    (5, "Camlin Geometry Box", "Camlin", "1 set", 125),
    (5, "Fevistik Glue Stick", "Pidilite", "15 g", 30),
    (5, "Kangaro Stapler HP-10", "Kangaro", "1 pc", 60),
]

# Products with price HISTORY: sold at 4 shops, 3 records each (2 older + latest)
TRACKED = {1, 6, 11, 12, 13, 16, 21, 29, 34, 41}


def q(s):
    return "'" + s.replace("'", "''") + "'"


def money(x):
    return max(1, round(x))


records = []
for pid, (cat, name, brand, unit, base) in enumerate(PRODUCTS, start=1):
    chosen = rng.sample(SHOPS, 4 if pid in TRACKED else 3)
    for shop in chosen:
        sid, factor = shop[0], shop[4]
        latest = money(base * factor * rng.uniform(0.98, 1.03))
        latest_at = ANCHOR - timedelta(days=rng.randint(0, 9), hours=rng.randint(0, 8),
                                       minutes=rng.randint(0, 59))
        records.append((pid, sid, latest, latest_at))
        if pid in TRACKED:
            p_30 = money(latest * rng.uniform(0.94, 0.99))
            p_60 = money(latest * rng.uniform(0.89, 0.95))
            records.append((pid, sid, p_30, ANCHOR - timedelta(days=rng.randint(28, 34),
                                                              hours=rng.randint(0, 8))))
            records.append((pid, sid, p_60, ANCHOR - timedelta(days=rng.randint(58, 64),
                                                              hours=rng.randint(0, 8))))

# Oldest first, so price_id grows with time (price_id is also a tie-breaker later)
records.sort(key=lambda r: (r[3], r[0], r[1]))

fmt = "%Y-%m-%d %H:%M:%S"
out = ["-- PricePulse sample data. DEMONSTRATION DATA ONLY: not live, verified or current prices.",
       "USE pricepulse_db;", "", "START TRANSACTION;", ""]

out.append("INSERT INTO categories (category_id, category_name) VALUES")
out.append(",\n".join(f"  ({i}, {q(n)})" for i, n in CATEGORIES) + ";\n")

out.append("INSERT INTO shops (shop_id, shop_name, location, contact) VALUES")
out.append(",\n".join(f"  ({s[0]}, {q(s[1])}, {q(s[2])}, {q(s[3])})" for s in SHOPS) + ";\n")

out.append("INSERT INTO products (product_id, product_name, brand, category_id, unit, image_url) VALUES")
rows = []
for pid, (cat, name, brand, unit, _) in enumerate(PRODUCTS, start=1):
    img = f"https://placehold.co/400x400/dcfce7/166534?text={quote_plus(name)}"
    rows.append(f"  ({pid}, {q(name)}, {q(brand)}, {cat}, {q(unit)}, {q(img)})")
out.append(",\n".join(rows) + ";\n")

for i in range(0, len(records), 60):
    chunk = records[i:i + 60]
    out.append("INSERT INTO price_records (product_id, shop_id, price, recorded_at, submitted_by) VALUES")
    out.append(",\n".join(f"  ({p}, {s}, {pr:.2f}, '{t.strftime(fmt)}', NULL)"
                          for p, s, pr, t in chunk) + ";\n")

out.append("COMMIT;")

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_data.sql")
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print(f"Wrote {path}: {len(CATEGORIES)} categories, {len(SHOPS)} shops, "
      f"{len(PRODUCTS)} products, {len(records)} price records")