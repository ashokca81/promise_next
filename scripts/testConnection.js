// Test MongoDB connection
// Run: node scripts/testConnection.js

import connectDB from '../utils/db.js';
import mongoose from 'mongoose';

const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...');
    await connectDB();
    console.log('✅ MongoDB connection successful!');
    
    // Test if we can access the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    if (collections.length > 0) {
      console.log('Collections:', collections.map(c => c.name).join(', '));
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('\n💡 Please check:');
    console.error('   1. MongoDB connection string is correct');
    console.error('   2. Username and password are correct');
    console.error('   3. IP address is whitelisted in MongoDB Atlas');
    console.error('   4. Network allows MongoDB connections');
    await mongoose.connection.close();
    process.exit(1);
  }
};

testConnection();

