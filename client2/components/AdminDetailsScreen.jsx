import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { adminApi } from "../utils/api";

const ROLE_LABELS = {
  superadmin: { label: "👑 Super Admin", bg: "#f59e0b20", color: "#f59e0b" },
  admin: { label: "🛡️ Admin", bg: "#06b6d420", color: "#06b6d4" },
  it_admin: { label: "🖥️ IT Admin", bg: "#8b5cf620", color: "#8b5cf6" },
  table_admin: { label: "📅 Table Admin", bg: "#22c55e20", color: "#22c55e" },
  courses_admin: { label: "📚 Courses Admin", bg: "#3b82f620", color: "#3b82f6" },
  enrollment_admin: { label: "📝 Enrollment Admin", bg: "#f9731620", color: "#f97316" },
};

export default function AdminDetailsScreen({ userId, onGoBack }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const res = await adminApi.getUserById(userId);
      setAdmin(res.user || res.admin || res.student || res);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setError("No admin ID provided");
      setLoading(false);
      return;
    }
    fetchData();
  }, [userId, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#2554e8" />
        <Text style={styles.loadingText}>Loading admin data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={onGoBack}>
          <Text style={styles.backLinkText}>← Back to Users</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = admin?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const roleInfo = ROLE_LABELS[admin?.role] || ROLE_LABELS.admin;
  const isActive = admin?.isActive !== false;
  const createdDate = admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  }) : "—";

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2554e8" />}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={onGoBack}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: roleInfo.color }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{admin?.fullName}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
          <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
        </View>
        <Text style={styles.profileEmail}>{admin?.email}</Text>
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? "#22c55e" : "#ef4444" }]} />
          <Text style={[styles.statusLabel, { color: isActive ? "#22c55e" : "#ef4444" }]}>
            {isActive ? "Active" : "Suspended"}
          </Text>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>
        {[
          { label: "Full Name", value: admin?.fullName },
          { label: "Email", value: admin?.email },
          { label: "Role", value: roleInfo.label },
          { label: "University ID", value: admin?.universityId || "—" },
          { label: "Department", value: admin?.major || "—" },
        ].map((item, i, arr) => (
          <View key={i}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value || "—"}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Metadata */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Metadata</Text>
        {[
          { label: "Created On", value: createdDate },
          { label: "Account ID", value: admin?.id || admin?._id || "—" },
        ].map((item, i, arr) => (
          <View key={i}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={[styles.infoValue, { fontSize: 11 }]}>{item.value}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 12, color: "#888", fontSize: 14 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 14, color: "#ef4444", marginBottom: 16, textAlign: "center" },
  retryBtn: { backgroundColor: "#2554e8", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontWeight: "700" },
  backLink: { marginTop: 16 },
  backLinkText: { color: "#2554e8", fontWeight: "600", fontSize: 14 },

  backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtnText: { color: "#2554e8", fontWeight: "700", fontSize: 15 },

  profileHeader: {
    alignItems: "center", paddingVertical: 24, backgroundColor: "#fff",
    marginHorizontal: 16, marginTop: 8, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  profileName: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 6 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },
  profileEmail: { fontSize: 13, color: "#888" },

  card: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTitle: {
    fontSize: 14, fontWeight: "800", color: "#888",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16,
  },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 16, fontWeight: "700" },

  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, color: "#888", fontWeight: "600" },
  infoValue: { fontSize: 13, color: "#111", fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  divider: { height: 1, backgroundColor: "#f3f4f6" },
});
