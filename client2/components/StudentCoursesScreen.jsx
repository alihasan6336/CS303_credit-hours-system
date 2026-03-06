import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useEffect, useState } from "react";
import { authApi, courseApi } from "../utils/api";

const { width } = Dimensions.get("window");

export default function StudentCoursesScreen({ onNavigateDashboard }) {
    const [activeTab, setActiveTab] = useState("available"); 
    const [availableCourses, setAvailableCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState("");

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            setError("");

            const responseAll = await courseApi.getAll();
            setAvailableCourses(responseAll.courses || []);

            const responseHome = await authApi.home();
            setMyCourses(responseHome.student?.courses || []);

        } catch (err) {
            setError(err.message || "Failed to load courses");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleEnroll = async (courseId) => {
        try {
            setActionLoadingId(courseId);
            await courseApi.enroll(courseId);
            Alert.alert("Success", "Successfully enrolled in the course!");
            await fetchCourses();
        } catch (err) {
            Alert.alert("Enrollment Failed", err.message || "You cannot enroll in this course.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDrop = async (courseId) => {
        Alert.alert(
            "Drop Course",
            "Are you sure you want to drop this course?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Drop",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setActionLoadingId(courseId);
                            await courseApi.drop(courseId);
                            Alert.alert("Success", "Course dropped successfully.");
                            await fetchCourses();
                        } catch (err) {
                            Alert.alert("Drop Failed", err.message || "Failed to drop course.");
                        } finally {
                            setActionLoadingId(null);
                        }
                    },
                },
            ]
        );
    };

    const isEnrolled = (courseCode) => {
        return myCourses.some(myCode => myCode.code === courseCode);
    };

    return (
        <View style={styles.container}>
            {/* HEADER TABS */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Course Registration</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === "available" && styles.tabBtnActive]}
                        onPress={() => setActiveTab("available")}
                    >
                        <Text style={[styles.tabText, activeTab === "available" && styles.tabTextActive]}>
                            Available Courses
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === "my_courses" && styles.tabBtnActive]}
                        onPress={() => setActiveTab("my_courses")}
                    >
                        <Text style={[styles.tabText, activeTab === "my_courses" && styles.tabTextActive]}>
                            My Courses
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* CONTENT */}
            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2554e8" />
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchCourses}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {activeTab === "available" && (
                        <View>
                            {availableCourses.map((course) => {
                                const enrolled = isEnrolled(course.code);
                                const isFull = course.enrolledCount >= course.capacity;

                                return (
                                    <View key={course._id} style={styles.courseCard}>
                                        <View style={styles.courseTop}>
                                            <Text style={styles.courseCode}>{course.code}</Text>
                                            {course.day && (
                                                <View style={[styles.dayBadge, { backgroundColor: "#4f46e520", borderColor: "#4f46e5" }]}>
                                                    <Text style={[styles.dayText, { color: "#4f46e5" }]}>{course.day}</Text>
                                                </View>
                                            )}
                                            <View style={styles.creditBadge}>
                                                <Text style={styles.creditText}>{course.credits} cr</Text>
                                            </View>
                                        </View>

                                        <Text style={styles.courseName}>{course.name}</Text>
                                        <Text style={styles.courseInstructor}>👤 {course.instructor}</Text>

                                        <View style={styles.courseBottom}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.courseDetail}>🕐 {course.time}</Text>
                                                <Text style={styles.courseDetail}>📍 {course.room}</Text>
                                                <Text style={styles.courseDetail}>👥 {course.enrolledCount}/{course.capacity} filled</Text>
                                            </View>

                                            {enrolled ? (
                                                <View style={[styles.actionBtn, styles.actionBtnDisabled]}>
                                                    <Text style={styles.actionBtnTextDisabled}>Enrolled</Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, (isFull || actionLoadingId === course._id) && styles.actionBtnDisabled]}
                                                    disabled={isFull || actionLoadingId === course._id}
                                                    onPress={() => handleEnroll(course._id)}
                                                >
                                                    {actionLoadingId === course._id ? (
                                                        <ActivityIndicator size="small" color="#fff" />
                                                    ) : (
                                                        <Text style={[styles.actionBtnText, isFull && styles.actionBtnTextDisabled]}>
                                                            {isFull ? "Class Full" : "Enroll"}
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                            {availableCourses.length === 0 && (
                                <Text style={styles.emptyText}>No available courses at the moment.</Text>
                            )}
                        </View>
                    )}

                    {activeTab === "my_courses" && (
                        <View>
                            {myCourses.map((course, index) => {
                               const originalCourse = availableCourses.find(c => c.code === course.code);

                                return (
                                    <View key={index} style={styles.courseCard}>
                                        <View style={styles.courseTop}>
                                            <Text style={styles.courseCode}>{course.code}</Text>
                                            {course.day && (
                                                <View style={[styles.dayBadge, { backgroundColor: "#22c55e20", borderColor: "#22c55e" }]}>
                                                    <Text style={[styles.dayText, { color: "#22c55e" }]}>{course.day}</Text>
                                                </View>
                                            )}
                                            <View style={styles.creditBadge}>
                                                <Text style={styles.creditText}>{course.credits} cr</Text>
                                            </View>
                                        </View>

                                        <Text style={styles.courseName}>{course.name}</Text>
                                        <Text style={styles.courseInstructor}>👤 {course.instructor}</Text>

                                        <View style={styles.courseBottom}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.courseDetail}>🕐 {course.time}</Text>
                                                <Text style={styles.courseDetail}>📍 {course.room}</Text>
                                            </View>

                                            {originalCourse ? (
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, styles.actionBtnDanger]}
                                                    disabled={actionLoadingId === originalCourse._id}
                                                    onPress={() => handleDrop(originalCourse._id)}
                                                >
                                                    {actionLoadingId === originalCourse._id ? (
                                                        <ActivityIndicator size="small" color="#ef4444" />
                                                    ) : (
                                                        <Text style={styles.actionBtnTextDanger}>Drop Course</Text>
                                                    )}
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            })}
                            {myCourses.length === 0 && (
                                <Text style={styles.emptyText}>You haven't enrolled in any courses yet.</Text>
                            )}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f2f5",
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111",
        marginBottom: 16,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#f0f2f5",
        padding: 4,
        borderRadius: 10,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 8,
    },
    tabBtnActive: {
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    tabTextActive: {
        color: "#2554e8",
    },
    centerBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        fontSize: 14,
        color: "#ef4444",
        marginBottom: 16,
        textAlign: "center",
    },
    retryBtn: {
        backgroundColor: "#2554e8",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryBtnText: {
        color: "#fff",
        fontWeight: "600",
    },
    scrollContent: {
        padding: 16,
    },
    emptyText: {
        textAlign: "center",
        color: "#888",
        marginTop: 40,
        fontSize: 15,
    },

    courseCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    courseTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    courseCode: {
        fontSize: 14,
        fontWeight: "800",
        color: "#2554e8",
    },
    dayBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
    },
    dayText: { fontSize: 11, fontWeight: "700" },
    creditBadge: {
        marginLeft: "auto",
        backgroundColor: "#f0f2f5",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    creditText: { fontSize: 11, fontWeight: "700", color: "#555" },
    courseName: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 6 },
    courseInstructor: { fontSize: 13, color: "#777", marginBottom: 12 },
    courseBottom: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    courseDetail: { fontSize: 13, color: "#555", marginBottom: 4 },

    actionBtn: {
        backgroundColor: "#2554e8",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 90,
        alignItems: "center",
    },
    actionBtnDisabled: {
        backgroundColor: "#e5e7eb",
    },
    actionBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    actionBtnTextDisabled: {
        color: "#9ca3af",
        fontWeight: "700",
        fontSize: 13,
    },
    actionBtnDanger: {
        backgroundColor: "#fef2f2",
        borderWidth: 1.5,
        borderColor: "#fecaca",
    },
    actionBtnTextDanger: {
        color: "#ef4444",
        fontWeight: "700",
        fontSize: 13,
    },
});
