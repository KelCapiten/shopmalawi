#!/bin/bash

# Set MySQL credentials
DB_NAME="shopMalawi"
DB_USER="root"
DB_PASSWORD="root"

# SQL commands to create the database and tables
SQL_COMMANDS="
-- Drop the database if it exists and create a new one
DROP DATABASE IF EXISTS \`$DB_NAME\`;
CREATE DATABASE \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`$DB_NAME\`;

-- Roles Table for Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT 'no-email@example.com', 
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    location_id VARCHAR(100),
    role_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- User Images Table (Storing Actual Images)
CREATE TABLE user_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL COMMENT 'File path to the stored image',
    type ENUM('profile', 'ad'),
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- locations Table
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- User Bank Details Table
CREATE TABLE IF NOT EXISTS user_bank_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    payment_method_id INT NOT NULL,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_holder_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE  -- New foreign key constraint
) ENGINE=InnoDB;

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INT DEFAULT NULL, -- References the parent category
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL COMMENT 'Amount in Malawian Kwacha (MWK)',
    mark_up_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (mark_up_amount >= 0) COMMENT 'Amount in Malawian Kwacha (MWK)',
    subcategory_id INT,
    subcategory_name VARCHAR(100),
    maincategory_id INT,
    maincategory_name VARCHAR(100),
    stock_quantity INT NOT NULL DEFAULT 0,
    uploaded_by INT NOT NULL, -- References users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT (name, description),
    FOREIGN KEY (subcategory_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (maincategory_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (subcategory_id),
    INDEX (maincategory_id),
    INDEX (uploaded_by)
) ENGINE=InnoDB;

-- Inquiries Table
CREATE TABLE IF NOT EXISTS product_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INT,
    stock_quantity INT NOT NULL DEFAULT 0,
    uploaded_by INT NOT NULL, -- References users table
    location_id INT, -- References locations table
    status ENUM('pending', 'resolved', 'closed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT (name, description),
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    INDEX (uploaded_by),
    INDEX (location_id)
) ENGINE=InnoDB;

-- Product Offers Table
CREATE TABLE IF NOT EXISTS product_offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    inquiries_id INT NOT NULL,
    FOREIGN KEY fk_product_offers_product_id (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY fk_product_offers_inquiries_id (inquiries_id) REFERENCES product_inquiries(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_inquiry (product_id, inquiries_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_inquiries_id (inquiries_id)
) ENGINE=InnoDB;

-- Images Table
CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    imageable_id INT NOT NULL,
    imageable_type VARCHAR(50) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); ENGINE=InnoDB;

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    banner_url VARCHAR(255),
    profile_picture_url VARCHAR(255),
    owner_id INT NOT NULL, -- References users table
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT (brand_name, tagline, description),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (owner_id)
) ENGINE=InnoDB;

-- System Images Table 
CREATE TABLE system_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL COMMENT 'File path to the stored image',
    alt_text VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Payment Screenshots Table 
CREATE TABLE payment_screenshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL COMMENT 'File path to the stored image',
    alt_text VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Product Attributes Table (for variations like brand, size, color)
CREATE TABLE IF NOT EXISTS product_attributes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (product_id)
) ENGINE=InnoDB;

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_town VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL COMMENT 'Amount in Malawian Kwacha (MWK)',
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (status)
) ENGINE=InnoDB;

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL COMMENT 'Amount in Malawian Kwacha (MWK)',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (product_id)
) ENGINE=InnoDB;

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL COMMENT 'Amount in Malawian Kwacha (MWK)',
    payment_method_id INT NOT NULL, -- References payment_methods table
    payment_screenshots_id INT NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refund', 'refunding', 'refunded', 'canceled') DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (payment_screenshots_id) REFERENCES payment_screenshots(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (payment_method_id)
) ENGINE=InnoDB;

-- Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    reason TEXT,
    payment_screenshots_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_screenshots_id) REFERENCES payment_screenshots(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (status)
) ENGINE=InnoDB;

-- Shipping Table
CREATE TABLE IF NOT EXISTS shipping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    address TEXT NOT NULL,
    town VARCHAR(100) NOT NULL,
    status ENUM('pending', 'shipped', 'delivered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (status)
) ENGINE=InnoDB;

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CHECK (rating BETWEEN 1 AND 5),
    INDEX (user_id),
    INDEX (product_id)
) ENGINE=InnoDB;

-- Wishlist Items Table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist (user_id, product_id),
    INDEX (user_id),
    INDEX (product_id)
) ENGINE=InnoDB;

-- Discounts and Coupons Table
CREATE TABLE IF NOT EXISTS discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    max_uses INT,
    uses INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Discount Usages Table
CREATE TABLE IF NOT EXISTS discount_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discount_id INT NOT NULL,
    user_id INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (discount_id),
    INDEX (user_id)
) ENGINE=InnoDB;

-- Returns Table
CREATE TABLE IF NOT EXISTS returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX (order_id),
    INDEX (status)
) ENGINE=InnoDB;

-- Return Items Table
CREATE TABLE IF NOT EXISTS return_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT NOT NULL,
    order_item_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    INDEX (return_id),
    INDEX (order_item_id)
) ENGINE=InnoDB;

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('insert', 'update', 'delete') NOT NULL,
    old_data JSON,
    new_data JSON,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (table_name),
    INDEX (record_id),
    INDEX (performed_by)
) ENGINE=InnoDB;

-- Insert Roles
INSERT INTO roles (role_name, description) VALUES
('customer', 'Regular customer with access to purchase products and manage their account'),
('admin', 'Administrator with full access to manage the platform');

-- Insert Main Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic gadgets and devices'),
('Cars', 'Wide range of books and literature'),
('Clothing', 'Men and Women clothing for all ages'),
('Produce', 'Agricultural products across Malawi'),
('Services', 'Need something done? Find it here');

-- Store the IDs of the main categories in variables
SET @electronics_id = (SELECT id FROM categories WHERE name = 'Electronics');
SET @car_id = (SELECT id FROM categories WHERE name = 'Cars');
SET @clothing_id = (SELECT id FROM categories WHERE name = 'Clothing');
SET @Produce_id = (SELECT id FROM categories WHERE name = 'Produce');

-- Insert Subcategories for Electronics
INSERT INTO categories (name, description, parent_id) VALUES
('TVs', 'Televisions and home entertainment systems', @electronics_id),
('Phones', 'Smartphones and mobile devices', @electronics_id),
('Laptops', 'Laptops and notebooks', @electronics_id);

-- Insert Subcategories for Cars
INSERT INTO categories (name, description, parent_id) VALUES
('Used Cars', 'Buy a local used car', @car_id),
('IT Cars', 'Buy a newly imported car', @car_id);

-- Insert Subcategories for Clothing
INSERT INTO categories (name, description, parent_id) VALUES
('Men\'s Clothing', 'Clothing for men', @clothing_id) ,
('Women\'s Clothing', 'Clothing for women', @clothing_id),
('Kids\' Clothing', 'Clothing for kids', @clothing_id);

-- Insert locations
INSERT INTO locations (name) VALUES
('Karonga'),
('Mzuzu'),
('Lilongwe'),
('Blantyre'),
('Kasungu');

-- Insert Payment Methods
INSERT INTO payment_methods (method_name, description) VALUES
('mobile_money', 'Mobile Money services like Airtel Money, TNM Mpamba'),
('bank_transfer', 'Direct bank transfers'),
('cash_on_delivery', 'Payment upon delivery'),
('local_payment_gateway', 'Local online payment gateways');
"

# Run MySQL commands
echo "Setting up the database '$DB_NAME'..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "$SQL_COMMANDS"

if [ $? -eq 0 ]; then
    echo "Database and tables created successfully!"
else
    echo "Failed to set up the database. Please check your MySQL credentials and try again."
    exit 1
fi

echo "Setup script execution completed."