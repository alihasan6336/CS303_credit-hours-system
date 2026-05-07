import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminUser extends Document {
  fullName: string;
  universityId?: string;
  email: string;
  password: string;
  major?: string;
  phoneNumber?: string;
  role: 'admin' | 'superadmin' | 'it_admin' | 'table_admin' | 'courses_admin' | 'enrollment_admin';
  isActive: boolean;
  permissions?: string[]; // Array of permission strings: 'dashboard', 'courses', 'accounts', 'enrollment', 'grading', 'table'
  createdBy?: mongoose.Types.ObjectId;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  photoUrl?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    universityId: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    major: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin', 'it_admin', 'table_admin', 'courses_admin', 'enrollment_admin'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    lastLogin: {
      type: Date,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    permissions: {
      type: [String],
      default: [],
      enum: ['dashboard', 'courses', 'accounts', 'enrollment', 'grading', 'table'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: populate the AdminPermission document for this user
AdminUserSchema.virtual('permissionsDoc', {
  ref: 'AdminPermission',
  localField: '_id',
  foreignField: 'admin',
  justOne: true,
});

// Hash password before saving
AdminUserSchema.pre<IAdminUser>('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12); // stronger for admin accounts
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
AdminUserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for fast queries
AdminUserSchema.index({ role: 1, isActive: 1 });
AdminUserSchema.index({ createdBy: 1 });

export default mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
