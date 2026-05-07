import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Models
import Course from '../models/Course';
import CourseAssignment from '../models/CourseAssignment';
import Student from '../models/Student';
import Enrollment from '../models/Enrollment';
import AdminUser from '../models/AdminUser';
import AdminPermission, { ALL_PERMISSIONS } from '../models/AdminPermission';
import SystemSettings from '../models/SystemSettings';

dotenv.config();

// Current academic settings
const CURRENT_SEMESTER = 'Fall';
const SYSTEM_ACADEMIC_YEAR = '2025-2026'; // For CourseAssignment and SystemSettings
const STUDENT_ACADEMIC_YEAR = '1st Year'; // For Student model: '1st Year', '2nd Year', etc.

// All departments in the system
const DEPARTMENTS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Computer Engineering',
  'Cybersecurity',
  'Data Science',
];

// Helper to get time slots for different days
type DaySchedule = { [key: string]: string[] };
const TIME_SLOTS: DaySchedule = {
  'Sunday': ['09:00 - 11:00', '11:00 - 13:00', '13:00 - 15:00', '15:00 - 17:00'],
  'Monday': ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'],
  'Tuesday': ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00'],
  'Wednesday': ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00'],
  'Thursday': ['09:00 - 11:00', '10:00 - 12:00', '13:00 - 15:00'],
  'Friday': ['10:00 - 12:00', '13:00 - 15:00'],
  'Saturday': ['09:00 - 11:00', '10:00 - 12:00', '13:00 - 15:00'],
};

