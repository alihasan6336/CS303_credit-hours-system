import { spawn } from 'child_process';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Delay utility to avoid rate limits
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Configuration - Set to true to use Admin API (saves GPA correctly), false for public registration
const USE_ADMIN_API = true;
const ADMIN_EMAIL = 'admin@admin.com'; // Only needed if USE_ADMIN_API = true
const ADMIN_PASSWORD = '123456';     // Only needed if USE_ADMIN_API = true

const SERVER_PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${SERVER_PORT}/api`;

// Major abbreviations for email generation
const MAJOR_ABBREVIATIONS: Record<string, string> = {
  'Computer Science': 'cs',
  'Software Engineering': 'se',
  'Information Technology': 'it',
  'Computer Engineering': 'ce',
  'Cybersecurity': 'cyber',
  'Data Science': 'ds',
};

// All majors from student model
const MAJORS = Object.keys(MAJOR_ABBREVIATIONS);

// Student data structure - matches Register.tsx fields
interface StudentData {
  fullName: string;
  universityId: string;
  email: string;
  password: string;
  major: string;
  level: number;
  currentSemester: 'Fall' | 'Spring' | 'Summer';
  completedCreditHours: number;
  gpa: number;
  phoneNumber?: string;
  studentId?: string; // MongoDB ID after creation
}

// Wait for server to be ready
const waitForServer = async (maxRetries = 30): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is ready!');
      return true;
    } catch {
      process.stdout.write(`⏳ Waiting for server... (${i + 1}/${maxRetries})\r`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
};

// Calculate grade points from percentage grade
const calculateGradePoints = (percentage: number): number => {
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

// Calculate GPA from completed courses data
const calculateGPAFromCourses = (courses: { grade: number; credits: number }[]): { gpa: number; totalCredits: number } => {
  if (courses.length === 0) return { gpa: 0, totalCredits: 0 };
  
  let totalQualityPoints = 0;
  let totalCredits = 0;
  let completedCredits = 0;
  
  for (const course of courses) {
    const gradePoints = calculateGradePoints(course.grade);
    totalQualityPoints += gradePoints * course.credits;
    totalCredits += course.credits;
    // Only count credits if passed (grade >= 60 -> gradePoints >= 2.0)
    if (course.grade >= 60) {
      completedCredits += course.credits;
    }
  }
  
  const gpa = totalCredits > 0 ? Number((totalQualityPoints / totalCredits).toFixed(2)) : 0;
  return { gpa, totalCredits: completedCredits };
};

// Generate student data based on major and level
// Note: GPA and completedCreditHours will be calculated from actual course enrollments
const generateStudentData = (major: string, level: number, completedCourses?: { grade: number; credits: number }[]): StudentData => {
  const majorAbbr = MAJOR_ABBREVIATIONS[major];
  const email = `student${level}${majorAbbr}@uni.com`;
  const currentSemester = 'Fall' as const;
  
  // Calculate GPA and credits from completed courses if provided
  let completedCreditHours = 0;
  let gpa = 0;
  
  if (completedCourses && completedCourses.length > 0) {
    const result = calculateGPAFromCourses(completedCourses);
    completedCreditHours = result.totalCredits;
    gpa = result.gpa;
  } else {
    // Default for Level 1 (no completed courses)
    completedCreditHours = 0;
    gpa = 0;
  }
  
  return {
    fullName: `Student ${level} ${major}`,
    universityId: `U${majorAbbr.toUpperCase()}${level}${Math.floor(1000 + Math.random() * 9000)}`,
    email,
    password: '123456',
    major,
    level,
    currentSemester,
    completedCreditHours,
    gpa,
    phoneNumber: '', // Optional field
  };
};

// Register student via API (matches Register.tsx exactly)
const registerStudent = async (studentData: StudentData): Promise<string | null> => {
  try {
    // Build registration payload matching Register.tsx
    const registrationPayload: any = {
      fullName: studentData.fullName,
      universityId: studentData.universityId,
      email: studentData.email,
      password: studentData.password,
      confirmPassword: studentData.password, // Required by validation
      major: studentData.major,
      level: studentData.level,
      currentSemester: studentData.currentSemester,
      completedCreditHours: String(studentData.completedCreditHours), // Register.tsx sends as string
      acceptTerms: true, // Required by validation
    };
    
    // Add optional phoneNumber if present
    if (studentData.phoneNumber) {
      registrationPayload.phoneNumber = studentData.phoneNumber;
    }
    
    const response = await axios.post(`${BASE_URL}/auth/register`, registrationPayload);
    
    if (response.data.success) {
      console.log(`✅ Registered: ${studentData.email} (GPA: ${studentData.gpa})`);
      return response.data.token;
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`⚠️  Already exists: ${studentData.email}`);
      // Try to login to get token
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: studentData.email,
          password: studentData.password,
        });
        return loginResponse.data.token;
      } catch {
        return null;
      }
    }
    console.error(`❌ Failed to register ${studentData.email}:`, error.response?.data?.message || error.message);
    return null;
  }
};

// Admin login cache
let cachedAdminToken: string | null = null;

// Login as admin and cache token
const loginAsAdmin = async (adminEmail: string, adminPassword: string): Promise<string | null> => {
  if (cachedAdminToken) return cachedAdminToken;
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    
    if (loginResponse.data.success) {
      cachedAdminToken = loginResponse.data.token;
      return cachedAdminToken;
    }
    return null;
  } catch {
    console.error('❌ Admin login failed');
    return null;
  }
};

// Alternative: Create student via Admin API (includes GPA directly)
const createStudentViaAdminAPI = async (
  adminToken: string,
  studentData: StudentData
): Promise<{ success: boolean; studentId?: string }> => {
  try {
    // Create student via admin API (matches AccountManagement.tsx fields)
    const response = await axios.post(
      `${BASE_URL}/admin/users/students`,
      {
        fullName: studentData.fullName,
        email: studentData.email,
        password: studentData.password,
        universityId: studentData.universityId,
        major: studentData.major,
        level: studentData.level,
        currentSemester: studentData.currentSemester,
        completedCreditHours: studentData.completedCreditHours,
        gpa: studentData.gpa, // Admin API accepts GPA directly!
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    if (response.data.success) {
      const studentId = response.data.student?.id || response.data.student?._id;
      console.log(`✅ Created via Admin API: ${studentData.email} (GPA: ${studentData.gpa})`);
      return { success: true, studentId };
    }
    return { success: false };
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`⚠️  Already exists: ${studentData.email}`);
      return { success: true }; // Consider existing as success
    }
    console.error(`❌ Admin API failed for ${studentData.email}:`, error.response?.data?.message || error.message);
    return { success: false };
  }
};

// Admin: Enroll student in a course (adminEnroll endpoint)
const adminEnrollStudent = async (
  adminToken: string,
  studentId: string,
  courseId: string
): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/admin/enrollments`,
      {
        studentId: studentId,
        courseId: courseId,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    if (response.data.success) {
      return response.data.enrollment?._id || null;
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 409) {
      // Already enrolled, try to find enrollment ID
      return null; // Will handle differently
    }
    return null;
  }
};

