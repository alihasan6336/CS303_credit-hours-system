const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("authToken");

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

// Course API for ManageCourses page
interface CourseData {
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
  prerequisite?: string;
}

interface CoursesListResponse {
  success: boolean;
  courses: CourseData[];
}

interface CreateCourseResponse {
  success: boolean;
  course: CourseData;
  message?: string;
}

export const courseApi = {
  getAllCourses(): Promise<CoursesListResponse> {
    return request<CoursesListResponse>("/api/courses");
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
    prerequisite?: string;
  }): Promise<CreateCourseResponse> {
    return request<CreateCourseResponse>("/api/courses", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateCourse(id: string, body: {
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
    prerequisite?: string;
  }): Promise<CreateCourseResponse> {
    return request<CreateCourseResponse>(`/api/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  bulkUpdateCourses(courses: Array<{
    _id: string;
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
    prerequisite?: string;
  }>): Promise<{ success: boolean; message: string; courses: CourseData[] }> {
    return request("/api/courses/bulk", {
      method: "PUT",
      body: JSON.stringify({ courses }),
    });
  },

  deleteCourse(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/courses/${id}`, {
      method: "DELETE",
    });
  },
};

export type { StudentFromApi, AuthResponse, MeResponse, HomeResponse, CourseFromApi };

