import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

const { width } = Dimensions.get("window");

const stats = {
  totalStudents: 340,
  totalCourses: 24,
  totalAdmins: 5,
  totalGroups: 48,
};

const studentsByLevel = [
  { level: "Year 1", count: 102, color: "#3b82f6" },
  { level: "Year 2", count: 89, color: "#8b5cf6" },
  { level: "Year 3", count: 85, color: "#f59e0b" },
  { level: "Year 4", count: 64, color: "#22c55e" },
];

const popularCourses = [
  { code: "CS303", name: "Software Engineering", enrolled: 45, capacity: 50, color: "#3b82f6" },
  { code: "CS311", name: "Database Systems", enrolled: 38, capacity: 40, color: "#8b5cf6" },
  { code: "CS321", name: "Computer Networks", enrolled: 40, capacity: 45, color: "#f59e0b" },
  { code: "CS101", name: "Intro to Programming", enrolled: 98, capacity: 100, color: "#22c55e" },
];

export default function SuperAdminDashboard() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Super Admin</Text>
          <Text style={styles.headerSub}>Spring 2025 — Full Control</Text>
        </View>
        <View style={styles.bellWrapper}>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>
      </View>

      {/* ADMIN CARD */}
      <View style={styles.adminCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SA</Text>
        </View>
        <View>
          <Text style={styles.adminName}>Super Admin</Text>
          <Text style={styles.adminEmail}>superadmin@sci.com</Text>
        </View>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>👑 Super Admin</Text>
        </View>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsGrid}>
        {[
          { icon: "👥", number: stats.totalStudents, label: "Total Students", color: "#3b82f6" },
          { icon: "📚", number: stats.totalCourses, label: "Total Courses", color: "#8b5cf6" },
          { icon: "🛡️", number: stats.totalAdmins, label: "Admins", color: "#f59e0b" },
          { icon: "👨‍👩‍👧‍👦", number: stats.totalGroups, label: "Groups", color: "#22c55e" },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statNumber}>{s.number}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* STUDENTS BY LEVEL */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Students by Level</Text>
        {studentsByLevel.map((item, i) => (
          <View key={i} style={styles.levelRow}>
            <Text style={styles.levelLabel}>{item.level}</Text>
            <View style={styles.levelBarBg}>
              <View style={[styles.levelBarFill, {
                width: `${(item.count / stats.totalStudents) * 100}%`,
                backgroundColor: item.color,
              }]} />
            </View>
            <Text style={[styles.levelCount, { color: item.color }]}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* COURSE ENROLLMENT */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Course Enrollment</Text>
        {popularCourses.map((course, i) => {
          const pct = Math.round((course.enrolled / course.capacity) * 100);
          return (
            <View key={i} style={[styles.courseRow, i !== popularCourses.length - 1 && styles.courseRowBorder]}>
              <View style={styles.courseRowTop}>
                <Text style={[styles.courseCode, { color: course.color }]}>{course.code}</Text>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseCount}>{course.enrolled}/{course.capacity}</Text>
              </View>
              <View style={styles.levelBarBg}>
                <View style={[styles.levelBarFill, {
                  width: `${pct}%`,
                  backgroundColor: pct >= 90 ? "#ef4444" : course.color,
                }]} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
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
