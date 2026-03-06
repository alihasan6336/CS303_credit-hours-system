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
import { adminApi } from "../utils/api";

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState("student");
  const [modalVisible, setModalVisible] = useState(false);
  const [accountType, setAccountType] = useState("student");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    studentId: "", level: "1st Year", major: "Computer Science",
    currentSemester: "Fall",
  });

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getStudents();
      setAccounts(response.students || []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const students = accounts.filter(a => a.role === "student");
  const admins = accounts.filter(a => a.role === "superadmin");
  const filtered = tab === "student" ? students : admins;

  const openAddModal = (type) => {
    setAccountType(type);
    setForm({ name: "", email: "", password: "", studentId: "", level: "1st Year", major: "Computer Science", currentSemester: "Fall" });
    setModalVisible(true);
  };

  const saveAccount = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        fullName: form.name,
        email: form.email,
        password: form.password,
        role: accountType === "admin" ? "superadmin" : "student",
      };
      if (accountType === "student") {
        payload.universityId = form.studentId || undefined;
        payload.academicYear = form.level;
        payload.major = form.major;
        payload.currentSemester = form.currentSemester;
      }
      await adminApi.createAccount(payload);
      setModalVisible(false);
      await fetchAccounts();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = (id, name) => {
    Alert.alert("Delete Account", `Delete ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await adminApi.deleteAccount(id);
            await fetchAccounts();
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#2554e8" /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Accounts</Text>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.addAdminBtn} onPress={() => openAddModal("admin")}>
              <Text style={styles.addAdminBtnText}>+ Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addStudentBtn} onPress={() => openAddModal("student")}>
              <Text style={styles.addStudentBtnText}>+ Student</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabBtn, tab === "student" && styles.tabBtnActive]} onPress={() => setTab("student")}>
            <Text style={[styles.tabBtnText, tab === "student" && styles.tabBtnTextActive]}>
              Students ({students.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === "admin" && styles.tabBtnActive]} onPress={() => setTab("admin")}>
            <Text style={[styles.tabBtnText, tab === "admin" && styles.tabBtnTextActive]}>
              Admins ({admins.length})
            </Text>
          </TouchableOpacity>
        </View>

        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No {tab === "student" ? "students" : "admins"} found</Text>
        ) : (
          filtered.map((account) => (
            <View key={account._id} style={styles.accountCard}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountAvatar, { backgroundColor: account.role === "superadmin" ? "#8b5cf620" : "#2554e820" }]}>
                  <Text style={styles.accountAvatarText}>
                    {account.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{account.fullName}</Text>
                  <Text style={styles.accountEmail}>{account.email}</Text>
                  {account.role === "student" && (
                    <Text style={styles.accountMeta}>{account.universityId} • Level {account.level}</Text>
                  )}
                  {account.role === "superadmin" && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>🛡️ Admin</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteAccount(account._id, account.fullName)}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {accountType === "student" ? "Create Student Account" : "Create Admin Account"}
              </Text>

              {[
                { label: "Full Name *", key: "name", placeholder: "e.g. Ahmed Ali" },
                { label: "Email *", key: "email", placeholder: "e.g. ahmed@sci.com" },
                { label: "Password *", key: "password", placeholder: "Set a password", secure: true },
                ...(accountType === "student" ? [
                  { label: "University ID", key: "studentId", placeholder: "Auto-generated if empty" },
                  { label: "Academic Year", key: "level", placeholder: "e.g. 1st Year" },
                  { label: "Major", key: "major", placeholder: "e.g. Computer Science" },
                  { label: "Semester", key: "currentSemester", placeholder: "e.g. Fall" },
                ] : []),
              ].map((field) => (
                <View key={field.key}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor="#aaa"
                    value={form[field.key]}
                    onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                    secureTextEntry={field.secure}
                  />
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveAccount} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Create Account</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  headerBtns: { flexDirection: "row", gap: 8 },
  addAdminBtn: { backgroundColor: "#8b5cf6", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addAdminBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  addStudentBtn: { backgroundColor: "#2554e8", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addStudentBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginTop: 16, backgroundColor: "#e5e7eb", borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  tabBtnTextActive: { color: "#2554e8" },
  accountCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 10,
    borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  accountLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  accountAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  accountAvatarText: { fontSize: 14, fontWeight: "800", color: "#2554e8" },
  accountName: { fontSize: 14, fontWeight: "700", color: "#111" },
  accountEmail: { fontSize: 12, color: "#888", marginTop: 1 },
  accountMeta: { fontSize: 11, color: "#aaa", marginTop: 2 },
  roleBadge: { marginTop: 4, backgroundColor: "#8b5cf620", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" },
  roleBadgeText: { fontSize: 11, color: "#8b5cf6", fontWeight: "700" },
  deleteIcon: { fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, marginTop: 100 },
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
