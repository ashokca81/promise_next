// Manual superadmin creation script
// Usage: MONGODB_URI="your_connection_string" node scripts/createSuperadminManual.js [email] [password] [name]

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const createSuperadmin = async () => {
  try {
    // Get connection string from environment or use default
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ashokca810:ashokca810@cluster0.psirpqa.mongodb.net/cardgenerator?appName=Cluster0&retryWrites=true&w=majority';
    
    console.log('🔄 Connecting to MongoDB...');
    console.log('   URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    
    console.log('✅ Connected to MongoDB!');

    // Define User schema inline (in case models aren't available)
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, enum: ['superadmin', 'user'], default: 'user' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      imageLimit: { type: Number, default: 0 },
      imagesGenerated: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
    });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Super Admin';

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ role: 'superadmin' });
    if (existingAdmin) {
      console.log('⚠️  Superadmin already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log('\n💡 To create a new one, delete the existing superadmin first.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create superadmin
    const superadmin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'superadmin',
      status: 'approved',
      imageLimit: 0, // Unlimited
    });

    await superadmin.save();

    console.log('\n✅ Superadmin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!');
    console.log('\n📝 Login at: http://localhost:3000/login');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating superadmin:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Authentication Error - Please check:');
      console.error('   1. MongoDB username and password are correct');
      console.error('   2. Connection string format is correct');
      console.error('   3. IP address is whitelisted in MongoDB Atlas');
      console.error('\n📝 To use a different connection string:');
      console.error('   MONGODB_URI="your_connection_string" node scripts/createSuperadminManual.js');
    } else if (error.message.includes('E11000')) {
      console.error('\n⚠️  A user with this email already exists!');
    } else {
      console.error('\nFull error:', error);
    }
    
    try {
      await mongoose.connection.close();
    } catch (e) {
      // Ignore close errors
    }
    process.exit(1);
  }
};

createSuperadmin();

