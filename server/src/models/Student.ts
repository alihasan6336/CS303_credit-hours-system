import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
                               // main fields // all has 1-1 map 
export interface IStudent extends Document {
  fullName: string;
  universityId: string;
  email: string;
  password: string;
  major: string;
  academicYear: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  currentSemester: 'Fall' | 'Spring' | 'Summer';
  completedCreditHours: number;
  phoneNumber?: string;
  gpa: number;
  level: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  role: string;
}

const StudentSchema: Schema = new Schema(
  {
    role: {
      type: String,
      enum: ['student', 'admin', 'superadmin'],
      default: 'student',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    universityId: {
      type: String,
      required: [true, 'University ID is required'],
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address and have edu'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, 
    },

    major: {
      type: String,
      required: [true, 'Major is required'],
      enum: [
        'Computer Science',
        'Software Engineering',
        'Information Technology',
        'Computer Engineering',
        'Cybersecurity',
        'Data Science',
        'Business Administration',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
      ],
    },

    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    },

    currentSemester: {
      type: String,
      required: [true, 'Current semester is required'],
      enum: ['Fall', 'Spring', 'Summer'],
    },

    completedCreditHours: {
      type: Number,
      required: [true, 'Completed credit hours is required'],
      min: [0, 'Credit hours cannot be negative'],
      default: 0,
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },

    gpa: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 4,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
               //  for password mis //
    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, 
  }
);
                         // hash pass // 
StudentSchema.pre<IStudent>('save', async function () {
  if (!this.isModified('password')) return ;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
                           // compare pass //
StudentSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IStudent>('Student', StudentSchema);