const mongoose = require('mongoose');
const { User, Category, Brand, Supplier, Warehouse, Product, WarehouseStock, Transaction, AuditLog, Alert } = require('./models');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_db';

async function reset() {
  try {
    console.log('🔄 Connecting to MongoDB for reset...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('🗑️  Dropping all collections...');
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.drop();
    }
    
    console.log('🌱 Re-seeding clean data...');
    
    // Create initial Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    await new User({
      name: 'System Admin',
      email: 'admin@prostock.io',
      password_hash: hashedPassword,
      role: 'ADMIN',
      permissions: ['MANAGE_USERS','MANAGE_CATEGORIES','CREATE_PRODUCT','EDIT_PRODUCT','DELETE_PRODUCT','STOCK_IN','STOCK_OUT','STOCK_ADJUST','VIEW_REPORTS','EXPORT_DATA','VIEW_AUDIT_LOGS','MANAGE_BRANDS','MANAGE_SUPPLIERS','MANAGE_WAREHOUSES'],
      is_active: true
    }).save();

    console.log('✅ Database reset successfully with 1 Admin user.');
    console.log('📧 Login: admin@prostock.io / Admin@123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  }
}

reset();
