-- Create database
CREATE DATABASE IF NOT EXISTS pharmacy_inventory;
USE pharmacy_inventory;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table (matches DR HOPE INVENTORY spreadsheet)
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE,
  product_name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  quantity_in_stock INT NOT NULL DEFAULT 0,
  cost_price DECIMAL(10, 2) DEFAULT 0.00,
  srp DECIMAL(10, 2) DEFAULT 0.00,
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_in_stock * srp) STORED,
  expiry_date DATE,
  supplier_id INT,
  notes TEXT,
  reorder_level INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Sales transactions table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'insurance', 'mobile') DEFAULT 'cash',
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sales items table
CREATE TABLE IF NOT EXISTS sales_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  inventory_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

-- Insert default users
INSERT INTO users (username, password, role) VALUES
  ('admin', 'admin123', 'admin'),
  ('staff', 'staff123', 'staff')
ON DUPLICATE KEY UPDATE username=username;

-- Insert default suppliers
INSERT INTO suppliers (name) VALUES
  ('Unilab'),
  ('GSK Pharma'),
  ('MedSupply Co.'),
  ('PharmaDirect')
ON DUPLICATE KEY UPDATE name=name;

-- Sample inventory data matching spreadsheet format
INSERT INTO inventory (item_code, product_name, brand, quantity_in_stock, cost_price, srp, expiry_date, supplier_id, notes) VALUES
  ('RX001', 'Paracetamol 500mg', 'Biogesic', 150, 3.00, 5.00, '2025-12-31', 1, 'Fast-moving item'),
  ('RX002', 'Amoxicillin 250mg', 'GSK', 80, 6.50, 7.50, '2025-09-30', 2, 'Prescription required')
ON DUPLICATE KEY UPDATE product_name=product_name;
