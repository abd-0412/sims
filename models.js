const mongoose = require('mongoose');

// ──────────── USER ────────────
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MANAGER', 'STAFF'], required: true },
  permissions: [{ type: String }], // Dynamic permissions: CREATE_PRODUCT, VIEW_REPORTS, etc.
  is_active: { type: Boolean, default: true },
  last_login_at: { type: Date, default: null },
  login_count: { type: Number, default: 0 },
  risk_score: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// ──────────── CATEGORY ────────────
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// ──────────── BRAND ────────────
const BrandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  logo_url: { type: String, default: '' },
  website: { type: String, default: '' },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// ──────────── SUPPLIER ────────────
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  total_purchases: { type: Number, default: 0 },
  total_spend: { type: Number, default: 0 },
  average_delivery_time: { type: Number, default: 0 }, // in days
  last_delivery_date: { type: Date, default: null },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});
SupplierSchema.index({ name: 1 });

// ──────────── WAREHOUSE ────────────
const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, default: '' },
  capacity: { type: Number, default: 10000 },
  current_utilization: { type: Number, default: 0 },
  utilization_percentage: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

// ──────────── PRODUCT ────────────
const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, default: '' },
  name: { type: String, required: true },
  model_number: { type: String, default: '' },
  specifications: { type: String, default: '' },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  unit: { type: String, required: true },
  reorder_level: { type: Number, default: 10 },
  overstock_level: { type: Number, default: 500 },
  cost_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  current_stock: { type: Number, default: 0 },
  total_sold: { type: Number, default: 0 },
  total_returned: { type: Number, default: 0 },
  total_revenue: { type: Number, default: 0 },
  last_sold_at: { type: Date, default: null },
  average_daily_sales: { type: Number, default: 0 },
  stock_turnover: { type: Number, default: 0 },
  dead_stock_days: { type: Number, default: 0 },
  is_fast_moving: { type: Boolean, default: false },
  is_dead_stock: { type: Boolean, default: false },
  status: { type: String, enum: ['ACTIVE', 'DISCONTINUED', 'BLOCKED'], default: 'ACTIVE' },
  is_active: { type: Boolean, default: true },
  deleted_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});
ProductSchema.index({ category_id: 1 });
ProductSchema.index({ brand_id: 1 });
ProductSchema.index({ supplier_id: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ is_active: 1 });

// ──────────── WAREHOUSE STOCK (Multi-warehouse) ────────────
const WarehouseStockSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
});
WarehouseStockSchema.index({ product_id: 1, warehouse_id: 1 }, { unique: true });

// ──────────── TRANSACTION (Purchase / Sale / Adjustment) ────────────
const TransactionSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
  type: { type: String, enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'IN', 'OUT', 'RETURN'], required: true },
  quantity: { type: Number, required: true },
  // Purchase specific
  supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  purchase_cost: { type: Number, default: 0 },
  invoice_number: { type: String, default: '' },
  payment_status: { type: String, enum: ['PAID', 'PENDING'], default: 'PENDING' },
  received_date: { type: Date, default: null },
  // Sale specific
  customer_name: { type: String, default: '' },
  customer_type: { type: String, enum: ['Retail', 'Wholesale'], default: 'Retail' },
  selling_price_at_sale: { type: Number, default: 0 },
  discount_applied: { type: Number, default: 0 },
  final_price: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  // Return specific
  return_reason: { type: String, enum: ['Damaged', 'Defective', 'Customer Return'], default: null },
  return_condition: { type: String, enum: ['Resellable', 'Not Resellable'], default: 'Resellable' },
  // Common
  reason: { type: String, default: '' },
  remarks: { type: String, default: '' },
  is_anomaly: { type: Boolean, default: false },
  request_id: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
});
TransactionSchema.index({ product_id: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ created_at: -1 });
TransactionSchema.index({ supplier_id: 1 });
TransactionSchema.index({ warehouse_id: 1 });
TransactionSchema.index({ request_id: 1 }, { unique: true, sparse: true });

// ──────────── AUDIT LOG ────────────
const AuditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String },
  entity_id: { type: String },
  message: { type: String },
  created_at: { type: Date, default: Date.now }
});
AuditLogSchema.index({ created_at: -1 });
AuditLogSchema.index({ user_id: 1 });

// ──────────── ALERT ────────────
const AlertSchema = new mongoose.Schema({
  type: { type: String, enum: ['LOW_STOCK', 'OVERSTOCK', 'DEAD_STOCK', 'STOCK_OUT'], required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
  message: { type: String, required: true },
  priority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  status: { type: String, enum: ['ACTIVE', 'RESOLVED'], default: 'ACTIVE' },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});
AlertSchema.index({ is_read: 1 });

module.exports = {
  User: mongoose.model('User', UserSchema),
  Category: mongoose.model('Category', CategorySchema),
  Brand: mongoose.model('Brand', BrandSchema),
  Supplier: mongoose.model('Supplier', SupplierSchema),
  Warehouse: mongoose.model('Warehouse', WarehouseSchema),
  Product: mongoose.model('Product', ProductSchema),
  WarehouseStock: mongoose.model('WarehouseStock', WarehouseStockSchema),
  Transaction: mongoose.model('Transaction', TransactionSchema),
  AuditLog: mongoose.model('AuditLog', AuditLogSchema),
  Alert: mongoose.model('Alert', AlertSchema)
};