// Admin: Update grade for enrollment
const adminUpdateGrade = async (
  adminToken: string,
  enrollmentId: string,
  grade: number
): Promise<boolean> => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/admin/enrollments/${enrollmentId}/grade`,
      { grade },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data.success;
  } catch {
    return false;
  }
};

// Get available courses for student's level
const getAvailableCourses = async (token: string, level: number): Promise<any[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/courses/available`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Filter courses by level
    const courses = response.data.courses || [];
    return courses.filter((c: any) => c.level === level);
  } catch (error: any) {
    console.error('❌ Failed to get courses:', error.response?.data?.message || error.message);
    return [];
  }
};

// Enroll in course
const enrollInCourse = async (token: string, courseId: string): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/courses/${courseId}/enroll`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.success;
  } catch (error: any) {
    if (error.response?.status === 409) {
      return true; // Already enrolled
    }
    return false;
  }
};

// Generate random grade (60-100% for realistic distribution)
const generateGrade = (): number => {
  return Math.floor(60 + Math.random() * 41); // 60-100 range
};

// Admin: Enroll student in course and assign grade (for completed courses simulation)
const adminEnrollAndGrade = async (
  adminToken: string,
  studentEmail: string,
  courseId: string,
  grade: number
): Promise<boolean> => {
  try {
    // First, admin enrolls student
    const enrollResponse = await axios.post(
      `${BASE_URL}/admin/enrollments`,
      {
        studentId: studentEmail, // Actually need student ID, not email - will handle differently
        courseId: courseId,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    if (enrollResponse.data.success) {
      // Assign grade to mark as completed
      const enrollmentId = enrollResponse.data.enrollment?._id;
      if (enrollmentId) {
        await axios.patch(
          `${BASE_URL}/admin/enrollments/${enrollmentId}/grade`,
          { grade },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
      }
      return true;
    }
    return false;
  } catch (error: any) {
    if (error.response?.status === 409) return true; // Already enrolled
    return false;
  }
};

// Get all courses for a specific level
const getCoursesByLevel = async (level: number): Promise<any[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/courses?level=${level}`);
    return response.data.courses || [];
  } catch {
    return [];
  }
};

