-- V2__seed_data.sql
-- Seed admin user (password: admin123 - BCrypt encoded)
INSERT INTO users (id, email, password, full_name, role, company_name)
VALUES (
    gen_random_uuid(),
    'admin@sweetdistribution.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Admin User',
    'ADMIN',
    'Sweet Distribution HQ'
) ON CONFLICT (email) DO NOTHING;

-- Seed sample products
INSERT INTO products (name, description, price, category, stock_quantity, min_order_quantity) VALUES
('Gulab Jamun', 'Soft and spongy milk-solid-based sweet soaked in sugar syrup', 12.99, 'Traditional', 500, 10),
('Kaju Katli', 'Diamond-shaped cashew fudge with silver foil', 24.99, 'Premium', 300, 5),
('Rasgulla', 'Soft and spongy cottage cheese balls in sugar syrup', 10.99, 'Traditional', 400, 10),
('Jalebi', 'Crispy deep-fried pretzel-shaped sweet soaked in saffron syrup', 8.99, 'Traditional', 600, 20),
('Soan Papdi', 'Flaky and crispy cube-shaped sweet', 15.99, 'Dry Sweets', 350, 10),
('Mysore Pak', 'Rich and dense sweet made from ghee, sugar and gram flour', 18.99, 'Premium', 250, 5),
('Peda', 'Dense sweet made from khoya with cardamom flavor', 14.99, 'Traditional', 400, 10),
('Barfi', 'Dense milk-based sweet available in various flavors', 16.99, 'Premium', 300, 5),
('Laddu', 'Round ball-shaped sweet made from flour, sugar and ghee', 11.99, 'Traditional', 500, 15),
('Chocolate Truffle Box', 'Assorted premium chocolate truffles', 29.99, 'Chocolates', 200, 5)
ON CONFLICT DO NOTHING;
