import { useState } from "react";
import {
    Alert,
    ScrollView, StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const students = [
  { id: "2021-CS-0342", name: "Ahmed Al-Rashidi", level: "Year 3" },
  { id: "2022-CS-0101", name: "Sara Mohammed", level: "Year 2" },
  { id: "2023-CS-0055", name: "Omar Hassan", level: "Year 1" },
  { id: "2021-CS-0210", name: "Layla Ibrahim", level: "Year 3" },
];

const courses = [
  { code: "CS303", name: "Software Engineering", groups: ["G1", "G2"] },
  { code: "CS311", name: "Database Systems", groups: ["G1"] },
  { code: "CS321", name: "Computer Networks", groups: ["G1", "G2"] },
  { code: "CS101", name: "Intro to Programming", groups: ["G1", "G2", "G3"] },
];

export default function EnrollmentManagement() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [enrollments, setEnrollments] = useState([
    { studentId: "2021-CS-0342", courseCode: "CS303", group: "G1" },
    { studentId: "2021-CS-0342", courseCode: "CS311", group: "G1" },
  ]);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const studentEnrollments = enrollments.filter(e => e.studentId === selectedStudent?.id);

  const enroll = () => {
    if (!selectedStudent || !selectedCourse || !selectedGroup) {
      Alert.alert("Error", "Please select a student, course, and group");
      return;
    }
    const already = enrollments.find(e => e.studentId === selectedStudent.id && e.courseCode === selectedCourse.code);
    if (already) {
      Alert.alert("Already Enrolled", `${selectedStudent.name} is already enrolled in ${selectedCourse.code}`);
      return;
    }
    setEnrollments([...enrollments, { studentId: selectedStudent.id, courseCode: selectedCourse.code, group: selectedGroup }]);
    Alert.alert("Success", `${selectedStudent.name} enrolled in ${selectedCourse.code} - ${selectedGroup}`);
    setSelectedCourse(null);
    setSelectedGroup(null);
  };

  const unenroll = (courseCode) => {
    Alert.alert("Remove Enrollment", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setEnrollments(enrollments.filter(e => !(e.studentId === selectedStudent?.id && e.courseCode === courseCode))) },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enrollment</Text>
        <Text style={styles.headerSub}>Manually enroll students into courses</Text>
      </View>

      {/* SEARCH STUDENT */}
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
        {filteredStudents.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={[styles.studentCard, selectedStudent?.id === student.id && styles.studentCardActive]}
            onPress={() => { setSelectedStudent(student); setSelectedCourse(null); setSelectedGroup(null); }}
          >
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>{student.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</Text>
            </View>
            <View>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentMeta}>{student.id} • {student.level}</Text>
            </View>
            {selectedStudent?.id === student.id && <Text style={styles.selectedCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* SELECT COURSE */}
      {selectedStudent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Select Course</Text>
          {courses.map((course) => {
            const isEnrolled = enrollments.find(e => e.studentId === selectedStudent.id && e.courseCode === course.code);
            return (
              <TouchableOpacity
                key={course.code}
                style={[styles.courseCard, selectedCourse?.code === course.code && styles.courseCardActive, isEnrolled && styles.courseCardEnrolled]}
                onPress={() => { if (!isEnrolled) { setSelectedCourse(course); setSelectedGroup(null); } }}
              >
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseName}>{course.name}</Text>
                {isEnrolled
                  ? <Text style={styles.enrolledBadge}>✅ Enrolled</Text>
                  : selectedCourse?.code === course.code && <Text style={styles.selectedCheck}>✓</Text>
                }
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* SELECT GROUP */}
      {selectedCourse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Select Group</Text>
          <View style={styles.groupRow}>
            {selectedCourse.groups.map((group) => (
              <TouchableOpacity
                key={group}
                style={[styles.groupBtn, selectedGroup === group && styles.groupBtnActive]}
                onPress={() => setSelectedGroup(group)}
              >
                <Text style={[styles.groupBtnText, selectedGroup === group && styles.groupBtnTextActive]}>{group}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ENROLL BUTTON */}
      {selectedStudent && selectedCourse && selectedGroup && (
        <TouchableOpacity style={styles.enrollBtn} onPress={enroll}>
          <Text style={styles.enrollBtnText}>✅ Enroll {selectedStudent.name} in {selectedCourse.code} - {selectedGroup}</Text>
        </TouchableOpacity>
      )}

      {/* CURRENT ENROLLMENTS */}
      {selectedStudent && studentEnrollments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Enrollments — {selectedStudent.name}</Text>
          {studentEnrollments.map((e, i) => {
            const course = courses.find(c => c.code === e.courseCode);
            return (
              <View key={i} style={styles.enrollmentRow}>
                <Text style={styles.enrollmentCode}>{e.courseCode}</Text>
                <Text style={styles.enrollmentName}>{course?.name}</Text>
                <Text style={styles.enrollmentGroup}>{e.group}</Text>
                <TouchableOpacity onPress={() => unenroll(e.courseCode)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
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
  groupRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  groupBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#f0f2f5", borderWidth: 1.5, borderColor: "#e0e0e0",
  },
  groupBtnActive: { backgroundColor: "#2554e8", borderColor: "#2554e8" },
  groupBtnText: { fontSize: 14, fontWeight: "700", color: "#555" },
  groupBtnTextActive: { color: "#fff" },
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
  enrollmentGroup: { fontSize: 12, color: "#888", fontWeight: "600" },
  removeText: { fontSize: 12, color: "#ef4444", fontWeight: "700" },
});
