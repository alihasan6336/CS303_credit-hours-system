const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Test mode - set to true to use mock data when API fails
const TEST_MODE = false;

interface StudentFromApi {
  id: string;
  fullName: string;
  universityId: string;
  email: string;
  major: string;
  academicYear: string;
  currentSemester: string;
  completedCreditHours: number;
  phoneNumber: string;
  gpa: number;
  level: number;
  role: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  student: StudentFromApi;
  message?: string;
}

interface BasicResponse {
  success: boolean;
  message?: string;
  resetURL?: string;
}

interface MeResponse {
  success: boolean;
  student: StudentFromApi;
}

interface HomeResponse {
  success: boolean;
  student: StudentFromApi;
  courses: CourseFromApi[];
}

interface CourseFromApi {
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
}

// Mock data generators
const mockData = {
  student: {
    id: "2021-CS-0342",
    fullName: "Ahmed Al-Rashidi",
    universityId: "2021-CS-0342",
    email: "ahmed@university.edu",
    major: "Computer Science",
    academicYear: "3rd Year",
    currentSemester: "Spring",
    completedCreditHours: 87,
    phoneNumber: "0501234567",
    gpa: 3.75,
    level: 3,
    role: "student",
  },
  adminStats: {
    success: true,
    stats: {
      totalStudents: 245,
      totalCourses: 32,
      totalAdmins: 8,
      totalEnrollments: 1230,
    },
    studentsByLevel: [
      { level: 1, count: 62 },
      { level: 2, count: 58 },
      { level: 3, count: 65 },
      { level: 4, count: 60 },
    ],
    courses: [
      { code: "CS303", name: "Software Engineering", enrolled: 45, capacity: 50 },
      { code: "CS311", name: "Database Systems", enrolled: 42, capacity: 45 },
      { code: "CS321", name: "Computer Networks", enrolled: 38, capacity: 40 },
      { code: "MATH301", name: "Numerical Methods", enrolled: 35, capacity: 35 },
    ],
  },
  students: [
    {
      id: "1",
      fullName: "Ahmed Al-Rashidi",
      email: "ahmed@university.edu",
      universityId: "2021-CS-0342",
      major: "Computer Science",
      academicYear: "3rd Year",
      level: 3,
      role: "student",
      gpa: 3.75,
      completedCreditHours: 87,
      currentSemester: "Spring",
    },
    {
      id: "2",
      fullName: "Fatima Hassan",
      email: "fatima@university.edu",
      universityId: "2021-CS-0343",
      major: "Computer Science",
      academicYear: "2nd Year",
      level: 2,
      role: "student",
      gpa: 3.45,
      completedCreditHours: 54,
      currentSemester: "Spring",
    },
    {
      id: "admin1",
      fullName: "Mohammed Al-Mansouri",
      email: "admin1@university.edu",
      universityId: "ADMIN-001",
      major: "Administration",
      academicYear: "N/A",
      level: 0,
      role: "admin",
      gpa: 4.0,
      completedCreditHours: 0,
      currentSemester: "N/A",
    },
    {
      id: "admin2",
      fullName: "Sarah Al-Zahra",
      email: "admin2@university.edu",
      universityId: "ADMIN-002",
      major: "Administration",
      academicYear: "N/A",
      level: 0,
      role: "admin",
      gpa: 4.0,
      completedCreditHours: 0,
      currentSemester: "N/A",
    },
    {
      id: "admin3",
      fullName: "Khalid Al-Khaled",
      email: "admin3@university.edu",
      universityId: "ADMIN-003",
      major: "Administration",
      academicYear: "N/A",
      level: 0,
      role: "admin",
      gpa: 4.0,
      completedCreditHours: 0,
      currentSemester: "N/A",
    },
    {
      id: "superadmin1",
      fullName: "Dr. Samir Al-Omari",
      email: "superadmin@university.edu",
      universityId: "SUPER-ADMIN-001",
      major: "Administration",
      academicYear: "N/A",
      level: 0,
      role: "superadmin",
      gpa: 4.0,
      completedCreditHours: 0,
      currentSemester: "N/A",
    },
  ],
  assignments: {
    success: true,
    byLevel: {
      "1": [
        {
          _id: "1",
          course: {
            _id: "c1",
            code: "CS101",
            name: "Introduction to Programming",
            credits: 3,
            day: "Sunday",
            time: "09:00-10:30",
            room: "A-101",
            instructor: "Dr. Ahmed",
            capacity: 50,
            enrolledCount: 45,
          },
          level: 1,
          semester: "Fall",
          academicYear: "2024-2025",
          isActive: true,
        },
      ],
      "2": [],
      "3": [],
      "4": [],
    },
  },
  availableCourses: {
    success: true,
    courses: [
      { _id: "c1", code: "CS201", name: "Data Structures", credits: 3 },
      { _id: "c2", code: "CS301", name: "Algorithms", credits: 4 },
      { _id: "c3", code: "CS305", name: "Web Development", credits: 3 },
    ],
  },
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("authToken");

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // ignore JSON parse errors, will fall back to generic message
    }

    if (!res.ok) {
      const message =
        data?.message ||
        (typeof data === "string" ? data : "Something went wrong");
      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    // If TEST_MODE is enabled, return mock data based on the path
    if (TEST_MODE) {
      console.warn(`API call failed for ${path}, using mock data`);

      if (path.includes("/api/admin/stats")) {
        return mockData.adminStats as T;
      }
      if (path.includes("/api/admin/students")) {
        return { success: true, students: mockData.students } as T;
      }
      if (path.includes("/api/admin/check-authority")) {
        return { success: true, message: "You have permission to create this user." } as T;
      }
      if (path.includes("/api/course-assignments/by-level")) {
        return mockData.assignments as T;
      }
      if (path.includes("/api/course-assignments/available-courses")) {
        return mockData.availableCourses as T;
      }
      if (path.includes("/api/home")) {
        return {
          success: true,
          student: mockData.student,
          courses: [
            {
              code: "CS303",
              name: "Software Engineering",
              day: "Sunday",
              time: "08:00 – 09:30",
              room: "B-201",
              credits: 3,
              instructor: "Dr. Khalid Nasser",
            },
            {
              code: "CS311",
              name: "Database Systems",
              day: "Monday",
              time: "10:00 – 11:30",
              room: "A-104",
              credits: 3,
              instructor: "Dr. Sara Ahmed",
            },
          ],
        } as T;
      }
    }

    throw error;
  }
}

