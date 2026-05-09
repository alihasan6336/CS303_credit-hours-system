import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
const API_BASE_URL = process.env.EXPO_PUBLIC_VITE_API_BASE_URL || (Platform.OS === "android" ? "http://192.168.1.47:5000" : "http://localhost:5000");


async function request(path, options = {}) {
    const token = await AsyncStorage.getItem("authToken");

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };


    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
        });

        let data;
        let text = await res.text();

        // Handle SSE (Server-Sent Events) formatted response if it arrives as a single string
        // This often happens in mobile environments where streaming is handled differently.
        if (text.includes('data: {')) {
            const lines = text.split('\n');
            const successLine = lines.find(l => l.includes('"type":"success"'));
            if (successLine) {
                text = successLine.replace('data: ', '').trim();
            } else {
                // Try to find any data line if success isn't there yet
                const anyDataLine = lines.find(l => l.startsWith('data: '));
                if (anyDataLine) text = anyDataLine.replace('data: ', '').trim();
            }
        }

        try {
            data = JSON.parse(text);
        } catch (e) {
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
            if (res.status === 401) {
                // If token is invalid (e.g. DB wiped), clear session
                await authApi.logout();
                // Emit event for UI to reset state
                if (global.onUnauthorized) global.onUnauthorized();
            }
            throw new Error(errorMessage);
        }

        return data;
    } catch (err) {
        throw err;
    }
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

    getMyCourses() {
        return request("/api/courses/my-courses");
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

    update(id, payload) {
        return request(`/api/courses/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    },

    bulkEnroll(courseIds, replaceExisting = false) {
        return request("/api/courses/bulk-enroll", {
            method: "POST",
            body: JSON.stringify({ courseIds, replaceExisting }),
        });
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

    getUserById(id) {
        return request(`/api/admin/users/${id}`);
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

    getStudentAcademicRecord(id) {
        return request(`/api/admin/users/${id}/record`);
    },

    toggleAccountStatus(id) {
        return request(`/api/admin/users/${id}/toggle`, { method: "PATCH" });
    },

    updateGrade(enrollmentId, grade) {
        return request(`/api/admin/enrollments/${enrollmentId}/grade`, {
            method: "PATCH",
            body: JSON.stringify({ grade }),
        });
    },

    updateAccount(id, payload) {
        return request(`/api/admin/accounts/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    },

    updateRole(id, payload) {
        return request(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    },
};

export const gpaApi = {
    getBreakdown() {
        return request("/api/gpa/me");
    },

    recalculate() {
        return request("/api/gpa/recalculate", { method: "POST" });
    },

    predict(potentialGrades) {
        return request("/api/gpa/predict", {
            method: "POST",
            body: JSON.stringify({ potentialGrades }),
        });
    },
};

export const scheduleApi = {
    generate(body) {
        return request("/api/schedule/generate", {
            method: "POST",
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    recommend() {
        return request("/api/schedule/recommend", {
            method: "POST",
        });
    },
};

export const userApi = {
    async uploadAvatar(userId, imageUri) {
        const token = await AsyncStorage.getItem("authToken");
        const formData = new FormData();
        const fileName = imageUri.split("/").pop();
        const fileType = fileName.split(".").pop();
        formData.append("photo", {
            uri: imageUri,
            name: fileName,
            type: `image/${fileType}`,
        });
        const res = await fetch(`${API_BASE_URL}/api/photos/upload`, {
            method: "POST", // Changed from PATCH to POST to match router.post('/upload')
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload failed");
        return data;
    },

    async getAvatar(userId) {
        return request(`/api/photos/me`);
    },
};

export const settingsApi = {
    getSettings() {
        return request("/api/settings");
    },

    updateSettings(body) {
        return request("/api/settings", {
            method: "PUT",
            body: JSON.stringify(body),
        });
    },

    openRegistration(levels) {
        return request("/api/settings/open-registration", {
            method: "POST",
            body: JSON.stringify({ levels }),
        });
    },

    closeRegistration(levels) {
        return request("/api/settings/close-registration", {
            method: "POST",
            body: JSON.stringify({ levels }),
        });
    },

    showTable() {
        return request("/api/settings/show-table", {
            method: "POST",
        });
    },

    hideTable() {
        return request("/api/settings/hide-table", {
            method: "POST",
        });
    },
};
