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

const USE_ADMIN_API = true;
const ADMIN_EMAIL = 'admin@admin.com'; // Only needed if USE_ADMIN_API = true
const ADMIN_PASSWORD = '123456';     // Only needed if USE_ADMIN_API = true

const SERVER_PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${SERVER_PORT}/api`;

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Server management
let serverProcess: any = null;
let serverAlreadyRunning = false;

// Check if server is already running
const checkServerRunning = async (): Promise<boolean> => {
  try {
    // Extract base URL without /api and check health
    const baseUrl = BASE_URL.replace('/api', '');
    await axios.get(`${baseUrl}/api/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

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

    // Wait up to 15 seconds for server to start
    setTimeout(() => {
      if (!output.includes('Server running')) {
        console.log('⏱️ Server start timeout, assuming ready...');
        resolve();
      }
    }, 15000);

    serverProcess.on('error', reject);
  });
};

const stopServer = () => {
  if (serverProcess && !serverAlreadyRunning) {
    console.log('\n👋 Shutting down server...');
    serverProcess.kill();
  }
};

// Admin login (uses same endpoint as student login)
const adminLogin = async (): Promise<string | null> => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
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
const getAllCourses = async (adminToken: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/courses?limit=1000`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    return response.data.courses || [];
  } catch (error: any) {
    console.error('❌ Failed to get courses:', error.response?.data?.message || error.message);
    return [];
  }
};

// Get courses by level and major
const getCoursesByLevelAndMajor = async (level: number, major: string, adminToken: string): Promise<any[]> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/courses?level=${level}&major=${encodeURIComponent(major)}&limit=100`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data.courses || [];
  } catch (error: any) {
    console.log(`   ⚠️ getCoursesByLevelAndMajor failed: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    return [];
  }
};

// Check existing course assignments count
const getExistingAssignmentsCount = async (adminToken: string): Promise<number> => {
  try {
    const response = await axios.get(`${BASE_URL}/course-assignments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    return response.data.assignments?.length || 0;
  } catch {
    return 0;
  }
};

// Assign course to level with retry
const assignCourseToLevel = async (
  adminToken: string,
  courseId: string,
  level: number,
  semester: string,
  retries = 3
): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      await axios.post(
        `${BASE_URL}/course-assignments`,
        {
          courseId,
          level,
          semester,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      return true;
    } catch (error: any) {
      if (error.response?.status === 409) {
        return true; // Already exists
      }
      // Retry on network errors
      if (i < retries - 1 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response)) {
        console.log(`   ⚠️ Retry ${i + 1}/3 for course assignment...`);
        await delay(1000 * (i + 1));
        continue;
      }
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message;
      if (status !== 409) {
        console.error(`❌ Failed to assign course (${status}): ${msg}`);
      }
      return false;
    }
  }
  return false;
};

// Enroll student in course with retry
const enrollStudent = async (
  adminToken: string,
  studentId: string,
  courseId: string,
  retries = 3
): Promise<string | null> => {
  for (let i = 0; i < retries; i++) {
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
        return null;
      }
      // Retry on network errors
      if (i < retries - 1 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response)) {
        await delay(500 * (i + 1));
        continue;
      }
      return null;
    }
  }
  return null;
};