// Sample course data for each major
const COURSE_TEMPLATES: Record<string, string[]> = {
  'Computer Science': ['Intro to Programming', 'Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Software Engineering', 'Computer Networks', 'Web Development', 'AI Fundamentals', 'Machine Learning'],
  'Software Engineering': ['Software Design', 'Requirements Engineering', 'Testing & QA', 'Project Management', 'Agile Methods', 'Design Patterns', 'DevOps', 'Mobile Development', 'Cloud Computing', 'System Architecture'],
  'Information Technology': ['IT Fundamentals', 'Network Administration', 'System Administration', 'Cybersecurity Basics', 'Cloud Services', 'Database Administration', 'IT Support', 'Web Technologies', 'Data Analytics', 'IT Governance'],
  'Computer Engineering': ['Digital Logic', 'Computer Architecture', 'Embedded Systems', 'VLSI Design', 'Microprocessors', 'Hardware Design', 'Signal Processing', 'Robotics', 'IoT Systems', 'Computer Graphics'],
  'Cybersecurity': ['Security Fundamentals', 'Ethical Hacking', 'Network Security', 'Cryptography', 'Digital Forensics', 'Risk Management', 'Malware Analysis', 'Incident Response', 'Compliance', 'Security Architecture'],
  'Data Science': ['Statistics', 'Data Analysis', 'Python for Data', 'Machine Learning', 'Deep Learning', 'Big Data', 'Data Visualization', 'NLP', 'Time Series', 'Data Engineering'],
};

// Days and times for scheduling
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const TIME_SLOTS = ['09:00 - 10:30', '10:45 - 12:15', '13:00 - 14:30', '14:45 - 16:15'];

// Store created courses for prerequisite linking
const createdCoursesMap: Map<string, string> = new Map(); // code -> _id

