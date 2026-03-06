import { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView, StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const initialCourses = [
  { id: 1, code: "CS303", name: "Software Engineering", instructor: "Dr. Khalid Nasser", day: "Sunday", time: "08:00 – 09:30", room: "B-201", credits: 3, groups: [{ id: 1, name: "G1", capacity: 25, enrolled: 22 }, { id: 2, name: "G2", capacity: 25, enrolled: 23 }] },
  { id: 2, code: "CS311", name: "Database Systems", instructor: "Dr. Sara Ahmed", day: "Monday", time: "10:00 – 11:30", room: "A-104", credits: 3, groups: [{ id: 1, name: "G1", capacity: 40, enrolled: 38 }] },
  { id: 3, code: "CS321", name: "Computer Networks", instructor: "Dr. Omar Farouk", day: "Tuesday", time: "12:00 – 13:30", room: "C-305", credits: 3, groups: [{ id: 1, name: "G1", capacity: 30, enrolled: 25 }, { id: 2, name: "G2", capacity: 30, enrolled: 15 }] },
];

const dayColors = {
  Sunday: "#ef4444", Monday: "#3b82f6", Tuesday: "#22c55e",
  Wednesday: "#f59e0b", Thursday: "#8b5cf6", Saturday: "#ec4899",
};

export default function CourseManagement() {
  const [courses, setCourses] = useState(initialCourses);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", instructor: "", day: "Monday", time: "", room: "", credits: "3" });

  const openAddModal = () => {
    setEditingCourse(null);
    setForm({ code: "", name: "", instructor: "", day: "Monday", time: "", room: "", credits: "3" });
    setModalVisible(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setForm({ code: course.code, name: course.name, instructor: course.instructor, day: course.day, time: course.time, room: course.room, credits: String(course.credits) });
    setModalVisible(true);
  };

  const saveCourse = () => {
    if (!form.code || !form.name || !form.instructor) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    if (editingCourse) {
      setCourses(courses.map(c => c.id === editingCourse.id ? { ...c, ...form, credits: Number(form.credits) } : c));
    } else {
      setCourses([...courses, { id: Date.now(), ...form, credits: Number(form.credits), groups: [{ id: 1, name: "G1", capacity: 30, enrolled: 0 }] }]);
    }
    setModalVisible(false);
  };

  const deleteCourse = (id) => {
    Alert.alert("Delete Course", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setCourses(courses.filter(c => c.id !== id)) },
    ]);
  };

  const openGroupModal = (course) => {
    setSelectedCourse(course);
    setGroupModalVisible(true);
  };

  const updateGroupCapacity = (courseId, groupId, delta) => {
    setCourses(courses.map(c => c.id === courseId ? {
      ...c,
      groups: c.groups.map(g => g.id === groupId ? { ...g, capacity: Math.max(g.enrolled, g.capacity + delta) } : g)
    } : c));
  };

  const addGroup = (courseId) => {
    setCourses(courses.map(c => c.id === courseId ? {
      ...c,
      groups: [...c.groups, { id: Date.now(), name: `G${c.groups.length + 1}`, capacity: 30, enrolled: 0 }]
    } : c));
  };

  const deleteGroup = (courseId, groupId) => {
    setCourses(courses.map(c => c.id === courseId ? {
      ...c, groups: c.groups.filter(g => g.id !== groupId)
    } : c));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course Management</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Text style={styles.addBtnText}>+ Add Course</Text>
          </TouchableOpacity>
        </View>

        {/* COURSE LIST */}
        {courses.map((course) => {
          const totalEnrolled = course.groups.reduce((a, g) => a + g.enrolled, 0);
          const totalCapacity = course.groups.reduce((a, g) => a + g.capacity, 0);
          const dayColor = dayColors[course.day] || "#888";
          return (
            <View key={course.id} style={styles.courseCard}>
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
              <Text style={styles.courseDetail}>👥 {totalEnrolled}/{totalCapacity} enrolled  •  {course.groups.length} group(s)</Text>

              <View style={styles.courseActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openGroupModal(course)}>
                  <Text style={styles.actionBtnText}>👥 Groups</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => openEditModal(course)}>
                  <Text style={styles.actionBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => deleteCourse(course.id)}>
                  <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADD / EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingCourse ? "Edit Course" : "Add New Course"}</Text>
            {[
              { label: "Course Code *", key: "code", placeholder: "e.g. CS303" },
              { label: "Course Name *", key: "name", placeholder: "e.g. Software Engineering" },
              { label: "Instructor *", key: "instructor", placeholder: "e.g. Dr. Khalid" },
              { label: "Day", key: "day", placeholder: "e.g. Monday" },
              { label: "Time", key: "time", placeholder: "e.g. 08:00 – 09:30" },
              { label: "Room", key: "room", placeholder: "e.g. B-201" },
              { label: "Credits", key: "credits", placeholder: "e.g. 3" },
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
              <TouchableOpacity style={styles.saveBtn} onPress={saveCourse}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* GROUP MODAL */}
      <Modal visible={groupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Groups — {selectedCourse?.code}</Text>
            {selectedCourse?.groups.map((group) => (
              <View key={group.id} style={styles.groupRow}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupCount}>{group.enrolled}/{group.capacity}</Text>
                <TouchableOpacity style={styles.groupBtn} onPress={() => updateGroupCapacity(selectedCourse.id, group.id, -5)}>
                  <Text style={styles.groupBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.groupBtn} onPress={() => updateGroupCapacity(selectedCourse.id, group.id, 5)}>
                  <Text style={styles.groupBtnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteGroup(selectedCourse.id, group.id)}>
                  <Text style={{ color: "#ef4444", fontSize: 16 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addGroupBtn} onPress={() => addGroup(selectedCourse?.id)}>
              <Text style={styles.addGroupBtnText}>+ Add New Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setGroupModalVisible(false)}>
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: "#fff",
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
  courseActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: "#f0f2f5", paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  editBtn: { backgroundColor: "#eff6ff" },
  deleteBtn: { backgroundColor: "#fef2f2" },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: "#333" },
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
  groupRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  groupName: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111" },
  groupCount: { fontSize: 13, color: "#888", fontWeight: "600" },
  groupBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#f0f2f5", alignItems: "center", justifyContent: "center" },
  groupBtnText: { fontSize: 18, fontWeight: "700", color: "#2554e8" },
  addGroupBtn: { marginTop: 12, backgroundColor: "#eff6ff", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginBottom: 12 },
  addGroupBtnText: { color: "#2554e8", fontWeight: "700" },
});
