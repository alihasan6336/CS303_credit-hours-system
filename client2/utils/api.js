import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
const API_BASE_URL = Platform.OS === "android" ? "http://192.168.1.6:5000" : "http://localhost:5000";

async function request(path, options = {}) {
    const token = await AsyncStorage.getItem("authToken");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        // If the server returns HTML (e.g. 404 or 500 error page), res.json() fails
        const text = await res.text();
        console.log("Server returned non-JSON response:", text.slice(0, 200));
        throw new Error(`Server error (${res.status}): The server returned an unexpected response. Please check if the backend is running correctly.`);
    }

    if (!res.ok) {
        console.log("API Error Response:", JSON.stringify(data));
        let errorMessage = data.message || "Something went wrong";
        if (data.errors && typeof data.errors === "object") {
            const firstKey = Object.keys(data.errors)[0];
            if (firstKey) {
                errorMessage = data.errors[firstKey];
            }
        }
        throw new Error(errorMessage);
    }

    return data;
}

export const authApi = {
    async login({ email, password, rememberMe = false }) {
        const data = await request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password, rememberMe }),
        });
        if (data.token) {
            await AsyncStorage.setItem("authToken", data.token);
        }
        if (data.student) {
            await AsyncStorage.setItem("student", JSON.stringify(data.student));
        }
        return data;
    },

    async register(payload) {
        const data = await request("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        if (data.token) {
            await AsyncStorage.setItem("authToken", data.token);
        }
        if (data.student) {
            await AsyncStorage.setItem("student", JSON.stringify(data.student));
        }
        return data;
    },

    home() {
        return request("/api/home");
    },

    async logout() {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("student");
    },
};

export const courseApi = {
    getAll() {
        return request("/api/courses");
    },

    enroll(id) {
        return request(`/api/courses/${id}/enroll`, { method: "POST" });
    },

    drop(id) {
        return request(`/api/courses/${id}/enroll`, { method: "DELETE" });
    },

    create(payload) {
        return request("/api/courses", { method: "POST", body: JSON.stringify(payload) });
    },
};

export const adminApi = {
    getStats() {
        return request("/api/admin/stats");
    },

    getStudents(role) {
        const query = role ? `?role=${role}` : "";
        return request(`/api/admin/students${query}`);
    },

    createAccount(payload) {
        return request("/api/admin/accounts", { method: "POST", body: JSON.stringify(payload) });
    },

    deleteAccount(id) {
        return request(`/api/admin/accounts/${id}`, { method: "DELETE" });
    },

    getEnrollments() {
        return request("/api/admin/enrollments");
    },

    enroll(studentId, courseId) {
        return request("/api/admin/enrollments", { method: "POST", body: JSON.stringify({ studentId, courseId }) });
    },

    unenroll(enrollmentId) {
        return request(`/api/admin/enrollments/${enrollmentId}`, { method: "DELETE" });
    },
};
