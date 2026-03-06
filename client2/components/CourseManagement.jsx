import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { courseApi } from "../utils/api";

const dayColors = {
  Sunday: "#ef4444", Monday: "#3b82f6", Tuesday: "#22c55e",
  Wednesday: "#f59e0b", Thursday: "#8b5cf6", Saturday: "#ec4899",
};

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", instructor: "", day: "Monday", time: "", room: "", credits: "3", capacity: "30" });

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await courseApi.getAll();
      setCourses(response.courses || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const openAddModal = () => {
    setForm({ code: "", name: "", instructor: "", day: "Monday", time: "", room: "", credits: "3", capacity: "30" });
    setModalVisible(true);
  };

  const saveCourse = async () => {
    if (!form.code || !form.name || !form.instructor) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      setSaving(true);
      await courseApi.create({
        code: form.code,
        name: form.name,
        instructor: form.instructor,
        day: form.day,
        time: form.time,
        room: form.room,
        credits: Number(form.credits),
        capacity: Number(form.capacity),
      });
      setModalVisible(false);
      await fetchCourses();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#2554e8" /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course Management</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Text style={styles.addBtnText}>+ Add Course</Text>
          </TouchableOpacity>
        </View>

        {courses.length === 0 ? (
          <Text style={styles.emptyText}>No courses found</Text>
        ) : (
          courses.map((course) => {
            const dayColor = dayColors[course.day] || "#888";
            return (
              <View key={course._id} style={styles.courseCard}>
                <View style={styles.courseCardTop}>
                  <Text style={[styles.courseCode, { color: dayColor }]}>{course.code}</Text>
                  <View style={[styles.dayBadge, { backgroundColor: dayColor + "20", borderColor: dayColor }]}>
                    <Text style={[styles.dayText, { color: dayColor }]}>{course.day}</Text>
                  </View>
                  <View style={styles.creditBadge}>
                    <Text style={styles.creditText}>{course.credits} cr</Text>
                  </View>
                </View>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseDetail}>👤 {course.instructor}</Text>
                <Text style={styles.courseDetail}>🕐 {course.time}  📍 {course.room}</Text>
                <Text style={styles.courseDetail}>👥 {course.enrolledCount}/{course.capacity} enrolled</Text>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add New Course</Text>
            {[
              { label: "Course Code *", key: "code", placeholder: "e.g. CS303" },
              { label: "Course Name *", key: "name", placeholder: "e.g. Software Engineering" },
              { label: "Instructor *", key: "instructor", placeholder: "e.g. Dr. Khalid" },
              { label: "Day", key: "day", placeholder: "e.g. Monday" },
              { label: "Time", key: "time", placeholder: "e.g. 08:00 – 09:30" },
              { label: "Room", key: "room", placeholder: "e.g. B-201" },
              { label: "Credits", key: "credits", placeholder: "e.g. 3" },
              { label: "Capacity", key: "capacity", placeholder: "e.g. 30" },
            ].map((field) => (
              <View key={field.key}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={field.placeholder}
                  placeholderTextColor="#aaa"
                  value={form[field.key]}
                  onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCourse} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", color: "#888", marginTop: 40, fontSize: 15 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },
  addBtn: { backgroundColor: "#2554e8", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  courseCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  courseCardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  courseCode: { fontSize: 13, fontWeight: "700" },
  dayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  dayText: { fontSize: 11, fontWeight: "700" },
  creditBadge: { marginLeft: "auto", backgroundColor: "#f0f2f5", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  creditText: { fontSize: 11, fontWeight: "700", color: "#555" },
  courseName: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 6 },
  courseDetail: { fontSize: 12, color: "#666", marginBottom: 3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#555", marginBottom: 4 },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: "#222", backgroundColor: "#fafafa", marginBottom: 12,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: "#f0f2f5", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  cancelBtnText: { fontWeight: "700", color: "#555" },
  saveBtn: { flex: 1, backgroundColor: "#2554e8", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  saveBtnText: { fontWeight: "700", color: "#fff" },
});
