const mongoose = require('mongoose');
const { Product, User } = require('./models');

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/inventory_db');
    console.log('Connected!');
    const count = await User.countDocuments();
    console.log('User count:', count);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
test();