export const authApi = {
  login(body: {
    email: string;
    password: string;
    rememberMe: boolean;
  }): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  register(body: {
    fullName: string;
    universityId: string;
    email: string;
    password: string;
    major: string;
    academicYear: string;
    currentSemester: string;
    completedCreditHours: string;
    phoneNumber?: string;
  }): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  forgotPassword(body: { email: string }): Promise<BasicResponse> {
    return request<BasicResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  me(): Promise<MeResponse> {
    return request<MeResponse>("/api/auth/me");
  },

  home(): Promise<HomeResponse> {
    return request<HomeResponse>("/api/home");
  },

  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("student");
  },
};

interface AdminStatsResponse {
  success: boolean;
  stats: {
    totalStudents: number;
    totalCourses: number;
    totalAdmins: number;
    totalEnrollments: number;
  };
  studentsByLevel: { level: number; count: number }[];
  courses: { code: string; name: string; enrolled: number; capacity: number }[];
}

interface StudentAccount {
  id: string;
  fullName: string;
  email: string;
  universityId: string;
  major: string;
  academicYear: string;
  level: number;
  role: string;
  gpa: number;
  completedCreditHours: number;
  currentSemester: string;
}

interface StudentsListResponse {
  success: boolean;
  students: StudentAccount[];
}

interface CreateAccountResponse {
  success: boolean;
  student: { id: string; fullName: string; email: string; role: string };
  message?: string;
}

interface AuthorityCheckResponse {
  success: boolean;
  message?: string;
}

interface EnrollmentData {
  _id: string;
  student: { _id: string; fullName: string; universityId: string; email: string; level: number };
  course: { _id: string; code: string; name: string; credits: number };
  semester: string;
  academicYear: string;
  enrolledAt: string;
}

interface EnrollmentsResponse {
  success: boolean;
  enrollments: EnrollmentData[];
}

