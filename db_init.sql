
-- Initialize Database
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'STAFF') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    reorder_level INT DEFAULT 10,
    cost_price DECIMAL(10, 2) DEFAULT 0.00,
    selling_price DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 4. Stock Transactions Table
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
    quantity INT NOT NULL,
    reason VARCHAR(255),
    remarks TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50),
    entity_id INT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- SEEDING DATA
-- Standardize categories
INSERT INTO categories (name) VALUES 
('Computing Hardware'),
('Networking Gear'),
('Office Furniture'),
('Industrial Tools')
ON DUPLICATE KEY UPDATE name=name;

-- Standardize Users (Passwords are 'Admin@123' for project simplicity)
INSERT INTO users (name, email, password_hash, role, is_active) VALUES 
('System Admin', 'admin@prostock.io', 'Admin@123', 'ADMIN', 1),
('Operations Manager', 'manager@prostock.io', 'Admin@123', 'MANAGER', 1),
('Floor Staff', 'staff@prostock.io', 'Admin@123', 'STAFF', 1)
ON DUPLICATE KEY UPDATE email=email;

-- Standardize Sample Products
INSERT INTO products (sku, name, category_id, unit, reorder_level, cost_price, selling_price) VALUES 
('PRO-001', 'Workstation Z4', 1, 'Pcs', 5, 1200.00, 1500.00),
('PRO-002', 'ThinkPad P16', 1, 'Pcs', 3, 2200.00, 2800.00),
('NET-001', 'Core Switch 48P', 2, 'Pcs', 2, 800.00, 1100.00)
ON DUPLICATE KEY UPDATE sku=sku;

-- Initial Stock Seed
INSERT INTO stock_transactions (product_id, type, quantity, reason, created_by) VALUES 
(1, 'IN', 10, 'Initial System Seed', 1),
(2, 'IN', 5, 'Initial System Seed', 1),
(3, 'IN', 2, 'Initial System Seed', 1);
