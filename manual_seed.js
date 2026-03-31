const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Category, Product, Transaction } = require('./models');

const MONGODB_URI = 'mongodb://localhost:27017/inventory_db';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Cleared existing data');

    const categories = await Category.insertMany([
      { name: 'Computing Hardware' },
      { name: 'Networking Gear' },
      { name: 'Office Furniture' },
      { name: 'Industrial Tools' }
    ]);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    const users = await User.insertMany([
      { 
        name: 'System Admin', 
        email: 'admin@prostock.io', 
        password_hash: hashedPassword, 
        role: 'ADMIN',
        is_active: true,
        permissions: ['MANAGE_USERS','MANAGE_CATEGORIES','CREATE_PRODUCT','EDIT_PRODUCT','DELETE_PRODUCT','STOCK_IN','STOCK_OUT','STOCK_ADJUST','VIEW_REPORTS','EXPORT_DATA','VIEW_AUDIT_LOGS','MANAGE_BRANDS','MANAGE_SUPPLIERS','MANAGE_WAREHOUSES']
      },
      { 
        name: 'Operations Manager', 
        email: 'manager@prostock.io', 
        password_hash: hashedPassword, 
        role: 'MANAGER',
        is_active: true,
        permissions: ['CREATE_PRODUCT','EDIT_PRODUCT','STOCK_IN','STOCK_OUT','VIEW_REPORTS','EXPORT_DATA','MANAGE_SUPPLIERS']
      },
      { 
        name: 'Floor Staff', 
        email: 'staff@prostock.io', 
        password_hash: hashedPassword, 
        role: 'STAFF',
        is_active: true,
        permissions: ['STOCK_IN','STOCK_OUT']
      }
    ]);

    console.log('Created Users:', users.map(u => u.email));

    const products = await Product.insertMany([
      {
        sku: 'PRO-001',
        name: 'Workstation Z4',
        category_id: categories[0]._id,
        unit: 'Pcs',
        reorder_level: 5,
        cost_price: 1200,
        selling_price: 1500,
        current_stock: 10
      },
      {
        sku: 'PRO-002',
        name: 'ThinkPad P16',
        category_id: categories[0]._id,
        unit: 'Pcs',
        reorder_level: 3,
        cost_price: 2200,
        selling_price: 2800,
        current_stock: 5
      }
    ]);

    console.log('Seeding complete');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();