export const adminApi = {
  getStats(): Promise<AdminStatsResponse> {
    return request<AdminStatsResponse>("/api/admin/stats");
  },

  getStudents(role?: string): Promise<StudentsListResponse> {
    const query = role ? `?role=${role}` : "";
    return request<StudentsListResponse>(`/api/admin/students${query}`);
  },

  checkCreateUserAuthority(role: string): Promise<AuthorityCheckResponse> {
    return request<AuthorityCheckResponse>("/api/admin/check-authority", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  },

  createAccount(body: {
    fullName: string;
    email: string;
    password: string;
    universityId?: string;
    major?: string;
    academicYear?: string;
    currentSemester?: string;
    completedCreditHours?: number;
    phoneNumber?: string;
    role: string;
  }): Promise<CreateAccountResponse> {
    return request<CreateAccountResponse>("/api/admin/accounts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  createStudentAccount(body: {
    fullName: string;
    email: string;
    password: string;
    universityId?: string;
    major?: string;
    academicYear?: string;
    currentSemester?: string;
    completedCreditHours?: number;
  }): Promise<CreateAccountResponse> {
    return request<CreateAccountResponse>("/api/admin/users/students", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  createAdminAccount(body: {
    fullName: string;
    email: string;
    password: string;
    universityId?: string;
    major?: string;
    phoneNumber?: string;
  }): Promise<CreateAccountResponse> {
    return request<CreateAccountResponse>("/api/admin/users/admins", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  deleteAccount(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/admin/accounts/${id}`, {
      method: "DELETE",
    });
  },

  getEnrollments(): Promise<EnrollmentsResponse> {
    return request<EnrollmentsResponse>("/api/admin/enrollments");
  },

  enrollStudent(studentId: string, courseId: string): Promise<{ success: boolean; message: string }> {
    return request("/api/admin/enrollments", {
      method: "POST",
      body: JSON.stringify({ studentId, courseId }),
    });
  },

  unenrollStudent(enrollmentId: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/admin/enrollments/${enrollmentId}`, {
      method: "DELETE",
    });
  },
};

export const gpaApi = {
  getBreakdown(): Promise<{ success: boolean; gpa: number; totalCredits: number; breakdown: any[] }> {
    return request("/api/gpa/me");
  },

  recalculate(): Promise<{ success: boolean; message: string; data: { gpa: number; completedCreditHours: number } }> {
    return request("/api/gpa/recalculate", {
      method: "POST",
    });
  },

  predict(potentialGrades: { courseId: string; grade: number }[]): Promise<{ success: boolean; currentGPA: number; predictedGPA: number; totalCreditsAfter: number }> {
    return request("/api/gpa/predict", {
      method: "POST",
      body: JSON.stringify({ potentialGrades }),
    });
  },
};

interface CourseAssignmentData {
  _id: string;
  course: {
    _id: string;
    code: string;
    name: string;
    day: string;
    time: string;
    room: string;
    credits: number;
    instructor: string;
    capacity: number;
    enrolledCount: number;
  };
  level: number;
  semester: string;
  academicYear: string;
  isActive: boolean;
}

interface AssignmentsResponse {
  success: boolean;
  assignments: CourseAssignmentData[];
}

interface AssignmentsByLevelResponse {
  success: boolean;
  byLevel: Record<string, CourseAssignmentData[]>;
}

interface AvailableCoursesResponse {
  success: boolean;
  courses: { _id: string; code: string; name: string; credits: number }[];
}

export const courseAssignmentApi = {
  getAssignments(filters?: { level?: number; semester?: string; academicYear?: string }): Promise<AssignmentsResponse> {
    const params = new URLSearchParams();
    if (filters?.level) params.append("level", String(filters.level));
    if (filters?.semester) params.append("semester", filters.semester);
    if (filters?.academicYear) params.append("academicYear", filters.academicYear);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<AssignmentsResponse>(`/api/course-assignments${query}`);
  },

  getAssignmentsByLevel(filters?: { semester?: string; academicYear?: string }): Promise<AssignmentsByLevelResponse> {
    const params = new URLSearchParams();
    if (filters?.semester) params.append("semester", filters.semester);
    if (filters?.academicYear) params.append("academicYear", filters.academicYear);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<AssignmentsByLevelResponse>(`/api/course-assignments/by-level${query}`);
  },

  getAvailableCourses(filters?: { level?: number; semester?: string; academicYear?: string }): Promise<AvailableCoursesResponse> {
    const params = new URLSearchParams();
    if (filters?.level) params.append("level", String(filters.level));
    if (filters?.semester) params.append("semester", filters.semester);
    if (filters?.academicYear) params.append("academicYear", filters.academicYear);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<AvailableCoursesResponse>(`/api/course-assignments/available-courses${query}`);
  },

  assignCourse(body: {
    courseId: string;
    level: number;
    semester: string;
    academicYear: string;
  }): Promise<{ success: boolean; assignment: CourseAssignmentData }> {
    return request("/api/course-assignments", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  removeAssignment(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/course-assignments/${id}`, {
      method: "DELETE",
    });
  },
};

interface CourseResponse {
  success: boolean;
  course: {
    _id: string;
    code: string;
    name: string;
    day: string;
    time: string;
    room: string;
    credits: number;
    instructor: string;
    capacity: number;
    enrolledCount: number;
    major?: string;
    studentYear?: number;
    prerequisites?: string[];
    isActive: boolean;
  };
}

interface CoursesListResponse {
  success: boolean;
  courses: CourseResponse["course"][];
}

export const courseApi = {
  getAllCourses(): Promise<CoursesListResponse> {
    return request<CoursesListResponse>("/api/courses");
  },

  getCourseById(id: string): Promise<CourseResponse> {
    return request<CourseResponse>(`/api/courses/${id}`);
  },

  createCourse(body: {
    code: string;
    name: string;
    day: string;
    time: string;
    room: string;
    credits: number;
    instructor: string;
    capacity?: number;
    major?: string;
    studentYear?: number;
    prerequisites?: string[];
  }): Promise<CourseResponse> {
    return request<CourseResponse>("/api/courses", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateCourse(id: string, body: {
    code?: string;
    name?: string;
    day?: string;
    time?: string;
    room?: string;
    credits?: number;
    instructor?: string;
    capacity?: number;
    major?: string;
    studentYear?: number;
    prerequisites?: string[];
    isActive?: boolean;
  }): Promise<CourseResponse> {
    return request<CourseResponse>(`/api/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteCourse(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/courses/${id}`, {
      method: "DELETE",
    });
  },

  bulkUpdate(courses: any[]): Promise<{ success: boolean; message: string; courses: any[] }> {
    return request("/api/courses/bulk", {
      method: "PUT",
      body: JSON.stringify({ courses }),
    });
  },
};

export type { StudentFromApi, AuthResponse, MeResponse, HomeResponse, CourseFromApi, AuthorityCheckResponse, CourseResponse, CoursesListResponse };