// Admin: Create a course
const adminCreateCourse = async (
  adminToken: string,
  courseData: {
    code: string;
    name: string;
    level: number;
    major: string;
    credits: number;
    day: string;
    time: string;
    prerequisites?: string[];
  }
): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/courses`,  // Admin courses endpoint
      {
        code: courseData.code,
        name: courseData.name,
        level: courseData.level,
        major: courseData.major,
        credits: courseData.credits,
        day: courseData.day,
        time: courseData.time,
        room: 'TBA',
        instructor: 'System Generated',
        capacity: 50,
        isActive: true,
        prerequisites: courseData.prerequisites || [],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    if (response.data.success) {
      const courseId = response.data.course?._id || null;
      if (courseId) {
        createdCoursesMap.set(courseData.code, courseId);
      }
      return courseId;
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 409) {
      // Course already exists, try to find it
      return null;
    }
    console.error(`❌ Failed to create course ${courseData.code}:`, error.response?.data?.message || error.message);
    return null;
  }
};

// Build prerequisite list for a course based on level and index
const buildPrerequisites = (majorAbbr: string, level: number, courseIndex: number): string[] => {
  const prerequisites: string[] = [];
  
  // Level 1 courses have no prerequisites
  if (level === 1) {
    return prerequisites;
  }
  
  // For higher levels, add prerequisites from previous levels
  // Course 1 and 2: prerequisite from previous level course 1
  if (courseIndex <= 2 && level > 1) {
    prerequisites.push(`${majorAbbr}${level - 1}01`);
  }
  
  // Course 3 and 4: prerequisite from previous level course 3, and maybe same level course 1
  if (courseIndex >= 3 && courseIndex <= 4) {
    prerequisites.push(`${majorAbbr}${level - 1}03`);
    if (courseIndex === 4) {
      prerequisites.push(`${majorAbbr}${level}01`);
    }
  }
  
  // Course 5 and 6: prerequisite from previous level course 5, and maybe same level course 3
  if (courseIndex >= 5) {
    prerequisites.push(`${majorAbbr}${level - 1}05`);
    if (courseIndex === 6) {
      prerequisites.push(`${majorAbbr}${level}03`);
    }
  }
  
  return prerequisites;
};

// Create courses for all majors and levels if they don't exist
const ensureCoursesExist = async (adminToken: string): Promise<number> => {
  console.log('\n📚 Checking/Creating courses for all majors and levels...\n');
  
  let createdCount = 0;
  const majorCourseCodes: Map<string, string[]> = new Map(); // major -> list of created course codes
  
  for (const major of MAJORS) {
    const templates = COURSE_TEMPLATES[major] || COURSE_TEMPLATES['Computer Science'];
    const majorAbbr = MAJOR_ABBREVIATIONS[major];
    const createdCodes: string[] = [];
    
    // Process levels in order (1->2->3->4) to ensure prerequisites exist
    for (let level = 1; level <= 4; level++) {
      // Check if courses already exist for this level and major
      const existingCourses = await getCoursesByLevelAndMajor(level, major);
      
      if (existingCourses.length >= 6) {
        console.log(`✅ ${major} Level ${level}: ${existingCourses.length} courses already exist`);
        // Store existing course codes for prerequisite linking
        for (const course of existingCourses) {
          createdCodes.push(course.code);
          createdCoursesMap.set(course.code, course._id);
        }
        continue;
      }
      
      // Create 6 courses for this major and level
      const baseIndex = (level - 1) * 2;
      const coursesToCreate: string[] = [];
      
      // Get 6 unique course names for this level
      for (let i = 0; i < 6; i++) {
        const templateIndex = (baseIndex + i) % templates.length;
        coursesToCreate.push(templates[templateIndex]);
      }
      
      console.log(`📖 Creating ${coursesToCreate.length} courses for ${major} Level ${level}...`);
      
      for (let i = 0; i < coursesToCreate.length; i++) {
        const courseName = coursesToCreate[i];
        const courseIndex = i + 1;
        const courseCode = `${majorAbbr.toUpperCase()}${level}${String(courseIndex).padStart(2, '0')}`;
        const day = DAYS[i % DAYS.length];
        const time = TIME_SLOTS[i % TIME_SLOTS.length];
        
        // Build prerequisites
        const prerequisites = buildPrerequisites(majorAbbr.toUpperCase(), level, courseIndex);
        
        const courseId = await adminCreateCourse(adminToken, {
          code: courseCode,
          name: courseName,
          level,
          major,
          credits: 3,
          day,
          time,
          prerequisites: prerequisites.length > 0 ? prerequisites : undefined,
        });
        
        if (courseId) {
          createdCount++;
          createdCodes.push(courseCode);
          const prereqText = prerequisites.length > 0 ? ` (requires: ${prerequisites.join(', ')})` : '';
          console.log(`   ✅ Created: ${courseCode} - ${courseName}${prereqText}`);
        }
        
        // Delay to avoid rate limiting (1 per second max)
        await delay(1000);
      }
    }
    
    majorCourseCodes.set(major, createdCodes);
  }
  
  console.log(`\n✅ Course creation complete! Created ${createdCount} new courses with prerequisites.`);
  return createdCount;
};

// Get courses by level and major
const getCoursesByLevelAndMajor = async (level: number, major: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/courses?level=${level}&major=${encodeURIComponent(major)}`);
    return response.data.courses || [];
  } catch {
    return [];
  }
};

