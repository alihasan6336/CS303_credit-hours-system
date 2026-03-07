import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student';
import AdminUser from '../models/AdminUser';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if superadmin already exists in AdminUser collection
    const existingAdmin = await AdminUser.findOne({ email: 'sadmin@admin.edu' });
    if (existingAdmin) {
      console.log('Super admin already exists in AdminUser collection:', existingAdmin.email);
    } else {
      // Create in AdminUser collection
      await AdminUser.create({
        fullName: 'Super Admin',
        email: 'sadmin@admin.edu',
        password: 'sadmin123',
        role: 'superadmin',
        isActive: true,
      });
      console.log('✅ Super Admin created in AdminUser collection');
    }

    // Check if superadmin already exists in Student collection
    const existingStudent = await Student.findOne({ email: 'sadmin@admin.edu' });
    if (existingStudent) {
      console.log('Super admin already exists in Student collection:', existingStudent.email);
    } else {
      // Create in Student collection (for backward compatibility)
      await Student.create({
        fullName: 'Super Admin',
        universityId: 'SUPER-ADMIN-001',
        email: 'sadmin@admin.edu',
        password: 'sadmin123',
        major: 'Computer Science',
        academicYear: '1st Year',
        currentSemester: 'Fall',
        completedCreditHours: 0,
        phoneNumber: '',
        gpa: 0,
        level: 1,
        role: 'superadmin',
      });
      console.log('✅ Super Admin created in Student collection');
    }

    console.log('\n📋 Super Admin Credentials:');
    console.log('   Email: sadmin@admin.edu');
    console.log('   Password: sadmin123');
    console.log('   Role: superadmin');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error: any) {
    console.error('Error creating super admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