// Course templates by department
const DEPARTMENT_COURSES: { [key: string]: any[] } = {
  // COMPUTER SCIENCE - Core CS curriculum
  'Computer Science': [
    // Level 1
    { code: 'CS101', name: 'Introduction to Computer Science', credits: 3, prereq: [] },
    { code: 'CS102', name: 'Programming Fundamentals', credits: 4, prereq: [] },
    { code: 'CS103', name: 'Discrete Mathematics', credits: 3, prereq: [] },
    { code: 'CS104', name: 'Computer Architecture Basics', credits: 3, prereq: [] },
    // Level 2
    { code: 'CS201', name: 'Data Structures', credits: 4, prereq: ['CS101', 'CS102'] },
    { code: 'CS202', name: 'Object-Oriented Programming', credits: 3, prereq: ['CS102'] },
    { code: 'CS203', name: 'Algorithms I', credits: 3, prereq: ['CS103', 'CS201'] },
    { code: 'CS204', name: 'Web Development', credits: 3, prereq: ['CS102'] },
    // Level 3
    { code: 'CS301', name: 'Database Systems', credits: 3, prereq: ['CS201'] },
    { code: 'CS302', name: 'Operating Systems', credits: 4, prereq: ['CS201', 'CS104'] },
    { code: 'CS303', name: 'Computer Networks', credits: 3, prereq: ['CS202'] },
    { code: 'CS304', name: 'Software Engineering', credits: 3, prereq: ['CS202', 'CS204'] },
    // Level 4
    { code: 'CS401', name: 'Artificial Intelligence', credits: 3, prereq: ['CS203'] },
    { code: 'CS402', name: 'Machine Learning', credits: 3, prereq: ['CS203', 'CS301'] },
    { code: 'CS403', name: 'Capstone Project', credits: 6, prereq: ['CS302', 'CS304'] },
    { code: 'CS404', name: 'Cloud Computing', credits: 3, prereq: ['CS302', 'CS303'] },
  ],

  // SOFTWARE ENGINEERING - Focus on software development lifecycle
  'Software Engineering': [
    // Level 1
    { code: 'SE101', name: 'Intro to Software Engineering', credits: 3, prereq: [] },
    { code: 'SE102', name: 'Programming Basics', credits: 4, prereq: [] },
    { code: 'SE103', name: 'Software Modeling', credits: 3, prereq: [] },
    { code: 'SE104', name: 'Database Fundamentals', credits: 3, prereq: [] },
    // Level 2
    { code: 'SE201', name: 'Object-Oriented Design', credits: 4, prereq: ['SE102'] },
    { code: 'SE202', name: 'Software Testing', credits: 3, prereq: ['SE102'] },
    { code: 'SE203', name: 'Requirements Engineering', credits: 3, prereq: ['SE101', 'SE103'] },
    { code: 'SE204', name: 'Web Application Dev', credits: 3, prereq: ['SE102', 'SE104'] },
    // Level 3
    { code: 'SE301', name: 'Software Architecture', credits: 4, prereq: ['SE201'] },
    { code: 'SE302', name: 'DevOps Practices', credits: 3, prereq: ['SE202'] },
    { code: 'SE303', name: 'Mobile Development', credits: 3, prereq: ['SE204'] },
    { code: 'SE304', name: 'Quality Assurance', credits: 3, prereq: ['SE202', 'SE203'] },
    // Level 4
    { code: 'SE401', name: 'Project Management', credits: 3, prereq: ['SE303'] },
    { code: 'SE402', name: 'Software Security', credits: 3, prereq: ['SE301', 'SE302'] },
    { code: 'SE403', name: 'Senior Project', credits: 6, prereq: ['SE301', 'SE304'] },
    { code: 'SE404', name: 'Agile Methodologies', credits: 3, prereq: ['SE304'] },
  ],

  // INFORMATION TECHNOLOGY - Focus on IT infrastructure and systems
  'Information Technology': [
    // Level 1
    { code: 'IT101', name: 'IT Fundamentals', credits: 3, prereq: [] },
    { code: 'IT102', name: 'Networking Basics', credits: 4, prereq: [] },
    { code: 'IT103', name: 'Hardware Systems', credits: 3, prereq: [] },
    { code: 'IT104', name: 'Programming for IT', credits: 3, prereq: [] },
    // Level 2
    { code: 'IT201', name: 'Network Administration', credits: 4, prereq: ['IT102'] },
    { code: 'IT202', name: 'System Administration', credits: 3, prereq: ['IT103'] },
    { code: 'IT203', name: 'Database Management', credits: 3, prereq: ['IT104'] },
    { code: 'IT204', name: 'IT Security Fundamentals', credits: 3, prereq: ['IT102'] },
    // Level 3
    { code: 'IT301', name: 'Cloud Infrastructure', credits: 4, prereq: ['IT201', 'IT202'] },
    { code: 'IT302', name: 'Enterprise Systems', credits: 3, prereq: ['IT203'] },
    { code: 'IT303', name: 'IT Project Management', credits: 3, prereq: ['IT201'] },
    { code: 'IT304', name: 'Cybersecurity', credits: 3, prereq: ['IT204'] },
    // Level 4
    { code: 'IT401', name: 'Advanced Networking', credits: 3, prereq: ['IT301'] },
    { code: 'IT402', name: 'IT Strategy', credits: 3, prereq: ['IT302', 'IT303'] },
    { code: 'IT403', name: 'Capstone Project', credits: 6, prereq: ['IT301', 'IT304'] },
    { code: 'IT404', name: 'Emerging Technologies', credits: 3, prereq: ['IT302'] },
  ],

  // COMPUTER ENGINEERING - Hardware and software integration
  'Computer Engineering': [
    // Level 1
    { code: 'CE101', name: 'Digital Logic Design', credits: 3, prereq: [] },
    { code: 'CE102', name: 'Circuit Analysis', credits: 4, prereq: [] },
    { code: 'CE103', name: 'Programming for Engineers', credits: 3, prereq: [] },
    { code: 'CE104', name: 'Computer Organization', credits: 3, prereq: [] },
    // Level 2
    { code: 'CE201', name: 'Embedded Systems', credits: 4, prereq: ['CE101', 'CE103'] },
    { code: 'CE202', name: 'Microprocessors', credits: 3, prereq: ['CE104'] },
    { code: 'CE203', name: 'Signals and Systems', credits: 3, prereq: ['CE102'] },
    { code: 'CE204', name: 'Data Structures for CE', credits: 3, prereq: ['CE103'] },
    // Level 3
    { code: 'CE301', name: 'Computer Architecture', credits: 4, prereq: ['CE202'] },
    { code: 'CE302', name: 'VLSI Design', credits: 3, prereq: ['CE201'] },
    { code: 'CE303', name: 'Real-Time Systems', credits: 3, prereq: ['CE201'] },
    { code: 'CE304', name: 'Hardware Security', credits: 3, prereq: ['CE204'] },
    // Level 4
    { code: 'CE401', name: 'Advanced Architecture', credits: 3, prereq: ['CE301'] },
    { code: 'CE402', name: 'Robotics', credits: 3, prereq: ['CE303'] },
    { code: 'CE403', name: 'Senior Design Project', credits: 6, prereq: ['CE302', 'CE304'] },
    { code: 'CE404', name: 'IoT Systems', credits: 3, prereq: ['CE303', 'CE304'] },
  ],

  // CYBERSECURITY - Security focus
  'Cybersecurity': [
    // Level 1
    { code: 'CYB101', name: 'Cybersecurity Fundamentals', credits: 3, prereq: [] },
    { code: 'CYB102', name: 'Network Security Basics', credits: 4, prereq: [] },
    { code: 'CYB103', name: 'Programming for Security', credits: 3, prereq: [] },
    { code: 'CYB104', name: 'Ethical Hacking Intro', credits: 3, prereq: [] },
    // Level 2
    { code: 'CYB201', name: 'Cryptography', credits: 4, prereq: ['CYB103'] },
    { code: 'CYB202', name: 'Penetration Testing', credits: 3, prereq: ['CYB102', 'CYB104'] },
    { code: 'CYB203', name: 'Malware Analysis', credits: 3, prereq: ['CYB103'] },
    { code: 'CYB204', name: 'Security Operations', credits: 3, prereq: ['CYB101', 'CYB102'] },
    // Level 3
    { code: 'CYB301', name: 'Advanced Cryptography', credits: 4, prereq: ['CYB201'] },
    { code: 'CYB302', name: 'Digital Forensics', credits: 3, prereq: ['CYB202', 'CYB203'] },
    { code: 'CYB303', name: 'Secure Software Dev', credits: 3, prereq: ['CYB203'] },
    { code: 'CYB304', name: 'Risk Management', credits: 3, prereq: ['CYB204'] },
    // Level 4
    { code: 'CYB401', name: 'Advanced Penetration Testing', credits: 3, prereq: ['CYB302'] },
    { code: 'CYB402', name: 'Security Governance', credits: 3, prereq: ['CYB304'] },
    { code: 'CYB403', name: 'Capstone in Cybersecurity', credits: 6, prereq: ['CYB301', 'CYB303'] },
    { code: 'CYB404', name: 'Threat Intelligence', credits: 3, prereq: ['CYB302'] },
  ],

  // DATA SCIENCE - Analytics and ML focus
  'Data Science': [
    // Level 1
    { code: 'DS101', name: 'Data Science Fundamentals', credits: 3, prereq: [] },
    { code: 'DS102', name: 'Statistics for Data Science', credits: 4, prereq: [] },
    { code: 'DS103', name: 'Python for Data Science', credits: 3, prereq: [] },
    { code: 'DS104', name: 'Data Visualization', credits: 3, prereq: [] },
    // Level 2
    { code: 'DS201', name: 'Machine Learning Basics', credits: 4, prereq: ['DS102', 'DS103'] },
    { code: 'DS202', name: 'Data Mining', credits: 3, prereq: ['DS101', 'DS103'] },
    { code: 'DS203', name: 'Big Data Technologies', credits: 3, prereq: ['DS103'] },
    { code: 'DS204', name: 'Statistical Modeling', credits: 3, prereq: ['DS102'] },
    // Level 3
    { code: 'DS301', name: 'Deep Learning', credits: 4, prereq: ['DS201'] },
    { code: 'DS302', name: 'Natural Language Processing', credits: 3, prereq: ['DS201'] },
    { code: 'DS303', name: 'Data Engineering', credits: 3, prereq: ['DS203'] },
    { code: 'DS304', name: 'Predictive Analytics', credits: 3, prereq: ['DS204'] },
    // Level 4
    { code: 'DS401', name: 'Advanced ML', credits: 3, prereq: ['DS301'] },
    { code: 'DS402', name: 'AI Ethics', credits: 3, prereq: ['DS302'] },
    { code: 'DS403', name: 'Capstone Project', credits: 6, prereq: ['DS301', 'DS303'] },
    { code: 'DS404', name: 'Reinforcement Learning', credits: 3, prereq: ['DS301'] },
  ],

};