// Simulate completed courses for a student using Admin API (for levels > 1)
// Returns actual course data for consistent GPA/credit calculation
const simulateCompletedCoursesWithAdmin = async (
  adminToken: string,
  studentId: string,
  level: number,
  major: string
): Promise<{ 
  totalCredits: number; 
  gpa: number; 
  enrollments: any[];
  courseData: { grade: number; credits: number }[];
}> => {
  const enrollments: any[] = [];
  const courseData: { grade: number; credits: number }[] = [];
  
  console.log(`   📚 Simulating completed courses for ${major} Level ${level} student...`);
  
  // For each previous level, enroll and complete courses
  for (let prevLevel = 1; prevLevel < level; prevLevel++) {
    const courses = await getCoursesByLevelAndMajor(prevLevel, major);
    
    if (courses.length === 0) {
      console.log(`   ⚠️  No courses found for ${major} Level ${prevLevel}`);
      continue;
    }
    
    for (const course of courses.slice(0, 5)) { // 5 courses per level
      const grade = generateGrade();
      const credits = course.credits || 3;
      
      // Use shared grade calculation for consistency
      const gradePoints = calculateGradePoints(grade);
      
      // Store for GPA calculation
      courseData.push({ grade, credits });
      
      // Actually enroll and grade via admin API
      const enrollmentId = await adminEnrollStudent(adminToken, studentId, course._id);
      if (enrollmentId) {
        await adminUpdateGrade(adminToken, enrollmentId, grade);
        enrollments.push({
          courseCode: course.code,
          courseName: course.name,
          grade,
          gradePoints: gradePoints.toFixed(1),
          credits,
          level: prevLevel,
          status: 'completed',
        });
        console.log(`      ✓ ${course.code}: ${grade}% (${gradePoints.toFixed(1)} pts, ${credits} cr)`);
      } else {
        console.log(`      ⚠️ ${course.code}: Failed to enroll/grade`);
      }
      
      // Delay to avoid rate limiting (5 per second max)
      await delay(500);
    }
  }
  
  // Calculate GPA using shared function for consistency
  const { gpa, totalCredits } = calculateGPAFromCourses(courseData);
  
  console.log(`   📊 Calculated: ${totalCredits} credits, GPA ${gpa} from ${enrollments.length} courses`);
  
  return { totalCredits, gpa, enrollments, courseData };
};

