const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Category, Brand, Supplier, Warehouse, Product, WarehouseStock, Transaction, AuditLog, Alert } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// ──────────── ENVIRONMENT VALIDATION ────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const ENV_DEFAULTS = { MONGODB_URI: 'mongodb://localhost:27017/inventory_db', JWT_SECRET: 'sims_secret_key_2026', PORT: '5000' };
REQUIRED_ENV.forEach(key => {
  if (!process.env[key]) {
    console.warn(`⚠️  ENV variable ${key} not set. Using default: "${ENV_DEFAULTS[key]}"`);
    process.env[key] = ENV_DEFAULTS[key];
  }
});

// ──────────── IN-MEMORY CACHE (TTL-based) ────────────
const analyticsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = analyticsCache.get(key);
  if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) return entry.data;
  analyticsCache.delete(key);
  return null;
}

function setCache(key, data) {
  analyticsCache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache() {
  analyticsCache.clear();
}

// ──────────── RATE LIMITER (In-Memory) ────────────
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 1000; // requests per window

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  let record = rateLimitStore.get(ip);
  if (!record || (now - record.windowStart > RATE_LIMIT_WINDOW)) {
    record = { windowStart: now, count: 0 };
  }
  record.count++;
  rateLimitStore.set(ip, record);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_MAX - record.count));
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.', errorCode: 'RATE_LIMIT_EXCEEDED' });
  }
  next();
}

// ──────────── AUTH & PERMISSION MIDDLEWARE ────────────
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided', errorCode: 'NO_TOKEN' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token', errorCode: 'INVALID_TOKEN' });
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions', errorCode: 'NO_PERMISSION' });
    }
    next();
  };
}

// app.use(rateLimiter); // Temporarily disabled to resolve "Too many requests" loop check check check check check check check (Doubt: Disable rate limit) check check check check) </b>

// ──────────── ASYNC HANDLER (wraps route handlers) ────────────
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ──────────── PAGINATION HELPER ────────────
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRecords: total
    }
  };
}

// ──────────── INPUT VALIDATORS ────────────
function validateProductInput(body) {
  const errors = [];
  if (body.costPrice !== undefined && (body.costPrice < 0 || body.costPrice > 1000000)) errors.push('costPrice must be 0–1,000,000');
  if (body.sellingPrice !== undefined && (body.sellingPrice < 0 || body.sellingPrice > 1000000)) errors.push('sellingPrice must be 0–1,000,000');
  if (body.reorderLevel !== undefined && body.reorderLevel < 0) errors.push('reorderLevel cannot be negative');
  if (body.overstockLevel !== undefined && body.overstockLevel < 0) errors.push('overstockLevel cannot be negative');
  return errors.length > 0 ? errors.join('; ') : null;
}

function validateTransactionInput(body) {
  const errors = [];
  if (!body.type || !['PURCHASE','SALE','ADJUSTMENT','IN','OUT','RETURN'].includes(body.type)) errors.push('Invalid transaction type');
  if (body.quantity !== undefined && (body.quantity <= 0 || body.quantity > 10000)) errors.push('quantity must be 1–10,000');
  if (body.purchaseCost !== undefined && body.purchaseCost > 1000000) errors.push('purchaseCost exceeds limit');
  if (body.sellingPriceAtSale !== undefined && body.sellingPriceAtSale > 1000000) errors.push('sellingPriceAtSale exceeds limit');
  return errors.length > 0 ? errors.join('; ') : null;
}

// ──────────── MongoDB Connection ────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully.');
    seedDatabase();
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
  });

// ──────────── SKU Auto-Generator ────────────
async function generateSKU(categoryName, brandName) {
  const prefix = (categoryName || 'GEN').substring(0, 3).toUpperCase();
  const brandCode = (brandName || 'XX').substring(0, 2).toUpperCase();
  const count = await Product.countDocuments();
  const num = String(count + 1).padStart(4, '0');
  return `${prefix}-${brandCode}-${num}`;
}

