import mongoose from 'mongoose';
import Course from '../models/Course';
import CourseAssignment from '../models/CourseAssignment';
import dotenv from 'dotenv';
dotenv.config();

const courses = [
    { code: "CS303", name: "Software Engineering", day: "Sunday", time: "08:00 - 09:30", startTime: 480, endTime: 570, room: "B-201", credits: 3, instructor: "Dr. Khalid Nasser", capacity: 50, isActive: true },
    { code: "CS311", name: "Database Systems", day: "Monday", time: "10:00 - 11:30", startTime: 600, endTime: 690, room: "A-104", credits: 3, instructor: "Dr. Sara Ahmed", capacity: 50, isActive: true },
    { code: "CS321", name: "Computer Networks", day: "Tuesday", time: "12:00 - 13:30", startTime: 720, endTime: 810, room: "C-305", credits: 3, instructor: "Dr. Omar Farouk", capacity: 50, isActive: true },
    { code: "MATH301", name: "Numerical Methods", day: "Wednesday", time: "09:00 - 10:30", startTime: 540, endTime: 630, room: "D-112", credits: 3, instructor: "Dr. Laila Hassan", capacity: 40, isActive: true },
    { code: "CS401", name: "Artificial Intelligence", day: "Thursday", time: "14:00 - 15:30", startTime: 840, endTime: 930, room: "B-310", credits: 3, instructor: "Dr. Yusuf Malik", capacity: 40, isActive: true }
];

async function seed() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cs303");
        console.log("Connected to DB");

        for (const c of courses) {
            let existing = await Course.findOne({ code: c.code });
            let courseId = existing?._id;

            if (!existing) {
                const newC = await Course.create(c);
                courseId = newC._id;
                console.log("Created course:", c.code);
            } else {
                console.log("Course exists:", c.code);
            }

            // Automatically assign course to level 3 so the student can see them
            const existingAssign = await CourseAssignment.findOne({ course: courseId, level: 3 });
            if (!existingAssign) {
                await CourseAssignment.create({
                    course: courseId,
                    level: 3,
                    semester: "Spring",
                });
                await CourseAssignment.create({
                    course: courseId,
                    level: 3,
                    semester: "Spring",
                });
                console.log("Assigned to level 3:", c.code);
            }
        }

        console.log("Database seeded successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    } finally {
        process.exit(0);
    }
}

seed();
