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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { adminApi } from "../utils/api";

export default function GradingManagement() {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState("");
  const [searchCourse, setSearchCourse] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [gradingId, setGradingId] = useState(null);
  const [gradeValue, setGradeValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getEnrollments();
      setEnrollments(res.enrollments || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredEnrollments = enrollments.filter(e => {
    const sStudent = searchStudent.toLowerCase();
    const sCourse = searchCourse.toLowerCase();
    
    const matchStudent = !sStudent || 
      e.student?.fullName?.toLowerCase().includes(sStudent) ||
      e.student?.universityId?.toLowerCase().includes(sStudent);
      
    const matchCourse = !sCourse ||
      e.course?.code?.toLowerCase().includes(sCourse) ||
      e.course?.name?.toLowerCase().includes(sCourse);
      
    const matchTab = e.status === activeTab;
      
    return matchStudent && matchCourse && matchTab;
  });

  const startGrading = (id, currentGrade) => {
    setGradingId(id);
    setGradeValue(currentGrade !== null && currentGrade !== undefined ? String(currentGrade) : "");
  };

  const submitGrade = async () => {
    const numGrade = Number(gradeValue);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      Alert.alert("Invalid Grade", "Please enter a number between 0 and 100.");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.updateGrade(gradingId, numGrade);
      Alert.alert("Success", "Grade updated and record finalized.");
      setGradingId(null);
      await fetchData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#2554e8" /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Degrees & Grading</Text>
        <Text style={styles.headerSub}>Enter grades to finalize course records</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "active" && styles.tabBtnActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Needs Grading
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "completed" && styles.tabBtnActive]}
          onPress={() => setActiveTab("completed")}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}>
            Graded
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by student..."
              placeholderTextColor="#aaa"
              value={searchStudent}
              onChangeText={setSearchStudent}
            />
          </View>
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>📚</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by course..."
              placeholderTextColor="#aaa"
              value={searchCourse}
              onChangeText={setSearchCourse}
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredEnrollments.length === 0 ? (
          <Text style={styles.emptyText}>No enrollments found.</Text>
        ) : (
          filteredEnrollments.map((e) => {
            const isPassing = Number(gradeValue || e.grade || 0) >= (e.course?.passingGrade || 50);
            const isCurrentlyGrading = gradingId === e._id;

            return (
              <View key={e._id} style={[styles.card, isCurrentlyGrading && styles.cardActive]}>
                <View style={styles.cardTop}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{e.student?.fullName}</Text>
                    <Text style={styles.studentId}>{e.student?.universityId}</Text>
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseCode}>{e.course?.code}</Text>
                    <Text style={styles.semText}>{e.semester}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBottom}>
                  {isCurrentlyGrading ? (
                    <View style={styles.gradingRow}>
                      <View style={styles.inputWrap}>
                        <TextInput
                          style={styles.gradeInput}
                          keyboardType="numeric"
                          placeholder="Grade %"
                          value={gradeValue}
                          onChangeText={setGradeValue}
                          autoFocus
                        />
                        <Text style={[styles.passFailText, { color: isPassing ? "#22c55e" : "#ef4444" }]}>
                          {gradeValue ? (isPassing ? "PASS" : "FAIL") : ""}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.submitBtn} onPress={submitGrade} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setGradingId(null)}>
                        <Text style={styles.cancelText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : activeTab === "completed" ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.courseName}>{e.course?.name}</Text>
                      <View style={styles.gradedBox}>
                        <Text style={[styles.passFailText, { color: e.grade >= (e.course?.passingGrade || 50) ? "#22c55e" : "#ef4444" }]}>
                          {e.grade >= (e.course?.passingGrade || 50) ? "PASS" : "FAIL"}
                        </Text>
                        <Text style={styles.givenGrade}>{e.grade}%</Text>
                        <TouchableOpacity style={styles.editBtn} onPress={() => startGrading(e._id, e.grade)}>
                          <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.infoRow}>
                      <Text style={styles.courseName}>{e.course?.name}</Text>
                      <TouchableOpacity style={styles.startBtn} onPress={() => startGrading(e._id, e.grade)}>
                        <Text style={styles.startBtnText}>Give Degree</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: "#fff" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },
  headerSub: { fontSize: 13, color: "#888", marginTop: 2 },
  tabContainer: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: "#2554e8" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#888" },
  tabTextActive: { color: "#2554e8" },
  searchSection: { padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  searchRow: { flexDirection: "row", gap: 10 },
  searchWrapper: {
    flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },
  scroll: { flex: 1, padding: 16 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 40, fontSize: 15 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardActive: { borderWidth: 2, borderColor: "#2554e8" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  studentName: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  studentId: { fontSize: 12, color: "#64748b", marginTop: 2 },
  courseCode: { fontSize: 14, fontWeight: "800", color: "#2554e8", textAlign: "right" },
  semText: { fontSize: 11, color: "#94a3b8", textAlign: "right", marginTop: 2 },
  cardDivider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },
  cardBottom: { minHeight: 40, justifyContent: "center" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  courseName: { fontSize: 13, color: "#475569", flex: 1, marginRight: 10 },
  startBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  startBtnText: { fontSize: 12, fontWeight: "700", color: "#2554e8" },
  gradingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 10 },
  gradeInput: { flex: 1, paddingVertical: 8, fontSize: 16, fontWeight: "700", color: "#1e293b" },
  passFailText: { fontSize: 10, fontWeight: "900", marginLeft: 8 },
  submitBtn: { backgroundColor: "#2554e8", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  cancelBtn: { padding: 8 },
  cancelText: { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  gradedBox: { flexDirection: "row", alignItems: "center", gap: 12 },
  givenGrade: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  editBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  editBtnText: { fontSize: 11, fontWeight: "700", color: "#64748b" },
});
