import { spawn } from 'child_process';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Delay utility to avoid rate limits
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

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

// Student data structure
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

// Generate student data based on major and level
const generateStudentData = (major: string, level: number): StudentData => {
  const majorAbbr = MAJOR_ABBREVIATIONS[major];
  const email = `student${level}${majorAbbr}@uni.com`;
  
  // Calculate realistic credit hours and GPA based on level
  const baseCredits = (level - 1) * 30; // 30 credits per level completed
  const currentSemester = 'Fall' as const;
  
  // Random GPA between 2.5 and 4.0 for variety
  const gpa = parseFloat((2.5 + Math.random() * 1.5).toFixed(2));
  
  // Credit hours based on level progression
  const completedCreditHours = level === 1 ? 0 : baseCredits;
  
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
  };
};

// Register student via API
const registerStudent = async (studentData: StudentData): Promise<string | null> => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      fullName: studentData.fullName,
      universityId: studentData.universityId,
      email: studentData.email,
      password: studentData.password,
      confirmPassword: studentData.password, // Required by validation
      major: studentData.major,
      level: studentData.level,
      currentSemester: studentData.currentSemester,
      completedCreditHours: studentData.completedCreditHours,
      acceptTerms: true, // Required by validation
    });
    
    if (response.data.success) {
      console.log(`✅ Registered: ${studentData.email}`);
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

// Generate random grade (70-100%)
const generateGrade = (): number => {
  return Math.floor(70 + Math.random() * 31);
};

// Main function to create all students
const createAllStudents = async (): Promise<void> => {
  console.log('🚀 Starting student creation process...\n');
  
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
  
  console.log('\n📚 Creating students for all majors and levels...\n');
  
  const createdStudents: { email: string; token: string; level: number; major: string }[] = [];
  
  // Create students for each major and level
  for (const major of MAJORS) {
    console.log(`\n🏫 ${major}`);
    console.log('='.repeat(50));
    
    for (let level = 1; level <= 4; level++) {
      const studentData = generateStudentData(major, level);
      const token = await registerStudent(studentData);
      
      if (token) {
        createdStudents.push({
          email: studentData.email,
          token,
          level,
          major,
        });
        
        // If level > 1, simulate completed courses for previous levels
        if (level > 1) {
          console.log(`   📖 Level ${level} - Simulating ${(level - 1) * 5} completed courses`);
        }
      }
      
      // Wait 3 seconds between student registrations to avoid rate limit (15 per 15 min)
      await delay(3000);
    }
  }
  
  console.log(`\n✅ Created ${createdStudents.length} students successfully!`);
  
  // Enroll current level students in available courses
  console.log('\n📋 Enrolling students in courses...\n');
  
  for (const student of createdStudents) {
    const courses = await getAvailableCourses(student.token, student.level);
    
    if (courses.length > 0) {
      // Enroll in up to 5 courses
      const coursesToEnroll = courses.slice(0, 5);
      let enrolledCount = 0;
      
      for (const course of coursesToEnroll) {
        const success = await enrollInCourse(student.token, course._id);
        if (success) enrolledCount++;
        // Wait 1 second between enrollments to avoid rate limit
        await delay(1000);
      }
      
      console.log(`✅ ${student.email}: Enrolled in ${enrolledCount} courses`);
    } else {
      console.log(`⚠️  ${student.email}: No available courses for level ${student.level}`);
    }
  }
  
  console.log('\n🎉 Student creation and enrollment complete!');
  console.log('\n📧 Student Accounts:');
  console.log('-'.repeat(60));
  
  for (const major of MAJORS) {
    console.log(`\n${major}:`);
    for (let level = 1; level <= 4; level++) {
      const email = `student${level}${MAJOR_ABBREVIATIONS[major]}@uni.com`;
      console.log(`  Level ${level}: ${email} / 123456`);
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
