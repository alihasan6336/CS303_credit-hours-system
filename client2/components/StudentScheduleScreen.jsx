import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useEffect, useState } from "react";
import { authApi } from "../utils/api";

const { width } = Dimensions.get("window");

const DAYS_OF_WEEK = ["saturday","Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"];

const DAY_COLORS = {
    Sunday: "#ef4444",    
    Monday: "#3b82f6",    
    Tuesday: "#22c55e",   
    Wednesday: "#f59e0b", 
    Thursday: "#8b5cf6",  
    Saturday: "#ff69b4", 
};

export default function StudentScheduleScreen() {
    const [student, setStudent] = useState(null);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeDay, setActiveDay] = useState("All");

    const fetchSchedule = async () => {
        try {
            setIsLoading(true);
            setError("");

            const responseHome = await authApi.home();
            setStudent(responseHome.student);
            setCourses(responseHome.student?.courses || []);
        } catch (err) {
            setError(err.message || "Failed to load schedule");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const filteredCourses = courses.filter(
        (course) => activeDay === "All" || course.day === activeDay
    );

    const groupedCourses = DAYS_OF_WEEK.map(day => ({
        day,
        courses: filteredCourses.filter(c => c.day === day).sort((a, b) => a.time.localeCompare(b.time))
    })).filter(group => group.courses.length > 0);

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Schedule</Text>
                <Text style={styles.headerSub}>
                    {student ? `${student.semester} — ${courses.length} Courses` : "Loading..."}
                </Text>

                {/* DAY FILTER CHIPS */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    <TouchableOpacity
                        style={[styles.chip, activeDay === "All" && styles.chipActive]}
                        onPress={() => setActiveDay("All")}
                    >
                        <Text style={[styles.chipText, activeDay === "All" && styles.chipTextActive]}>
                            All Week
                        </Text>
                    </TouchableOpacity>
                    {DAYS_OF_WEEK.map((day) => (
                        <TouchableOpacity
                            key={day}
                            style={[
                                styles.chip,
                                activeDay === day && { backgroundColor: DAY_COLORS[day], borderColor: DAY_COLORS[day] }
                            ]}
                            onPress={() => setActiveDay(day)}
                        >
                            <Text style={[
                                styles.chipText,
                                activeDay === day && { color: "#fff" }
                            ]}>
                                {day}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* CONTENT */}
            {isLoading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2554e8" />
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchSchedule}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : courses.length === 0 ? (
                <View style={styles.centerBox}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyTitle}>No Classes Scheduled</Text>
                    <Text style={styles.emptySub}>You haven't enrolled in any courses for this semester yet.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {groupedCourses.map((group) => (
                        <View key={group.day} style={styles.dayGroup}>
                            {activeDay === "All" && (
                                <View style={styles.dayHeader}>
                                    <View style={[styles.dayDot, { backgroundColor: DAY_COLORS[group.day] }]} />
                                    <Text style={styles.dayTitle}>{group.day}</Text>
                                </View>
                            )}

                            {group.courses.map((course, index) => {
                                const classColor = DAY_COLORS[course.day] || "#4f46e5";

                                return (
                                    <View key={`${course.code}-${index}`} style={styles.timelineItem}>
                                        <View style={styles.timelineLeft}>
                                            <Text style={styles.timeText}>{course.time.split("–")[0]?.trim() || course.time}</Text>
                                            <View style={[styles.timelineLine, { backgroundColor: classColor + "40" }]} />
                                        </View>

                                        <View style={[styles.courseCard, { borderLeftColor: classColor }]}>
                                            <View style={styles.courseTop}>
                                                <Text style={[styles.courseCode, { color: classColor }]}>{course.code}</Text>
                                                <View style={styles.creditBadge}>
                                                    <Text style={styles.creditText}>{course.credits} cr</Text>
                                                </View>
                                            </View>

                                            <Text style={styles.courseName}>{course.name}</Text>
                                            <Text style={styles.courseInstructor}>👤 {course.instructor}</Text>

                                            <View style={styles.courseBottom}>
                                                <Text style={styles.courseDetail}>🕐 {course.time}</Text>
                                                <Text style={styles.courseDetail}>📍 Room {course.room}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))}

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
        backgroundColor: "#fff",
        paddingTop: 56,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111",
        paddingHorizontal: 20,
    },
    headerSub: {
        fontSize: 14,
        color: "#666",
        paddingHorizontal: 20,
        marginTop: 4,
        marginBottom: 16,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    chipActive: {
        backgroundColor: "#2554e8",
        borderColor: "#2554e8",
    },
    chipText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
    },
    chipTextActive: {
        color: "#fff",
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
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        maxWidth: 250,
    },
    scrollContent: {
        padding: 16,
    },

    dayGroup: {
        marginBottom: 24,
    },
    dayHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    dayDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dayTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111",
    },
    timelineItem: {
        flexDirection: "row",
        marginBottom: 16,
    },
    timelineLeft: {
        width: 60,
        alignItems: "center",
    },
    timeText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#555",
        marginBottom: 4,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        borderRadius: 1,
    },
    courseCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginLeft: 12,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    courseTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    courseCode: {
        fontSize: 14,
        fontWeight: "800",
    },
    creditBadge: {
        backgroundColor: "#f0f2f5",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    creditText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#555",
    },
    courseName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111",
        marginBottom: 4,
    },
    courseInstructor: {
        fontSize: 13,
        color: "#777",
        marginBottom: 10,
    },
    courseBottom: {
        flexDirection: "row",
        gap: 16,
    },
    courseDetail: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
});
