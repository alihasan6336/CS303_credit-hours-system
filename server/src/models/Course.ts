import mongoose, { Document, Schema } from 'mongoose';
                       
export interface ICourse extends Document {
  code:       string;
  name:       string;
  day:        'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  time:       string;
  room:       string;
  credits:    number;
  instructor: string;
  capacity:      number;
  enrolledCount: number;
  major?:        string;
  studentYear?:  number;
  prerequisite?: string;
  isActive:      boolean;
  createdAt:     Date;
  updatedAt:     Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },

    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },

    time: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },

    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
    },

    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [1, 'Min 1 credit'],
      max: [6, 'Max 6 credits'],
    },

    instructor: {
      type: String,
      required: [true, 'Instructor is required'],
      trim: true,
    },

    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      default: 30,
      min: 1,
    },

    enrolledCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    major: {
      type: String,
      enum: ['Computer Science', 'Information Technology', 'Software Engineering', 'Cybersecurity', 'Data Science', 'Computer Engineering'],
    },

    studentYear: {
      type: Number,
      min: 1,
      max: 4,
    },

    prerequisite: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CourseSchema.virtual('isFull').get(function () {
  return this.enrolledCount >= this.capacity;
});

export default mongoose.model<ICourse>('Course', CourseSchema);