import mongoose, { Document, Schema } from 'mongoose';
import { IAdminUser } from './AdminUser';
import Course from './Course';

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId | IAdminUser;
  action: string;
  targetUser?: mongoose.Types.ObjectId | IAdminUser;
  targetCourse?: mongoose.Types.ObjectId | typeof Course;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    targetCourse: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Indexes for fast queries
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ targetUser: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

// TTL index — auto-deletes logs older than 1 year
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
