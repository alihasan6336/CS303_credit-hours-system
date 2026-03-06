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

// Shape returned by GET /api/home  (homeController.ts)
interface HomeStudentPayload {
  name: string;           // student.fullName
  id: string;             // student.universityId
  level: number;
  gpa: number;
  completedHours: number; // student.completedCreditHours
  major: string;
  semester: string;       // e.g. "Fall 2025" (already formatted by server)
  courses: CourseFromApi[];
}

interface HomeResponse {
  success: boolean;
  student: HomeStudentPayload;
}

interface CourseFromApi {
  _id?: string;
  code: string;
  name: string;
  day: string;
  time: string;
  room: string;
  credits: number;
  instructor: string;
  capacity?: number;
  enrolledCount?: number;
}

interface CoursesListResponse {
  success: boolean;
  courses: CourseFromApi[];
}

interface MyCoursesResponse {
  success: boolean;
  count: number;
  data: Array<{ course: CourseFromApi; semester: string; academicYear: string }>;
}

interface EnrollResponse {
  success: boolean;
  message: string;
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
    confirmPassword: string;
    major: string;
    academicYear: string;
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

export const courseApi = {
  /** GET /api/courses — all active courses */
  list(): Promise<CoursesListResponse> {
    return request<CoursesListResponse>("/api/courses");
  },

  /** GET /api/courses/my-courses — student's enrolled courses */
  myCourses(): Promise<MyCoursesResponse> {
    return request<MyCoursesResponse>("/api/courses/my-courses");
  },

  /** POST /api/courses/:id/enroll */
  enroll(courseId: string): Promise<EnrollResponse> {
    return request<EnrollResponse>(`/api/courses/${courseId}/enroll`, {
      method: "POST",
    });
  },

  /** DELETE /api/courses/:id/enroll */
  drop(courseId: string): Promise<EnrollResponse> {
    return request<EnrollResponse>(`/api/courses/${courseId}/enroll`, {
      method: "DELETE",
    });
  },
};

export type {
  StudentFromApi,
  AuthResponse,
  MeResponse,
  HomeResponse,
  HomeStudentPayload,
  CourseFromApi,
  CoursesListResponse,
  MyCoursesResponse,
  EnrollResponse,
};

