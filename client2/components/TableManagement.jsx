import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { courseApi } from "../utils/api";
import { TIME_SLOTS } from "../constants/data";

const { width } = Dimensions.get("window");

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const DAY_COLORS = {
  Saturday: "#6366f1",
  Sunday: "#3b82f6",
  Monday: "#8b5cf6",
  Tuesday: "#f59e0b",
  Wednesday: "#22c55e",
  Thursday: "#ef4444",
};
const COURSE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#6366f1", "#f97316"];

export default function TableManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [conflict, setConflict] = useState(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchCourses();
  }, []);

  
  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.code?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.instructor?.toLowerCase().includes(q)
    );
  });

  
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const dayOrder = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    if (dayOrder !== 0) return dayOrder;
    return (a.time || "").localeCompare(b.time || "");
  });

  
  const openEdit = (course) => {
    setEditingCourse(course);
    setEditForm({
      day: course.day || "Sunday",
      time: course.time || TIME_SLOTS[0].value,
      room: course.room || "",
      capacity: String(course.capacity || ""),
      instructor: course.instructor || "",
    });
    setConflict(null);
    setEditModalVisible(true);
  };

  
  const checkConflicts = (form, courseId) => {
    const otherCourses = courses.filter((c) => (c._id || c.id) !== courseId);

    
    const roomConflict = otherCourses.find(
      (c) => c.room === form.room && c.day === form.day && c.time === form.time
    );
    if (roomConflict) {
      return `🏫 Room conflict: ${form.room} is already occupied by ${roomConflict.code} on ${form.day} at ${form.time}`;
    }

    
    const instructorConflict = otherCourses.find(
      (c) => c.instructor === form.instructor && c.day === form.day && c.time === form.time
    );
    if (instructorConflict) {
      return `👨‍🏫 Instructor conflict: ${form.instructor} is already teaching ${instructorConflict.code} on ${form.day} at ${form.time}`;
    }

    return null;
  };

  
  const saveSchedule = async () => {
    const cap = parseInt(editForm.capacity, 10);
    if (!cap || cap < 1) {
      Alert.alert("Error", "Please enter a valid capacity");
      return;
    }
    if (cap < (editingCourse.enrolled || 0)) {
      Alert.alert("Error", `Capacity cannot be less than current enrollment (${editingCourse.enrolled} students)`);
      return;
    }
    if (!editForm.room.trim()) {
      Alert.alert("Error", "Please enter a room");
      return;
    }
    if (!editForm.instructor.trim()) {
      Alert.alert("Error", "Please enter an instructor name");
      return;
    }

    const conflictMsg = checkConflicts(editForm, editingCourse._id || editingCourse.id);
    if (conflictMsg) {
      setConflict(conflictMsg);
      return;
    }

    try {
      setSaving(true);
      await courseApi.update(editingCourse._id || editingCourse.id, {
        day: editForm.day,
        time: editForm.time,
        room: editForm.room.trim(),
        capacity: cap,
        instructor: editForm.instructor.trim(),
      });
      setEditModalVisible(false);
      await fetchCourses();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  
  const updateForm = (key, value) => {
    const newForm = { ...editForm, [key]: value };
    setEditForm(newForm);
    if (editingCourse) {
      setConflict(checkConflicts(newForm, editingCourse._id || editingCourse.id));
    }
  };

  
  const getCourseColor = (courseId) => {
    const idx = courses.findIndex((c) => (c._id || c.id) === courseId);
    return COURSE_COLORS[idx % COURSE_COLORS.length];
  };

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2554e8" />
      </View>
    );
  }

  
  const renderWeeklyView = () => {
    const getCoursesForSlot = (day, timeSlot) => {
      return courses.filter((c) => c.day === day && c.time === timeSlot);
    };

    return (
      <View style={{ flex: 1 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ width: 800, flex: 1 }}>
            {/* Sticky-like Header */}
            <View style={styles.weeklyHeaderRow}>
              <View style={styles.weeklyDayHeaderCell}>
                <Text style={styles.weeklyDayHeaderText}>Day</Text>
              </View>
              {TIME_SLOTS.map((slot) => (
                <View key={slot.value} style={styles.weeklySlotHeaderCell}>
                  <Text style={styles.weeklySlotHeaderText}>{slot.label.split(' ')[1]}</Text>
                  <Text style={styles.weeklySlotTimeText}>{slot.value}</Text>
                </View>
              ))}
            </View>

            {/* Scrollable Body */}
            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {DAYS.map((day) => (
                <View key={day} style={styles.weeklyRow}>
                  <View style={[styles.weeklyDayCell, { borderLeftColor: DAY_COLORS[day] }]}>
                    <Text style={[styles.weeklyDayText, { color: DAY_COLORS[day] }]}>{day.substring(0, 3)}</Text>
                  </View>
                  {TIME_SLOTS.map((slot) => {
                    const slotCourses = getCoursesForSlot(day, slot.value);
                    const hasConflict = slotCourses.length > 1;
                    
                    return (
                      <View key={slot.value} style={[styles.weeklyCell, hasConflict && styles.weeklyCellConflictContainer]}>
                        {slotCourses.length > 0 ? (
                          slotCourses.map((course) => {
                            const color = getCourseColor(course._id || course.id);
                            return (
                              <TouchableOpacity
                                key={course._id || course.id}
                                style={[
                                  styles.weeklyCellFilled,
                                  { backgroundColor: color + "10", borderColor: color + "40" },
                                  hasConflict && styles.weeklyCellConflict,
                                ]}
                                onPress={() => openEdit(course)}
                              >
                                <Text style={[styles.weeklyCourseCode, { color }]} numberOfLines={1}>{course.code}</Text>
                                <Text style={styles.weeklyCourseRoom} numberOfLines={1}>{course.room}</Text>
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <Text style={styles.weeklyCellEmpty}>—</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  };

  
  const renderListView = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {sortedCourses.length === 0 ? (
        <Text style={styles.emptyText}>
          {searchQuery ? "No courses match your search" : "No courses found. Create courses first."}
        </Text>
      ) : (
        sortedCourses.map((course, index) => {
          const color = getCourseColor(course._id || course.id);

          return (
            <View key={course._id || course.id || `course-${index}`} style={styles.courseCard}>
              <View style={styles.courseCardTop}>
                <View style={[styles.courseCodeBadge, { backgroundColor: color + "18" }]}>
                  <Text style={[styles.courseCodeText, { color }]}>{course.code}</Text>
                </View>
                <Text style={styles.courseName} numberOfLines={1}>{course.name}</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(course)}>
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.courseInfoGrid}>
                <View style={styles.courseInfoItem}>
                  <Text style={styles.courseInfoIcon}>📅</Text>
                  <Text style={styles.courseInfoValue}>{course.day}</Text>
                </View>
                <View style={styles.courseInfoItem}>
                  <Text style={styles.courseInfoIcon}>🕐</Text>
                  <Text style={styles.courseInfoValue}>{course.time}</Text>
                </View>
                <View style={styles.courseInfoItem}>
                  <Text style={styles.courseInfoIcon}>📍</Text>
                  <Text style={styles.courseInfoValue}>{course.room}</Text>
                </View>
                <View style={styles.courseInfoItem}>
                  <Text style={styles.courseInfoIcon}>👨‍🏫</Text>
                  <Text style={styles.courseInfoValue}>{course.instructor}</Text>
                </View>
              </View>

              {/* Capacity bar */}
              <View style={styles.capacitySection}>
                <View style={styles.capacityHeader}>
                  <Text style={styles.capacityLabel}>Capacity</Text>
                  <Text style={styles.capacityValue}>{course.enrolledCount || 0}/{course.capacity} ({Math.round(((course.enrolledCount || 0) / course.capacity) * 100)}%)</Text>
                </View>
                <View style={styles.capacityBarBg}>
                  <View
                    style={[
                      styles.capacityBarFill,
                      {
                        width: `${Math.round(((course.enrolledCount || 0) / course.capacity) * 100)}%`,
                        backgroundColor: (course.enrolledCount / course.capacity) >= 0.9 ? "#ef4444" : (course.enrolledCount / course.capacity) >= 0.7 ? "#f59e0b" : "#22c55e",
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Table Management</Text>
          <Text style={styles.headerSub}>Manage course schedules & timetable</Text>
        </View>
      </View>

      {/* View Toggle + Search */}
      <View style={styles.controlsRow}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
            onPress={() => setViewMode("list")}
          >
            <Text style={[styles.toggleBtnText, viewMode === "list" && styles.toggleBtnTextActive]}>📋 List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "weekly" && styles.toggleBtnActive]}
            onPress={() => setViewMode("weekly")}
          >
            <Text style={[styles.toggleBtnText, viewMode === "weekly" && styles.toggleBtnTextActive]}>📊 Weekly</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "list" && (
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by code, name, or instructor..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Content */}
      {viewMode === "list" ? renderListView() : renderWeeklyView()}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Schedule</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {editingCourse && (
                <View style={styles.editCourseInfo}>
                  <Text style={styles.editCourseCode}>{editingCourse.code}</Text>
                  <Text style={styles.editCourseName}>{editingCourse.name}</Text>
                  <Text style={styles.editCourseEnrolled}>Currently enrolled: {editingCourse.enrolled} students</Text>
                </View>
              )}

              {/* Conflict Alert */}
              {conflict && (
                <View style={styles.conflictAlert}>
                  <Text style={styles.conflictText}>{conflict}</Text>
                </View>
              )}

              {/* Day Picker */}
              <Text style={styles.fieldLabel}>Day</Text>
              <View style={styles.pillRow}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.pill, editForm.day === day && [styles.pillSelected, { backgroundColor: DAY_COLORS[day] + "20", borderColor: DAY_COLORS[day] }]]}
                    onPress={() => updateForm("day", day)}
                  >
                    <Text style={[styles.pillText, editForm.day === day && { color: DAY_COLORS[day] }]}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time Slot Picker */}
              <Text style={styles.fieldLabel}>Time Slot</Text>
              <View style={styles.pillRow}>
                {TIME_SLOTS.map((slot) => (
                  <TouchableOpacity
                    key={slot.value}
                    style={[styles.slotPill, editForm.time === slot.value && styles.slotPillSelected]}
                    onPress={() => updateForm("time", slot.value)}
                  >
                    <Text style={[styles.slotPillText, editForm.time === slot.value && styles.slotPillTextSelected]}>
                      {slot.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Room */}
              <Text style={styles.fieldLabel}>Room</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Hall A-201"
                placeholderTextColor="#aaa"
                value={editForm.room}
                onChangeText={(v) => updateForm("room", v)}
              />

              {/* Capacity */}
              <Text style={styles.fieldLabel}>Capacity</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. 40"
                placeholderTextColor="#aaa"
                value={editForm.capacity}
                onChangeText={(v) => updateForm("capacity", v)}
                keyboardType="numeric"
              />

              {/* Instructor */}
              <Text style={styles.fieldLabel}>Instructor</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="e.g. Dr. Ahmad Khalil"
                placeholderTextColor="#aaa"
                value={editForm.instructor}
                onChangeText={(v) => updateForm("instructor", v)}
              />

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !!conflict && styles.saveBtnDisabled]}
                  onPress={saveSchedule}
                  disabled={!!conflict || saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },
  headerSub: { fontSize: 13, color: "#888", marginTop: 2 },

  controlsRow: {
    paddingHorizontal: 16, paddingTop: 12,
  },
  viewToggle: {
    flexDirection: "row", backgroundColor: "#e5e7eb", borderRadius: 12, padding: 4,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  toggleBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  toggleBtnTextActive: { color: "#2554e8" },

  searchContainer: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: "#e5e7eb",
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#222" },
  clearSearch: { fontSize: 16, color: "#aaa", padding: 4 },

  courseCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 10,
    borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  courseCardTop: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12,
  },
  courseCodeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  courseCodeText: { fontSize: 13, fontWeight: "800" },
  courseName: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111" },
  editBtn: {
    backgroundColor: "#2554e820", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  editBtnText: { fontSize: 12, fontWeight: "700", color: "#2554e8" },

  courseInfoGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12,
  },
  courseInfoItem: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f8fafc", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  courseInfoIcon: { fontSize: 12 },
  courseInfoValue: { fontSize: 12, fontWeight: "600", color: "#555" },

  capacitySection: { marginTop: 4 },
  capacityHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  capacityLabel: { fontSize: 11, fontWeight: "600", color: "#888" },
  capacityValue: { fontSize: 11, fontWeight: "700", color: "#555" },
  capacityBarBg: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  capacityBarFill: { height: 6, borderRadius: 3 },

  weeklyRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e5e7eb" },
  weeklyHeaderRow: { flexDirection: "row", backgroundColor: "#f8fafc", borderBottomWidth: 2, borderColor: "#e2e8f0" },
  weeklyDayHeaderCell: {
    width: 70, paddingVertical: 15, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderColor: "#e2e8f0",
  },
  weeklyDayHeaderText: { fontSize: 13, fontWeight: "800", color: "#64748b", textTransform: "uppercase" },
  weeklySlotHeaderCell: {
    width: 120, paddingVertical: 10, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderColor: "#e2e8f0",
  },
  weeklySlotHeaderText: { fontSize: 11, fontWeight: "800", color: "#1e293b" },
  weeklySlotTimeText: { fontSize: 9, color: "#94a3b8", marginTop: 2, fontWeight: "600" },

  weeklyDayCell: {
    width: 70, paddingVertical: 15, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff",
    borderLeftWidth: 4,
  },
  weeklyDayText: { fontSize: 13, fontWeight: "800" },

  weeklyCell: {
    width: 120, minHeight: 100, padding: 4, gap: 4,
    borderRightWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
  },
  weeklyCellFilled: {
    width: "100%", padding: 6, borderRadius: 8,
    borderWidth: 1,
  },
  weeklyCellConflictContainer: {
    backgroundColor: "#fff1f2",
  },
  weeklyCellConflict: {
    borderColor: "#f43f5e",
    backgroundColor: "#fff1f2",
    borderWidth: 2,
  },
  weeklyCellEmpty: { fontSize: 14, color: "#e2e8f0", fontWeight: "300" },
  weeklyCourseCode: { fontSize: 11, fontWeight: "800" },
  weeklyCourseRoom: { fontSize: 8, color: "#64748b", marginTop: 1, fontWeight: "500" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  closeIcon: { fontSize: 18, color: "#888", fontWeight: "600" },

  editCourseInfo: {
    backgroundColor: "#f8fafc", padding: 14, borderRadius: 12, marginBottom: 16,
  },
  editCourseCode: { fontSize: 15, fontWeight: "800", color: "#2554e8" },
  editCourseName: { fontSize: 14, fontWeight: "600", color: "#333", marginTop: 2 },
  editCourseEnrolled: { fontSize: 12, color: "#888", marginTop: 4 },

  conflictAlert: {
    backgroundColor: "#fef2f2", borderWidth: 1.5, borderColor: "#fca5a5",
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  conflictText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },

  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 4 },
  fieldInput: {
    borderWidth: 1.5, borderColor: "#e0e0e0", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: "#222", backgroundColor: "#fafafa", marginBottom: 12,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fafafa",
  },
  pillText: { fontSize: 12, fontWeight: "700", color: "#888" },
  pillSelected: { backgroundColor: "#2554e820", borderColor: "#2554e8" },

  slotPill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#e0e0e0", backgroundColor: "#fafafa",
  },
  slotPillSelected: { backgroundColor: "#2554e820", borderColor: "#2554e8" },
  slotPillText: { fontSize: 11, fontWeight: "700", color: "#888" },
  slotPillTextSelected: { color: "#2554e8" },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 20 },
  cancelBtn: { flex: 1, backgroundColor: "#f0f2f5", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  cancelBtnText: { fontWeight: "700", color: "#555" },
  saveBtn: { flex: 1, backgroundColor: "#2554e8", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#ccc" },
  saveBtnText: { fontWeight: "700", color: "#fff" },
});
