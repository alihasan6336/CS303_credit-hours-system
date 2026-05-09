import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course';
import Student from '../models/Student';
import Enrollment from '../models/Enrollment';
import SystemSettings from '../models/SystemSettings';

dotenv.config();

/**
 * Enroll test student in courses with per-course grades
 * Usage Examples:
 *   # Same grade for all courses at a level:
 *   npm run enroll-student -- level=1 grade=A
 *   
 *   # Per-course grades (percentage 0-100 or letter grade):
 *   npm run enroll-student -- level=1 "grades=CS101:95,CS102:87,MATH101:A"
 *   
 *   # Mix: default grade + overrides for specific courses:
 *   npm run enroll-student -- level=1 grade=B "grades=CS101:A,CS102:A+"
 *   
 *   # Specific student:
 *   npm run enroll-student -- level=1 grade=A email=teststudent@university.edu
 */

// Letter grade to percentage mapping
const LETTER_TO_PERCENTAGE: Record<string, number> = {
  'A+': 97, 'A': 93, 'A-': 90,
  'B+': 87, 'B': 83, 'B-': 80,
  'C+': 77, 'C': 73, 'C-': 70,
  'D+': 67, 'D': 63, 'D-': 60,
  'F': 50,
};

// Convert percentage to 4.0 scale grade points (matches system)
const percentageToGradePoints = (percentage: number): number => {
  if (percentage >= 90) return 4.0;
  if (percentage >= 85) return 3.7;
  if (percentage >= 80) return 3.3;
  if (percentage >= 75) return 3.0;
  if (percentage >= 70) return 2.7;
  if (percentage >= 65) return 2.3;
  if (percentage >= 60) return 2.0;
  if (percentage >= 55) return 1.7;
  if (percentage >= 50) return 1.0;
  return 0.0;
};

// Parse grade input (can be percentage number or letter grade)
const parseGrade = (input: string): number => {
  const trimmed = input.trim().toUpperCase();
  // If it's a letter grade, map it
  if (LETTER_TO_PERCENTAGE[trimmed] !== undefined) {
    return LETTER_TO_PERCENTAGE[trimmed];
  }
  // Otherwise parse as number (percentage)
  const num = parseInt(trimmed);
  if (!isNaN(num) && num >= 0 && num <= 100) {
    return num;
  }
  return 85; // default fallback
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const params: any = {};
  
  for (const arg of args) {
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      params[key] = value;
    }
  }
  
  // Parse per-course grades if provided
  // Format: grades=CS101:95,CS102:87,MATH101:A
  const courseGrades: Record<string, number> = {};
  if (params.grades) {
    const pairs = params.grades.split(',');
    for (const pair of pairs) {
      const [courseCode, grade] = pair.split(':');
      if (courseCode && grade) {
        courseGrades[courseCode.trim()] = parseGrade(grade);
      }
    }
  }
  
  return {
    targetLevel: parseInt(params.level) || 1,
    defaultGrade: parseGrade(params.grade || 'B'),
    courseGrades,
    studentEmail: params.email || 'teststudent@university.edu',
  };
};

const enrollStudentWithGrades = async () => {
  try {
    const { targetLevel, defaultGrade, courseGrades, studentEmail } = parseArgs();

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get system settings
    const settings = await SystemSettings.findOne();
    const currentSemester = settings?.currentSemester || 'Fall';

    // Find student
    const student = await Student.findOne({ email: studentEmail });
    if (!student) {
      throw new Error(`Student with email ${studentEmail} not found. Run createTestData.ts first.`);
    }

    console.log(`👤 Student: ${student.fullName} (${student.email})`);
    console.log(`📊 Current Level: ${student.level}`);
    console.log(`📊 Current GPA: ${student.gpa}`);
    console.log(`📊 Completed Credits: ${student.completedCreditHours}\n`);

    // Find all courses for the target level
    const targetCourses = await Course.find({ level: targetLevel });
    
    if (targetCourses.length === 0) {
      throw new Error(`No courses found for Level ${targetLevel}. Run createTestData.ts first.`);
    }

    console.log(`📚 Found ${targetCourses.length} courses for Level ${targetLevel}\n`);

    // Store old GPA before updating
    const oldGPA = student.gpa;

    for (const course of targetCourses) {
      // Get grade for this course (custom or default)
      const courseGrade = courseGrades[course.code] ?? defaultGrade;
      const letterGrade = Object.entries(LETTER_TO_PERCENTAGE)
        .find(([_, val]) => val === courseGrade)?.[0] || `${courseGrade}%`;

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: student._id,
        course: course._id,
        semester: currentSemester,
        level: targetLevel,
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === 'completed') {
          console.log(`   ⚠️  ${course.code} already completed with grade ${existingEnrollment.grade}%`);
          continue;
        } else if (existingEnrollment.status === 'active') {
          // Complete it with the specified grade
          existingEnrollment.status = 'completed';
          existingEnrollment.grade = courseGrade;
          await existingEnrollment.save();
          console.log(`   ✅ ${course.code} - ${course.name}: ${letterGrade} (${courseGrade}%) - COMPLETED`);
        }
      } else {
        // Create new enrollment and complete it
        await Enrollment.create({
          student: student._id,
          course: course._id,
          semester: currentSemester,
          level: targetLevel,
          grade: courseGrade,
          status: 'completed',
          enrolledAt: new Date(),
        });
        console.log(`   ✅ ${course.code} - ${course.name}: ${letterGrade} (${courseGrade}%)`);
      }
    }

    // Update student stats using system's GPA calculator (matches API behavior)
    const { recalculateStudentGPA } = require('../utils/gpaCalculator');
    const { gpa: finalGPA, completedCreditHours: finalCredits } = await recalculateStudentGPA(student._id.toString());
    const newLevel = Math.min(4, Math.floor(finalCredits / 30) + 1);

    // Reload student to get updated values
    const updatedStudent = await Student.findById(student._id);
    if (updatedStudent) {
      updatedStudent.level = newLevel;
      await updatedStudent.save();
    }

    console.log('\n📊 Updated Student Stats:');
    console.log(`   GPA: ${finalGPA.toFixed(2)} (was ${oldGPA.toFixed(2)})`);
    console.log(`   Completed Credits: ${finalCredits}`);
    console.log(`   Level: ${newLevel}`);
    console.log(`   Courses Completed: ${targetCourses.length}\n`);

    if (newLevel > targetLevel) {
      console.log(`🎉 Student promoted to Level ${newLevel}!`);
      console.log(`   Can now register for Level ${newLevel} courses.\n`);
    }

    // Show next level courses and prerequisites
    if (newLevel < 4) {
      const nextLevel = newLevel + 1;
      const nextLevelCourses = await Course.find({ level: nextLevel });
      console.log(`📋 Level ${nextLevel} courses now available (with prerequisites):`);
      for (const course of nextLevelCourses) {
        const prereqs = course.prerequisites?.length 
          ? course.prerequisites.join(', ') 
          : 'None';
        const hasAllPrereqs = course.prerequisites?.every((p: string) => 
          targetCourses.some((c: any) => c.code === p)
        );
        const status = hasAllPrereqs ? '✅ Can take' : '❌ Missing prerequisites';
        console.log(`   ${course.code} - Prerequisites: ${prereqs} (${status})`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

// Run script
if (require.main === module) {
  enrollStudentWithGrades();
}

export default enrollStudentWithGrades;
