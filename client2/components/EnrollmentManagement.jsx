import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { adminApi, courseApi } from "../utils/api";

export default function EnrollmentManagement() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [studentsRes, coursesRes, enrollmentsRes] = await Promise.all([
        adminApi.getStudents("student"),
        courseApi.getAll(),
        adminApi.getEnrollments(),
      ]);
      setStudents(studentsRes.students || []);
      setCourses(coursesRes.courses || []);
      setEnrollments(enrollmentsRes.enrollments || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredStudents = students.filter(s =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.universityId?.toLowerCase().includes(search.toLowerCase())
  );

  const studentEnrollments = enrollments.filter(e => e.student?._id === selectedStudent?._id);

  const isStudentEnrolledInCourse = (courseId) => {
    return studentEnrollments.some(e => e.course?._id === courseId);
  };

  const enroll = async () => {
    if (!selectedStudent || !selectedCourse) {
      Alert.alert("Error", "Please select a student and course");
      return;
    }
    try {
      setEnrolling(true);
      await adminApi.enroll(selectedStudent._id, selectedCourse._id);
      Alert.alert("Success", `${selectedStudent.fullName} enrolled in ${selectedCourse.code}`);
      setSelectedCourse(null);
      await fetchData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setEnrolling(false);
    }
  };

  const unenroll = (enrollmentId, courseName) => {
    Alert.alert("Remove Enrollment", `Remove ${courseName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await adminApi.unenroll(enrollmentId);
            await fetchData();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#2554e8" /></View>;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enrollment</Text>
        <Text style={styles.headerSub}>Manually enroll students into courses</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Select Student</Text>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {filteredStudents.slice(0, 10).map((student) => (
          <TouchableOpacity
            key={student._id}
            style={[styles.studentCard, selectedStudent?._id === student._id && styles.studentCardActive]}
            onPress={() => { setSelectedStudent(student); setSelectedCourse(null); }}
          >
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>
                {student.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={styles.studentName}>{student.fullName}</Text>
              <Text style={styles.studentMeta}>{student.universityId} • Level {student.level}</Text>
            </View>
            {selectedStudent?._id === student._id && <Text style={styles.selectedCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {selectedStudent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Select Course</Text>
          {courses.map((course) => {
            const enrolled = isStudentEnrolledInCourse(course._id);
            return (
              <TouchableOpacity
                key={course._id}
                style={[
                  styles.courseCard,
                  selectedCourse?._id === course._id && styles.courseCardActive,
                  enrolled && styles.courseCardEnrolled,
                ]}
                onPress={() => { if (!enrolled) setSelectedCourse(course); }}
              >
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseName}>{course.name}</Text>
                {enrolled
                  ? <Text style={styles.enrolledBadge}>✅ Enrolled</Text>
                  : selectedCourse?._id === course._id && <Text style={styles.selectedCheck}>✓</Text>
                }
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {selectedStudent && selectedCourse && (
        <TouchableOpacity style={styles.enrollBtn} onPress={enroll} disabled={enrolling}>
          {enrolling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.enrollBtnText}>
              ✅ Enroll {selectedStudent.fullName} in {selectedCourse.code}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {selectedStudent && studentEnrollments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Enrollments — {selectedStudent.fullName}</Text>
          {studentEnrollments.map((e) => (
            <View key={e._id} style={styles.enrollmentRow}>
              <Text style={styles.enrollmentCode}>{e.course?.code}</Text>
              <Text style={styles.enrollmentName}>{e.course?.name}</Text>
              <TouchableOpacity onPress={() => unenroll(e._id, e.course?.name)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },
  headerSub: { fontSize: 13, color: "#888", marginTop: 2 },
  section: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#2554e8", marginBottom: 12 },
  searchWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, backgroundColor: "#fafafa",
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#222" },
  studentCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: "#f9f9f9", marginBottom: 8, borderWidth: 1.5, borderColor: "#e0e0e0",
  },
  studentCardActive: { borderColor: "#2554e8", backgroundColor: "#eff6ff" },
  studentAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#2554e820", alignItems: "center", justifyContent: "center" },
  studentAvatarText: { fontSize: 13, fontWeight: "800", color: "#2554e8" },
  studentName: { fontSize: 14, fontWeight: "700", color: "#111" },
  studentMeta: { fontSize: 11, color: "#888", marginTop: 1 },
  selectedCheck: { marginLeft: "auto", color: "#2554e8", fontSize: 16, fontWeight: "700" },
  courseCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: "#f9f9f9", marginBottom: 8, borderWidth: 1.5, borderColor: "#e0e0e0",
  },
  courseCardActive: { borderColor: "#2554e8", backgroundColor: "#eff6ff" },
  courseCardEnrolled: { backgroundColor: "#f0fdf4", borderColor: "#22c55e" },
  courseCode: { fontSize: 13, fontWeight: "700", color: "#2554e8" },
  courseName: { flex: 1, fontSize: 13, color: "#333" },
  enrolledBadge: { fontSize: 11, color: "#22c55e", fontWeight: "700" },
  enrollBtn: {
    backgroundColor: "#2554e8", marginHorizontal: 16, marginTop: 12,
    borderRadius: 14, paddingVertical: 16, alignItems: "center",
  },
  enrollBtnText: { color: "#fff", fontWeight: "700", fontSize: 13, textAlign: "center" },
  enrollmentRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  enrollmentCode: { fontSize: 12, fontWeight: "700", color: "#2554e8", width: 50 },
  enrollmentName: { flex: 1, fontSize: 12, color: "#333" },
  removeText: { fontSize: 12, color: "#ef4444", fontWeight: "700" },
});
