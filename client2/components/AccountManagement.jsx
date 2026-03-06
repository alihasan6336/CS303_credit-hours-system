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

const initialAccounts = [
  { id: 1, type: "admin", name: "Dr. Sara Ahmed", email: "sara@sci.com", role: "Admin" },
  { id: 2, type: "admin", name: "Dr. Khalid Nasser", email: "khalid@sci.com", role: "Admin" },
  { id: 3, type: "student", name: "Ahmed Al-Rashidi", email: "ahmed@sci.com", studentId: "2021-CS-0342", level: "Year 3", major: "Computer Science" },
  { id: 4, type: "student", name: "Sara Mohammed", email: "sara.m@sci.com", studentId: "2022-CS-0101", level: "Year 2", major: "Computer Science" },
  { id: 5, type: "student", name: "Omar Hassan", email: "omar@sci.com", studentId: "2023-CS-0055", level: "Year 1", major: "Computer Science" },
];

export default function AccountManagement() {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [tab, setTab] = useState("student");
  const [modalVisible, setModalVisible] = useState(false);
  const [accountType, setAccountType] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", studentId: "", level: "Year 1", major: "Computer Science", role: "Admin" });

  const filtered = accounts.filter(a => a.type === tab);

  const openAddModal = (type) => {
    setAccountType(type);
    setForm({ name: "", email: "", password: "", studentId: "", level: "Year 1", major: "Computer Science", role: "Admin" });
    setModalVisible(true);
  };

  const saveAccount = () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    const newAccount = {
      id: Date.now(),
      type: accountType,
      name: form.name,
      email: form.email,
      ...(accountType === "student" ? {
        studentId: form.studentId || `2025-CS-${Math.floor(Math.random() * 9000 + 1000)}`,
        level: form.level,
        major: form.major,
      } : { role: "Admin" }),
    };
    setAccounts([...accounts, newAccount]);
    setModalVisible(false);
  };

  const deleteAccount = (id) => {
    Alert.alert("Delete Account", "Are you sure you want to delete this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setAccounts(accounts.filter(a => a.id !== id)) },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
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

        {/* TABS */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tabBtn, tab === "student" && styles.tabBtnActive]} onPress={() => setTab("student")}>
            <Text style={[styles.tabBtnText, tab === "student" && styles.tabBtnTextActive]}>
              Students ({accounts.filter(a => a.type === "student").length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === "admin" && styles.tabBtnActive]} onPress={() => setTab("admin")}>
            <Text style={[styles.tabBtnText, tab === "admin" && styles.tabBtnTextActive]}>
              Admins ({accounts.filter(a => a.type === "admin").length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACCOUNT LIST */}
        {filtered.map((account) => (
          <View key={account.id} style={styles.accountCard}>
            <View style={styles.accountLeft}>
              <View style={[styles.accountAvatar, { backgroundColor: account.type === "admin" ? "#8b5cf620" : "#2554e820" }]}>
                <Text style={styles.accountAvatarText}>
                  {account.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </Text>
              </View>
              <View>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountEmail}>{account.email}</Text>
                {account.type === "student" && (
                  <Text style={styles.accountMeta}>{account.studentId} • {account.level}</Text>
                )}
                {account.type === "admin" && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>🛡️ Admin</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteAccount(account.id)}>
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADD ACCOUNT MODAL */}
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
                  { label: "Student ID", key: "studentId", placeholder: "Auto-generated if empty" },
                  { label: "Level", key: "level", placeholder: "e.g. Year 1" },
                  { label: "Major", key: "major", placeholder: "e.g. Computer Science" },
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
                <TouchableOpacity style={styles.saveBtn} onPress={saveAccount}>
                  <Text style={styles.saveBtnText}>Create Account</Text>
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
