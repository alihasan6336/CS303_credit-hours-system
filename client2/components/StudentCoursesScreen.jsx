import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useEffect, useState } from "react";
import { courseApi, settingsApi } from "../utils/api";

const { width } = Dimensions.get("window");

export default function StudentCoursesScreen({ onNavigateDashboard }) {
    const [activeTab, setActiveTab] = useState("available");
    const [availableCourses, setAvailableCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isRegistrationOpenForMe, setIsRegistrationOpenForMe] = useState(false);

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            setError("");

            const responseAll = await courseApi.getAll();
            const responseEnrolled = await courseApi.getMyCourses();

            const passedCoursesIds = (responseEnrolled.data || [])
                .filter(e => e.status === 'completed' && e.grade >= (e.course?.passingGrade || 50))
                .map(e => e.course?._id);

            const settingsRes = await settingsApi.getSettings();
            const settings = settingsRes.settings || {};
            const openLevels = settings.enrollmentOpenLevels || [];
            const isGlobalOpen = settings.isRegistrationOpen;

            const studentLevel = parseInt(responseEnrolled.student?.level || 1, 10);
            const isOpen = isGlobalOpen && openLevels.includes(studentLevel);
            setIsRegistrationOpenForMe(isOpen);

            // Auto-switch tab if available is closed
            if (!isOpen && activeTab === "available") {
                setActiveTab("my_courses");
            }

            const filteredAvailable = (responseAll.courses || []).filter(c =>
                !passedCoursesIds.includes(c._id) &&
                (parseInt(c.level || 1, 10) <= studentLevel)
            );
            setAvailableCourses(filteredAvailable);

            const enrolledData = (responseEnrolled.data || [])
                .filter(e => e.status === 'active')
                .map(e => ({
                    _id: e.course?._id,
                    code: e.course?.code,
                    name: e.course?.name,
                    day: e.course?.day,
                    time: e.course?.time,
                    room: e.course?.room,
                    credits: e.course?.credits,
                    instructor: e.course?.instructor,
                    courseType: e.course?.type || e.course?.courseType,
                    status: e.status,
                }));
            setMyCourses(enrolledData);

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
            const course = availableCourses.find(c => String(c._id) === String(courseId));
            if (!course) {
                Alert.alert("Error", "Selected course not found.");
                return;
            }

            const toMinutes = (t) => {
                if (!t || typeof t !== "string") return 0;
                const parts = t.trim().split(":");
                const h = parseInt(parts[0], 10) || 0;
                const m = parseInt(parts[1], 10) || 0;
                return h * 60 + m;
            };

            const courseDay = (course.day || "").toString().trim().toLowerCase();
            const courseTime = (course.time || "").toString().trim();
            const newTimes = courseTime.split(/[^\d:]+/).filter(Boolean);

            if (courseDay && newTimes.length >= 2) {
                const nS = toMinutes(newTimes[0]);
                const nE = toMinutes(newTimes[1]);

                for (const enrolled of myCourses) {
                    const enrolledDay = (enrolled.day || "").toString().trim().toLowerCase();
                    const enrolledTime = (enrolled.time || "").toString().trim();
                    const exTimes = enrolledTime.split(/[^\d:]+/).filter(Boolean);

                    if (enrolledDay === courseDay && exTimes.length >= 2) {
                        const eS = toMinutes(exTimes[0]);
                        const eE = toMinutes(exTimes[1]);

                        if (nS < eE && eS < nE) {
                            Alert.alert(
                                "Schedule Conflict",
                                `Conflict with ${enrolled.code} (${enrolled.name}) on ${course.day} at ${enrolled.time}.`,
                                [{ text: "OK" }]
                            );
                            return;
                        }
                    }
                }
            }

            const currentCH = myCourses.reduce((sum, c) => sum + (c.credits || 0), 0);
            if (currentCH + (course.credits || 0) > 19) {
                Alert.alert("Limit Exceeded", "You cannot enroll in more than 19 credit hours per semester.");
                return;
            }

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
                    {isRegistrationOpenForMe && (
                        <TouchableOpacity
                            style={[styles.tabBtn, activeTab === "available" && styles.tabBtnActive]}
                            onPress={() => setActiveTab("available")}
                        >
                            <Text style={[styles.tabText, activeTab === "available" && styles.tabTextActive]}>
                                Available Courses
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.tabBtn, (activeTab === "my_courses" || !isRegistrationOpenForMe) && styles.tabBtnActive]}
                        onPress={() => setActiveTab("my_courses")}
                    >
                        <Text style={[styles.tabText, (activeTab === "my_courses" || !isRegistrationOpenForMe) && styles.tabTextActive]}>
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
                    <View style={styles.searchBarContainer}>
                        <TextInput
                            style={styles.searchBar}
                            placeholder="Search courses by code or name..."
                            placeholderTextColor="#94a3b8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {!isRegistrationOpenForMe && (
                        <View style={styles.closedBanner}>
                            <Text style={styles.closedIconSmall}>🔒</Text>
                            <Text style={styles.closedTextSmall}>
                                Course registration is currently closed for your year level.
                            </Text>
                        </View>
                    )}

                    {activeTab === "available" && isRegistrationOpenForMe && (
                        <View>
                            {availableCourses
                                .filter(c =>
                                    c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((course) => {
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
                                                {(course.type || course.courseType) && (
                                                    <View style={[styles.typeBadge, { backgroundColor: (course.type || course.courseType) === 'Online' ? '#dcfce7' : '#fef3c7' }]}>
                                                        <Text style={[styles.typeText, { color: (course.type || course.courseType) === 'Online' ? '#166534' : '#92400e' }]}>{course.type || course.courseType}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <Text style={styles.courseName}>{course.name}</Text>
                                            <Text style={styles.courseInstructor}>👤 {course.instructor}</Text>

                                            <View style={styles.courseBottom}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.courseDetail}>🕐 {course.time}</Text>
                                                    <Text style={styles.courseDetail}>📍 {course.room}</Text>
                                                    <Text style={styles.courseDetail}>👥 {course.enrolledCount}/{course.capacity} filled</Text>
                                                    {course.prerequisites?.length > 0 && (
                                                        <Text style={styles.coursePrereq}>Pre: {course.prerequisites.join(", ")}</Text>
                                                    )}
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
                            {myCourses
                                .filter(c =>
                                    c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((course, index) => {
                                    return (
                                        <View key={course._id || index} style={styles.courseCard}>
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
                                                {course.courseType && (
                                                    <View style={[styles.typeBadge, { backgroundColor: course.courseType === 'Online' ? '#dcfce7' : '#fef3c7' }]}>
                                                        <Text style={[styles.typeText, { color: course.courseType === 'Online' ? '#166534' : '#92400e' }]}>{course.courseType}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <Text style={styles.courseName}>{course.name}</Text>
                                            <Text style={styles.courseInstructor}>👤 {course.instructor}</Text>

                                            <View style={styles.courseBottom}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.courseDetail}>🕐 {course.time}</Text>
                                                    <Text style={styles.courseDetail}>📍 {course.room}</Text>
                                                </View>

                                                {isRegistrationOpenForMe && (
                                                    <TouchableOpacity
                                                        style={[styles.actionBtn, styles.actionBtnDanger]}
                                                        disabled={actionLoadingId === course._id}
                                                        onPress={() => handleDrop(course._id)}
                                                    >
                                                        {actionLoadingId === course._id ? (
                                                            <ActivityIndicator size="small" color="#ef4444" />
                                                        ) : (
                                                            <Text style={styles.actionBtnTextDanger}>Drop Course</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                )}
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
    searchBarContainer: {
        marginBottom: 16,
    },
    searchBar: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: "#1e293b",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
    typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
    typeText: { fontSize: 9, fontWeight: "800" },
    courseName: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 6 },
    courseInstructor: { fontSize: 13, color: "#777", marginBottom: 12 },
    courseBottom: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
    },
    courseDetail: { fontSize: 13, color: "#555", marginBottom: 4 },
    coursePrereq: { fontSize: 12, color: "#8b5cf6", fontWeight: "700", marginTop: 2 },

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
    // Registration Closed UI
    closedBanner: {
        backgroundColor: "#fef2f2",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#fee2e2",
    },
    closedIconSmall: { fontSize: 20, marginRight: 12 },
    closedTextSmall: { fontSize: 13, color: "#991b1b", fontWeight: "600", flex: 1 },
});
