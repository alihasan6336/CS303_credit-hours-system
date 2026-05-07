import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { adminApi } from "../utils/api";

export default function StudentDetailsScreen({ userId, onGoBack }) {
  const [student, setStudent] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [userRes, recordRes] = await Promise.all([
        adminApi.getUserById(userId),
        adminApi.getStudentAcademicRecord(userId),
      ]);
      setStudent(userRes.user || userRes.student || userRes);
      setRecord(recordRes);
    } catch (err) {
      setError(err.message || "Failed to load student data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setError("No student ID provided");
      setLoading(false);
      return;
    }
    fetchData();
  }, [userId, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2554e8" />
        <Text style={styles.loadingText}>Loading student data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={onGoBack}>
          <Text style={styles.backLinkText}>← Back to Users</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = student?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const enrollments = record?.enrollments || [];
  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const completedEnrollments = enrollments.filter(e => e.status === "completed");

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2554e8" />}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{student?.fullName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>🎓 Student</Text>
        </View>
        <Text style={styles.profileEmail}>{student?.email}</Text>
      </View>

      {/* Academic Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Academic Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: getGPAColor(record?.cumulativeGPA || 0) }]}>
              {(record?.cumulativeGPA || 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{record?.totalCreditsCompleted || 0}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{student?.level || "—"}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{activeEnrollments.length}</Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </View>
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>
        {[
          { label: "Full Name", value: student?.fullName },
          { label: "Email", value: student?.email },
          { label: "University ID", value: student?.universityId },
          { label: "Phone", value: student?.phoneNumber || "—" },
          { label: "Major", value: student?.major },
          { label: "Level", value: student?.level ? `Level ${student.level}` : "—" },
          { label: "Semester", value: student?.currentSemester },
          { label: "Role", value: student?.role },
        ].map((item, i, arr) => (
          <View key={i}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value || "—"}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Active Enrollments */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Enrollments ({activeEnrollments.length})</Text>
        {activeEnrollments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No active enrollments</Text>
          </View>
        ) : (
          activeEnrollments.map((enr, i) => (
            <View key={enr._id || i} style={[styles.enrollRow, i < activeEnrollments.length - 1 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.courseCode}>{enr.course?.code}</Text>
                <Text style={styles.courseName}>{enr.course?.name}</Text>
                <Text style={styles.courseMeta}>{enr.semester} • {enr.course?.credits || 0} Credits</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: "#22c55e15", borderColor: "#22c55e" }]}>
                <Text style={[styles.statusText, { color: "#22c55e" }]}>Active</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Academic History */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Academic History ({completedEnrollments.length})</Text>
        {completedEnrollments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No completed courses yet</Text>
          </View>
        ) : (
          completedEnrollments.map((enr, i) => {
            const grade = enr.grade;
            const isPassing = grade !== null && grade !== undefined && grade >= 50;
            return (
              <View key={enr._id || i} style={[styles.enrollRow, i < completedEnrollments.length - 1 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseCode}>{enr.course?.code}</Text>
                  <Text style={styles.courseName}>{enr.course?.name}</Text>
                  <Text style={styles.courseMeta}>{enr.semester} • {enr.course?.credits || 0} Credits</Text>
                </View>
                <View style={styles.gradeCol}>
                  <Text style={[styles.gradeText, { color: isPassing ? "#22c55e" : "#ef4444" }]}>
                    {grade !== null && grade !== undefined ? `${grade}%` : "N/A"}
                  </Text>
                  <Text style={styles.statusSmall}>{enr.status}</Text>
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

function getGPAColor(gpa) {
  if (gpa >= 3.5) return "#22c55e";
  if (gpa >= 3.0) return "#3b82f6";
  if (gpa >= 2.0) return "#f59e0b";
  if (gpa >= 1.0) return "#f97316";
  return "#ef4444";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#888", fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 14, color: "#ef4444", marginBottom: 16, textAlign: "center" },
  retryBtn: { backgroundColor: "#2554e8", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontWeight: "700" },
  backLink: { marginTop: 16 },
  backLinkText: { color: "#2554e8", fontWeight: "600", fontSize: 14 },

  backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtnText: { color: "#2554e8", fontWeight: "700", fontSize: 15 },

  profileHeader: {
    alignItems: "center", paddingVertical: 24, backgroundColor: "#fff",
    marginHorizontal: 16, marginTop: 8, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#2554e8", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 6 },
  roleBadge: {
    backgroundColor: "#2554e815", paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8, marginBottom: 6,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: "#2554e8" },
  profileEmail: { fontSize: 13, color: "#888" },

  card: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTitle: {
    fontSize: 14, fontWeight: "800", color: "#888",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16,
  },

  statsRow: {
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
  },
  statBox: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 22, fontWeight: "900", color: "#111" },
  statLabel: { fontSize: 10, color: "#888", fontWeight: "700", textTransform: "uppercase", marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: "#e5e7eb" },

  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, color: "#888", fontWeight: "600" },
  infoValue: { fontSize: 13, color: "#111", fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  divider: { height: 1, backgroundColor: "#f3f4f6" },

  emptyBox: { alignItems: "center", paddingVertical: 32 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: "#aaa", fontSize: 14, fontWeight: "600" },

  enrollRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  courseCode: { fontSize: 13, fontWeight: "800", color: "#2554e8" },
  courseName: { fontSize: 14, fontWeight: "700", color: "#111", marginTop: 2 },
  courseMeta: { fontSize: 11, color: "#aaa", marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  gradeCol: { alignItems: "flex-end" },
  gradeText: { fontSize: 16, fontWeight: "800" },
  statusSmall: { fontSize: 10, color: "#aaa", fontWeight: "600", textTransform: "capitalize", marginTop: 2 },
});
