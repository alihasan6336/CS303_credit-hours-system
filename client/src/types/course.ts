export interface Course {
  _id?: string;
  courseName: string;
  courseCode: string;
  major: string;
  studentYear: number;
  creditHours: number;
  instructorName?: string;
  prerequisite?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseFormData {
  courseName: string;
  courseCode: string;
  major: string;
  studentYear: number;
  creditHours: number;
  instructorName: string;
  prerequisite: string;
}

export const MAJORS = [
  "Computer Science",
  "Information Technology",
  "Software Engineering",
  "Cybersecurity",
  "Data Science",
  "Computer Engineering",
] as const;

export const STUDENT_YEARS = [1, 2, 3, 4] as const;
