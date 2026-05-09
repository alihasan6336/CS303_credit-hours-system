import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { courseApi, scheduleApi, settingsApi } from "../utils/api";

const { width } = Dimensions.get("window");

export default function AIScheduleScreen() {
  const [loading, setLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [fetchingCourses, setFetchingCourses] = useState(true);
  const [recommending, setRecommending] = useState(false);
  const [isRegistrationOpenForMe, setIsRegistrationOpenForMe] = useState(false);

  useEffect(() => {
    fetchAvailable();
  }, []);

  const fetchAvailable = async () => {
    try {
      setFetchingCourses(true);
      const [allRes, myRes, settingsRes] = await Promise.all([
        courseApi.getAll(),
        courseApi.getMyCourses(),
        settingsApi.getSettings()
      ]);

      const settings = settingsRes.settings || {};
      const openLevels = settings.enrollmentOpenLevels || [];
      const isGlobalOpen = settings.isRegistrationOpen;

      const studentLevel = parseInt(myRes.student?.level || 1, 10);
      setIsRegistrationOpenForMe(isGlobalOpen && openLevels.includes(studentLevel));

      const passedIds = (myRes.data || [])
        .filter(e => e.status === 'completed' && e.grade >= (e.course?.passingGrade || 50))
        .map(e => e.course?._id || e.course?.id);

      const filtered = (allRes.courses || []).filter(c =>
        !passedIds.includes(c._id || c.id) &&
        (parseInt(c.level || 1, 10) <= studentLevel)
      );

      setAvailableCourses(filtered);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setFetchingCourses(false);
    }
  };

  const handleRecommend = async () => {
    setRecommending(true);
    try {
      const data = await scheduleApi.recommend();
      if (data.success) {
        const codes = data.recommendations.map(c => c.code);
        setSelectedCourseIds(Array.from(new Set(codes)));
      }
    } catch (err) {
      Alert.alert("Error", "AI Recommendation failed: " + err.message);
    } finally {
      setRecommending(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.generate({
        preferredCourseIds: selectedCourseIds.length > 0 ? selectedCourseIds : undefined,
      });
      if (response.success) {
        setSchedule(response.schedule);
        setAdvice(response.aiAdvice || null);
        setStep(2);
      } else {
        setError(response.message || "Failed to generate schedule.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (code) => {
    setSelectedCourseIds(prev =>
      prev.includes(code) ? prev.filter(i => i !== code) : [...prev, code]
    );
  };

  const uniqueCourses = Array.from(new Set(availableCourses.map(c => c.code)))
    .map(code => availableCourses.find(c => c.code === code));

  const totalSelectedCredits = uniqueCourses
    .filter(c => selectedCourseIds.includes(c.code))
    .reduce((sum, c) => sum + (c.credits || 0), 0);

  const handleEnroll = async () => {
    if (!schedule) return;
    setEnrolling(true);
    try {
      const courseIds = schedule.courses.map(c => c._id || c.id);
      const res = await courseApi.bulkEnroll(courseIds, true); // replaceExisting: true
      if (res.success) {
        setEnrollSuccess(true);
        Alert.alert("Success", res.message || "Enrolled in all courses successfully!");
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to enroll in some courses.");
    } finally {
      setEnrolling(false);
    }
  };

  if (fetchingCourses) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading available courses...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingTitle}>Calculating optimal combinations...</Text>
        <Text style={styles.loadingSub}>Pruning thousands of invalid schedules to find your best fit.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Text style={styles.headerIcon}>✨</Text>
        </View>
        <Text style={styles.headerTitle}>AI Schedule Optimizer</Text>
        <Text style={styles.headerSub}>
          Our intelligent algorithm analyzes hundreds of course combinations to find your perfect timetable with the{" "}
          <Text style={styles.headerHighlight}>least possible days on campus</Text>.
        </Text>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Optimization Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => { setError(null); setStep(1); }}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isRegistrationOpenForMe && (
        <View style={styles.closedBanner}>
          <Text style={styles.closedIconSmall}>🔒</Text>
          <Text style={styles.closedTextSmall}>
            Registration is currently closed for your year level. Optimizer features are unavailable.
          </Text>
        </View>
      )}

      {step === 1 && !loading && !error && isRegistrationOpenForMe && (
        <>
          <View style={styles.selectionCard}>
            <View style={styles.selectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectionTitle}>Select Your Courses</Text>
                <Text style={styles.selectionSub}>Choose the courses you'd like to include in your optimized schedule.</Text>

                <TouchableOpacity
                  style={[styles.recommendBtn, recommending && { opacity: 0.7 }]}
                  onPress={handleRecommend}
                  disabled={recommending}
                >
                  {recommending ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <Text style={styles.recommendBtnText}>✨ Smart Select with AI</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.creditCounter}>
                <Text style={[styles.creditValue, { color: totalSelectedCredits < 14 ? "#f59e0b" : "#22c55e" }]}>
                  {totalSelectedCredits}
                </Text>
                <Text style={styles.creditRange}>/ 14-19</Text>
                <Text style={styles.creditLabel}>Credits</Text>
              </View>
            </View>

            {totalSelectedCredits < 14 && selectedCourseIds.length > 0 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>⚠️ You need at least 14 credits. Please select more courses.</Text>
              </View>
            )}

            {uniqueCourses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>No Courses Available</Text>
                <Text style={styles.emptySub}>We couldn't find any courses matching your criteria.</Text>
              </View>
            ) : (
              uniqueCourses.map(course => {
                const isSelected = selectedCourseIds.includes(course.code);
                const groupCount = availableCourses.filter(c => c.code === course.code).length;
                return (
                  <TouchableOpacity
                    key={course.code}
                    style={[styles.courseOption, isSelected && styles.courseOptionSelected]}
                    onPress={() => toggleCourse(course.code)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.courseOptionTop}>
                        <Text style={styles.courseOptionCode}>{course.code}</Text>
                        <View style={styles.creditBadge}>
                          <Text style={styles.creditBadgeText}>{course.credits} Cr</Text>
                        </View>
                        {groupCount > 1 && (
                          <View style={styles.groupBadge}>
                            <Text style={styles.groupBadgeText}>{groupCount} Groups</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.courseOptionName}>{course.name}</Text>
                      <Text style={styles.courseOptionHint}>
                        Multiple sections available - AI will pick the best time for you.
                      </Text>
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity
              style={[styles.generateBtn, (selectedCourseIds.length === 0 || totalSelectedCredits < 14) && styles.generateBtnDisabled]}
              disabled={selectedCourseIds.length === 0 || totalSelectedCredits < 14}
              onPress={handleGenerate}
            >
              <Text style={styles.generateBtnText}>✨ Optimize This Selection</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Tip: </Text>
              Select at least 5-6 courses to give the AI enough options to find the best configuration!
            </Text>
          </View>
        </>
      )}

      {step === 2 && schedule && !error && (
        <>
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Optimization Successful!</Text>
              <Text style={styles.successSub}>
                Found a valid schedule with only <Text style={{ fontWeight: "800" }}>{schedule.dayCount} days</Text> on campus.
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setStep(1); setSchedule(null); setEnrollSuccess(false); }}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>✨ Schedule Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statItemValue}>{schedule.totalCredits}</Text>
                <Text style={styles.statItemLabel}>Credits</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemValue}>{schedule.dayCount}</Text>
                <Text style={styles.statItemLabel}>Days</Text>
              </View>
            </View>
            <View style={styles.daysRow}>
              {(schedule.uniqueDays || []).map(day => {
                const colors = { Sunday: "#3b82f6", Monday: "#8b5cf6", Tuesday: "#f59e0b", Wednesday: "#22c55e", Thursday: "#ef4444" };
                const color = colors[day] || "#6366f1";
                return (
                  <View key={day} style={[styles.dayChip, { backgroundColor: color + "15", borderColor: color, borderWidth: 1 }]}>
                    <Text style={[styles.dayChipText, { color }]}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {advice && (
            <View style={styles.adviceCard}>
              <Text style={styles.adviceTitle}>🤖 AI Academic Advisor</Text>

              <Text style={styles.adviceSectionLabel}>Summary</Text>
              <Text style={styles.adviceText}>"{advice.summary}"</Text>

              {advice.reasoning && (
                <>
                  <Text style={styles.adviceSectionLabel}>Strategy</Text>
                  <Text style={styles.adviceText}>{advice.reasoning}</Text>
                </>
              )}

              {advice.tips && advice.tips.length > 0 && (
                <>
                  <View style={styles.adviceDivider} />
                  <Text style={styles.adviceSectionLabel}>Tips for Success</Text>
                  {advice.tips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                      <Text style={styles.tipDot}>•</Text>
                      <Text style={styles.tipRowText}>{tip}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          <View style={styles.enrollCard}>
            <Text style={styles.enrollTitle}>Auto-Enroll</Text>
            <Text style={styles.enrollSub}>
              Would you like to enroll in all these courses now? This will register you for the optimized schedule.
            </Text>
            {enrollSuccess ? (
              <View style={styles.enrollSuccessBanner}>
                <Text style={styles.enrollSuccessText}>✅ Enrolled Successfully</Text>
              </View>
            ) : (
              isRegistrationOpenForMe && (
                <TouchableOpacity
                  style={styles.enrollBtn}
                  onPress={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <ActivityIndicator color="#6366f1" />
                  ) : (
                    <Text style={styles.enrollBtnText}>Confirm Enrollment</Text>
                  )}
                </TouchableOpacity>
              )
            )}
          </View>

          <Text style={styles.timetableTitle}>Proposed Timetable</Text>
          {schedule.courses.map((course, idx) => (
            <View key={course._id || idx} style={styles.timetableCard}>
              <View style={styles.timetableTop}>
                <Text style={styles.timetableCode}>{course.code}</Text>
                <View style={styles.timetableCreditBadge}>
                  <Text style={styles.timetableCreditText}>{course.credits} Cr</Text>
                </View>
                {course.group && (
                  <View style={styles.timetableGroupBadge}>
                    <Text style={styles.timetableGroupText}>Grp {course.group}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.timetableName}>{course.name}</Text>
              <View style={styles.timetableDetails}>
                <Text style={styles.timetableDetail}>👤 {course.instructor || "TBA"}</Text>
                <Text style={styles.timetableDetail}>📍 {course.room || "TBA"}</Text>
              </View>
              <View style={styles.timetableSchedule}>
                <View style={styles.dayScheduleBadge}>
                  <Text style={styles.dayScheduleText}>📅 {course.day}</Text>
                </View>
                <View style={styles.timeScheduleBadge}>
                  <Text style={styles.timeScheduleText}>🕐 {course.time}</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#888", fontSize: 14 },
  loadingTitle: { marginTop: 16, fontSize: 18, fontWeight: "700", color: "#111", textAlign: "center" },
  loadingSub: { marginTop: 8, fontSize: 13, color: "#888", textAlign: "center" },


  header: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 },
  headerIconBox: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "#6366f1", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  headerIcon: { fontSize: 28 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 8 },
  headerSub: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20 },
  headerHighlight: { color: "#6366f1", fontWeight: "700" },


  errorCard: {
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 20, marginHorizontal: 16, padding: 24, alignItems: "center",
  },
  errorIcon: { fontSize: 40, marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#991b1b", marginBottom: 8 },
  errorMessage: { fontSize: 14, color: "#dc2626", textAlign: "center", marginBottom: 20 },
  errorBtn: { backgroundColor: "#dc2626", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  errorBtnText: { color: "#fff", fontWeight: "700" },

  selectionCard: {
    backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 5,
  },
  selectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  selectionTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  selectionSub: { fontSize: 12, color: "#888", marginTop: 4, maxWidth: 200 },
  creditCounter: { alignItems: "flex-end" },
  creditValue: { fontSize: 24, fontWeight: "900" },
  creditRange: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  creditLabel: { fontSize: 9, color: "#aaa", fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },

  recommendBtn: {
    marginTop: 10,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  recommendBtnText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "700",
  },

  warningBanner: {
    backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a",
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  warningText: { fontSize: 13, color: "#92400e" },

  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  emptySub: { fontSize: 12, color: "#888", marginTop: 4, textAlign: "center" },

  courseOption: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderRadius: 14, borderWidth: 2, borderColor: "#f3f4f6",
    backgroundColor: "#fff", marginBottom: 10,
  },
  courseOptionSelected: {
    borderColor: "#6366f1", backgroundColor: "#eef2ff",
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  courseOptionTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  courseOptionCode: { fontSize: 11, fontWeight: "800", color: "#6366f1", textTransform: "uppercase" },
  creditBadge: { backgroundColor: "#f3f4f6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  creditBadgeText: { fontSize: 9, fontWeight: "800", color: "#888" },
  groupBadge: { backgroundColor: "#eff6ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  groupBadgeText: { fontSize: 9, fontWeight: "800", color: "#3b82f6" },
  courseOptionName: { fontSize: 14, fontWeight: "700", color: "#111" },
  courseOptionHint: { fontSize: 11, color: "#aaa", marginTop: 4 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: "#d1d5db",
    alignItems: "center", justifyContent: "center", marginLeft: 12,
  },
  checkCircleSelected: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  checkMark: { color: "#fff", fontSize: 12, fontWeight: "800" },

  generateBtn: {
    backgroundColor: "#6366f1", paddingVertical: 16, borderRadius: 14,
    alignItems: "center", marginTop: 20,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  generateBtnDisabled: { backgroundColor: "#d1d5db", shadowOpacity: 0 },
  generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  tipCard: {
    backgroundColor: "#eef2ff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 16,
  },
  tipText: { fontSize: 13, color: "#4338ca", lineHeight: 18 },
  tipBold: { fontWeight: "800" },

  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0",
    borderRadius: 14, marginHorizontal: 16, padding: 16, marginBottom: 8,
  },
  successIcon: { fontSize: 20 },
  successTitle: { fontSize: 14, fontWeight: "800", color: "#166534" },
  successSub: { fontSize: 12, color: "#15803d", marginTop: 2 },
  changeLink: { color: "#15803d", fontWeight: "700", fontSize: 13 },

  statsCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12,
    borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  statsTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 16 },
  statsGrid: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  statItem: { alignItems: "center" },
  statItemValue: { fontSize: 28, fontWeight: "900", color: "#6366f1" },
  statItemLabel: { fontSize: 11, color: "#888", fontWeight: "700", textTransform: "uppercase", marginTop: 4 },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: { backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  dayChipText: { fontSize: 12, fontWeight: "700", color: "#555" },

  adviceCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12,
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#e0e7ff",
  },
  adviceTitle: { fontSize: 16, fontWeight: "800", color: "#312e81", marginBottom: 16 },
  adviceSectionLabel: { fontSize: 12, fontWeight: "800", color: "#111", marginBottom: 4 },
  adviceText: { fontSize: 13, color: "#555", lineHeight: 18, marginBottom: 12, fontStyle: "italic" },
  adviceDivider: { height: 1, backgroundColor: "#e0e7ff", marginVertical: 8 },
  tipRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  tipDot: { color: "#6366f1", fontWeight: "800", fontSize: 14 },
  tipRowText: { fontSize: 12, color: "#555", flex: 1, lineHeight: 16 },

  enrollCard: {
    backgroundColor: "#6366f1", marginHorizontal: 16, marginTop: 12,
    borderRadius: 20, padding: 20,
    shadowColor: "#6366f1", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  enrollTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 8 },
  enrollSub: { fontSize: 13, color: "#c7d2fe", marginBottom: 16 },
  enrollSuccessBanner: {
    backgroundColor: "#22c55e", padding: 12, borderRadius: 12, alignItems: "center",
  },
  enrollSuccessText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  enrollBtn: {
    backgroundColor: "#fff", paddingVertical: 14, borderRadius: 12, alignItems: "center",
  },
  enrollBtnText: { color: "#6366f1", fontWeight: "800", fontSize: 15 },

  timetableTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  timetableCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  timetableTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  timetableCode: { fontSize: 12, fontWeight: "800", color: "#6366f1", textTransform: "uppercase", letterSpacing: 0.5 },
  timetableCreditBadge: { backgroundColor: "#f5f3ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  timetableCreditText: { fontSize: 10, fontWeight: "800", color: "#7c3aed" },
  timetableGroupBadge: { backgroundColor: "#eef2ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  timetableGroupText: { fontSize: 10, fontWeight: "800", color: "#6366f1" },
  timetableName: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 8 },
  timetableDetails: { flexDirection: "row", gap: 16, marginBottom: 10 },
  timetableDetail: { fontSize: 12, color: "#888" },
  timetableSchedule: { flexDirection: "row", gap: 10 },
  dayScheduleBadge: {
    flex: 1, backgroundColor: "#eff6ff", paddingVertical: 8, borderRadius: 10, alignItems: "center",
  },
  dayScheduleText: { fontSize: 12, fontWeight: "700", color: "#2563eb" },
  timeScheduleBadge: {
    flex: 1, backgroundColor: "#f8fafc", paddingVertical: 8, borderRadius: 10, alignItems: "center",
  },
  timeScheduleText: { fontSize: 12, fontWeight: "700", color: "#555" },

  // Registration Closed Styles
  closedBanner: {
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  closedIconSmall: { fontSize: 20, marginRight: 12 },
  closedTextSmall: { fontSize: 13, color: "#991b1b", fontWeight: "600", flex: 1 },
});