// Main function to create all students
const createAllStudents = async (): Promise<void> => {
  console.log('🚀 Starting student creation process...\n');
  console.log(`📋 Mode: ${USE_ADMIN_API ? 'Admin API (Full course simulation)' : 'Public Registration (GPA defaults to 0)'}`);
  console.log(`📋 Majors: ${MAJORS.join(', ')}\n`);
  
  // Start the server
  console.log('📡 Starting server...');
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: 'f:\\CS303_credit-hours-system\\server',
    shell: true,
    stdio: 'pipe',
  });
  
  // Wait for server to be ready
  const serverReady = await waitForServer();
  // Extra delay after server starts to ensure middleware is ready
  await delay(2000);
  if (!serverReady) {
    console.error('\n❌ Server failed to start');
    serverProcess.kill();
    process.exit(1);
  }
  
  // Login as admin once for all operations
  let adminToken: string | null = null;
  if (USE_ADMIN_API) {
    adminToken = await loginAsAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);
    if (!adminToken) {
      console.error('❌ Failed to login as admin, falling back to public registration');
    } else {
      console.log('✅ Admin logged in successfully\n');
      
      // Ensure courses exist for all majors and levels
      await ensureCoursesExist(adminToken);
    }
  }
  
  console.log('\n📚 Creating students for all majors and levels...\n');
  
  const createdStudents: { 
    email: string; 
    token: string | null; 
    level: number; 
    major: string; 
    gpa: number; 
    studentId?: string;
    academicHistory?: any[];
    currentEnrollments?: any[];
  }[] = [];
  
  // Create students for each major and level
  for (const major of MAJORS) {
    console.log(`\n🏫 ${major}`);
    console.log('='.repeat(50));
    
    for (let level = 1; level <= 4; level++) {
      let success = false;
      let token: string | null = null;
      let studentId: string | undefined;
      let actualGpa = 0;
      let actualCredits = 0;
      let completedCoursesData: { grade: number; credits: number }[] = [];
      let academicEnrollments: any[] = [];
      
      // For Admin API + Level > 1: First simulate completed courses to get actual GPA/credits
      // BEFORE creating the student so we can set the correct values
      if (USE_ADMIN_API && adminToken && level > 1) {
        console.log(`   📚 Pre-calculating GPA/credits for ${major} Level ${level}...`);
        
        // Simulate completed courses without a student yet (we'll use a temp ID)
        // We'll create enrollments after student is created
        const courses = await getCoursesByLevelAndMajor(level - 1, major);
        
        // Generate grades for completed courses (all previous levels - all 6 courses per level)
        for (let prevLevel = 1; prevLevel < level; prevLevel++) {
          const prevCourses = await getCoursesByLevelAndMajor(prevLevel, major);
          // Take all 6 courses (or whatever exists)
          const coursesToComplete = prevCourses.slice(0, 6);
          
          for (const course of coursesToComplete) {
            // Generate passing grade (60-100) to ensure credits count
            const grade = Math.floor(60 + Math.random() * 41); // 60-100
            const credits = course.credits || 3;
            completedCoursesData.push({ grade, credits });
            academicEnrollments.push({
              courseCode: course.code,
              courseName: course.name,
              grade,
              credits,
              level: prevLevel,
              status: 'completed',
            });
          }
        }
        
        // Calculate actual GPA/credits from completed courses
        const result = calculateGPAFromCourses(completedCoursesData);
        actualGpa = result.gpa;
        actualCredits = result.totalCredits;
        console.log(`   📊 Pre-calculated: ${actualCredits} credits, GPA ${actualGpa}`);
      }
      
      // Generate student data with correct GPA/credits
      const studentData = generateStudentData(major, level, completedCoursesData);
      
      if (USE_ADMIN_API && adminToken) {
        // Use Admin API with full course simulation
        const result = await createStudentViaAdminAPI(adminToken, studentData);
        success = result.success;
        studentId = result.studentId;
        
        if (success && studentId) {
          // ENROLL IN COMPLETED COURSES (previous levels)
          if (level > 1 && academicEnrollments.length > 0) {
            console.log(`   📚 Enrolling in ${academicEnrollments.length} completed courses (previous levels)...`);
            
            for (const enrollment of academicEnrollments) {
              const courses = await getCoursesByLevelAndMajor(enrollment.level, major);
              const course = courses.find((c: any) => c.code === enrollment.courseCode);
              
              if (course) {
                const enrollmentId = await adminEnrollStudent(adminToken, studentId, course._id);
                if (enrollmentId) {
                  await adminUpdateGrade(adminToken, enrollmentId, enrollment.grade);
                }
              }
              await delay(500);
            }
            
            console.log(`   ✅ Completed: ${academicEnrollments.length} courses, ${actualCredits} credits, GPA: ${actualGpa}`);
          }
          
          // ENROLL IN CURRENT LEVEL COURSES (as in-progress)
          const currentLevelCourses = await getCoursesByLevelAndMajor(level, major);
          if (currentLevelCourses.length > 0) {
            const coursesToEnroll = currentLevelCourses.slice(0, 6);
            console.log(`   📚 Enrolling in ${coursesToEnroll.length} current level courses (Level ${level})...`);
            
            let enrolledCount = 0;
            for (const course of coursesToEnroll) {
              const enrollmentId = await adminEnrollStudent(adminToken, studentId, course._id);
              if (enrollmentId) {
                enrolledCount++;
              }
              await delay(500);
            }
            
            console.log(`   ✅ Current Level: Enrolled in ${enrolledCount} courses`);
          }
        } else if (success) {
          actualGpa = 0;
          actualCredits = 0;
        }
        
        if (success) {
          // Login to get token for current course enrollment
          try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
              email: studentData.email,
              password: studentData.password,
            });
            token = loginResponse.data.token || null;
          } catch {
            token = null;
          }
        }
      } else {
        // Use Public Registration (matches Register.tsx exactly)
        token = await registerStudent(studentData);
        success = !!token;
        actualGpa = 0; // Public registration doesn't accept GPA
        actualCredits = 0;
      }
      
      if (success) {
        // Build academic history and current enrollments
        const academicHistory: any[] = [];
        const currentEnrollments: any[] = [];
        
        // Use actual academic enrollment data (with real grades) that was saved to database
        if (USE_ADMIN_API && level > 1 && academicEnrollments.length > 0) {
          for (const enrollment of academicEnrollments) {
            academicHistory.push({
              courseCode: enrollment.courseCode,
              courseName: enrollment.courseName,
              level: enrollment.level,
              grade: enrollment.grade, // Use actual grade that was saved
              credits: enrollment.credits,
              status: 'completed',
              semester: 'Previous',
            });
          }
        }
        
        // Add current level courses to current enrollments (up to 6)
        const currentCourses = await getCoursesByLevelAndMajor(level, major);
        for (const course of currentCourses.slice(0, 6)) {
          currentEnrollments.push({
            courseCode: course.code,
            courseName: course.name,
            level,
            credits: course.credits || 3,
            status: 'in-progress',
            semester: 'Fall 2024',
          });
        }
        
        // Verify consistency: GPA/credits should match what we calculated
        const verifyCalc = calculateGPAFromCourses(
          academicHistory.map(h => ({ grade: h.grade, credits: h.credits }))
        );
        
        if (Math.abs(verifyCalc.gpa - actualGpa) > 0.01 || verifyCalc.totalCredits !== actualCredits) {
          console.log(`   ⚠️  Data mismatch! Calculated GPA: ${actualGpa}, Verified: ${verifyCalc.gpa}`);
        }
        
        createdStudents.push({
          email: studentData.email,
          token,
          level,
          major,
          gpa: actualGpa,
          studentId,
          academicHistory,
          currentEnrollments,
        });
        
        if (level > 1 && USE_ADMIN_API) {
          console.log(`   📖 Level ${level} - Actual Credits: ${actualCredits}, Actual GPA: ${actualGpa.toFixed(2)}`);
        }
      }
      
      // Wait 5 seconds between student registrations to avoid rate limit (12 per minute)
      await delay(5000);
    }
  }
  
  console.log(`\n✅ Created ${createdStudents.length} students successfully!`);
  
  // Enroll current level students in available courses
  console.log('\n📋 Enrolling students in courses...\n');
  
  for (const student of createdStudents) {
    // Skip if no token (can't enroll without authentication)
    if (!student.token) {
      console.log(`⚠️  ${student.email}: No token available, skipping enrollment`);
      continue;
    }
    
    const courses = await getAvailableCourses(student.token, student.level);
    
    if (courses.length > 0) {
      // Enroll in up to 6 courses (skip if already enrolled via admin)
      const coursesToEnroll = courses.slice(0, 6);
      let enrolledCount = 0;
      
      for (const course of coursesToEnroll) {
        const success = await enrollInCourse(student.token, course._id);
        if (success) enrolledCount++;
        // Wait 2 seconds between enrollments to avoid rate limit
        await delay(2000);
      }
      
      console.log(`✅ ${student.email}: Enrolled in ${enrolledCount} courses`);
    } else {
      console.log(`⚠️  ${student.email}: No available courses for level ${student.level}`);
    }
  }
  
  console.log('\n🎉 Student creation and enrollment complete!');
  
  // Summary Table
  console.log('\n📊 Student Summary Table:');
  console.log('='.repeat(120));
  console.log(
    `${'Major'.padEnd(22)} | ${'Level'.padEnd(5)} | ${'Email'.padEnd(28)} | ${'History'.padEnd(7)} | ${'Current'.padEnd(7)} | ${'Credits'.padEnd(7)} | ${'GPA'.padEnd(5)} | ${'Status'.padEnd(8)}`
  );
  console.log('-'.repeat(120));
  
  for (const student of createdStudents) {
    const status = student.token ? '✅ Active' : '⚠️ No Token';
    const historyCount = student.academicHistory?.length || 0;
    const currentCount = student.currentEnrollments?.length || 0;
    const totalCredits = student.academicHistory?.reduce((sum, c) => sum + (c.credits || 3), 0) || 0;
    console.log(
      `${student.major.slice(0, 22).padEnd(22)} | ${String(student.level).padEnd(5)} | ${student.email.padEnd(28)} | ${String(historyCount).padEnd(7)} | ${String(currentCount).padEnd(7)} | ${String(totalCredits).padEnd(7)} | ${student.gpa.toFixed(2).padEnd(5)} | ${status.padEnd(8)}`
    );
  }
  console.log('='.repeat(120));
  
  console.log('\n📊 Statistics by Level:');
  console.log('-'.repeat(70));
  for (let level = 1; level <= 4; level++) {
    const levelStudents = createdStudents.filter(s => s.level === level);
    const avgGpa = levelStudents.length > 0 
      ? (levelStudents.reduce((sum, s) => sum + s.gpa, 0) / levelStudents.length).toFixed(2)
      : '0.00';
    const avgHistory = levelStudents.length > 0
      ? Math.round(levelStudents.reduce((sum, s) => sum + (s.academicHistory?.length || 0), 0) / levelStudents.length)
      : 0;
    const avgCurrent = levelStudents.length > 0
      ? Math.round(levelStudents.reduce((sum, s) => sum + (s.currentEnrollments?.length || 0), 0) / levelStudents.length)
      : 0;
    console.log(`  Level ${level}: ${levelStudents.length} students | Avg GPA: ${avgGpa} | Avg History: ${avgHistory} | Avg Current: ${avgCurrent}`);
  }
  
  // Show sample academic history for a Level 4 student
  const sampleLevel4 = createdStudents.find(s => s.level === 4 && s.academicHistory && s.academicHistory.length > 0);
  if (sampleLevel4) {
    console.log(`\n📚 Sample Academic History (${sampleLevel4.email}):`);
    console.log('='.repeat(90));
    console.log(`${'Course Code'.padEnd(12)} | ${'Course Name'.padEnd(30)} | ${'Level'.padEnd(5)} | ${'Grade'.padEnd(5)} | ${'Credits'.padEnd(7)} | ${'Status'.padEnd(10)}`);
    console.log('-'.repeat(90));
    for (const course of sampleLevel4.academicHistory?.slice(0, 10) || []) {
      console.log(
        `${course.courseCode.padEnd(12)} | ${course.courseName.slice(0, 30).padEnd(30)} | ${String(course.level).padEnd(5)} | ${String(course.grade).padEnd(5)} | ${String(course.credits).padEnd(7)} | ${course.status.padEnd(10)}`
      );
    }
    console.log('='.repeat(90));
    console.log(`   Total Completed: ${sampleLevel4.academicHistory?.length} courses, GPA: ${sampleLevel4.gpa.toFixed(2)}`);
  }
  
  // Show sample current enrollment for a Level 2 student
  const sampleLevel2 = createdStudents.find(s => s.level === 2 && s.currentEnrollments && s.currentEnrollments.length > 0);
  if (sampleLevel2) {
    console.log(`\n📅 Sample Current Semester Enrollment (${sampleLevel2.email}):`);
    console.log('='.repeat(90));
    console.log(`${'Course Code'.padEnd(12)} | ${'Course Name'.padEnd(35)} | ${'Level'.padEnd(5)} | ${'Credits'.padEnd(7)} | ${'Status'.padEnd(12)}`);
    console.log('-'.repeat(90));
    for (const course of sampleLevel2.currentEnrollments || []) {
      console.log(
        `${course.courseCode.padEnd(12)} | ${course.courseName.slice(0, 35).padEnd(35)} | ${String(course.level).padEnd(5)} | ${String(course.credits).padEnd(7)} | ${course.status.padEnd(12)}`
      );
    }
    console.log('='.repeat(90));
    console.log(`   Current Load: ${sampleLevel2.currentEnrollments?.length} courses, ${sampleLevel2.currentEnrollments?.reduce((s, c) => s + c.credits, 0)} credits`);
  }
  
  console.log('\n📧 Quick Access (All passwords: 123456):');
  console.log('-'.repeat(70));
  
  for (const major of MAJORS) {
    console.log(`\n${major}:`);
    for (let level = 1; level <= 4; level++) {
      const email = `student${level}${MAJOR_ABBREVIATIONS[major]}@uni.com`;
      const student = createdStudents.find(s => s.email === email);
      const historyCount = student?.academicHistory?.length || 0;
      const currentCount = student?.currentEnrollments?.length || 0;
      const gpaDisplay = USE_ADMIN_API && student ? `(GPA: ${student.gpa.toFixed(2)}, H:${historyCount}, C:${currentCount})` : '';
      console.log(`  Level ${level}: ${email.padEnd(35)} ${gpaDisplay}`);
    }
  }
  
  console.log('\n👋 Shutting down server...');
  serverProcess.kill();
  process.exit(0);
};

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n👋 Cleaning up...');
  process.exit(0);
});

// Run the script
createAllStudents().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