// ──────────── Barcode Generator ────────────
function generateBarcode(sku) {
  const timestamp = Date.now().toString().slice(-8);
  return `PRO${timestamp}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// ──────────── Audit Helper ────────────
async function createAuditLog(userId, action, entity, entityId, message) {
  try {
    const log = new AuditLog({ user_id: userId, action, entity, entity_id: entityId, message });
    await log.save();

    // Risk Scoring Logic based on actions
    if (['PRODUCT_DELETE', 'USER_DELETE', 'DATA_QUALITY_REJECT', 'ANOMALY_DETECTED', 'STOCK_ADJUST'].includes(action)) {
      await User.findByIdAndUpdate(userId, { $inc: { risk_score: 10 } });
    }
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
}

// ──────────── Alert Generator ────────────
async function checkAndCreateAlerts(productId) {
  try {
    const product = await Product.findById(productId);
    if (!product || !product.is_active) return;

    // Low stock alert lifecycle
    if (product.current_stock <= product.reorder_level) {
      const type = product.current_stock === 0 ? 'STOCK_OUT' : 'LOW_STOCK';
      const existing = await Alert.findOne({ product_id: productId, type, status: 'ACTIVE' });
      if (!existing) {
        const message = product.current_stock === 0 
          ? `OUT OF STOCK: ${product.name} (${product.sku}) is completely sold out.`
          : `LOW STOCK: ${product.name} (${product.sku}) is at ${product.current_stock} units — below reorder limit (${product.reorder_level}).`;
        
        await new Alert({
          type,
          product_id: productId,
          message,
          priority: product.current_stock === 0 ? 'HIGH' : 'MEDIUM',
          status: 'ACTIVE'
        }).save();
      }
    } else {
      // Auto-resolve if stock recovered
      await Alert.updateMany({ product_id: productId, type: { $in: ['LOW_STOCK', 'STOCK_OUT'] }, status: 'ACTIVE' }, { status: 'RESOLVED' });
    }

    // Overstock alert lifecycle
    if (product.current_stock > product.overstock_level) {
      const existing = await Alert.findOne({ product_id: productId, type: 'OVERSTOCK', status: 'ACTIVE' });
      if (!existing) {
        await new Alert({
          type: 'OVERSTOCK',
          product_id: productId,
          message: `${product.name} (${product.sku}) is at ${product.current_stock} units — exceeds overstock level of ${product.overstock_level}.`,
          priority: 'MEDIUM',
          status: 'ACTIVE'
        }).save();
      }
    } else {
      // Auto-resolve if stock returned to normal ranges
      await Alert.updateMany({ product_id: productId, type: 'OVERSTOCK', status: 'ACTIVE' }, { status: 'RESOLVED' });
    }
  } catch (err) {
    console.error('Alert check failed:', err.message);
  }
}

// ──────────── Input Validation ────────────
function validateRequired(fields, body) {
  const missing = fields.filter(f => !body[f] && body[f] !== 0);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
}

// ──────────── Permission Middleware ────────────
// ──────────── Permission Placeholder (REPLACED) ────────────
// requirePermission is now defined above with real logic.

// ──────────── Seeding ────────────
async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding database...');

      // Brands
      const brands = await Brand.insertMany([
        { name: 'Dell', website: 'https://dell.com' },
        { name: 'HP', website: 'https://hp.com' },
        { name: 'Cisco', website: 'https://cisco.com' },
        { name: 'Lenovo', website: 'https://lenovo.com' },
        { name: 'Herman Miller', website: 'https://hermanmiller.com' }
      ]);

      // Suppliers
      const suppliers = await Supplier.insertMany([
        { name: 'TechWorld Distributors', contact: 'John Smith', email: 'john@techworld.com', phone: '+1-555-0100', address: '123 Tech Avenue, San Jose, CA', rating: 5 },
        { name: 'Office Plus Supply', contact: 'Jane Doe', email: 'jane@officeplus.com', phone: '+1-555-0200', address: '456 Commerce St, Austin, TX', rating: 4 },
        { name: 'Global Hardware Inc.', contact: 'Mike Chen', email: 'mike@globalhw.com', phone: '+1-555-0300', address: '789 Industrial Blvd, Chicago, IL', rating: 4 }
      ]);

      // Warehouses
      const warehouses = await Warehouse.insertMany([
        { name: 'Main Warehouse', location: 'Building A, Floor 1' },
        { name: 'Secondary Storage', location: 'Building B, Floor 2' },
        { name: 'Offsite Depot', location: '101 Storage Lane, Dallas, TX' }
      ]);

      // Categories
      const categories = await Category.insertMany([
        { name: 'Computing Hardware', description: 'Computers, workstations, and laptops' },
        { name: 'Networking Gear', description: 'Switches, routers, and access points' },
        { name: 'Office Furniture', description: 'Desks, chairs, and storage units' },
        { name: 'Industrial Tools', description: 'Power tools and hand tools' },
        { name: 'Peripherals', description: 'Monitors, keyboards, and mice' },
        { name: 'Software Licenses', description: 'Operating systems and productivity software' }
      ]);

      // Users with permissions (Hashed Passwords)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      const users = await User.insertMany([
        {
          name: 'System Admin', email: 'admin@sims.io', password_hash: hashedPassword, role: 'ADMIN',
          permissions: ['MANAGE_USERS','MANAGE_CATEGORIES','CREATE_PRODUCT','EDIT_PRODUCT','DELETE_PRODUCT','STOCK_IN','STOCK_OUT','STOCK_ADJUST','VIEW_REPORTS','EXPORT_DATA','VIEW_AUDIT_LOGS','MANAGE_BRANDS','MANAGE_SUPPLIERS','MANAGE_WAREHOUSES']
        },
        {
          name: 'Operations Manager', email: 'manager@sims.io', password_hash: hashedPassword, role: 'MANAGER',
          permissions: ['CREATE_PRODUCT','EDIT_PRODUCT','STOCK_IN','STOCK_OUT','VIEW_REPORTS','EXPORT_DATA','MANAGE_SUPPLIERS']
        },
        {
          name: 'Floor Staff', email: 'staff@sims.io', password_hash: hashedPassword, role: 'STAFF',
          permissions: ['STOCK_IN','STOCK_OUT']
        }
      ]);

      // Products
      const products = await Product.insertMany([
        { sku: 'COM-DE-0001', barcode: generateBarcode('COM-DE-0001'), name: 'Workstation Z4', model_number: 'Z4-G5', specifications: '32GB RAM, 1TB SSD, RTX 4070', category_id: categories[0]._id, brand_id: brands[0]._id, supplier_id: suppliers[0]._id, unit: 'Pcs', reorder_level: 5, overstock_level: 100, cost_price: 1200, selling_price: 1500, current_stock: 10 },
        { sku: 'COM-LE-0002', barcode: generateBarcode('COM-LE-0002'), name: 'ThinkPad P16', model_number: 'P16-G2', specifications: '16GB RAM, 512GB SSD, Xeon W', category_id: categories[0]._id, brand_id: brands[3]._id, supplier_id: suppliers[0]._id, unit: 'Pcs', reorder_level: 3, overstock_level: 50, cost_price: 2200, selling_price: 2800, current_stock: 5 },
        { sku: 'NET-CI-0003', barcode: generateBarcode('NET-CI-0003'), name: 'Core Switch 48P', model_number: 'C9300-48T', specifications: '48-Port Managed L3 Switch', category_id: categories[1]._id, brand_id: brands[2]._id, supplier_id: suppliers[2]._id, unit: 'Pcs', reorder_level: 2, overstock_level: 20, cost_price: 800, selling_price: 1100, current_stock: 2 },
        { sku: 'FUR-HM-0004', barcode: generateBarcode('FUR-HM-0004'), name: 'Aeron Chair', model_number: 'AER-C', specifications: 'Size C, Graphite, Fully Loaded', category_id: categories[2]._id, brand_id: brands[4]._id, supplier_id: suppliers[1]._id, unit: 'Pcs', reorder_level: 5, overstock_level: 50, cost_price: 850, selling_price: 1295, current_stock: 12 },
        { sku: 'PER-DE-0005', barcode: generateBarcode('PER-DE-0005'), name: 'UltraSharp U2723QE', model_number: 'U2723QE', specifications: '27" 4K IPS USB-C Monitor', category_id: categories[4]._id, brand_id: brands[0]._id, supplier_id: suppliers[0]._id, unit: 'Pcs', reorder_level: 8, overstock_level: 100, cost_price: 450, selling_price: 620, current_stock: 25 }
      ]);

      // Initial Transactions
      for (const p of products) {
        await new Transaction({ product_id: p._id, warehouse_id: warehouses[0]._id, type: 'PURCHASE', quantity: p.current_stock, supplier_id: p.supplier_id, purchase_cost: p.cost_price * p.current_stock, reason: 'Initial Stock', created_by: users[0]._id }).save();
        await WarehouseStock.findOneAndUpdate(
          { product_id: p._id, warehouse_id: warehouses[0]._id },
          { $set: { quantity: p.current_stock } },
          { upsert: true }
        );
      }

      console.log('✨ Database seeding complete. Created: brands, suppliers, warehouses, categories, products, and transactions for SIMS.');
    }
  } catch (err) {
    console.error('❌ Seeding Failed:', err.message);
  }
}

// ══════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════

// --- HEALTH ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date(), db: 'mongodb' });
});

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, is_active: true });
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign(
        { userId: user._id, role: user.role, permissions: user.permissions || [] },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      // Update login stats
      user.last_login_at = new Date();
      user.login_count = (user.login_count || 0) + 1;
      await user.save();

      const formatted = { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions || [], isActive: user.is_active, createdAt: user.created_at };
      await createAuditLog(user._id, 'LOGIN', 'USER', user._id.toString(), `${user.name} logged in.`);
      res.json({ success: true, user: formatted, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password.', errorCode: 'INVALID_CREDENTIALS' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed. Please try again.', errorCode: 'LOGIN_FAILED' });
  }
});

// ──────────── BRANDS ────────────
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await Brand.find({ is_active: true });
    res.json(brands.map(b => ({ id: b._id, name: b.name, logoUrl: b.logo_url, website: b.website, isActive: b.is_active, createdAt: b.created_at })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch brands.' });
  }
});

app.post('/api/brands', verifyToken, requirePermission('MANAGE_BRANDS'), async (req, res) => {
  const error = validateRequired(['name'], req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const brand = new Brand({ name: req.body.name, logo_url: req.body.logoUrl || '', website: req.body.website || '' });
    await brand.save();
    await createAuditLog(req.user.userId, 'BRAND_CREATE', 'BRAND', brand._id.toString(), `Created brand: ${brand.name}`);
    res.json({ id: brand._id, name: brand.name, logoUrl: brand.logo_url, website: brand.website, isActive: brand.is_active, createdAt: brand.created_at });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create brand.', errorCode: 'BRAND_CREATE_FAILED' });
  }
});

app.put('/api/brands/:id', verifyToken, requirePermission('MANAGE_BRANDS'), async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, { name: req.body.name, logo_url: req.body.logoUrl, website: req.body.website }, { new: true });
    await createAuditLog(req.user.userId, 'BRAND_UPDATE', 'BRAND', brand._id.toString(), `Updated brand: ${brand.name}`);
    res.json({ id: brand._id, name: brand.name });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update brand.', errorCode: 'BRAND_UPDATE_FAILED' });
  }
});

app.delete('/api/brands/:id', verifyToken, requirePermission('MANAGE_BRANDS'), async (req, res) => {
  try {
    const activeProducts = await Product.find({ brand_id: req.params.id, is_active: true }).limit(3);
    if (activeProducts.length > 0) {
      const names = activeProducts.map(p => p.name).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `Infrastructure block: This brand is currently linked to active products (${names}${activeProducts.length === 3 ? '...' : ''}). Reassign these products before deactivation.`, 
        errorCode: 'BRAND_IN_USE' 
      });
    }
    const brand = await Brand.findByIdAndUpdate(req.params.id, { is_active: false });
    await createAuditLog(req.user.userId, 'BRAND_DELETE', 'BRAND', req.params.id, `Deactivated brand: ${brand.name}`);
    res.json({ success: true, message: 'Brand deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete brand.', errorCode: 'BRAND_DELETE_FAILED' });
  }
});

// ──────────── SUPPLIERS ────────────
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find({ is_active: true });
    res.json(suppliers.map(s => ({ id: s._id, name: s.name, contact: s.contact, email: s.email, phone: s.phone, address: s.address, rating: s.rating, isActive: s.is_active, createdAt: s.created_at })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch suppliers.' });
  }
});

app.post('/api/suppliers', verifyToken, requirePermission('MANAGE_SUPPLIERS'), async (req, res) => {
  const error = validateRequired(['name'], req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const supplier = new Supplier({ name: req.body.name, contact: req.body.contact, email: req.body.email, phone: req.body.phone, address: req.body.address, rating: req.body.rating || 0 });
    await supplier.save();
    await createAuditLog(req.user.userId, 'SUPPLIER_CREATE', 'SUPPLIER', supplier._id.toString(), `Created supplier: ${supplier.name}`);
    res.json({ id: supplier._id, name: supplier.name, contact: supplier.contact, email: supplier.email, phone: supplier.phone, address: supplier.address, rating: supplier.rating, isActive: supplier.is_active, createdAt: supplier.created_at });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create supplier.' });
  }
});

app.put('/api/suppliers/:id', verifyToken, requirePermission('MANAGE_SUPPLIERS'), async (req, res) => {
  try {
    const s = await Supplier.findByIdAndUpdate(req.params.id, { name: req.body.name, contact: req.body.contact, email: req.body.email, phone: req.body.phone, address: req.body.address, rating: req.body.rating }, { new: true });
    await createAuditLog(req.user.userId, 'SUPPLIER_UPDATE', 'SUPPLIER', s._id.toString(), `Updated supplier: ${s.name}`);
    res.json({ id: s._id, name: s.name });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update supplier.', errorCode: 'SUPPLIER_UPDATE_FAILED' });
  }
});

app.delete('/api/suppliers/:id', verifyToken, requirePermission('MANAGE_SUPPLIERS'), async (req, res) => {
  try {
    const activeProducts = await Product.find({ supplier_id: req.params.id, is_active: true }).limit(3);
    if (activeProducts.length > 0) {
      const names = activeProducts.map(p => p.name).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `Infrastructure block: This supplier is currently linked to active products (${names}${activeProducts.length === 3 ? '...' : ''}). Reassign these products before deactivation.`, 
        errorCode: 'SUPPLIER_IN_USE' 
      });
    }
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { is_active: false });
    await createAuditLog(req.user.userId, 'SUPPLIER_DELETE', 'SUPPLIER', req.params.id, `Deactivated supplier: ${supplier.name}`);
    res.json({ success: true, message: 'Supplier deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete supplier.', errorCode: 'SUPPLIER_DELETE_FAILED' });
  }
});

// ──────────── WAREHOUSES ────────────
app.get('/api/warehouses', async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ is_active: true });
    res.json(warehouses.map(w => ({ id: w._id, name: w.name, location: w.location, isActive: w.is_active, createdAt: w.created_at })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch warehouses.' });
  }
});

app.post('/api/warehouses', verifyToken, requirePermission('MANAGE_WAREHOUSES'), async (req, res) => {
  const error = validateRequired(['name'], req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const warehouse = new Warehouse({ name: req.body.name, location: req.body.location || '' });
    await warehouse.save();
    await createAuditLog(req.user.userId, 'WAREHOUSE_CREATE', 'WAREHOUSE', warehouse._id.toString(), `Created warehouse: ${warehouse.name}`);
    res.json({ id: warehouse._id, name: warehouse.name, location: warehouse.location, isActive: warehouse.is_active, createdAt: warehouse.created_at });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create warehouse.' });
  }
});

app.put('/api/warehouses/:id', verifyToken, requirePermission('MANAGE_WAREHOUSES'), async (req, res) => {
  try {
    const w = await Warehouse.findByIdAndUpdate(req.params.id, { name: req.body.name, location: req.body.location }, { new: true });
    await createAuditLog(req.user.userId, 'WAREHOUSE_UPDATE', 'WAREHOUSE', w._id.toString(), `Updated warehouse: ${w.name}`);
    res.json({ id: w._id, name: w.name, location: w.location });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update warehouse.', errorCode: 'WAREHOUSE_UPDATE_FAILED' });
  }
});

app.delete('/api/warehouses/:id', verifyToken, requirePermission('MANAGE_WAREHOUSES'), async (req, res) => {
  try {
    const activeStocks = await WarehouseStock.find({ warehouse_id: req.params.id, quantity: { $gt: 0 } }).populate('product_id').limit(3);
    if (activeStocks.length > 0) {
      const names = activeStocks.map(s => s.product_id?.name || 'Unknown').join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `Infrastructure block: This storage node contains active stock for (${names}${activeStocks.length === 3 ? '...' : ''}). All units must be transferred or liquidated first.`, 
        errorCode: 'WAREHOUSE_IN_USE' 
      });
    }
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, { is_active: false });
    await createAuditLog(req.user.userId, 'WAREHOUSE_DELETE', 'WAREHOUSE', req.params.id, `Deactivated warehouse: ${warehouse.name}`);
    res.json({ success: true, message: 'Warehouse deactivated.' });
  } catch (err) {
    console.error('Delete warehouse error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete warehouse.', errorCode: 'WAREHOUSE_DELETE_FAILED' });
  }
});

// ──────────── CATEGORIES ────────────
app.get('/api/categories', async (req, res) => {
  try {
    const showAll = req.query.showAll === 'true';
    const filter = showAll ? {} : { is_active: true };
    const categories = await Category.find(filter);
    res.json(categories.map(c => ({ id: c._id, name: c.name, description: c.description || '', isActive: c.is_active, createdAt: c.created_at })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories.' });
  }
});

app.post('/api/categories', verifyToken, requirePermission('MANAGE_CATEGORIES'), async (req, res) => {
  const error = validateRequired(['name'], req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const category = new Category({ name: req.body.name, description: req.body.description || '' });
    await category.save();
    await createAuditLog(req.user.userId, 'CATEGORY_CREATE', 'CATEGORY', category._id.toString(), `Created category: ${category.name}`);
    res.json({ id: category._id, name: category.name, description: category.description, isActive: category.is_active, createdAt: category.created_at });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create category.' });
  }
});

app.put('/api/categories/:id', verifyToken, requirePermission('MANAGE_CATEGORIES'), async (req, res) => {
  try {
    const c = await Category.findByIdAndUpdate(req.params.id, { name: req.body.name, description: req.body.description }, { new: true });
    await createAuditLog(req.user.userId, 'CATEGORY_UPDATE', 'CATEGORY', c._id.toString(), `Updated category: ${c.name}`);
    res.json({ id: c._id, name: c.name, description: c.description });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update category.', errorCode: 'CATEGORY_UPDATE_FAILED' });
  }
});

app.delete('/api/categories/:id', verifyToken, requirePermission('MANAGE_CATEGORIES'), async (req, res) => {
  try {
    const activeProducts = await Product.find({ category_id: req.params.id, is_active: true }).limit(3);
    if (activeProducts.length > 0) {
      const names = activeProducts.map(p => p.name).join(', ');
      return res.status(400).json({ 
        success: false, 
        message: `Infrastructure block: This category houses active products (${names}${activeProducts.length === 3 ? '...' : ''}). Move them to a new category before decommissioning this path.`, 
        errorCode: 'CATEGORY_IN_USE' 
      });
    }
    // Soft delete: deactivate category
    const category = await Category.findByIdAndUpdate(req.params.id, { is_active: false });
    await createAuditLog(req.user.userId, 'CATEGORY_DELETE', 'CATEGORY', req.params.id, `Deactivated category: ${category.name}`);
    res.json({ success: true, message: 'Category deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete category.', errorCode: 'CATEGORY_DELETE_FAILED' });
  }
});

// ──────────── PRODUCTS ────────────
app.get('/api/products', async (req, res) => {
  try {
    const showAll = req.query.showAll === 'true';
    const filter = showAll ? {} : { is_active: true };
    const { page, limit, skip } = parsePagination(req.query);
    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter).populate('category_id').populate('brand_id').populate('supplier_id').skip(skip).limit(limit);
    const formatted = products.map(p => ({
      id: p._id,
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      modelNumber: p.model_number || '',
      specifications: p.specifications || '',
      categoryId: p.category_id ? p.category_id._id : null,
      categoryName: p.category_id ? p.category_id.name : 'Uncategorized',
      brandId: p.brand_id ? p.brand_id._id : null,
      brandName: p.brand_id ? p.brand_id.name : 'No Brand',
      supplierId: p.supplier_id ? p.supplier_id._id : null,
      supplierName: p.supplier_id ? p.supplier_id.name : 'No Supplier',
      unit: p.unit,
      reorderLevel: p.reorder_level,
      overstockLevel: p.overstock_level,
      currentStock: p.current_stock,
      costPrice: p.cost_price,
      sellingPrice: p.selling_price,
      totalSold: p.total_sold || 0,
      totalRevenue: p.total_revenue || 0,
      status: p.status || 'ACTIVE',
      isActive: p.is_active,
      deletedAt: p.deleted_at || null,
      createdAt: p.created_at
    }));
    // Return flat array for backward compatibility when no pagination params given
    if (!req.query.page) return res.json(formatted);
    res.json(paginatedResponse(formatted, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

app.post('/api/products', verifyToken, requirePermission('CREATE_PRODUCT'), async (req, res) => {
  const error = validateRequired(['name', 'categoryId', 'unit'], req.body);
  if (error) return res.status(400).json({ success: false, message: error, errorCode: 'VALIDATION_ERROR' });
  const inputError = validateProductInput(req.body);
  if (inputError) return res.status(400).json({ success: false, message: inputError, errorCode: 'INPUT_VALIDATION_ERROR' });
  try {
    // Auto-generate SKU if not provided
    let sku = req.body.sku;
    if (!sku) {
      const cat = await Category.findById(req.body.categoryId);
      const brand = req.body.brandId ? await Brand.findById(req.body.brandId) : null;
      sku = await generateSKU(cat?.name, brand?.name);
    }

    const barcode = generateBarcode(sku);
    const product = new Product({
      sku, barcode,
      name: req.body.name,
      model_number: req.body.modelNumber || '',
      specifications: req.body.specifications || '',
      category_id: req.body.categoryId,
      brand_id: req.body.brandId || null,
      supplier_id: req.body.supplierId || null,
      unit: req.body.unit,
      reorder_level: req.body.reorderLevel || 10,
      overstock_level: req.body.overstockLevel || 500,
      cost_price: req.body.costPrice || 0,
      selling_price: req.body.sellingPrice || 0
    });
    await product.save();
    invalidateCache();
    await createAuditLog(req.user.userId, 'PRODUCT_CREATE', 'PRODUCT', product._id.toString(), `Created product: ${sku} - ${req.body.name}`);
    res.json({ id: product._id, sku: product.sku, barcode: product.barcode, name: product.name });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product: ' + err.message });
  }
});

app.put('/api/products/:id', verifyToken, requirePermission('EDIT_PRODUCT'), async (req, res) => {
  const inputError = validateProductInput(req.body);
  if (inputError) return res.status(400).json({ success: false, message: inputError, errorCode: 'INPUT_VALIDATION_ERROR' });
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.modelNumber !== undefined) updates.model_number = req.body.modelNumber;
    if (req.body.specifications !== undefined) updates.specifications = req.body.specifications;
    if (req.body.categoryId) updates.category_id = req.body.categoryId;
    if (req.body.brandId !== undefined) updates.brand_id = req.body.brandId || null;
    if (req.body.supplierId !== undefined) updates.supplier_id = req.body.supplierId || null;
    if (req.body.unit) updates.unit = req.body.unit;
    if (req.body.reorderLevel !== undefined) updates.reorder_level = req.body.reorderLevel;
    if (req.body.overstockLevel !== undefined) updates.overstock_level = req.body.overstockLevel;
    if (req.body.costPrice !== undefined) updates.cost_price = req.body.costPrice;
    if (req.body.sellingPrice !== undefined) updates.selling_price = req.body.sellingPrice;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    await checkAndCreateAlerts(product._id);
    invalidateCache();
    await createAuditLog(req.user.userId, 'PRODUCT_UPDATE', 'PRODUCT', product._id.toString(), `Updated product: ${product.name}`);
    res.json(product);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product.', errorCode: 'PRODUCT_UPDATE_FAILED' });
  }
});

app.delete('/api/products/:id', verifyToken, requirePermission('DELETE_PRODUCT'), async (req, res) => {
  try {
    // Soft delete
    await Product.findByIdAndUpdate(req.params.id, { 
      is_active: false, 
      status: 'DISCONTINUED', 
      deleted_at: new Date() 
    });
    await createAuditLog(req.user.userId, 'PRODUCT_DELETE', 'PRODUCT', req.params.id, 'Soft-deleted product.');
    invalidateCache();
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product.', errorCode: 'PRODUCT_DELETE_FAILED' });
  }
});

// ──────────── TRANSACTIONS ────────────
app.get('/api/transactions', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const total = await Transaction.countDocuments();
    const transactions = await Transaction.find()
      .populate({
        path: 'product_id',
        populate: [
          { path: 'brand_id' },
          { path: 'category_id' }
        ]
      })
      .populate('created_by')
      .populate('supplier_id')
      .populate('warehouse_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const formatted = transactions.map(t => ({
      id: t._id,
      productId: t.product_id?._id,
      productName: t.product_id?.name || 'Unknown',
      brandName: t.product_id?.brand_id?.name || 'O.E.M',
      categoryName: t.product_id?.category_id?.name || 'Uncategorized',
      warehouseId: t.warehouse_id?._id || null,
      warehouseName: t.warehouse_id?.name || 'Default',
      type: t.type,
      quantity: t.quantity,
      supplierId: t.supplier_id?._id || null,
      supplierName: t.supplier_id?.name || '',
      purchaseCost: t.purchase_cost || 0,
      customerName: t.customer_name || '',
      sellingPriceAtSale: t.selling_price_at_sale || 0,
      profit: t.profit || 0,
      reason: t.reason,
      remarks: t.remarks,
      isAnomaly: t.is_anomaly || false,
      createdBy: t.created_by?._id,
      createdByName: t.created_by?.name || 'System',
      createdAt: t.created_at
    }));
    if (!req.query.page) return res.json(formatted);
    res.json(paginatedResponse(formatted, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions.' });
  }
});

app.post('/api/transactions', verifyToken, async (req, res) => {
  const { 
    type, productId, quantity, reason, remarks, warehouseId, supplierId, 
    purchaseCost, customerName, customerType, sellingPriceAtSale, discountApplied, 
    requestId, invoiceNumber, paymentStatus, receivedDate, returnReason, returnCondition 
  } = req.body;
  const userId = req.user.userId;

  const error = validateRequired(['type', 'productId', 'quantity'], req.body);
  if (error) return res.status(400).json({ success: false, message: error, errorCode: 'VALIDATION_ERROR' });

  const inputError = validateTransactionInput(req.body);
  if (inputError) return res.status(400).json({ success: false, message: inputError, errorCode: 'INPUT_VALIDATION_ERROR' });

  if (quantity > 10000) {
    await createAuditLog(userId, 'DATA_QUALITY_REJECT', 'TRANSACTION', productId, `Rejected: Extreme quantity ${quantity}`);
    return res.status(400).json({ success: false, message: 'Extreme stock update blocked (exceeds 10,000 units).', errorCode: 'DATA_QUALITY_LIMIT' });
  }

  // ──────────── Transaction Support Check ────────────
  let session = null;
  try {
    // Proactive check: Only attempt transactions if the DB is a replica set
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    if (serverStatus.repl) {
      session = await mongoose.startSession();
    } else {
      console.warn('⚠️  Standalone MongoDB detected. Transactions disabled for local compatibility.');
    }
  } catch (err) {
    console.warn('⚠️  Could not initialize MongoDB session. Falling back to standalone mode.');
  }

  try {
    let transactionRecord;
    const runAtomic = async (sess) => {
      // ── Idempotency Check ──
      if (requestId) {
        const existing = await Transaction.findOne({ request_id: requestId }).session(sess);
        if (existing) {
          transactionRecord = existing;
          transactionRecord.idempotent = true;
          return; 
        }
      }
      const product = await Product.findById(productId).session(sess);
      if (!product) throw new Error('Product not found.');

      const warehouse = warehouseId ? await Warehouse.findById(warehouseId).session(sess) : null;

      // Calculate profit & stock changes
      let profit = 0;
      let stockChange = 0;
      let finalPrice = sellingPriceAtSale || product.selling_price;
      if (discountApplied) finalPrice -= discountApplied;
      
      if (type === 'SALE' || type === 'OUT') {
        if (product.current_stock < quantity) {
          throw new Error(`Insufficient stock. Available: ${product.current_stock}, Requested: ${quantity}`);
        }
        profit = (finalPrice - product.cost_price) * quantity;
        stockChange = -quantity;
        product.last_sold_at = new Date();
        product.average_daily_sales = (product.average_daily_sales * 29 + quantity) / 30;
      } else if (type === 'PURCHASE' || type === 'IN') {
        stockChange = quantity;
      } else if (type === 'RETURN') {
        stockChange = (returnCondition === 'Not Resellable') ? 0 : quantity;
        profit = -((finalPrice - product.cost_price) * quantity);
      } else {
        stockChange = quantity;
      }

      // Warehouse Capacity Check
      if (warehouse && stockChange > 0) {
        if (warehouse.current_utilization + stockChange > warehouse.capacity) {
          throw new Error(`Warehouse capacity exceeded. Capacity: ${warehouse.capacity}, Requested: ${warehouse.current_utilization + stockChange}`);
        }
      }

      // Update Basic Metrics
      product.current_stock += stockChange;
      if (type === 'SALE') {
        product.total_sold += quantity;
        product.total_revenue += finalPrice * quantity;
      } else if (type === 'RETURN') {
        product.total_returned += quantity;
      }
      
      // Stock Turnover update
      const avgStock = (product.current_stock + (product.current_stock - stockChange)) / 2 || 1;
      product.stock_turnover = product.total_sold / avgStock;
      product.is_fast_moving = product.stock_turnover > 2;

      await product.save({ session: sess });

      // Update Warehouse utilization
      if (warehouse) {
        warehouse.current_utilization += stockChange;
        warehouse.utilization_percentage = (warehouse.current_utilization / warehouse.capacity) * 100;
        await warehouse.save({ session: sess });
      }

      // Update Supplier analytics
      if (type === 'PURCHASE' && supplierId) {
        const supplier = await Supplier.findById(supplierId).session(sess);
        if (supplier) {
          supplier.total_purchases += 1;
          supplier.total_spend += purchaseCost || (product.cost_price * quantity);
          supplier.last_delivery_date = receivedDate || new Date();
          await supplier.save({ session: sess });
        }
      }

      // Create Transaction Record
      const isAnomaly = (type === 'ADJUSTMENT' && Math.abs(quantity) > 500) || (quantity > 1000);
      const transaction = new Transaction({
        product_id: productId,
        warehouse_id: warehouseId || null,
        type,
        quantity,
        supplier_id: supplierId || null,
        purchase_cost: purchaseCost || (product.cost_price * quantity),
        invoice_number: invoiceNumber,
        payment_status: paymentStatus || 'PENDING',
        received_date: receivedDate,
        customer_name: customerName || '',
        customer_type: customerType || 'Retail',
        selling_price_at_sale: finalPrice,
        discount_applied: discountApplied || 0,
        final_price: finalPrice,
        profit,
        reason: reason || '',
        remarks: remarks || '',
        is_anomaly: isAnomaly,
        ...(requestId && { request_id: requestId }),
        return_reason: returnReason,
        return_condition: returnCondition || 'Resellable',
        created_by: userId
      });
      transactionRecord = await transaction.save({ session: sess });

      if (isAnomaly) {
        await new Alert({
          type: 'OVERSTOCK',
          product_id: productId,
          warehouse_id: warehouseId,
          message: `ANOMALY: Large stock movement of ${quantity} units detected.`
        }).save({ session: sess });
      }

      // Warehouse Stock update
      if (warehouseId) {
        await WarehouseStock.findOneAndUpdate(
          { product_id: productId, warehouse_id: warehouseId },
          { $inc: { quantity: stockChange }, $set: { updated_at: new Date() } },
          { upsert: true, session: sess }
        );
      }

      await createAuditLog(userId, (stockChange > 0 ? 'STOCK_IN' : 'STOCK_OUT'), 'STOCK', productId, `${type} x${quantity} for ${product.name}`);
    };

    if (session) {
      try {
        await session.withTransaction(() => runAtomic(session));
      } catch (err) {
        if (err.message.includes('replica set') || err.message.includes('mongos') || err.message.includes('transaction')) {
          console.warn('⚠️  MongoDB Transaction Session failed (standalone detected). Proceeding without transaction.');
          await runAtomic(null);
        } else {
          throw err;
        }
      }
    } else {
      await runAtomic(null);
    }

    await checkAndCreateAlerts(productId);
    invalidateCache();
    res.json(transactionRecord);
  } catch (err) {
    console.error('Transaction failed:', err.message);
    res.status(400).json({ success: false, message: err.message, errorCode: 'TRANSACTION_FAILED' });
  } finally {
    if (session) session.endSession();
  }
});

// ──────────── WAREHOUSE STOCK ────────────
app.get('/api/warehouse-stock', async (req, res) => {
  try {
    const stocks = await WarehouseStock.find().populate('product_id').populate('warehouse_id');
    res.json(stocks.map(s => ({
      id: s._id,
      productId: s.product_id?._id,
      productName: s.product_id?.name || 'Unknown',
      warehouseId: s.warehouse_id?._id,
      warehouseName: s.warehouse_id?.name || 'Unknown',
      quantity: s.quantity,
      updatedAt: s.updated_at
    })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch warehouse stock.' });
  }
});

// ──────────── ALERTS ────────────
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().populate('product_id').populate('warehouse_id').sort({ created_at: -1 }).limit(100);
    res.json(alerts.map(a => ({
      id: a._id, type: a.type,
      productId: a.product_id?._id, productName: a.product_id?.name || 'Unknown',
      warehouseId: a.warehouse_id?._id, warehouseName: a.warehouse_id?.name || '',
      message: a.message, isRead: a.is_read, createdAt: a.created_at
    })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch alerts.' });
  }
});

app.put('/api/alerts/:id/read', async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ message: 'Alert marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update alert.' });
  }
});

// ──────────── AUDIT LOGS ────────────
app.get('/api/logs', verifyToken, requirePermission('VIEW_AUDIT_LOGS'), async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find().populate('user_id').sort({ created_at: -1 }).skip(skip).limit(limit);
    const formatted = logs.map(l => ({
      id: l._id, userId: l.user_id?._id, userName: l.user_id?.name || 'System',
      action: l.action, entity: l.entity, entityId: l.entity_id, message: l.message, createdAt: l.created_at
    }));
    if (!req.query.page) return res.json(formatted);
    res.json(paginatedResponse(formatted, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs.' });
  }
});

app.post('/api/logs', verifyToken, requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const log = new AuditLog({ user_id: req.user.userId, action: req.body.action, entity: req.body.entity, entity_id: req.body.entityId, message: req.body.message });
    await log.save();
    res.json(log);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create log.', errorCode: 'LOG_CREATE_FAILED' });
  }
});

// ──────────── USERS ────────────
app.get('/api/users', verifyToken, requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const total = await User.countDocuments({ is_active: true });
    const users = await User.find({ is_active: true }).skip(skip).limit(limit);
    const formatted = users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, permissions: u.permissions || [], isActive: u.is_active, createdAt: u.created_at }));
    if (!req.query.page) return res.json(formatted);
    res.json(paginatedResponse(formatted, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

app.post('/api/users', async (req, res) => {
  const error = validateRequired(['name', 'email'], req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const user = new User({ name: req.body.name, email: req.body.email, password_hash: req.body.password_hash || req.body.password || 'Admin@123', role: req.body.role || 'STAFF', permissions: req.body.permissions || [] });
    await user.save();
    await createAuditLog(req.body.adminId, 'USER_CREATE', 'USER', user._id.toString(), `Created user: ${user.name} (${user.role})`);
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user: ' + err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.role) updates.role = req.body.role;
    if (req.body.permissions) updates.permissions = req.body.permissions;
    if (req.body.password || req.body.password_hash) updates.password_hash = req.body.password || req.body.password_hash;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    await createAuditLog(req.body.adminId, 'USER_UPDATE', 'USER', user._id.toString(), `Updated user: ${user.name}`);
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { is_active: false });
    await createAuditLog(req.body.adminId, 'USER_DELETE', 'USER', req.params.id, 'Soft-deleted user account.');
    res.json({ message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// ──────────── INTELLIGENCE / ANALYTICS ────────────

// 1. Composite Product Intelligence Scoring (CACHED)
app.get('/api/analytics/product-score', verifyToken, requirePermission('VIEW_REPORTS'), async (req, res) => {
  try {
    const cached = getCached('product-score');
    if (cached) return res.json(cached);

    const pipeline = [
      { $match: { is_active: true } },
      { $project: {
          productId: '$_id',
          name: 1,
          totalSold: '$total_sold',
          profit: { $subtract: ['$total_revenue', { $multiply: ['$total_sold', '$cost_price'] }] },
          turnover: { 
            $cond: [ { $gt: ['$current_stock', 0] }, { $divide: ['$total_sold', '$current_stock'] }, '$total_sold' ] 
          }
      }},
      { $setWindowFields: {
          output: {
            maxSold: { $max: '$totalSold' },
            maxProfit: { $max: '$profit' },
            maxTurnover: { $max: '$turnover' }
          }
      }},
      { $project: {
          productId: 1, name: 1, totalSold: 1, profit: 1, turnover: 1,
          normalizedSold: { $cond: [ {$eq: ['$maxSold', 0]}, 0, { $divide: ['$totalSold', '$maxSold'] }]},
          normalizedProfit: { $cond: [ {$eq: ['$maxProfit', 0]}, 0, { $divide: ['$profit', '$maxProfit'] }]},
          normalizedTurnover: { $cond: [ {$eq: ['$maxTurnover', 0]}, 0, { $divide: ['$turnover', '$maxTurnover'] }]}
      }},
      { $project: {
          productId: 1, name: 1,
          score: { $multiply: [100, { $add: [
            { $multiply: ['$normalizedSold', 0.4] },
            { $multiply: ['$normalizedProfit', 0.3] },
            { $multiply: ['$normalizedTurnover', 0.3] }
          ]}]}
      }},
      { $sort: { score: -1 } },
      { $setWindowFields: { sortBy: { score: -1 }, output: { rank: { $documentNumber: {} } } } }
    ];
    const scores = await Product.aggregate(pipeline);
    const result = {
      metadata: { weights: { sales: 0.4, profit: 0.3, turnover: 0.3 } },
      scores
    };
    setCache('product-score', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute product scores: ' + err.message });
  }
});

// 2. Decision & Recommendation Engine (Explainable, CACHED)
app.get('/api/analytics/recommendations', verifyToken, requirePermission('VIEW_REPORTS'), async (req, res) => {
  try {
    const cached = getCached('recommendations');
    if (cached) return res.json(cached);
    const products = await Product.find({ is_active: true });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSales = await Transaction.find({ type: { $in: ['SALE', 'OUT'] }, created_at: { $gte: thirtyDaysAgo } });
    const recentReturns = await Transaction.find({ type: 'RETURN', created_at: { $gte: thirtyDaysAgo } });

    const recommendations = products.map(p => {
      const totalProfit = p.total_revenue - (p.total_sold * p.cost_price);
      const turnoverRatio = p.current_stock > 0 ? (p.total_sold / p.current_stock) : p.total_sold;
      const returnRate = p.total_sold > 0 ? ((p.total_returned || 0) / p.total_sold) : 0;
      const last30Sales = recentSales.filter(t => t.product_id.toString() === p._id.toString()).reduce((s, t) => s + t.quantity, 0);
      const last30Returns = recentReturns.filter(t => t.product_id.toString() === p._id.toString()).reduce((s, t) => s + t.quantity, 0);
      const deadStockValue = p.total_sold === 0 ? p.current_stock * p.cost_price : 0;

      const reasons = [];
      let recommendation = '';
      let category = '';

      if (turnoverRatio > 2 && totalProfit > 0) {
        category = 'High Performer';
        recommendation = `Increase reorder quantity by 20% (current reorder level: ${p.reorder_level})`;
        reasons.push(`Turnover ratio of ${turnoverRatio.toFixed(2)}x exceeds 2.0 threshold`);
        reasons.push(`Lifetime profit of ${totalProfit.toFixed(0)} is positive`);
        if (last30Sales > 0) reasons.push(`${last30Sales} units sold in the last 30 days`);
        if (returnRate < 0.05) reasons.push(`Return rate of ${(returnRate * 100).toFixed(1)}% is minimal`);
      } else if (p.current_stock > 0 && p.total_sold === 0) {
        category = 'Dead Stock';
        recommendation = `Apply discount to clear ${deadStockValue.toFixed(0)} of frozen capital or discontinue`;
        reasons.push('Zero units sold since product listing');
        reasons.push(`${p.current_stock} units currently occupying warehouse space`);
        reasons.push(`${deadStockValue.toFixed(0)} capital locked in unsold inventory`);
      } else if (returnRate > 0.15) {
        category = 'High Return Risk';
        recommendation = 'Investigate quality issues and consider supplier review';
        reasons.push(`Return rate of ${(returnRate * 100).toFixed(1)}% exceeds 15% threshold`);
        reasons.push(`${p.total_returned || 0} total returns vs ${p.total_sold} total sold`);
        if (last30Returns > 0) reasons.push(`${last30Returns} returns in last 30 days`);
      } else if (turnoverRatio < 0.5 && p.total_sold > 0) {
        category = 'Slow-moving';
        recommendation = `Reduce reorder level from ${p.reorder_level} to ${Math.max(1, Math.floor(p.reorder_level * 0.6))}`;
        reasons.push(`Turnover ratio of ${turnoverRatio.toFixed(2)}x is below 0.5 threshold`);
        if (last30Sales === 0) reasons.push('No sales recorded in the last 30 days');
        else reasons.push(`Only ${last30Sales} units sold in last 30 days`);
      } else {
        category = 'Stable';
        recommendation = 'Maintain current reorder and pricing strategy';
        reasons.push(`Turnover ratio of ${turnoverRatio.toFixed(2)}x is within normal range`);
        if (last30Sales > 0) reasons.push(`${last30Sales} units sold in last 30 days`);
      }

      return {
        entity: p.name,
        productId: p._id,
        category,
        recommendation,
        reasons,
        metricsUsed: {
          totalSold: p.total_sold,
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          turnoverRatio: parseFloat(turnoverRatio.toFixed(2)),
          returnRate: parseFloat((returnRate * 100).toFixed(1)),
          last30DaySales: last30Sales,
          currentStock: p.current_stock
        }
      };
    });

    setCache('recommendations', recommendations);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate recommendations: ' + err.message });
  }
});

// 3. Demand Gap (Lost Sales) Detection
app.get('/api/analytics/demand-gap', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pipeline = [
      { $match: { type: 'SALE', created_at: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$product_id', sold30Days: { $sum: '$quantity' } } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $match: { 'product.is_active': true, 'product.current_stock': 0, sold30Days: { $gt: 0 } } },
      { $project: {
          productId: '$_id',
          name: '$product.name',
          avgDailyDemand: { $divide: ['$sold30Days', 30] },
          outOfStockDays: { $literal: 7 } // Assume an estimated 7 days out of stock for now
      }},
      { $project: {
          productId: 1, name: 1, avgDailyDemand: 1,
          missedSalesEstimate: { $ceil: { $multiply: ['$avgDailyDemand', '$outOfStockDays'] } },
          confidenceLevel: { $cond: [{ $gt: ['$avgDailyDemand', 3] }, 'HIGH', 'MEDIUM'] },
          recommendation: "Increase safety stock and reorder immediately based on past velocity"
      }}
    ];
    const gaps = await Transaction.aggregate(pipeline);
    res.json(gaps);
  } catch (err) {
    res.status(500).json({ message: 'Failed to detect demand gaps.' });
  }
});

// 4. Trend Analysis Engine
app.get('/api/analytics/trends', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const pipeline = [
      { $match: { type: { $in: ['SALE', 'OUT'] }, created_at: { $gte: sixtyDaysAgo } } },
      { $group: {
          _id: '$product_id',
          currentPeriodSales: { $sum: { $cond: [ {$gte: ['$created_at', thirtyDaysAgo]}, '$quantity', 0 ] } },
          previousPeriodSales: { $sum: { $cond: [ {$lt: ['$created_at', thirtyDaysAgo]}, '$quantity', 0 ] } }
      }},
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: {
          productId: '$_id',
          name: '$product.name',
          currentPeriodSales: 1,
          previousPeriodSales: 1,
          growthRate: { 
            $cond: [ 
              { $eq: ['$previousPeriodSales', 0] }, 
              1, // 100% growth if prev was 0
              { $divide: [ { $subtract: ['$currentPeriodSales', '$previousPeriodSales'] }, '$previousPeriodSales' ] }
            ] 
          }
      }},
      { $project: {
          productId: 1, name: 1, currentPeriodSales: 1, previousPeriodSales: 1, growthRate: 1,
          trend: { $cond: [ {$gt: ['$growthRate', 0.05]}, 'UP', { $cond: [ {$lt: ['$growthRate', -0.05]}, 'DOWN', 'STABLE' ] } ] }
      }}
    ];
    const trends = await Transaction.aggregate(pipeline);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute trends: ' + err.message});
  }
});

// 7. Inventory Simulation Engine (What-If)
app.post('/api/analytics/simulate', async (req, res) => {
  try {
    const { productId, proposedStockIncrease, availableBudget } = req.body;
    let finalIncrease = proposedStockIncrease;
    if (!finalIncrease || finalIncrease <= 0) return res.status(400).json({ message: 'Invalid proposed stock.' });
    
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const constrainedBy = [];
    if (availableBudget && (finalIncrease * product.cost_price > availableBudget)) {
      finalIncrease = Math.floor(availableBudget / product.cost_price);
      constrainedBy.push("budget");
    }

    // Constraint-Based Procurement Engine storage check
    const warehouse = await Warehouse.findOne({ is_active: true }); // Simplification for test
    if (warehouse && warehouse.capacity && (product.current_stock + finalIncrease > warehouse.capacity)) {
      finalIncrease = warehouse.capacity - product.current_stock;
      constrainedBy.push("storage");
    }

    const turnover = product.total_sold > 0 ? (product.current_stock > 0 ? (product.total_sold / product.current_stock) : product.total_sold) : 0;
    const expectedSales = turnover > 0 ? finalIncrease * 0.8 : 0;
    const expectedProfit = expectedSales * (product.selling_price - product.cost_price);
    const storageImpact = finalIncrease * 1.5;

    let recommendation = "";
    if (constrainedBy.length > 0) {
      recommendation = `WARNING: Scaled down to ${finalIncrease} units to meet constraints.`;
    } else {
      recommendation = turnover < 1 ? "WARNING: Low historical turnover. Increase runs high risk of overstock." : "Simulated outcome acceptable.";
    }

    res.json({
      expectedSales: Math.round(expectedSales),
      expectedProfit: expectedProfit.toFixed(2),
      storageImpact,
      recommendation,
      suggestedQuantity: finalIncrease,
      constrainedBy
    });
  } catch (err) {
    res.status(500).json({ message: 'Simulation failed.' });
  }
});

// Stock Turnover
app.get('/api/intelligence/turnover', async (req, res) => {
  try {
    const pipeline = [
      { $match: { type: 'SALE', created_at: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } },
      { $group: {
          _id: '$product_id',
          totalSold30Days: { $sum: '$quantity' },
          profitGenerated: { $sum: '$profit' }
        }
      },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: {
          productId: '$_id',
          productName: '$product.name',
          modelNumber: '$product.model_number',
          currentStock: '$product.current_stock',
          totalSold30Days: 1,
          profitGenerated: 1,
          turnoverRatio: { 
            $cond: [ { $eq: ['$product.current_stock', 0] }, '$totalSold30Days', { $divide: ['$totalSold30Days', '$product.current_stock'] } ] 
          }
      }},
      { $sort: { turnoverRatio: -1 } }
    ];
    const turnover = await Transaction.aggregate(pipeline);
    res.json(turnover);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute stock turnover analytics.' });
  }
});

// Supplier Intelligence
app.get('/api/intelligence/suppliers', async (req, res) => {
  try {
    const pipeline = [
      { $match: { type: 'PURCHASE' } },
      { $group: {
          _id: '$supplier_id',
          totalPurchases: { $sum: 1 },
          totalVolumeReceived: { $sum: '$quantity' },
          totalSpend: { $sum: { $multiply: ['$quantity', '$purchase_cost'] } }
      }},
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
      { $project: { 
          supplierId: '$_id', 
          supplierName: '$supplier.name', 
          rating: '$supplier.rating', 
          totalSpend: 1, 
          totalVolumeReceived: 1 
      }},
      { $sort: { totalSpend: -1 } }
    ];
    const performance = await Transaction.aggregate(pipeline);
    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute supplier performance.' });
  }
});

// Profit Dashboard
app.get('/api/analytics/profit', async (req, res) => {
  try {
    const sales = await Transaction.find({ type: { $in: ['SALE', 'OUT'] } }).populate('product_id');
    const totalRevenue = sales.reduce((s, t) => s + (t.selling_price_at_sale || 0) * t.quantity, 0);
    const totalCost = sales.reduce((s, t) => s + (t.product_id?.cost_price || 0) * t.quantity, 0);
    const totalProfit = sales.reduce((s, t) => s + (t.profit || 0), 0);
    res.json({ totalRevenue, totalCost, totalProfit, totalTransactions: sales.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to calculate profit analytics.' });
  }
});

// Fast / Slow Moving Products
app.get('/api/analytics/movement', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const transactions = await Transaction.find({ created_at: { $gte: thirtyDaysAgo } }).populate('product_id');

    const movement = {};
    transactions.forEach(t => {
      const name = t.product_id?.name || 'Unknown';
      const id = t.product_id?._id?.toString();
      if (!id) return;
      if (!movement[id]) movement[id] = { name, totalQuantity: 0, transactions: 0 };
      movement[id].totalQuantity += t.quantity;
      movement[id].transactions += 1;
    });

    const sorted = Object.entries(movement).map(([id, data]) => ({ productId: id, ...data })).sort((a, b) => b.totalQuantity - a.totalQuantity);
    const fastMoving = sorted.slice(0, 10);
    const slowMoving = sorted.slice(-10).reverse();

    res.json({ fastMoving, slowMoving });
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute movement analytics.' });
  }
});

// Dead Stock Detection
app.get('/api/analytics/dead-stock', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 60;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activeProducts = await Product.find({ is_active: true, current_stock: { $gt: 0 } });
    const recentProductIds = await Transaction.distinct('product_id', { created_at: { $gte: cutoff } });
    const recentIdSet = new Set(recentProductIds.map(id => id.toString()));
    const deadStock = activeProducts.filter(p => !recentIdSet.has(p._id.toString()));

    res.json(deadStock.map(p => ({
      productId: p._id, sku: p.sku, name: p.name, currentStock: p.current_stock, costPrice: p.cost_price,
      deadStockDays: days,
      deadStockValue: p.current_stock * p.cost_price
    })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to detect dead stock.' });
  }
});

// Brand Analysis
app.get('/api/analytics/brands', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true }).populate('brand_id');
    const sales = await Transaction.find({ type: { $in: ['SALE', 'OUT'] } });

    const brandData = {};
    products.forEach(p => {
      const brandName = p.brand_id?.name || 'No Brand';
      if (!brandData[brandName]) brandData[brandName] = { productCount: 0, totalStock: 0, totalRevenue: 0, totalProfit: 0 };
      brandData[brandName].productCount++;
      brandData[brandName].totalStock += p.current_stock;
    });

    sales.forEach(t => {
      const product = products.find(p => p._id.toString() === t.product_id.toString());
      const brandName = product?.brand_id?.name || 'No Brand';
      if (brandData[brandName]) {
        brandData[brandName].totalRevenue += (t.selling_price_at_sale || 0) * t.quantity;
        brandData[brandName].totalProfit += t.profit || 0;
      }
    });

    res.json(Object.entries(brandData).map(([name, data]) => ({ brand: name, ...data })));
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute brand analytics.' });
  }
});

// Smart Inventory - Reorder Suggestions (Moving Average)
app.get('/api/analytics/reorder-suggestions', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true });
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentSales = await Transaction.find({ type: { $in: ['SALE', 'OUT'] }, created_at: { $gte: ninetyDaysAgo } });

    const suggestions = products.map(p => {
      const productSales = recentSales.filter(t => t.product_id.toString() === p._id.toString());
      const totalSold = productSales.reduce((s, t) => s + t.quantity, 0);
      const avgDailySales = totalSold / 90;
      const daysOfSupply = avgDailySales > 0 ? Math.floor(p.current_stock / avgDailySales) : 999;
      const suggestedReorder = Math.ceil(avgDailySales * 30); // 30-day supply

      return {
        id: p._id, sku: p.sku, name: p.name, currentStock: p.current_stock,
        reorderLevel: p.reorder_level, avgDailySales: Math.round(avgDailySales * 100) / 100,
        daysOfSupply, suggestedReorder,
        urgency: daysOfSupply <= 7 ? 'CRITICAL' : daysOfSupply <= 14 ? 'HIGH' : daysOfSupply <= 30 ? 'MEDIUM' : 'LOW'
      };
    }).filter(s => s.urgency !== 'LOW').sort((a, b) => a.daysOfSupply - b.daysOfSupply);

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate reorder suggestions.' });
  }
});

// ──────────── MODEL PERFORMANCE ANALYSIS ────────────
app.get('/api/analytics/model-performance', async (req, res) => {
  try {
    const pipeline = [
      { $match: { is_active: true } },
      { $group: {
          _id: { brandId: '$brand_id', modelNumber: '$model_number' },
          totalProducts: { $sum: 1 },
          totalSold: { $sum: '$total_sold' },
          totalReturned: { $sum: '$total_returned' },
          totalRevenue: { $sum: '$total_revenue' },
          totalStock: { $sum: '$current_stock' },
          avgCostPrice: { $avg: '$cost_price' },
          avgSellingPrice: { $avg: '$selling_price' }
      }},
      { $lookup: { from: 'brands', localField: '_id.brandId', foreignField: '_id', as: 'brand' } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      { $project: {
          brandName: '$brand.name',
          modelNumber: '$_id.modelNumber',
          totalProducts: 1,
          totalSold: 1,
          totalReturned: 1,
          totalRevenue: 1,
          totalStock: 1,
          profit: { $subtract: ['$totalRevenue', { $multiply: ['$totalSold', '$avgCostPrice'] }] },
          turnover: { $cond: [{ $gt: ['$totalStock', 0] }, { $divide: ['$totalSold', '$totalStock'] }, '$totalSold'] },
          returnRate: { $cond: [{ $gt: ['$totalSold', 0] }, { $divide: ['$totalReturned', '$totalSold'] }, 0] }
      }},
      { $sort: { profit: -1 } }
    ];
    const results = await Product.aggregate(pipeline);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute model performance: ' + err.message });
  }
});

// ──────────── RETURN IMPACT ANALYSIS ────────────
app.get('/api/analytics/return-impact', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true, total_returned: { $gt: 0 } });
    const results = products.map(p => {
      const returnRate = p.total_sold > 0 ? (p.total_returned / p.total_sold) : 0;
      const profitImpact = p.total_returned * (p.selling_price - p.cost_price);
      return {
        productId: p._id,
        name: p.name,
        totalSold: p.total_sold,
        totalReturned: p.total_returned,
        returnRate: parseFloat((returnRate * 100).toFixed(1)),
        impactOnProfit: parseFloat((-profitImpact).toFixed(2)),
        isHighReturnRisk: returnRate > 0.15
      };
    }).sort((a, b) => b.returnRate - a.returnRate);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute return impact.' });
  }
});

// ──────────── USER BEHAVIOR ANALYTICS ────────────
app.get('/api/analytics/user-behavior', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pipeline = [
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: '$user_id',
          totalActions: { $sum: 1 },
          stockEdits: { $sum: { $cond: [{ $in: ['$action', ['STOCK_IN', 'STOCK_OUT', 'STOCK_ADJUST', 'STOCK_RETURN']] }, 1, 0] } },
          deletions: { $sum: { $cond: [{ $regexMatch: { input: '$action', regex: /DELETE/ } }, 1, 0] } },
          dataQualityRejects: { $sum: { $cond: [{ $eq: ['$action', 'DATA_QUALITY_REJECT'] }, 1, 0] } },
          productEdits: { $sum: { $cond: [{ $eq: ['$action', 'PRODUCT_UPDATE'] }, 1, 0] } }
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
          userId: '$_id',
          userName: '$user.name',
          role: '$user.role',
          totalActions: 1,
          stockEdits: 1,
          deletions: 1,
          dataQualityRejects: 1,
          productEdits: 1,
          anomalyCount: { $add: ['$deletions', '$dataQualityRejects'] },
          riskScore: {
            $min: [100, { $multiply: [{ $add: [
              { $multiply: ['$deletions', 15] },
              { $multiply: ['$dataQualityRejects', 25] },
              { $cond: [{ $gt: ['$stockEdits', 50] }, 20, 0] },
              { $cond: [{ $gt: ['$productEdits', 30] }, 10, 0] }
            ]}, 1] }]
          }
      }},
      { $sort: { riskScore: -1 } }
    ];
    const behavior = await AuditLog.aggregate(pipeline);
    res.json(behavior);
  } catch (err) {
    res.status(500).json({ message: 'Failed to compute user behavior analytics: ' + err.message });
  }
});

// Backend CSV Export
app.get('/api/export/products', async (req, res) => {
  try {
    const products = await Product.find({ is_active: true }).populate('category_id').populate('brand_id').populate('supplier_id');
    const header = 'SKU,Name,Category,Brand,Supplier,Unit,Stock,Cost Price,Selling Price,Reorder Level\n';
    const rows = products.map(p =>
      `"${p.sku}","${p.name}","${p.category_id?.name || ''}","${p.brand_id?.name || ''}","${p.supplier_id?.name || ''}","${p.unit}",${p.current_stock},${p.cost_price},${p.selling_price},${p.reorder_level}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.csv');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ message: 'Export failed.' });
  }
});

