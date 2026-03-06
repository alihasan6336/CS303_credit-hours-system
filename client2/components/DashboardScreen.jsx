import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const student = {
  name: "Ahmed Al-Rashidi",
  id: "2021-CS-0342",
  major: "Computer Science",
  level: "Year 3",
  gpa: "3.75",
  semester: "Spring 2025",
  enrolledCourses: 5,
  creditHours: 15,
  completedHours: 87,
  totalHours: 120,
};

const courses = [
  { code: "CS303", name: "Software Engineering", instructor: "Dr. Khalid Nasser", day: "Sunday", time: "08:00 – 09:30", room: "B-201", credits: 3, dayColor: "#ef4444" },
  { code: "CS311", name: "Database Systems", instructor: "Dr. Sara Ahmed", day: "Monday", time: "10:00 – 11:30", room: "A-104", credits: 3, dayColor: "#3b82f6" },
  { code: "CS321", name: "Computer Networks", instructor: "Dr. Omar Farouk", day: "Tuesday", time: "12:00 – 13:30", room: "C-305", credits: 3, dayColor: "#22c55e" },
  { code: "CS341", name: "Operating Systems", instructor: "Dr. Layla Hassan", day: "Wednesday", time: "14:00 – 15:30", room: "A-201", credits: 3, dayColor: "#f59e0b" },
  { code: "CS351", name: "AI Fundamentals", instructor: "Dr. Nour Ali", day: "Thursday", time: "09:00 – 10:30", room: "B-102", credits: 3, dayColor: "#8b5cf6" },
];

const progress = Math.round((student.completedHours / student.totalHours) * 100);

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>Spring 2025 — Computer Science</Text>
        </View>
        <View style={styles.bellWrapper}>
          <Text style={styles.bellIcon}>🔔</Text>
        </View>
      </View>

      {/* USER CARD */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AA</Text>
        </View>
        <View>
          <Text style={styles.userName}>{student.name}</Text>
          <Text style={styles.userId}>{student.id}</Text>
        </View>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: "#3b82f6" }]}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statNumber}>{student.enrolledCourses}</Text>
          <Text style={styles.statLabel}>Enrolled Courses</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#f59e0b" }]}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statNumber}>{student.creditHours}</Text>
          <Text style={styles.statLabel}>Credit Hours</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#8b5cf6" }]}>
          <Text style={styles.statIcon}>🎓</Text>
          <Text style={styles.statNumber}>{student.gpa}</Text>
          <Text style={styles.statLabel}>GPA</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#22c55e" }]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statNumber}>{student.completedHours}</Text>
          <Text style={styles.statLabel}>Completed Hours</Text>
        </View>
      </View>

      {/* DEGREE PROGRESS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Degree Progress</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.progressHours}>{student.completedHours} / {student.totalHours} hours</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressSub}>Year 3 — Level 3</Text>
          <Text style={styles.progressSub}>{student.totalHours - student.completedHours} hrs remaining</Text>
        </View>
      </View>

      {/* STUDENT INFO */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Info</Text>
        {[
          { label: "Major", value: student.major },
          { label: "Level", value: student.level },
          { label: "GPA", value: student.gpa },
          { label: "Semester", value: student.semester },
          { label: "Student ID", value: student.id },
        ].map((item, i) => (
          <View key={i} style={[styles.infoRow, i !== 4 && styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* REGISTERED COURSES */}
      <View style={styles.card}>
        <View style={styles.coursesHeader}>
          <Text style={styles.cardTitle}>Registered Courses</Text>
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add Course</Text>
          </TouchableOpacity>
        </View>

        {courses.map((course, i) => (
          <View key={i} style={[styles.courseCard, i !== courses.length - 1 && styles.courseCardBorder]}>
            <View style={styles.courseTop}>
              <Text style={styles.courseCode}>{course.code}</Text>
              <View style={[styles.dayBadge, { backgroundColor: course.dayColor + "20", borderColor: course.dayColor }]}>
                <Text style={[styles.dayText, { color: course.dayColor }]}>{course.day}</Text>
              </View>
              <View style={styles.creditBadge}>
                <Text style={styles.creditText}>{course.credits} cr</Text>
              </View>
            </View>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseInstructor}>👤 {course.instructor}</Text>
            <View style={styles.courseBottom}>
              <Text style={styles.courseDetail}>🕐 {course.time}</Text>
              <Text style={styles.courseDetail}>📍 {course.room}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },

  // HEADER
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111",
  },
  headerSub: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  bellWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  bellIcon: { fontSize: 18 },

  // USER CARD
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2554e8",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  userName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  userId: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },

  // STATS
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    width: (width - 40) / 2,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statNumber: { fontSize: 26, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },

  // CARD
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },

  // PROGRESS
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressHours: { fontSize: 13, color: "#555", fontWeight: "600" },
  progressPercent: { fontSize: 13, color: "#2554e8", fontWeight: "700" },
  progressBarBg: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    backgroundColor: "#2554e8",
    borderRadius: 5,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  progressSub: { fontSize: 12, color: "#aaa" },

  // STUDENT INFO
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: { fontSize: 13, color: "#888" },
  infoValue: { fontSize: 13, color: "#111", fontWeight: "600" },

  // COURSES
  coursesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  addBtn: {
    backgroundColor: "#2554e8",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  courseCard: {
    paddingVertical: 14,
  },
  courseCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  courseTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  courseCode: {
    fontSize: 13,
    fontWeight: "700",
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
  courseName: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 4 },
  courseInstructor: { fontSize: 12, color: "#888", marginBottom: 6 },
  courseBottom: { flexDirection: "row", gap: 16 },
  courseDetail: { fontSize: 12, color: "#666" },
});
