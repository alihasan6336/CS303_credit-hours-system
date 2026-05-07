import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { authApi, courseApi, gpaApi, userApi } from "../utils/api";

const { width } = Dimensions.get("window");

export default function DashboardScreen({ onNavigateCourses, onUpdateUser }) {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [homeRes, enrolledRes] = await Promise.all([
          authApi.home(),
          courseApi.getMyCourses(),
        ]);
        setStudent({
          ...homeRes.student,
          totalHours: 146,
        });
        const enrolledData = (enrolledRes.data || [])
          .filter(e => e.status === 'active')
          .map(e => ({
          _id: e.course?._id,
          code: e.course?.code,
          name: e.course?.name,
          day: e.course?.day,
          time: e.course?.time,
          room: e.course?.room,
          credits: e.course?.credits,
          instructor: e.course?.instructor,
        }));
        setCourses(enrolledData);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (student?._id) {
      userApi.getAvatar(student._id).then(res => { 
        if (res.photoUrl) {
          setAvatar(res.photoUrl);
          if (onUpdateUser) onUpdateUser({ photoUrl: res.photoUrl });
        }
      }).catch(() => {});
    }
  }, [student?._id]);

  const pickAvatar = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "📷 Take Photo", onPress: openCamera },
      { text: "🖼️ Choose from Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Camera access required."); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) handleUpload(result.assets[0].uri);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Gallery access required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) handleUpload(result.assets[0].uri);
  };

  const handleUpload = async (uri) => {
    try {
      setUploading(true);
      const res = await userApi.uploadAvatar(student._id, uri);
      setAvatar(res.photoUrl);
      if (onUpdateUser) onUpdateUser({ photoUrl: res.photoUrl });
    } catch (err) {
      Alert.alert("Error", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };


  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2554e8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: 20 }]}>
        <Text style={{ color: "#ef4444", fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  const completedHours = student?.completedCreditHours ?? 0;
  const totalHours = student?.totalHours || 146;
  const progress = Math.round((completedHours / totalHours) * 100) || 0;
  const enrolledCount = courses.length;
  const currentCreditHours = courses.reduce((sum, c) => sum + (c.credits || 0), 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hello, {student.fullName}</Text>
          <Text style={styles.headerSub}>{student.currentSemester} — {student.major}</Text>
        </View>

      </View>

      {/* USER CARD */}
      <View style={styles.userCard}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickAvatar} disabled={uploading}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{student.fullName?.substring(0, 2).toUpperCase() || "🧑‍🎓"}</Text>
            </View>
          )}
          <View style={styles.avatarCamBadge}>
            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 10 }}>✏️</Text>}
          </View>
        </TouchableOpacity>
        <View>
          <Text style={styles.userName}>{student.fullName}</Text>
          <Text style={styles.userId}>{student.universityId || student.id}</Text>
        </View>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: "#3b82f6" }]}>
          <Text style={styles.statIcon}>📚</Text>
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Enrolled</Text>
            <Text style={styles.statNumber}>{enrolledCount}</Text>
          </View>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#f59e0b" }]}>
          <Text style={styles.statIcon}>⚡</Text>
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Credits</Text>
            <Text style={styles.statNumber}>{currentCreditHours}</Text>
          </View>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#8b5cf6" }]}>
          <Text style={styles.statIcon}>🎓</Text>
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>GPA</Text>
            <Text style={styles.statNumber}>{student.gpa != null ? student.gpa.toFixed(1) : "N/A"}</Text>
          </View>
        </View>
        <View style={[styles.statCard, { borderLeftColor: "#22c55e" }]}>
          <Text style={styles.statIcon}>✅</Text>
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statNumber}>{completedHours}</Text>
          </View>
        </View>
      </View>

      {/* DEGREE PROGRESS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Degree Progress</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.progressHours}>{completedHours} / {totalHours} hours</Text>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressSub}>{student.academicYear} — Level {student.level || 1}</Text>
          <Text style={styles.progressSub}>{totalHours - completedHours} hrs remaining</Text>
        </View>
      </View>

      {/* STUDENT INFO */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Information</Text>
        {[
          { label: "Student ID", value: student.universityId || student.id },
          { label: "Major", value: student.major },
          { label: "Level", value: student.level || 1 },
          { label: "Semester", value: student.currentSemester },
        ].map((item, i, arr) => (
          <View key={i} style={[styles.infoRow, i !== arr.length - 1 && styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* REGISTERED COURSES */}
      <View style={styles.card}>
        <View style={styles.coursesHeader}>
          <Text style={styles.cardTitle}>Registered Courses</Text>
        </View>

        {courses.map((course, i) => (
          <View key={i} style={[styles.courseCard, i !== courses.length - 1 && styles.courseCardBorder]}>
            <View style={styles.courseTop}>
              <Text style={styles.courseCode}>{course.code}</Text>
              {course.day && (
                <View style={[styles.dayBadge, { backgroundColor: (course.dayColor || "#4f46e5") + "20", borderColor: course.dayColor || "#4f46e5" }]}>
                  <Text style={[styles.dayText, { color: course.dayColor || "#4f46e5" }]}>{course.day}</Text>
                </View>
              )}
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
  avatarWrapper: { position: "relative" },
  avatarImage: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
  },
  avatarCamBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#2554e8",
  },
  userName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  userId: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },

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
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: { fontSize: 24, marginRight: 12 },
  statTextContainer: { flex: 1 },
  statNumber: { fontSize: 22, fontWeight: "800", color: "#111" },
  statLabel: { fontSize: 12, color: "#888", marginBottom: 2, flexWrap: "wrap" },

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
  recordBtn: { backgroundColor: "#f0f2f5", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  recordBtnText: { color: "#2554e8", fontWeight: "700", fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  closeIcon: { fontSize: 18, color: "#888", fontWeight: "600" },
  summaryRow: { flexDirection: "row", backgroundColor: "#f8fafc", borderRadius: 16, padding: 16, marginBottom: 20 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryVal: { fontSize: 24, fontWeight: "900", color: "#2554e8" },
  summaryLab: { fontSize: 10, color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", marginTop: 2 },
  transRow: { flexDirection: "row", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", alignItems: "center" },
  transCode: { fontSize: 13, fontWeight: "800", color: "#2554e8" },
  transName: { fontSize: 13, fontWeight: "600", color: "#1e293b", marginTop: 1 },
  transSem: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  transGrade: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  transGP: { fontSize: 10, color: "#94a3b8", fontWeight: "700", marginTop: 2 },
  emptyTrans: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
});
