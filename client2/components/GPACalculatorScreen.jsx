import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { gpaApi } from "../utils/api";

const { width } = Dimensions.get("window");

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

function percentageToLetter(percentage) {
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
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

function getPercentageColor(p) {
  if (p >= 90) return "#22c55e";
  if (p >= 80) return "#3b82f6";
  if (p >= 70) return "#f59e0b";
  if (p >= 60) return "#f97316";
  return "#ef4444";
}

export default function GPACalculatorScreen({ onGoBack }) {
  const [courses, setCourses] = useState([
    { id: 1, name: "", credits: "3", percentage: "" },
  ]);
  const [nextId, setNextId] = useState(2);
  
  const [serverGPA, setServerGPA] = useState(0);
  const [serverCredits, setServerCredits] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBreakdown();
  }, []);

  const fetchBreakdown = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await gpaApi.getBreakdown();
      const breakdown = data.breakdown || [];
      const totalEarnedCredits = breakdown.reduce((sum, item) => sum + (parseFloat(item.credits) || 0), 0);
      setServerGPA(data.gpa || 0);
      setServerCredits(totalEarnedCredits);
    } catch (err) {
      setError(err.message || "Failed to load current GPA data");
    } finally {
      setLoading(false);
    }
  };

  const addCourse = () => {
    setCourses([...courses, { id: nextId, name: "", credits: "3", percentage: "" }]);
    setNextId(nextId + 1);
  };

  const removeCourse = (id) => {
    if (courses.length <= 1) return;
    setCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id, field, value) => {
    setCourses(
      courses.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const validCourses = courses.filter(
    (c) => c.percentage !== "" && !isNaN(parseFloat(c.percentage)) && parseFloat(c.credits) > 0
  );

  const newCredits = validCourses.reduce(
    (sum, c) => sum + (parseFloat(c.credits) || 0),
    0
  );

  const calculatedGPA = (() => {
    if (validCourses.length === 0 && serverCredits === 0) return 0;
    
    let totalQualityPoints = serverGPA * serverCredits;
    let totalCredits = serverCredits;
    
    for (const c of validCourses) {
      const cr = parseFloat(c.credits) || 0;
      const gp = percentageToGradePoints(parseFloat(c.percentage));
      totalQualityPoints += gp * cr;
      totalCredits += cr;
    }
    return totalCredits > 0 ? Number((totalQualityPoints / totalCredits).toFixed(2)) : 0;
  })();

  const newSemesterGPA = (() => {
    if (validCourses.length === 0) return null;
    let semQP = 0;
    for (const c of validCourses) {
      const cr = parseFloat(c.credits) || 0;
      const gp = percentageToGradePoints(parseFloat(c.percentage));
      semQP += gp * cr;
    }
    return newCredits > 0 ? Number((semQP / newCredits).toFixed(2)) : 0;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Target GPA Calculator</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator size="small" color="#2554e8" style={{ marginBottom: 10 }} />}
        
        <View style={styles.gpaResultCard}>
          <Text style={styles.gpaCardTitle}>Projected Cumulative GPA</Text>
          <View style={styles.gpaCircle}>
            <Text style={[styles.gpaValue, { color: getGPAColor(calculatedGPA) }]}>
              {calculatedGPA.toFixed(2)}
            </Text>
            <Text style={styles.gpaScale}>/ 4.00</Text>
          </View>
          <Text style={[styles.gpaLabel, { color: getGPAColor(calculatedGPA) }]}>
            {getGPALabel(calculatedGPA)}
          </Text>
          <View style={styles.gpaMeta}>
            <View style={styles.gpaMetaItem}>
              <Text style={styles.gpaMetaValue}>{serverGPA.toFixed(2)}</Text>
              <Text style={styles.gpaMetaLabel}>Current GPA</Text>
            </View>
            <View style={styles.gpaMetaDivider} />
            <View style={styles.gpaMetaItem}>
              <Text style={styles.gpaMetaValue}>{newSemesterGPA !== null ? newSemesterGPA.toFixed(2) : "-"}</Text>
              <Text style={styles.gpaMetaLabel}>Semester GPA</Text>
            </View>
          </View>
        </View>

        {courses.map((course, index) => {
          const pVal = parseFloat(course.percentage);
          const hasGrade = course.percentage !== "" && !isNaN(pVal);
          const gp = hasGrade ? percentageToGradePoints(pVal) : null;
          const letter = hasGrade ? percentageToLetter(pVal) : null;
          const pColor = hasGrade ? getPercentageColor(pVal) : "#888";

          return (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseCardHeader}>
                <Text style={styles.courseNumber}>Expected Course {index + 1}</Text>
                {hasGrade && (
                  <View style={[styles.letterBadge, { backgroundColor: pColor + "18", borderColor: pColor }]}>
                    <Text style={[styles.letterBadgeText, { color: pColor }]}>{letter} ({gp.toFixed(1)})</Text>
                  </View>
                )}
                {courses.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeCourse(course.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.fieldLabel}>Credit Hours</Text>
              <View style={styles.creditRow}>
                {["1", "2", "3", "4"].map((cr) => (
                  <TouchableOpacity
                    key={cr}
                    style={[
                      styles.creditChip,
                      course.credits === cr && styles.creditChipActive,
                    ]}
                    onPress={() => updateCourse(course.id, "credits", cr)}
                  >
                    <Text
                      style={[
                        styles.creditChipText,
                        course.credits === cr && styles.creditChipTextActive,
                      ]}
                    >
                      {cr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Expected Percentage (0-100)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.percentageInput,
                  hasGrade && { borderColor: pColor },
                ]}
                placeholder="e.g. 85"
                placeholderTextColor="#aaa"
                value={course.percentage}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  if (cleaned === "" || (parseFloat(cleaned) >= 0 && parseFloat(cleaned) <= 100)) {
                    updateCourse(course.id, "percentage", cleaned);
                  }
                }}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          );
        })}

        <TouchableOpacity style={styles.addCourseBtn} onPress={addCourse}>
          <Text style={styles.addCourseBtnText}>+ Add Course</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gpaResultCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  gpaCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  gpaCircle: {
    alignItems: "center",
    marginBottom: 8,
  },
  gpaValue: {
    fontSize: 48,
    fontWeight: "900",
  },
  gpaScale: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
    marginTop: -4,
  },
  gpaLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  gpaMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  gpaMetaItem: {
    alignItems: "center",
  },
  gpaMetaValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },
  gpaMetaLabel: {
    fontSize: 11,
    color: "#aaa",
    fontWeight: "600",
  },
  gpaMetaDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e5e7eb",
  },
  courseCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  courseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  courseNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2554e8",
  },
  letterBadge: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  letterBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  percentageInput: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    borderWidth: 1.5,
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  creditRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  creditChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  creditChipActive: {
    backgroundColor: "#2554e815",
    borderColor: "#2554e8",
  },
  creditChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888",
  },
  creditChipTextActive: {
    color: "#2554e8",
  },
  addCourseBtn: {
    backgroundColor: "#2554e8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#2554e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  addCourseBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
