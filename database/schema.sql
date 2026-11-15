-- PricePulse: relational schema (needs MySQL 8.0.16+ so CHECK constraints are enforced)

CREATE DATABASE IF NOT EXISTS pricepulse_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pricepulse_db;

-- Drop in child -> parent order so the script can be re-run safely
DROP TABLE IF EXISTS price_records;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS shops;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin','user') NOT NULL DEFAULT 'user',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL,
    CONSTRAINT uq_categories_name UNIQUE (category_name)
) ENGINE=InnoDB;

CREATE TABLE products (
    product_id   INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    brand        VARCHAR(100) NOT NULL,
    category_id  INT NOT NULL,
    unit         VARCHAR(30)  NOT NULL,
    image_url    VARCHAR(500) NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_product_identity UNIQUE (product_name, brand, unit),
    INDEX idx_products_category (category_id),
    INDEX idx_products_name (product_name),
    INDEX idx_products_brand (brand)
) ENGINE=InnoDB;

CREATE TABLE shops (
    shop_id    INT AUTO_INCREMENT PRIMARY KEY,
    shop_name  VARCHAR(120) NOT NULL,
    location   VARCHAR(200) NOT NULL,
    contact    VARCHAR(30)  NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shop_identity UNIQUE (shop_name, location)
) ENGINE=InnoDB;

-- Append-only price history: a price change is a NEW row, never an UPDATE.
CREATE TABLE price_records (
    price_id     INT AUTO_INCREMENT PRIMARY KEY,
    product_id   INT NOT NULL,
    shop_id      INT NOT NULL,
    price        DECIMAL(10,2) NOT NULL,
    recorded_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_by INT NULL,
    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT fk_price_product
        FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_price_shop
        FOREIGN KEY (shop_id) REFERENCES shops(shop_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_price_user
        FOREIGN KEY (submitted_by) REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    -- Speeds up "latest price per shop for a product"
    INDEX idx_price_latest (product_id, shop_id, recorded_at),
    INDEX idx_price_shop (shop_id),
    INDEX idx_price_recorded (recorded_at)
) ENGINE=InnoDB;