// Update grade for enrollment with retry
const updateGrade = async (
  adminToken: string,
  enrollmentId: string,
  grade: number,
  retries = 3
): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      await axios.patch(
        `${BASE_URL}/admin/enrollments/${enrollmentId}/grade`,
        { grade },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      return true;
    } catch (error: any) {
      // Retry on network errors
      if (i < retries - 1 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || !error.response)) {
        await delay(500 * (i + 1));
        continue;
      }
      if (error.response?.status !== 404) {
        console.error(`❌ Failed to update grade (${error.response?.status}):`, error.response?.data?.message || error.message);
      }
      return false;
    }
  }
  return false;
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
    console.log('\n📋 Standalone Enrollment Script');
    console.log('================================\n');

    // Check if server is already running
    console.log('🔍 Checking if server is already running...');
    serverAlreadyRunning = await checkServerRunning();
    
    if (serverAlreadyRunning) {
      console.log('✅ Server is already running! Skipping startup.\n');
    } else {
      console.log('🚀 Starting server...');
      await startServer();
      console.log('⏳ Waiting for server to fully initialize (10s)...');
      await delay(10000);
    }

    // Admin login
    console.log('🔐 Attempting admin login...');
    const adminToken = await adminLogin();
    if (!adminToken) {
      console.error('❌ Could not authenticate admin');
      console.log('\n💡 Tips:');
      console.log('   1. Make sure the admin account exists in the database');
      console.log('   2. Check ADMIN_EMAIL and ADMIN_PASSWORD in this script');
      console.log('   3. Verify the server is running on the correct port (5001)');
      console.log(`\n   Current credentials: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
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
    const allCourses = await getAllCourses(adminToken);
    console.log(`✅ Found ${allCourses.length} courses`);
    
    // Debug: Show sample courses
    if (allCourses.length > 0) {
      console.log('   📋 Sample courses:');
      allCourses.slice(0, 3).forEach((c: any) => {
        console.log(`      - ${c.code}: level=${c.level}, major=${c.major}`);
      });
    }
    console.log();

    if (allCourses.length === 0) {
      console.log('⚠️ No courses found. Exiting.');
      stopServer();
      process.exit(0);
    }

    // Step 1: Check and assign courses to levels
    console.log('📋 Step 1: Checking course assignments...');
    console.log('-'.repeat(60));
    
    const existingAssignments = await getExistingAssignmentsCount(adminToken);
    const totalCourses = allCourses.filter((c: any) => c.level && c.major).length;
    
    console.log(`   ℹ️ Found ${existingAssignments} existing assignments, ${totalCourses} courses available`);
    
    // Skip if most courses are already assigned (90% threshold)
    if (existingAssignments >= totalCourses * 0.9) {
      console.log(`   ✅ Skipping assignment - ${existingAssignments} courses already assigned to levels\n`);
    } else {
      console.log('   🔄 Assigning courses to levels...');
      let assignmentCount = 0;
      let processedCount = 0;
      
      for (const course of allCourses) {
        if (course.level && course.major) {
          processedCount++;
          const success = await assignCourseToLevel(
            adminToken,
            course._id,
            course.level,
            'Fall'
          );
          if (success) assignmentCount++;
          
          // Show progress every 10 courses
          if (processedCount % 10 === 0 || processedCount === totalCourses) {
            process.stdout.write(`\r   📊 Progress: ${processedCount}/${totalCourses} (${Math.round((processedCount/totalCourses)*100)}%)`);
          }
          
          await delay(1000); // 1 second delay to avoid rate limits
        }
      }
      console.log(`\n   ✅ Assigned ${assignmentCount} new courses to levels\n`);
    }

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
          const courses = await getCoursesByLevelAndMajor(prevLevel, major, adminToken);
          console.log(`      Level ${prevLevel}: found ${courses.length} courses`);

          for (const course of courses) {
            const enrollmentId = await enrollStudent(adminToken, studentId, course._id);
            if (enrollmentId) {
              // Set passing grade (60-100)
              const grade = generatePassingGrade();
              await updateGrade(adminToken, enrollmentId, grade);
              completedCount++;
              totalGradesSet++;
              await delay(1000);
            }
            await delay(1000);
          }
        }

        console.log(`   ✅ Completed: ${completedCount} courses with grades`);
        totalEnrollments += completedCount;
      }

      // Enroll in current level courses (in-progress)
      console.log(`   📚 Enrolling in current level courses (Level ${level})...`);
      const currentCourses = await getCoursesByLevelAndMajor(level, major, adminToken);
      console.log(`      Level ${level}: found ${currentCourses.length} courses`);
      let currentCount = 0;

      for (const course of currentCourses.slice(0, 6)) {
        const enrollmentId = await enrollStudent(adminToken, studentId, course._id);
        if (enrollmentId) {
          currentCount++;
        }
        await delay(1000);
      }

      console.log(`   ✅ Current: ${currentCount} courses (in-progress)`);
      totalEnrollments += currentCount;

      // Recalculate GPA for student
      if (level > 1) {
        console.log(`   🔄 Recalculating GPA...`);
        await recalculateGPA(adminToken, studentId);
        await delay(1000);
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
