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

function getPercentageColor(p) {
  if (p >= 90) return "#22c55e";
  if (p >= 80) return "#3b82f6";
  if (p >= 70) return "#f59e0b";
  if (p >= 60) return "#f97316";
  return "#ef4444";
}

export default function GPACalculatorScreen({ onGoBack }) {
  const [breakdown, setBreakdown] = useState(null);
  const [serverGPA, setServerGPA] = useState(null);
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
      setBreakdown(data.breakdown || []);
      setServerGPA(data.gpa);
    } catch (err) {
      setError(err.message || "Failed to load GPA data");
    } finally {
      setLoading(false);
    }
  };



  const renderHistory = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2554e8" />
        </View>
      )}

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchBreakdown} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !loading && breakdown ? (
        <>
          {serverGPA !== null && (
            <View style={styles.gpaResultCard}>
              <View style={styles.gpaCircle}>
                <Text style={[styles.gpaValue, { color: getGPAColor(serverGPA) }]}>
                  {serverGPA.toFixed(2)}
                </Text>
                <Text style={styles.gpaScale}>/ 4.00</Text>
              </View>
              <Text style={[styles.gpaLabel, { color: getGPAColor(serverGPA) }]}>
                {getGPALabel(serverGPA)} — Official GPA
              </Text>
            </View>
          )}

          {breakdown.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No completed courses yet</Text>
            </View>
          ) : (
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Completed Courses</Text>
              {breakdown.map((item, i) => (
                <View
                  key={i}
                  style={[
                    styles.historyRow,
                    i !== breakdown.length - 1 && styles.historyRowBorder,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyCode}>{item.code}</Text>
                    <Text style={styles.historyName}>{item.name}</Text>
                    <Text style={styles.historySemester}>
                      {item.semester} — {item.academicYear}
                    </Text>
                  </View>
                  <View style={styles.historyRight}>
                    <View
                      style={[
                        styles.gradeBadge,
                        {
                          backgroundColor: getGPAColor(item.gradePoints) + "18",
                          borderColor: getGPAColor(item.gradePoints),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gradeBadgeText,
                          { color: getGPAColor(item.gradePoints) },
                        ]}
                      >
                        {gradePointsToLetter(item.gradePoints)}
                      </Text>
                    </View>
                    <Text style={styles.historyGrade}>{item.grade}%</Text>
                    <Text style={styles.historyCredits}>
                      {item.credits} cr
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grades</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderHistory()}
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
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#2554e8",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
  },
  tabTextActive: {
    color: "#fff",
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
  scaleCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  scaleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },
  scaleGrid: {
    gap: 0,
  },
  scaleHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    marginBottom: 2,
  },
  scaleHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scaleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  scaleRowAlt: {
    backgroundColor: "#f8fafc",
  },
  scaleRange: {
    flex: 1,
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
  },
  scaleLetter: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  scaleGP: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    fontWeight: "700",
    textAlign: "right",
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
  resetBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  resetBtnText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: "center",
  },
  errorWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#2554e8",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "600",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  historyCode: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2554e8",
  },
  historyName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginTop: 2,
  },
  historySemester: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 2,
  },
  historyRight: {
    alignItems: "center",
    gap: 4,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  gradeBadgeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  historyGrade: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  historyCredits: {
    fontSize: 11,
    color: "#888",
    fontWeight: "600",
  },
});
