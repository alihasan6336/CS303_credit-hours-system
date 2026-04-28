import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './src/models/Course';
import { parseTimeString } from './src/controllers/courseController';

dotenv.config();

const migrate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected!');

    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses to migrate.`);

    let count = 0;
    for (const course of courses) {
      if (course.time) {
        const { start, end } = parseTimeString(course.time);
        course.startTime = start;
        course.endTime = end;
        
        // Fix invalid enrolledCount if found
        if (course.enrolledCount < 0) {
          course.enrolledCount = 0;
        }
        
        await course.save({ validateBeforeSave: false });
        count++;
      }
    }

    console.log(`Migration complete! Updated ${count} courses.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
