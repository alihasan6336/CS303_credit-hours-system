import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { courseApi } from "../utils/api";

const dayColors = {
  Sunday: "#3b82f6", Monday: "#8b5cf6", Tuesday: "#f59e0b", Wednesday: "#22c55e", Thursday: "#ef4444", Saturday: "#06b6d4",
};

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", instructor: "", day: "Monday", time: "", room: "",
    credits: "3", capacity: "30", prerequisites: "",
    courseType: "Lecture", semester: ["Fall"], passingGrade: "50",
    major: "Computer Science", studentYear: "1",
  });

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
    setEditingCourse(null);
    setForm({
        code: "", name: "", instructor: "", day: "Monday", time: "", room: "",
        credits: "3", capacity: "30", prerequisites: "",
        courseType: "Lecture", semester: ["Fall"], passingGrade: "50",
        major: "Computer Science", studentYear: "1",
    });
    setModalVisible(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setForm({
      code: course.code,
      name: course.name,
      instructor: course.instructor,
      day: course.day,
      time: course.time,
      room: course.room,
      credits: String(course.credits),
      capacity: String(course.capacity),
      prerequisites: course.prerequisites ? course.prerequisites.join(", ") : "",
      courseType: course.courseType || "Lecture",
      semester: Array.isArray(course.semester) ? course.semester : [course.semester],
      passingGrade: String(course.passingGrade || "50"),
      major: course.major || "Computer Science",
      studentYear: String(course.studentYear || "1"),
    });
    setModalVisible(true);
  };

  const saveCourse = async () => {
    if (!form.code || !form.name || !form.instructor) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        code: form.code,
        name: form.name,
        instructor: form.instructor,
        day: form.day,
        time: form.time,
        room: form.room,
        credits: Number(form.credits),
        capacity: Number(form.capacity),
        prerequisites: form.prerequisites.split(",").map(p => p.trim()).filter(Boolean),
        courseType: form.courseType,
        semester: form.semester,
        passingGrade: Number(form.passingGrade),
        major: form.major,
        studentYear: Number(form.studentYear),
      };

      if (editingCourse) {
        await courseApi.update(editingCourse._id || editingCourse.id, payload);
      } else {
        await courseApi.create(payload);
      }
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

        {[1, 2, 3, 4].map(level => {
          const levelCourses = courses.filter(c => parseInt(c.studentYear || 1) === level);
          if (levelCourses.length === 0) return null;
          return (
            <View key={level} style={{ marginBottom: 20 }}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelHeaderText}>Level {level}</Text>
                <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>{levelCourses.length} Courses</Text></View>
              </View>
              {levelCourses.map((course) => {
                const dayColor = dayColors[course.day] || "#888";
                const courseId = course._id || course.id;
                return (
                  <View key={courseId} style={styles.courseCard}>
                    <View style={styles.courseCardTop}>
                      <Text style={[styles.courseCode, { color: dayColor }]}>{course.code}</Text>
                      <View style={[styles.dayBadge, { backgroundColor: dayColor + "20", borderColor: dayColor }]}>
                        <Text style={[styles.dayText, { color: dayColor }]}>{course.day}</Text>
                      </View>
                      <View style={styles.creditBadge}>
                        <Text style={styles.creditText}>{course.credits} cr</Text>
                      </View>
                      <TouchableOpacity onPress={() => openEditModal(course)} style={styles.editBtn}>
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.courseName}>{course.name}</Text>
                    <Text style={styles.courseDetail}>👤 {course.instructor}</Text>
                    <Text style={styles.courseDetail}>🕐 {course.time}  📍 {course.room}</Text>
                    <Text style={styles.courseDetail}>👥 {course.enrolledCount || 0}/{course.capacity} enrolled</Text>
                    {course.prerequisites?.length > 0 && (
                      <Text style={styles.coursePrereq}>Pre: {course.prerequisites.join(", ")}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        {courses.length === 0 && <Text style={styles.emptyText}>No courses found</Text>}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingCourse ? "Edit Course" : "Add New Course"}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              {[
                { label: "Course Code *", key: "code", placeholder: "e.g. CS303" },
                { label: "Course Name *", key: "name", placeholder: "e.g. Software Engineering" },
                { label: "Instructor *", key: "instructor", placeholder: "e.g. Dr. Khalid" },
                { label: "Room", key: "room", placeholder: "e.g. B-201" },
                { label: "Credits", key: "credits", placeholder: "e.g. 3" },
                { label: "Capacity", key: "capacity", placeholder: "e.g. 30" },
                { label: "Passing Grade", key: "passingGrade", placeholder: "e.g. 50" },
                { label: "Prerequisites", key: "prerequisites", placeholder: "e.g. CS101, CS202" },
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

              <Text style={styles.fieldLabel}>Course Type</Text>
              <View style={styles.dayRow}>
                {["Lecture", "Lab"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.dayPill, form.courseType === t && styles.pillSelected]}
                    onPress={() => setForm({ ...form, courseType: t, time: "" })}
                  >
                    <Text style={[styles.dayPillText, form.courseType === t && styles.pillTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Time</Text>
              <View style={styles.dayRow}>
                {(form.courseType === "Lab" 
                  ? ["08:00 - 11:00", "11:00 - 14:00", "14:00 - 17:00", "17:00 - 20:00"]
                  : ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00"]
                ).map((timeSlot) => (
                  <TouchableOpacity
                    key={timeSlot}
                    style={[styles.dayPill, form.time === timeSlot && styles.pillSelected]}
                    onPress={() => setForm({ ...form, time: timeSlot })}
                  >
                    <Text style={[styles.dayPillText, form.time === timeSlot && styles.pillTextSelected]}>{timeSlot}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Semester (Multi-select)</Text>
              <View style={styles.dayRow}>
                {["Fall", "Spring", "Summer"].map((s) => {
                  const selected = form.semester.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.dayPill, selected && styles.pillSelected]}
                      onPress={() => {
                        const next = selected ? form.semester.filter(i => i !== s) : [...form.semester, s];
                        if (next.length > 0) setForm({ ...form, semester: next });
                      }}
                    >
                      <Text style={[styles.dayPillText, selected && styles.pillTextSelected]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Day</Text>
              <View style={styles.dayRow}>
                {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayPill, form.day === d && styles.pillSelected]}
                    onPress={() => setForm({ ...form, day: d })}
                  >
                    <Text style={[styles.dayPillText, form.day === d && styles.pillTextSelected]}>{d.slice(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Major</Text>
              <View style={styles.dayRow}>
                {['Computer Science', 'Information Technology', 'Software Engineering', 'Cybersecurity', 'Data Science', 'Computer Engineering'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.dayPill, form.major === m && styles.pillSelected]}
                    onPress={() => setForm({ ...form, major: m })}
                  >
                    <Text style={[styles.dayPillText, form.major === m && styles.pillTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Student Year</Text>
              <View style={styles.dayRow}>
                {["1", "2", "3", "4"].map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.dayPill, form.studentYear === y && styles.pillSelected]}
                    onPress={() => setForm({ ...form, studentYear: y })}
                  >
                    <Text style={[styles.dayPillText, form.studentYear === y && styles.pillTextSelected]}>Yr {y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCourse} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  editBtn: { marginLeft: 8 },
  editBtnText: { color: "#2554e8", fontSize: 12, fontWeight: "700" },
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
  coursePrereq: { fontSize: 11, color: "#8b5cf6", fontWeight: "700", marginTop: 4 },
  levelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 20, marginTop: 16, marginBottom: 8 },
  levelHeaderText: { fontSize: 16, fontWeight: "800", color: "#111" },
  levelBadge: { backgroundColor: "#2554e810", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelBadgeText: { fontSize: 11, fontWeight: "700", color: "#2554e8" },
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
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  dayPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fafafa",
  },
  dayPillText: { fontSize: 13, fontWeight: "700", color: "#888" },
  pillSelected: { backgroundColor: "#2554e820", borderColor: "#2554e8" },
  pillTextSelected: { color: "#2554e8" },
});