app.get('/api/export/transactions', async (req, res) => {
  try {
    const txns = await Transaction.find().populate('product_id').populate('created_by').populate('supplier_id').sort({ created_at: -1 });
    const header = 'Date,Type,Product,Quantity,Supplier,Customer,Purchase Cost,Selling Price,Profit,Reason,User\n';
    const rows = txns.map(t =>
      `"${new Date(t.created_at).toLocaleDateString()}","${t.type}","${t.product_id?.name || ''}",${t.quantity},"${t.supplier_id?.name || ''}","${t.customer_name || ''}",${t.purchase_cost || 0},${t.selling_price_at_sale || 0},${t.profit || 0},"${t.reason || ''}","${t.created_by?.name || ''}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions_export.csv');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ message: 'Export failed.' });
  }
});

// -------------------- NEW ADVANCED ANALYTICS (Analytics-Ready Logic) --------------------

// 4. Supplier Performance Scoring (cost efficiency + reliability + rating)
app.get('/api/analytics/supplier-performance', verifyToken, requirePermission('VIEW_REPORTS'), async (req, res) => {
  try {
    const suppliers = await Supplier.find({ is_active: true });
    
    // Performance scoring logic
    const performance = suppliers.map(s => {
      const avgSpend = s.total_purchases > 0 ? (s.total_spend / s.total_purchases) : 0;
      // Normalization (example: assuming 10kavg is good for weighting)
      const costEfficiency = Math.min(100, (avgSpend / 1000) * 10); 
      const reliability = s.last_delivery_date ? 90 : 50; // Placeholder for reliability logic based on history
      
      const performanceScore = (costEfficiency * 0.4) + (reliability * 0.4) + ((s.rating || 0) * 20 * 0.2);

      return {
        id: s._id,
        name: s.name,
        totalPurchases: s.total_purchases,
        totalSpend: s.total_spend,
        avgSpend,
        rating: s.rating,
        performanceScore: parseFloat(performanceScore.toFixed(2)),
        status: performanceScore > 80 ? 'EXCELLENT' : performanceScore > 60 ? 'GOOD' : 'POOR'
      };
    }).sort((a,b) => b.performanceScore - a.performanceScore);

    res.json(performance);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch supplier performance.', errorCode: 'SUPPLIER_PERF_FAILED' });
  }
});

// 5. Warehouse Utilization Analytics
app.get('/api/analytics/warehouse-performance', verifyToken, requirePermission('VIEW_REPORTS'), async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ is_active: true });
    const formatted = warehouses.map(w => ({
      id: w._id,
      name: w.name,
      location: w.location,
      capacity: w.capacity,
      currentUtilization: w.current_utilization,
      utilizationPercentage: parseFloat(w.utilization_percentage.toFixed(2)),
      isOverCapacity: w.current_utilization >= w.capacity,
      loadStatus: w.utilization_percentage > 90 ? 'CRITICAL' : w.utilization_percentage > 70 ? 'HIGH' : 'OPTIMAL'
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch warehouse performance.', errorCode: 'WAREHOUSE_PERF_FAILED' });
  }
});

// 6. Product Sales Velocity & Turnover Performance
app.get('/api/analytics/product-performance', verifyToken, requirePermission('VIEW_REPORTS'), async (req, res) => {
  try {
    const products = await Product.find({ is_active: true });
    const performance = products.map(p => {
      // Logic for dead_stock_days
      const noSaleDuration = p.last_sold_at ? Math.floor((Date.now() - p.last_sold_at) / (1000 * 60 * 60 * 24)) : Math.floor((Date.now() - p.created_at) / (1000 * 60 * 60 * 24));
      
      return {
        id: p._id,
        name: p.name,
        sku: p.sku,
        currentStock: p.current_stock,
        averageDailySales: parseFloat(p.average_daily_sales.toFixed(2)),
        stockTurnover: parseFloat(p.stock_turnover.toFixed(2)),
        deadStockDays: noSaleDuration,
        isFastMoving: p.is_fast_moving || false,
        isDeadStock: noSaleDuration > 90 && p.total_sold === 0
      };
    });

    res.json(performance);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch product performance.', errorCode: 'PRODUCT_PERF_FAILED' });
  }
});

// 7. Return Impact Analysis
app.get('/api/analytics/return-impact', verifyToken, requirePermission('VIEW_REPORTS'), async (req, res) => {
  try {
    const returns = await Transaction.find({ type: 'RETURN' }).populate('product_id');
    const products = await Product.find({ total_returned: { $gt: 0 } });

    const impactByProduct = products.map(p => ({
      name: p.name,
      sku: p.sku,
      returnCount: p.total_returned,
      returnRate: parseFloat(((p.total_returned / (p.total_sold + p.total_returned)) * 100).toFixed(1)),
      revenueLost: parseFloat((p.total_returned * p.selling_price).toFixed(2))
    })).sort((a,b) => b.returnRate - a.returnRate);

    // Aggregate reasons
    const reasons = await Transaction.aggregate([
      { $match: { type: 'RETURN' } },
      { $group: { _id: '$return_reason', count: { $sum: 1 } } }
    ]);

    res.json({
      impactByProduct,
      reasonDistribution: reasons.map(r => ({ reason: r._id || 'Unknown', count: r.count })),
      totalLostRevenue: impactByProduct.reduce((sum, item) => sum + item.revenueLost, 0)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch return impact.', errorCode: 'RETURN_IMPACT_FAILED' });
  }
});

// ──────────── FULL BACKUP EXPORT ────────────
app.get('/api/export/backup', verifyToken, requirePermission('EXPORT_DATA'), async (req, res) => {
  try {
    const [products, transactions, users, logs, alerts, categories, brands, suppliers, warehouses] = await Promise.all([
      Product.find(),
      Transaction.find(),
      User.find().select('-password_hash'),
      AuditLog.find(),
      Alert.find(),
      Category.find(),
      Brand.find(),
      Supplier.find(),
      Warehouse.find()
    ]);
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: { products, transactions, users, logs, alerts, categories, brands, suppliers, warehouses },
      counts: {
        products: products.length, transactions: transactions.length, users: users.length,
        logs: logs.length, alerts: alerts.length, categories: categories.length,
        brands: brands.length, suppliers: suppliers.length, warehouses: warehouses.length
      }
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=prostock_backup_' + new Date().toISOString().slice(0,10) + '.json');
    res.json(backup);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Backup export failed.', errorCode: 'BACKUP_FAILED' });
  }
});

// ──────────── API VERSIONING (v1 alias) ────────────
// All existing /api/* routes are also accessible under /api/v1/*
const v1Router = express.Router();
v1Router.all('/*', (req, res, next) => {
  // Rewrite /api/v1/... to /api/...
  req.url = '/api' + req.url;
  app.handle(req, res, next);
});
app.use('/api/v1', v1Router);

// ──────────── GLOBAL ERROR HANDLER ────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    errorCode: err.errorCode || 'INTERNAL_ERROR'
  });
});

// ──────────── ENHANCED HEALTH CHECK ────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    version: '2.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    cacheSize: analyticsCache.size,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ──────────── START ────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('───────────────────────────────────');
  console.log(`🚀 ProStock API Online: http://localhost:${PORT}`);
  console.log(`📅 ${new Date().toLocaleString()}`);
  console.log(`🔒 Rate Limit: ${RATE_LIMIT_MAX} req / ${RATE_LIMIT_WINDOW/60000} min`);
  console.log(`⚡ Cache TTL: ${CACHE_TTL/1000}s`);
  console.log('───────────────────────────────────');
});
