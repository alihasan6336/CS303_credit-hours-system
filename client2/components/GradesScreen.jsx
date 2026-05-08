import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from "react-native";
import { gpaApi } from "../utils/api";

const { width } = Dimensions.get("window");

// Helper functions for GPA
function percentageToGradePoints(percentage) {
  if (percentage >= 97) return 4.0;
  if (percentage >= 93) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 87) return 3.3;
  if (percentage >= 83) return 3.0;
  if (percentage >= 80) return 2.7;
  if (percentage >= 77) return 2.3;
  if (percentage >= 73) return 2.0;
  if (percentage >= 70) return 1.7;
  if (percentage >= 67) return 1.3;
  if (percentage >= 63) return 1.0;
  if (percentage >= 60) return 0.7;
  return 0.0;
}

function gradePointsToLetter(gp) {
  if (gp >= 4.0) return "A";
  if (gp >= 3.7) return "A-";
  if (gp >= 3.3) return "B+";
  if (gp >= 3.0) return "B";
  if (gp >= 2.7) return "B-";
  if (gp >= 2.3) return "C+";
  if (gp >= 2.0) return "C";
  if (gp >= 1.7) return "C-";
  if (gp >= 1.3) return "D+";
  if (gp >= 1.0) return "D";
  if (gp >= 0.7) return "D-";
  return "F";
}

function getGPAColor(gpa) {
  if (gpa >= 3.5) return "#22c55e";
  if (gpa >= 3.0) return "#3b82f6";
  if (gpa >= 2.0) return "#f59e0b";
  if (gpa >= 1.0) return "#f97316";
  return "#ef4444";
}

function getGPALabel(gpa) {
  if (gpa >= 3.7) return "Excellent";
  if (gpa >= 3.3) return "Very Good";
  if (gpa >= 2.7) return "Good";
  if (gpa >= 2.0) return "Acceptable";
  if (gpa >= 1.0) return "Poor";
  return "Failing";
}

