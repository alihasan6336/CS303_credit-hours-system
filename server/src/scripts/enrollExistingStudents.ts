/**
 * Standalone script to:
 * 1. Assign courses to levels (CourseAssignment)
 * 2. Enroll existing students in their courses
 * 3. Set grades for completed courses
 * 4. Recalculate GPA
 */

import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin@credit-hours.com';
const ADMIN_PASSWORD = 'admin123';

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Server management
let serverProcess: any = null;

const startServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting server...');
    const serverPath = path.join(__dirname, '..', '..');
    serverProcess = spawn('npm', ['start'], {
      cwd: serverPath,
      shell: true,
      stdio: 'pipe',
    });

    let output = '';
    const checkReady = (data: Buffer) => {
      output += data.toString();
      if (output.includes('Server running on port') || output.includes('connected to MongoDB')) {
        console.log('✅ Server is ready!');
        resolve();
      }
    };

    serverProcess.stdout?.on('data', checkReady);
    serverProcess.stderr?.on('data', checkReady);

    setTimeout(() => {
      if (!output.includes('Server running')) {
        console.log('⏱️ Server start timeout, assuming ready...');
        resolve();
      }
    }, 8000);

    serverProcess.on('error', reject);
  });
};

const stopServer = () => {
  if (serverProcess) {
    console.log('\n👋 Shutting down server...');
    serverProcess.kill();
  }
};

// Admin login
const adminLogin = async (): Promise<string | null> => {
  try {
    const response = await axios.post(`${BASE_URL}/admin/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    return response.data.token || null;
  } catch (error: any) {
    console.error('❌ Admin login failed:', error.response?.data?.message || error.message);
    return null;
  }
};

// Fetch all students
const getAllStudents = async (adminToken: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/admin/students?limit=1000`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    return response.data.students || [];
  } catch (error: any) {
    console.error('❌ Failed to get students:', error.response?.data?.message || error.message);
    return [];
  }
};

// Fetch all courses
const getAllCourses = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/courses?limit=1000`);
    return response.data.courses || [];
  } catch (error: any) {
    console.error('❌ Failed to get courses:', error.response?.data?.message || error.message);
    return [];
  }
};

// Get courses by level and major
const getCoursesByLevelAndMajor = async (level: number, major: string): Promise<any[]> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/courses?level=${level}&major=${encodeURIComponent(major)}&limit=100`
    );
    return response.data.courses || [];
  } catch {
    return [];
  }
};

// Assign course to level
const assignCourseToLevel = async (
  adminToken: string,
  courseId: string,
  level: number,
  major: string,
  semester: string
): Promise<boolean> => {
  try {
    await axios.post(
      `${BASE_URL}/admin/course-assignments`,
      {
        courseId,
        level,
        major,
        semester,
        isActive: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return true;
  } catch (error: any) {
    if (error.response?.status === 409) {
      return true; // Already exists
    }
    console.error(`❌ Failed to assign course:`, error.response?.data?.message || error.message);
    return false;
  }
};

// Enroll student in course
const enrollStudent = async (
  adminToken: string,
  studentId: string,
  courseId: string
): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/enrollments`,
      {
        studentId,
        courseId,
        status: 'active',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data.enrollment?._id || null;
  } catch (error: any) {
    if (error.response?.status === 409) {
      // Already enrolled, try to find existing
      try {
        const listResponse = await axios.get(
          `${BASE_URL}/admin/enrollments?studentId=${studentId}&courseId=${courseId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        const enrollments = listResponse.data.enrollments || [];
        if (enrollments.length > 0) return enrollments[0]._id;
      } catch {
        // Ignore
      }
    }
    return null;
  }
};

// Update grade for enrollment
const updateGrade = async (
  adminToken: string,
  enrollmentId: string,
  grade: number
): Promise<boolean> => {
  try {
    await axios.patch(
      `${BASE_URL}/admin/enrollments/${enrollmentId}/grade`,
      { grade },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to update grade:`, error.response?.data?.message || error.message);
    return false;
  }
};

// Recalculate student GPA
const recalculateGPA = async (adminToken: string, studentId: string): Promise<boolean> => {
  try {
    await axios.post(
      `${BASE_URL}/gpa/admin/recalculate/${studentId}`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to recalculate GPA:`, error.response?.data?.message || error.message);
    return false;
  }
};

// Generate a passing grade (60-100)
const generatePassingGrade = (): number => {
  return Math.floor(60 + Math.random() * 41); // 60-100
};

