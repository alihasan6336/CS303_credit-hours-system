import mongoose, { Document, Schema } from 'mongoose';
        // main fields //
export interface IEnrollment extends Document {
  student:      mongoose.Types.ObjectId;
  course:       mongoose.Types.ObjectId;
  semester:     'Fall' | 'Spring' | 'Summer';  
  academicYear: string;                           
  enrolledAt:   Date;
  createdAt:    Date;
  updatedAt:    Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },

    semester: {
      type: String,
      required: [true, 'Semester is required'],
      enum: ['Fall', 'Spring', 'Summer'],
    },

    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index: one enrollment per student+course+semester+year
EnrollmentSchema.index(
  { student: 1, course: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);