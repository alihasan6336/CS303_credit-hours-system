import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
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
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
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