export default function GradesScreen({ onGoBack }) {
  const [activeTab, setActiveSubTab] = useState("history"); // 'history' | 'calculator'
  const [breakdown, setBreakdown] = useState([]);
  const [serverGPA, setServerGPA] = useState(0);
  const [serverCredits, setServerCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculator State
  const [calcCourses, setCalcCourses] = useState([
    { id: 1, credits: "3", percentage: "" },
  ]);
  const [nextId, setNextId] = useState(2);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await gpaApi.getBreakdown();
      const b = data.breakdown || [];
      setBreakdown(b);
      setServerGPA(data.gpa || 0);
      const totalEarnedCredits = b.reduce((sum, item) => sum + (parseFloat(item.credits) || 0), 0);
      setServerCredits(totalEarnedCredits);
    } catch (err) {
      setError(err.message || "Failed to load academic record");
    } finally {
      setLoading(false);
    }
  };

  const addCalcCourse = () => {
    setCalcCourses([...calcCourses, { id: nextId, credits: "3", percentage: "" }]);
    setNextId(nextId + 1);
  };

  const removeCalcCourse = (id) => {
    if (calcCourses.length <= 1) return;
    setCalcCourses(calcCourses.filter((c) => c.id !== id));
  };

  const updateCalcCourse = (id, field, value) => {
    setCalcCourses(calcCourses.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const validCalcCourses = calcCourses.filter(
    (c) => c.percentage !== "" && !isNaN(parseFloat(c.percentage)) && parseFloat(c.credits) > 0
  );

  const projectedGPA = (() => {
    if (validCalcCourses.length === 0 && serverCredits === 0) return serverGPA;
    let totalQualityPoints = serverGPA * serverCredits;
    let totalCredits = serverCredits;
    for (const c of validCalcCourses) {
      const cr = parseFloat(c.credits) || 0;
      const gp = percentageToGradePoints(parseFloat(c.percentage));
      totalQualityPoints += gp * cr;
      totalCredits += cr;
    }
    return totalCredits > 0 ? Number((totalQualityPoints / totalCredits).toFixed(2)) : 0;
  })();

  const renderHistory = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.gpaCard}>
        <Text style={styles.cardLabel}>Cumulative GPA</Text>
        <View style={styles.gpaCircle}>
          <Text style={[styles.gpaValue, { color: getGPAColor(serverGPA) }]}>
            {serverGPA.toFixed(2)}
          </Text>
          <Text style={styles.gpaScale}>/ 4.00</Text>
        </View>
        <Text style={[styles.gpaStatus, { color: getGPAColor(serverGPA) }]}>
          {getGPALabel(serverGPA)}
        </Text>
      </View>

      <View style={styles.historyCard}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyTitle}>Course History</Text>
          <TextInput
            style={styles.historySearch}
            placeholder="Search code or name..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {breakdown.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No completed courses found.</Text>
          </View>
        ) : (
          breakdown
            .filter(item =>
              item.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.name?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((item, i) => (
              <View key={i} style={[styles.courseRow, i !== breakdown.length - 1 && styles.borderBottom]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseCode}>{item.code}</Text>
                  <Text style={styles.courseName}>{item.name}</Text>
                  <Text style={styles.courseMeta}>{item.semester} {item.academicYear}</Text>
                </View>
                <View style={styles.gradeCol}>
                  <View style={[styles.gradeBadge, { backgroundColor: getGPAColor(item.gradePoints) + "15", borderColor: getGPAColor(item.gradePoints) }]}>
                    <Text style={[styles.gradeBadgeText, { color: getGPAColor(item.gradePoints) }]}>
                      {gradePointsToLetter(item.gradePoints)}
                    </Text>
                  </View>
                  <Text style={styles.coursePercentage}>{item.grade}%</Text>
                  <Text style={styles.courseCredits}>{item.credits} Cr</Text>
                </View>
              </View>
            ))
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderCalculator = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.gpaCard}>
        <Text style={styles.cardLabel}>Projected GPA</Text>
        <View style={styles.gpaCircle}>
          <Text style={[styles.gpaValue, { color: getGPAColor(projectedGPA) }]}>
            {projectedGPA.toFixed(2)}
          </Text>
          <Text style={styles.gpaScale}>/ 4.00</Text>
        </View>
        <Text style={[styles.gpaStatus, { color: getGPAColor(projectedGPA) }]}>
          {getGPALabel(projectedGPA)}
        </Text>
        <Text style={styles.calcSub}>Includes {validCalcCourses.length} new courses</Text>
      </View>

      {calcCourses.map((course, index) => {
        const pVal = parseFloat(course.percentage);
        const hasGrade = course.percentage !== "" && !isNaN(pVal);
        const gp = hasGrade ? percentageToGradePoints(pVal) : null;
        return (
          <View key={course.id} style={styles.courseCard}>
            <View style={styles.courseCardHeader}>
              <Text style={styles.courseNumber}>Expected Course {index + 1}</Text>
              {hasGrade && (
                <View style={[styles.miniBadge, { backgroundColor: getGPAColor(gp) + "15", borderColor: getGPAColor(gp) }]}>
                  <Text style={[styles.miniBadgeText, { color: getGPAColor(gp) }]}>{gradePointsToLetter(gp)} ({gp.toFixed(1)})</Text>
                </View>
              )}
              {calcCourses.length > 1 && (
                <TouchableOpacity onPress={() => removeCalcCourse(course.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.calcInputRow}>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.fieldLabel}>Percentage</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0-100"
                  keyboardType="numeric"
                  value={course.percentage}
                  onChangeText={(v) => updateCalcCourse(course.id, "percentage", v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Credits</Text>
                <View style={styles.creditToggle}>
                  {["2", "3", "4"].map(cr => (
                    <TouchableOpacity
                      key={cr}
                      style={[styles.crBtn, course.credits === cr && styles.crBtnActive]}
                      onPress={() => updateCalcCourse(course.id, "credits", cr)}
                    >
                      <Text style={[styles.crBtnText, course.credits === cr && styles.crBtnTextActive]}>{cr}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.addBtn} onPress={addCalcCourse}>
        <Text style={styles.addBtnText}>+ Add Another Course</Text>
      </TouchableOpacity>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  if (loading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#2554e8" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTab, activeTab === "history" && styles.subTabActive]}
          onPress={() => setActiveSubTab("history")}
        >
          <Text style={[styles.subTabText, activeTab === "history" && styles.subTabTextActive]}>📜 History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, activeTab === "calculator" && styles.subTabActive]}
          onPress={() => setActiveSubTab("calculator")}
        >
          <Text style={[styles.subTabText, activeTab === "calculator" && styles.subTabTextActive]}>🧮 Calculator</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "history" ? renderHistory() : renderCalculator()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  subTabBar: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  subTab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "#f0f2f5", alignItems: "center" },
  subTabActive: { backgroundColor: "#2554e8" },
  subTabText: { fontSize: 13, fontWeight: "700", color: "#888" },
  subTabTextActive: { color: "#fff" },
  tabContent: { flex: 1, padding: 16 },

  gpaCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 24, alignItems: "center",
    marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 5,
  },
  cardLabel: { fontSize: 12, fontWeight: "800", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  gpaCircle: { alignItems: "center", marginBottom: 4 },
  gpaValue: { fontSize: 48, fontWeight: "900" },
  gpaScale: { fontSize: 14, color: "#aaa", fontWeight: "600", marginTop: -4 },
  gpaStatus: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  calcSub: { fontSize: 12, color: "#aaa", marginTop: 8, fontWeight: "600" },

  historyCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  historyHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  historyTitle: { fontSize: 15, fontWeight: "800", color: "#111" },
  historySearch: {
    flex: 0.7,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  courseRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  courseCode: { fontSize: 13, fontWeight: "800", color: "#2554e8" },
  courseName: { fontSize: 14, fontWeight: "700", color: "#111", marginTop: 1 },
  courseMeta: { fontSize: 11, color: "#aaa", marginTop: 2 },
  gradeCol: { alignItems: "flex-end", gap: 2 },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, borderWidth: 1.5 },
  gradeBadgeText: { fontSize: 12, fontWeight: "900" },
  coursePercentage: { fontSize: 12, fontWeight: "700", color: "#555" },
  courseCredits: { fontSize: 10, color: "#aaa", fontWeight: "600" },

  courseCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  courseCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  courseNumber: { fontSize: 13, fontWeight: "800", color: "#555" },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  miniBadgeText: { fontSize: 10, fontWeight: "800" },
  removeBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#ef4444", fontSize: 12, fontWeight: "800" },
  calcInputRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: "#aaa", marginBottom: 6 },
  input: { backgroundColor: "#f8fafc", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 14 },
  creditToggle: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 8, padding: 2 },
  crBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  crBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  crBtnText: { fontSize: 12, fontWeight: "700", color: "#94a3b8" },
  crBtnTextActive: { color: "#2554e8" },
  addBtn: { backgroundColor: "#2554e810", paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#2554e830", borderStyle: "dashed" },
  addBtnText: { color: "#2554e8", fontSize: 14, fontWeight: "700" },

  emptyBox: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: "#aaa", fontWeight: "600" },
});
