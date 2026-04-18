import dotenv from "dotenv";
import connectDB from "./config/db";
import Student from "./models/Student";
import Course from "./models/Course";
import Enrollment from "./models/Enrollment";

dotenv.config();

const testModels = async () => {
  await connectDB();

  try {
    console.log("🚀 Testing models...");

    // 1️⃣ Create Student
    const student = await Student.create({
      fullName: "Test Student",
      universityId: "U12345",
      email: "test@example.com",
      password: "123456",
      major: "Computer Science",
      academicYear: "3rd Year",
      currentSemester: "Fall",
      completedCreditHours: 30,
      phoneNumber: "1234567890",
    });

    console.log("✅ Student Created:", student.email);

    // 2️⃣ Create Course
    const course = await Course.create({
      code: "tests",
      name: "test Systems",
      day: "Monday",
      time: "10:00 AM",
      room: "A101",
      credits: 3,
      instructor: "Dr.besso",
    });

    console.log("✅ Course Created:", course.code);

    // 3️⃣ Create Enrollment
    const enrollment = await Enrollment.create({
      student: student._id,
      course: course._id,
      academicYear: "2024-2025",
      semester: "Fall",
    });

    console.log("✅ Enrollment Created");

    // 4️⃣ Test Populate
    const populated = await Enrollment.findById(enrollment._id)
      .populate("student")
      .populate("course");

    console.log("🎯 Populated Enrollment:");
    console.log(populated);

    console.log("🎉 All models working correctly!");
    process.exit();
  } catch (error) {
    console.error("❌ Error testing models:", error);
    process.exit(1);
  }
};

testModels();