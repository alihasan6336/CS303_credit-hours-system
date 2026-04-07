import mongoose, { Document, Schema } from 'mongoose';
        // main fields //
export interface IEnrollment extends Document {
  student:      mongoose.Types.ObjectId;
  course:       mongoose.Types.ObjectId;
  semester:     'Fall' | 'Spring' | 'Summer';  
  academicYear: string;                           
  grade?:       number; // 0-100 or 0-4.0 scale
  status:       'active' | 'completed' | 'dropped' | 'withdrawn';
  enrolledAt:   Date;
  createdAt:    Date;
  updatedAt:    Date;
  isPassed?:    boolean;
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

    grade: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    status: {
      type: String,
      enum: ['active', 'completed', 'dropped', 'withdrawn'],
      default: 'active',
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property indicating if the student passed the course
EnrollmentSchema.virtual('isPassed').get(function () {
  if (this.grade === null || this.grade === undefined) return false;
  // Fallback to 50 if course/passingGrade not populated
  const passingGrade = (this.course as any)?.passingGrade || 50;
  return this.grade >= passingGrade;
});

// Compound unique index: one enrollment per student+course+semester+year
EnrollmentSchema.index(
  { student: 1, course: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);