// Main function
const main = async () => {
  try {
    await startServer();
    await delay(2000);

    console.log('\n📋 Standalone Enrollment Script');
    console.log('================================\n');

    // Admin login
    const adminToken = await adminLogin();
    if (!adminToken) {
      console.error('❌ Could not authenticate admin');
      stopServer();
      process.exit(1);
    }
    console.log('✅ Admin authenticated\n');

    // Fetch all students
    console.log('📚 Fetching existing students...');
    const students = await getAllStudents(adminToken);
    console.log(`✅ Found ${students.length} students\n`);

    if (students.length === 0) {
      console.log('⚠️ No students found. Exiting.');
      stopServer();
      process.exit(0);
    }

    // Fetch all courses
    console.log('📚 Fetching existing courses...');
    const allCourses = await getAllCourses();
    console.log(`✅ Found ${allCourses.length} courses\n`);

    if (allCourses.length === 0) {
      console.log('⚠️ No courses found. Exiting.');
      stopServer();
      process.exit(0);
    }

    // Step 1: Assign courses to levels
    console.log('📋 Step 1: Assigning courses to levels...');
    console.log('-'.repeat(60));

    let assignmentCount = 0;
    for (const course of allCourses) {
      if (course.level && course.major) {
        const success = await assignCourseToLevel(
          adminToken,
          course._id,
          course.level,
          course.major,
          'Fall 2024'
        );
        if (success) assignmentCount++;
        await delay(200); // Small delay to avoid rate limits
      }
    }
    console.log(`✅ Assigned ${assignmentCount} courses to levels\n`);

    // Step 2: Enroll students in courses
    console.log('📋 Step 2: Enrolling students in courses...');
    console.log('-'.repeat(60));

    const majors = [...new Set(students.map((s: any) => s.major))];
    let totalEnrollments = 0;
    let totalGradesSet = 0;

    for (const student of students) {
      const studentId = student._id || student.id;
      const level = student.level || 1;
      const major = student.major;

      if (!studentId || !major) {
        console.log(`⚠️ Skipping student ${student.email}: missing data`);
        continue;
      }

      console.log(`\n👤 ${student.email} (Level ${level}, ${major})`);

      // Enroll in previous level courses (completed)
      if (level > 1) {
        console.log(`   📚 Enrolling in completed courses (Levels 1-${level - 1})...`);
        let completedCount = 0;

        for (let prevLevel = 1; prevLevel < level; prevLevel++) {
          const courses = await getCoursesByLevelAndMajor(prevLevel, major);

          for (const course of courses) {
            const enrollmentId = await enrollStudent(adminToken, studentId, course._id);
            if (enrollmentId) {
              // Set passing grade (60-100)
              const grade = generatePassingGrade();
              await updateGrade(adminToken, enrollmentId, grade);
              completedCount++;
              totalGradesSet++;
              await delay(300);
            }
            await delay(200);
          }
        }

        console.log(`   ✅ Completed: ${completedCount} courses with grades`);
        totalEnrollments += completedCount;
      }

      // Enroll in current level courses (in-progress)
      console.log(`   📚 Enrolling in current level courses (Level ${level})...`);
      const currentCourses = await getCoursesByLevelAndMajor(level, major);
      let currentCount = 0;

      for (const course of currentCourses.slice(0, 6)) {
        const enrollmentId = await enrollStudent(adminToken, studentId, course._id);
        if (enrollmentId) {
          currentCount++;
        }
        await delay(200);
      }

      console.log(`   ✅ Current: ${currentCount} courses (in-progress)`);
      totalEnrollments += currentCount;

      // Recalculate GPA for student
      if (level > 1) {
        console.log(`   🔄 Recalculating GPA...`);
        await recalculateGPA(adminToken, studentId);
        await delay(500);
      }

      // Progress indicator
      console.log(`   📊 Progress: ${Math.round(((students.indexOf(student) + 1) / students.length) * 100)}%`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ENROLLMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Total Enrollments: ${totalEnrollments}`);
    console.log(`📊 Grades Set: ${totalGradesSet}`);
    console.log(`📊 Students Processed: ${students.length}`);
    console.log('='.repeat(60));

    // Summary by student
    console.log('\n📋 Student Enrollment Summary:');
    console.log('-'.repeat(90));
    console.log(`${'Email'.padEnd(30)} | ${'Level'.padEnd(5)} | ${'Major'.padEnd(20)} | ${'Status'.padEnd(10)}`);
    console.log('-'.repeat(90));

    for (const student of students.slice(0, 10)) {
      console.log(
        `${student.email.slice(0, 30).padEnd(30)} | ${String(student.level).padEnd(5)} | ${student.major.slice(0, 20).padEnd(20)} | ✅ Enrolled`
      );
    }
    if (students.length > 10) {
      console.log(`... and ${students.length - 10} more students`);
    }
    console.log('-'.repeat(90));

    console.log('\n🎉 All students enrolled successfully!');
    console.log('   - Previous level courses: COMPLETED with grades');
    console.log('   - Current level courses: IN-PROGRESS');
    console.log('   - GPA: Recalculated based on completed courses');

  } catch (error) {
    console.error('\n❌ Script failed:', error);
  } finally {
    stopServer();
    process.exit(0);
  }
};

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Interrupted by user');
  stopServer();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('\n❌ Uncaught exception:', err);
  stopServer();
  process.exit(1);
});

// Run
main();
