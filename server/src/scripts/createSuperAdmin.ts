import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/Student';

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

    // Check if superadmin already exists
    const existing = await Student.findOne({ email: 'sadmin@admin.edu' });
    if (existing) {
      console.log('Super admin already exists:', existing.email);
      await mongoose.disconnect();
      return;
    }

    // Create superadmin
    const superAdmin = await Student.create({
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

    console.log('✅ Super Admin created successfully!');


    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error: any) {
    console.error('Error creating super admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
