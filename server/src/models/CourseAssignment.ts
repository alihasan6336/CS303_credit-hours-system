import mongoose, { Document, Schema } from 'mongoose';

// CourseAssignment - assigns courses to specific academic levels
export interface ICourseAssignment extends Document {
  course: mongoose.Types.ObjectId;
  level: number; // 1, 2, 3, or 4
  semester: 'Fall' | 'Spring' | 'Summer';
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseAssignmentSchema = new Schema<ICourseAssignment>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },

    level: {
      type: Number,
      required: [true, 'Level is required'],
      enum: [1, 2, 3, 4],
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: one assignment per course+level+semester+year
CourseAssignmentSchema.index(
  { course: 1, level: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

export default mongoose.model<ICourseAssignment>('CourseAssignment', CourseAssignmentSchema);