// Generate full TEST_COURSES with scheduling info
const generateTestCourses = () => {
  const courses: any[] = [];
  const days = Object.keys(TIME_SLOTS);
  let globalRoomIndex = 0;
  const rooms = ['A101', 'A102', 'A103', 'A104', 'B201', 'B202', 'B203', 'B204', 'C301', 'C302', 'C303', 'C304', 
                 'D401', 'D402', 'D403', 'D404', 'E501', 'E502', 'E503', 'F601', 'F602', 'F603', 'G701', 'G702',
                 'H801', 'H802', 'I901', 'I902', 'J101', 'J102', 'K201', 'K202', 'L301', 'L302', 'M401', 'M402'];
  
  DEPARTMENTS.forEach((dept) => {
    const deptCourses = DEPARTMENT_COURSES[dept];
    if (!deptCourses) return;

    deptCourses.forEach((course, index) => {
      const level = Math.floor(index / 4) + 1; // 4 courses per level
      const day = days[index % days.length];
      const timeSlotIndex = Math.floor(index / days.length) % TIME_SLOTS[day].length;
      const room = rooms[globalRoomIndex % rooms.length];
      globalRoomIndex++;

      courses.push({
        code: course.code,
        name: course.name,
        credits: course.credits,
        level: level,
        day: day,
        time: TIME_SLOTS[day][timeSlotIndex],
        room: room,
        instructor: `Dr. ${dept.split(' ')[0]}${index + 1}`,
        capacity: 25 + (index % 15),
        prerequisites: course.prereq,
        major: dept,
      });
    });
  });

  return courses;
};

