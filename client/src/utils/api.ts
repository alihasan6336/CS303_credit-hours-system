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

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
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

  me(token: string): Promise<{ success: boolean; student: StudentFromApi }> {
    return request<{ success: boolean; student: StudentFromApi }>(
      "/api/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  },
};

export type { StudentFromApi, AuthResponse };

