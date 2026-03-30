
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Database Configuration - Matches XAMPP Defaults
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'inventory_db'
};

// Helper to test connection on startup
async function testDbConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ DATABASE LINK ESTABLISHED: inventory_db is accessible.');
    await connection.end();
  } catch (error) {
    console.error('❌ DATABASE LINK FAILED:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Reason: MySQL service is not running. Start MySQL in XAMPP.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   Reason: Database "inventory_db" does not exist. Create it in phpMyAdmin.');
    } else {
      console.error(`   Reason: ${error.message}`);
    }
  }
}

async function query(sql, params) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error(`[DATABASE ERROR]: ${error.message}`);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

// --- SYSTEM ENDPOINTS ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await query('SELECT * FROM users WHERE email = ? AND password_hash = ?', [email, password]);
    if (users.length > 0) {
      const user = users[0];
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active === 1,
        createdAt: user.created_at
      };
      res.json({ user: formattedUser, token: 'session-' + Date.now() });
    } else {
      res.status(401).json({ message: 'CREDENTIAL VALIDATION FAILED' });
    }
  } catch (err) {
    res.status(500).json({ message: "AUTH_SUBSYSTEM_FAILURE" });
  }
});

// --- PRODUCT ENDPOINTS ---
app.get('/api/products', async (req, res) => {
  try {
    const sql = `
      SELECT p.*, c.name as categoryName, 
      (SELECT COALESCE(SUM(CASE WHEN type='IN' THEN quantity WHEN type='OUT' THEN -quantity ELSE 0 END), 0) 
       FROM stock_transactions WHERE product_id = p.id) as currentStock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    const results = await query(sql);
    const formatted = results.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryId: p.category_id,
      categoryName: p.categoryName || 'Uncategorized',
      unit: p.unit,
      reorderLevel: p.reorder_level,
      currentStock: Number(p.currentStock),
      costPrice: Number(p.cost_price || 0),
      sellingPrice: Number(p.selling_price || 0),
      isActive: p.is_active === 1,
      createdAt: p.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "FETCH_PRODUCTS_FAILED" });
  }
});

app.post('/api/products', async (req, res) => {
  const { sku, name, categoryId, unit, reorderLevel, costPrice, sellingPrice, createdBy } = req.body;
  try {
    const result = await query(
      'INSERT INTO products (sku, name, category_id, unit, reorder_level, cost_price, selling_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sku, name, categoryId, unit, reorderLevel, costPrice, sellingPrice]
    );
    await query('INSERT INTO audit_logs (user_id, action, entity, message) VALUES (?, ?, ?, ?)', 
      [createdBy, 'PRODUCT_CREATE', 'PRODUCT', `Created product ${sku}: ${name}`]);
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "CREATE_PRODUCT_FAILED" });
  }
});

// --- CATEGORY ENDPOINTS ---
app.get('/api/categories', async (req, res) => {
  try {
    const results = await query('SELECT * FROM categories');
    res.json(results.map(c => ({ id: c.id, name: c.name, createdAt: c.created_at })));
  } catch (err) {
    res.status(500).json({ message: "FETCH_CATEGORIES_FAILED" });
  }
});

// --- TRANSACTION ENDPOINTS ---
app.get('/api/transactions', async (req, res) => {
  try {
    const sql = `
      SELECT t.*, p.name as productName, u.name as createdByName 
      FROM stock_transactions t 
      LEFT JOIN products p ON t.product_id = p.id 
      LEFT JOIN users u ON t.created_by = u.id 
      ORDER BY t.created_at DESC
    `;
    const results = await query(sql);
    res.json(results.map(t => ({
      id: t.id,
      productId: t.product_id,
      productName: t.productName || 'Unknown Product',
      type: t.type,
      quantity: t.quantity,
      reason: t.reason,
      remarks: t.remarks,
      createdBy: t.created_by,
      createdByName: t.createdByName || 'Unknown System',
      createdAt: t.created_at
    })));
  } catch (err) {
    res.status(500).json({ message: "FETCH_TRANSACTIONS_FAILED" });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { type, productId, quantity, reason, remarks, userId } = req.body;
  try {
    const result = await query(
      'INSERT INTO stock_transactions (product_id, type, quantity, reason, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [productId, type, quantity, reason, remarks, userId]
    );
    await query('INSERT INTO audit_logs (user_id, action, entity, message) VALUES (?, ?, ?, ?)', 
      [userId, type === 'IN' ? 'STOCK_IN' : 'STOCK_OUT', 'STOCK', `Processed ${type} x ${quantity} for product ID ${productId}`]);
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "TRANSACTION_PROCESS_FAILED" });
  }
});

// --- LOG ENDPOINTS ---
app.get('/api/logs', async (req, res) => {
  try {
    const results = await query('SELECT l.*, u.name as userName FROM audit_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 100');
    res.json(results.map(l => ({
      id: l.id,
      userId: l.user_id,
      userName: l.userName || 'System',
      action: l.action,
      entity: l.entity,
      message: l.message,
      createdAt: l.created_at
    })));
  } catch (err) {
    res.status(500).json({ message: "FETCH_LOGS_FAILED" });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const results = await query('SELECT * FROM users');
    res.json(results.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.is_active === 1,
      createdAt: u.created_at
    })));
  } catch (err) {
    res.status(500).json({ message: "FETCH_USERS_FAILED" });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🚀 IMS BACKEND ONLINE: http://localhost:${PORT}`);
  console.log(`📅 TIMESTAMP: ${new Date().toLocaleString()}`);
  console.log('-------------------------------------------');
  testDbConnection();
});