// Helper: parse "HH:MM - HH:MM" into start/end minutes from midnight
function parseTimeRange(timeStr: string): { startTime: number; endTime: number } {
  const [start, end] = timeStr.split(' - ').map((t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  });
  return { startTime: start, endTime: end };
}

const TEST_COURSES = generateTestCourses().map((c) => {
  const { startTime, endTime } = parseTimeRange(c.time);
  return { ...c, startTime, endTime };
});

const createTestData = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI not found in environment');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Initialize system settings
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        currentSemester: CURRENT_SEMESTER,
        academicYear: SYSTEM_ACADEMIC_YEAR,
      });
      console.log(`✅ Created system settings: ${CURRENT_SEMESTER} ${SYSTEM_ACADEMIC_YEAR}`);
    } else {
      settings.currentSemester = CURRENT_SEMESTER;
      settings.academicYear = SYSTEM_ACADEMIC_YEAR;
      await settings.save();
      console.log(`✅ Updated system settings: ${CURRENT_SEMESTER} ${SYSTEM_ACADEMIC_YEAR}`);
    }

    // Create Super Admin
    let superAdmin = await AdminUser.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      superAdmin = await AdminUser.create({
        fullName: 'Super Admin',
        email: 'superadmin@university.edu',
        password: 'superadmin123',
        role: 'superadmin',
        isActive: true,
      });
      await AdminPermission.create({
        admin: superAdmin._id,
        permissions: [...ALL_PERMISSIONS],
        grantedBy: superAdmin._id,
        note: 'System Super Admin',
      });
      console.log('✅ Created Super Admin:');
      console.log('   Email: superadmin@university.edu');
      console.log('   Password: superadmin123\n');
    } else {
      console.log('⚠️  Super Admin already exists');
      console.log(`   Email: ${superAdmin.email}\n`);
    }

    // Create Courses
    const createdCourses: Map<string, any> = new Map();
    console.log('📚 Creating courses...');

    for (const courseData of TEST_COURSES) {
      let course = await Course.findOne({ code: courseData.code });
      if (!course) {
        course = await Course.create({
          ...courseData,
          enrolledCount: 0,
          isActive: true,
        });
        createdCourses.set(courseData.code, course);
        console.log(`   ✅ ${course.code} - ${course.name} (${course.credits} credits)`);
      } else {
        createdCourses.set(courseData.code, course);
        console.log(`   ⚠️  ${course.code} already exists`);
      }
    }

    // Create Course Assignments
    console.log('\n📋 Assigning courses to levels...');
    for (const courseData of TEST_COURSES) {
      const course = createdCourses.get(courseData.code);
      if (!course) continue;

      const existingAssignment = await CourseAssignment.findOne({
        course: course._id,
        level: courseData.level,
        semester: CURRENT_SEMESTER,
      });

      if (!existingAssignment) {
        await CourseAssignment.create({
          course: course._id,
          level: courseData.level,
          semester: CURRENT_SEMESTER,
          isActive: true,
        });
        console.log(`   ✅ Level ${courseData.level}: ${courseData.code}`);
      } else {
        console.log(`   ⚠️  Level ${courseData.level}: ${courseData.code} already assigned`);
      }
    }

    // Create Test Students for each department
    console.log('\n👤 Creating test students for each department...');
    const createdStudents: any[] = [];
    
    for (let i = 0; i < DEPARTMENTS.length; i++) {
      const dept = DEPARTMENTS[i];
      const studentEmail = `student.${dept.toLowerCase().replace(/\s+/g, '')}@university.edu`;
      const universityId = `STU2025${String(i + 1).padStart(3, '0')}`;
      
      let student = await Student.findOne({ email: studentEmail });
      
      if (!student) {
        const hashedPassword = await bcrypt.hash('student123', 10);
        student = await Student.create({
          fullName: `${dept} Student`,
          email: studentEmail,
          password: hashedPassword,
          universityId: universityId,
          major: dept,
          level: 1,
          gpa: 0,
          completedCreditHours: 0,
          currentSemester: CURRENT_SEMESTER,
          isActive: true,
        });
        console.log(`   ✅ ${dept}: ${studentEmail}`);
        createdStudents.push(student);
      } else {
        console.log(`   ⚠️  ${dept}: ${studentEmail} already exists`);
        createdStudents.push(student);
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total Courses: ${createdCourses.size} (${DEPARTMENTS.length} departments × 16 courses each)`);
    console.log(`   Levels covered: 1, 2, 3, 4`);
    console.log(`   Semester: ${CURRENT_SEMESTER} ${SYSTEM_ACADEMIC_YEAR}`);
    console.log(`   Super Admin: superadmin@university.edu (password: superadmin123)`);
    console.log(`   Test Students: ${createdStudents.length} created (password: student123 for all)`);
    console.log(`\n   Students by Department:`);
    DEPARTMENTS.forEach((dept, i) => {
      console.log(`      - ${dept}: student.${dept.toLowerCase().replace(/\s+/g, '')}@university.edu`);
    });
    console.log('\n✅ Test data setup complete!');
    console.log('\nNext steps:');
    console.log('1. Login as superadmin at /login');
    console.log('2. Or login as teststudent at /login');
    console.log('3. Student can register for Level 1 courses (no prerequisites)');
    console.log('4. After completing Level 1, student can register for Level 2, etc.');

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
  createTestData();
}

export default createTestData;
