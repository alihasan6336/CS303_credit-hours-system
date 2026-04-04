import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminUser from '../models/AdminUser';
import AdminPermission, { ALL_PERMISSIONS } from '../models/AdminPermission';

dotenv.config();

/**
 * Super Admin Creation Script
 * 
 * The Super Admin is the system owner with full control:
 * - Only ONE superadmin can exist in the system
 * - Has ALL permissions (create, read, update, delete everything)
 * - Can create/manage other admins and users
 * - Can manage all system settings
 * - Admin users have less privileges than superadmin
 */

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if any superadmin already exists in the system
    const existingSuperAdmin = await AdminUser.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists in the system:');
      console.log(`   Name: ${existingSuperAdmin.fullName}`);
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Created: ${existingSuperAdmin.createdAt}`);
      console.log('\n❌ Cannot create another superadmin. Only ONE superadmin is allowed.');
      
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
      return;
    }

    // Create the Super Admin in AdminUser collection
    const superAdmin = await AdminUser.create({
      fullName: 'Super Admin',
      email: 'sadmin@admin.edu',
      password: 'sadmin123',
      role: 'superadmin',
      isActive: true,
    });

    console.log('✅ Super Admin created successfully');

    // Grant ALL permissions to superadmin
    // Superadmin has full access to everything in the system
    await AdminPermission.create({
      admin: superAdmin._id,
      permissions: [...ALL_PERMISSIONS], // All system permissions
      grantedBy: superAdmin._id, // Self-granted as system owner
      note: 'System Super Admin - Full access to all system operations',
    });

    console.log('✅ Full permissions granted to Super Admin');

    console.log('\n' + '='.repeat(50));
    console.log('📋 SUPER ADMIN CREDENTIALS');
    console.log('='.repeat(50));
    console.log('   Email:    sadmin@admin.edu');
    console.log('   Password: sadmin123');
    console.log('   Role:superadmin');
    console.log('\n🔑 PERMISSIONS:');
    console.log('   - Full system access');
    console.log('   - Create/Read/Update/Delete all users');
    console.log('   - Manage courses and enrollments');
    console.log('   - Create and manage admin users');
    console.log('   - All system settings and operations');
    console.log('='.repeat(50));
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Keep these credentials secure');
    console.log('   - Change password after first login');
    console.log('   - Only ONE superadmin can exist in the system');
    console.log('='.repeat(50));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('Script completed successfully');
    
  } catch (error: any) {
    console.error('❌ Error creating super admin:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

// Run the script
createSuperAdmin();
