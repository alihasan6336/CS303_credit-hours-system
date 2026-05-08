const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

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
  photoUrl?: string;
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
  group?: string;
}

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
    confirmPassword: string;
    major: string;
    level: number;
    currentSemester: string;
    completedCreditHours: string;
    phoneNumber?: string;
    acceptTerms: boolean;
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
    totalSuperAdmins: number;
    totalEnrollments: number;
    recentLogins: number;
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
  page: number;
  limit: number;
  total: number;
  pages: number;
  count: number;
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

  getStudents(role?: string, page: number = 1, limit: number = 10, search?: string): Promise<StudentsListResponse> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) params.append('search', search);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<StudentsListResponse>(`/api/admin/students${query}`);
  },

  createAccount(body: {
    fullName: string;
    email: string;
    password: string;
    universityId?: string;
    major?: string;
    level?: number;
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
    level?: number;
    currentSemester?: string;
    completedCreditHours?: number;
    gpa?: number;
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

  updateAccount(id: string, body: any): Promise<{ success: boolean; user: any; message?: string }> {
    return request(`/api/admin/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
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
    group?: string;
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
    group?: string;
    type?: 'Lecture' | 'Lab';
    capacity: number;
    enrolledCount: number;
    major?: string;
    level?: number;
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
    group?: string;
    type?: 'Lecture' | 'Lab';
    capacity?: number;
    major?: string;
    level?: number;
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
    group?: string;
    type?: 'Lecture' | 'Lab';
    capacity?: number;
    major?: string;
    level?: number;
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

  enroll(courseId: string): Promise<{ success: boolean; message: string; seatsRemaining?: number }> {
    return request(`/api/courses/${courseId}/enroll`, {
      method: "POST",
    });
  },
  
  bulkEnroll(courseIds: string[], replaceExisting: boolean = false): Promise<{ success: boolean; message: string; enrolledCount: number }> {
    return request("/api/courses/bulk-enroll", {
      method: "POST",
      body: JSON.stringify({ courseIds, replaceExisting }),
    });
  },

  drop(courseId: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/courses/${courseId}/enroll`, {
      method: "DELETE",
    });
  },

  getMyCreditLimit(): Promise<{
    success: boolean;
    creditLimit: {
      minCredits: number;
      maxCredits: number;
      currentCredits: number;
      remainingCredits: number;
      reason: string;
      isSummer: boolean;
      isOverride: boolean;
      semester: string;
      gpa: number;
    };
  }> {
    return request("/api/courses/my-credit-limit");
  },
};

interface ScheduleResponse {
  success: boolean;
  message: string;
  schedule: {
    courses: any[];
    totalCredits: number;
    dayCount: number;
    uniqueDays: string[];
  };
}

export const scheduleApi = {
  generate(body?: { preferredCourseIds?: string[] }): Promise<ScheduleResponse> {
    return request<ScheduleResponse>("/api/schedule/generate", {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  recommend(): Promise<{ success: boolean; recommendations: any[] }> {
    return request("/api/schedule/recommend", {
      method: "POST",
    });
  },
};

interface PhotoResponse {
  success: boolean;
  photoUrl: string;
  message?: string;
}

export const photoApi = {
  upload(file: File): Promise<PhotoResponse> {
    const formData = new FormData();
    formData.append("photo", file);
    return fetch(`${API_BASE_URL}/api/photos/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
      body: formData,
    }).then((res) => res.json());
  },

  getMyPhoto(): Promise<PhotoResponse> {
    return request<PhotoResponse>("/api/photos/me");
  },

  deletePhoto(): Promise<PhotoResponse> {
    return request<PhotoResponse>("/api/photos/me", { method: "DELETE" });
  },
};

interface CreditLimitOverrideBody {
  min: number;
  max: number;
  isActive: boolean;
  reason?: string;
}

export const adminCreditLimitApi = {
  getStudentCreditLimit(studentId: string): Promise<{
    success: boolean;
    creditLimit: {
      minCredits: number;
      maxCredits: number;
      currentCredits: number;
      remainingCredits: number;
      reason: string;
      isSummer: boolean;
      isOverride: boolean;
      semester: string;
      gpa: number;
      override: { min: number; max: number; isActive: boolean; reason: string };
    };
  }> {
    return request(`/api/admin/users/${studentId}/credit-limit`);
  },

  updateCreditOverride(studentId: string, body: CreditLimitOverrideBody): Promise<{
    success: boolean;
    message: string;
    creditLimitOverride: { min: number; max: number; isActive: boolean; reason: string };
  }> {
    return request(`/api/admin/users/${studentId}/credit-override`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};

interface SettingsResponse {
  success: boolean;
  settings: {
    currentSemester: string;
    academicYear: string;
    isRegistrationOpen: boolean;
    tableVisible: boolean;
    enrollmentOpenLevels: number[];
    enrollmentStartDate?: string;
    enrollmentEndDate?: string;
  };
}

export const settingsApi = {
  getSettings(): Promise<SettingsResponse> {
    return request<SettingsResponse>("/api/settings");
  },

  updateSettings(body: {
    currentSemester?: string;
    academicYear?: string;
    isRegistrationOpen?: boolean;
    tableVisible?: boolean;
    enrollmentOpenLevels?: number[];
    enrollmentStartDate?: string;
    enrollmentEndDate?: string;
  }): Promise<SettingsResponse> {
    return request<SettingsResponse>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  openRegistration(levels?: number[]): Promise<{ success: boolean; message: string; isRegistrationOpen: boolean; enrollmentOpenLevels: number[] }> {
    return request("/api/settings/open-registration", {
      method: "POST",
      body: JSON.stringify({ levels }),
    });
  },

  closeRegistration(levels?: number[]): Promise<{ success: boolean; message: string; isRegistrationOpen: boolean; enrollmentOpenLevels: number[] }> {
    return request("/api/settings/close-registration", {
      method: "POST",
      body: JSON.stringify({ levels }),
    });
  },

  showTable(): Promise<{ success: boolean; message: string; tableVisible: boolean }> {
    return request("/api/settings/show-table", {
      method: "POST",
    });
  },

  hideTable(): Promise<{ success: boolean; message: string; tableVisible: boolean }> {
    return request("/api/settings/hide-table", {
      method: "POST",
    });
  },
};

export type { StudentFromApi, AuthResponse, MeResponse, HomeResponse, CourseFromApi, CourseResponse, CoursesListResponse };

