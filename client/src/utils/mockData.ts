export interface MockCourse {
    _id: string;
    code: string;
    name: string;
    credits: number;
    instructor: string;
    day: string;
    time: string;
    room: string;
    seats: number;
    maxSeats: number;
    prerequisites: string[]; // course codes
}

export const mockAvailableCourses: MockCourse[] = [
    // Level 1 Courses
    {
        _id: "c1",
        code: "CS101",
        name: "Introduction to CS",
        credits: 3,
        instructor: "Dr. Ahmed",
        day: "Monday",
        time: "10:00 AM - 11:30 AM",
        room: "Hall 1",
        seats: 25,
        maxSeats: 50,
        prerequisites: [],
    },
    {
        _id: "c2",
        code: "MA101",
        name: "Calculus I",
        credits: 4,
        instructor: "Dr. Laila",
        day: "Tuesday",
        time: "08:00 AM - 10:00 AM",
        room: "Room 101",
        seats: 48,
        maxSeats: 50,
        prerequisites: [],
    },
    // Level 2 Courses
    {
        _id: "c3",
        code: "CS201",
        name: "Data Structures",
        credits: 4,
        instructor: "Dr. Omar",
        day: "Wednesday",
        time: "10:00 AM - 11:30 AM",
        room: "Lab 2",
        seats: 15,
        maxSeats: 30,
        prerequisites: ["CS101"],
    },
    {
        _id: "c4",
        code: "CS202",
        name: "Computer Architecture",
        credits: 3,
        instructor: "Dr. Sara",
        day: "Thursday",
        time: "12:00 PM - 01:30 PM",
        room: "Hall B",
        seats: 28,
        maxSeats: 30,
        prerequisites: ["CS101"],
    },
    // Level 3 Courses
    {
        _id: "c5",
        code: "CS303",
        name: "Web Development",
        credits: 3,
        instructor: "Dr. Khaled",
        day: "Monday",
        time: "02:00 PM - 03:30 PM",
        room: "Lab 1",
        seats: 10,
        maxSeats: 30,
        prerequisites: ["CS201"],
    },
    {
        _id: "c6",
        code: "CS305",
        name: "Artificial Intelligence",
        credits: 3,
        instructor: "Dr. Mona",
        day: "Tuesday",
        time: "02:00 PM - 03:30 PM",
        room: "Room 205",
        seats: 5,
        maxSeats: 25,
        prerequisites: ["CS201", "MA101"],
    },
    {
        _id: "c7",
        code: "IS301",
        name: "Project Management",
        credits: 2,
        instructor: "Dr. Hany",
        day: "Wednesday",
        time: "01:00 PM - 02:30 PM",
        room: "Room 301",
        seats: 12,
        maxSeats: 40,
        prerequisites: [], // High level course no prereqs
    },
    {
        _id: "c8",
        code: "CS401",
        name: "Natural Language Processing",
        credits: 3,
        instructor: "Dr. Zaki",
        day: "Thursday",
        time: "08:00 AM - 09:30 AM",
        room: "Lab 3",
        seats: 8,
        maxSeats: 20,
        prerequisites: ["CS305"],
    },
    {
        _id: "c9",
        code: "CS205",
        name: "Operating Systems",
        credits: 3,
        instructor: "Dr. Ibrahim",
        day: "Tuesday",
        time: "10:00 AM - 11:30 AM",
        room: "Hall C",
        seats: 12,
        maxSeats: 40,
        prerequisites: ["CS102"], // Student only took CS101, so this will be locked
    },
];

export const studentData = {
    id: "202100123",
    name: "Ali Hassan",
    major: "Computer Science",
    level: 1, // Student has 27 credits, threshold for level 2 is 32
    semester: "Fall 2025",
    gpa: 3.29,
    completedCredits: 27,
    requiredCredits: 146,
};

export const LEVEL_THRESHOLDS = {
    LEVEL_2: 32,
    LEVEL_3: 66,
    LEVEL_4: 96,
    GRADUATION: 146
};

// Model Plan (Standard Curriculum)
export const modelPlan = {
    level1: {
        requiredCredits: 38,
        courses: ["CS101", "MA101", "EN101", "PH101", "MA102", "CS102", "EN102", "PH102"]
    },
    level2: {
        requiredTotalCredits: 74, // 38 + 36
        courses: ["CS201", "CS202", "CS205", "MA201", "ST201", "CS203", "CS204", "MA202"]
    },
    level3: {
        requiredTotalCredits: 110, // 74 + 36
        courses: ["CS301", "CS303", "CS305", "IS301", "CS304", "CS306", "MA301", "ST301"]
    },
    level4: {
        requiredTotalCredits: 146,
        courses: ["CS401", "CS402", "CS403", "GP1", "GP2", "Elective1", "Elective2", "Elective3"]
    }
};

export interface AcademicHistoryEntry {
    semester: string;
    courses: {
        code: string;
        name: string;
        credits: number;
        grade: string;
        points: number;
    }[];
}

export const mockAcademicHistory: AcademicHistoryEntry[] = [
    {
        semester: "Fall 2024",
        courses: [
            { code: "CS101", name: "Introduction to CS", credits: 3, grade: "A", points: 4.0 },
            { code: "MA101", name: "Calculus I", credits: 4, grade: "B+", points: 3.5 },
            { code: "EN101", name: "English I", credits: 2, grade: "A-", points: 3.7 },
            { code: "PH101", name: "Physics I", credits: 4, grade: "B", points: 3.0 },
        ],
    },
    {
        semester: "Spring 2025",
        courses: [
            { code: "CS201", name: "Data Structures", credits: 4, grade: "A-", points: 3.7 },
            { code: "MA102", name: "Calculus II", credits: 4, grade: "C+", points: 2.5 },
            { code: "EN102", name: "English II", credits: 2, grade: "A", points: 4.0 },
            { code: "PH102", name: "Physics II", credits: 4, grade: "B-", points: 2.7 },
        ],
    },
];

export const getGradePoints = (grade: string): number => {
    const mapping: Record<string, number> = {
        "A+": 4.0, "A": 4.0, "A-": 3.7,
        "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7,
        "D+": 1.3, "D": 1.0,
        "F": 0.0,
    };
    return mapping[grade.toUpperCase()] || 0;
};
