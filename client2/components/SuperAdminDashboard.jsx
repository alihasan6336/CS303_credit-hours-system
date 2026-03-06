import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useEffect, useState } from "react";
import { adminApi } from "../utils/api";

const { width } = Dimensions.get("window");

const LEVEL_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e"];
const COURSE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#6366f1", "#f97316"];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [studentsByLevel, setStudentsByLevel] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await adminApi.getStats();
      setStats(response.stats);
      setStudentsByLevel(response.studentsByLevel || []);
      setCourses(response.courses || []);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2554e8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Super Admin</Text>
          <Text style={styles.headerSub}>Dashboard Overview</Text>
        </View>
        <View style={styles.bellWrapper}>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>
      </View>

      <View style={styles.adminCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SA</Text>
        </View>
        <View>
          <Text style={styles.adminName}>Super Admin</Text>
          <Text style={styles.adminEmail}>Full Control Panel</Text>
        </View>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>👑 Super Admin</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { icon: "👥", number: stats?.totalStudents || 0, label: "Total Students", color: "#3b82f6" },
          { icon: "📚", number: stats?.totalCourses || 0, label: "Total Courses", color: "#8b5cf6" },
          { icon: "🛡️", number: stats?.totalAdmins || 0, label: "Admins", color: "#f59e0b" },
          { icon: "📝", number: stats?.totalEnrollments || 0, label: "Enrollments", color: "#22c55e" },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statNumber}>{s.number}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Students by Level</Text>
        {studentsByLevel.length === 0 ? (
          <Text style={styles.emptyText}>No student data available</Text>
        ) : (
          studentsByLevel.map((item, i) => (
            <View key={i} style={styles.levelRow}>
              <Text style={styles.levelLabel}>Lvl {item.level}</Text>
              <View style={styles.levelBarBg}>
                <View style={[styles.levelBarFill, {
                  width: `${((item.count / (stats?.totalStudents || 1)) * 100)}%`,
                  backgroundColor: LEVEL_COLORS[i % LEVEL_COLORS.length],
                }]} />
              </View>
              <Text style={[styles.levelCount, { color: LEVEL_COLORS[i % LEVEL_COLORS.length] }]}>{item.count}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Course Enrollment</Text>
        {courses.length === 0 ? (
          <Text style={styles.emptyText}>No courses available</Text>
        ) : (
          courses.map((course, i) => {
            const pct = Math.round((course.enrolled / course.capacity) * 100);
            const color = COURSE_COLORS[i % COURSE_COLORS.length];
            return (
              <View key={i} style={[styles.courseRow, i !== courses.length - 1 && styles.courseRowBorder]}>
                <View style={styles.courseRowTop}>
                  <Text style={[styles.courseCode, { color }]}>{course.code}</Text>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseCount}>{course.enrolled}/{course.capacity}</Text>
                </View>
                <View style={styles.levelBarBg}>
                  <View style={[styles.levelBarFill, {
                    width: `${pct}%`,
                    backgroundColor: pct >= 90 ? "#ef4444" : color,
                  }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 14, color: "#ef4444", marginBottom: 16, textAlign: "center" },
  retryBtn: { backgroundColor: "#2554e8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: "#fff", fontWeight: "600" },
  emptyText: { color: "#888", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111" },
  headerSub: { fontSize: 13, color: "#888", marginTop: 2 },
  bellWrapper: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f0f2f5", alignItems: "center", justifyContent: "center",
  },
  bellIcon: { fontSize: 18 },
  adminCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a2e", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#f59e0b", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  adminName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  adminEmail: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  adminBadge: {
    marginLeft: "auto", backgroundColor: "#f59e0b20",
    borderWidth: 1, borderColor: "#f59e0b",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  adminBadgeText: { color: "#f59e0b", fontSize: 11, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 12, marginTop: 16, gap: 8,
  },
  statCard: {
    width: (width - 40) / 2, backgroundColor: "#fff",
    borderRadius: 14, padding: 16, borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statNumber: { fontSize: 26, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  card: {
    backgroundColor: "#fff", borderRadius: 16,
    marginHorizontal: 16, marginTop: 16, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 16 },
  levelRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  levelLabel: { width: 50, fontSize: 12, fontWeight: "600", color: "#555" },
  levelBarBg: { flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  levelBarFill: { height: 8, borderRadius: 4 },
  levelCount: { width: 35, fontSize: 12, fontWeight: "700", textAlign: "right" },
  courseRow: { paddingVertical: 12 },
  courseRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  courseRowTop: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  courseCode: { fontSize: 12, fontWeight: "700" },
  courseName: { flex: 1, fontSize: 13, color: "#333", fontWeight: "600" },
  courseCount: { fontSize: 12, color: "#888", fontWeight: "600" },
});
