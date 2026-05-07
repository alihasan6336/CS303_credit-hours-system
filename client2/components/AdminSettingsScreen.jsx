import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { userApi } from "../utils/api";

export default function SettingsScreen({ user, onLogout, onUpdateUser }) {
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAvatar();
  }, [user?._id]);

  const loadAvatar = async () => {
    try {
      const res = await userApi.getAvatar(user._id);
      if (res.photoUrl) {
        setAvatar(res.photoUrl);
        if (onUpdateUser) onUpdateUser({ photoUrl: res.photoUrl });
      }
    } catch (_) {}
  };

  const pickImage = () => {
    Alert.alert("Profile Photo", "Choose an option", [
      { text: "📷 Take Photo", onPress: openCamera },
      { text: "🖼️ Choose from Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) handleUpload(result.assets[0].uri);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Gallery access is required to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) handleUpload(result.assets[0].uri);
  };

  const handleUpload = async (uri) => {
    try {
      setUploading(true);
      const res = await userApi.uploadAvatar(user._id, uri);
      setAvatar(res.photoUrl);
      if (onUpdateUser) onUpdateUser({ photoUrl: res.photoUrl });
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const ROLE_BADGE = {
    superadmin: { label: "👑 Super Admin", bg: "#f59e0b20", color: "#f59e0b" },
    admin: { label: "🛡️ Admin", bg: "#06b6d420", color: "#06b6d4" },
    student: { label: "🎓 Student", bg: "#2554e820", color: "#2554e8" },
  };

  const isAdmin = user.role && (user.role === "admin" || user.role === "superadmin" || user.role.includes("_admin"));
  const isStudent = !isAdmin;
  const badge = isAdmin 
    ? (user.role === "superadmin" ? ROLE_BADGE.superadmin : ROLE_BADGE.admin)
    : ROLE_BADGE.student;
  const initials = user.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={uploading}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            {uploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.avatarEditIcon}>✏️</Text>
            }
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change profile photo</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{user.fullName || "—"}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Address</Text>
          <Text style={styles.infoValue}>{user.email || "—"}</Text>
        </View>

        {!isStudent && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Role</Text>
              <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.roleBadgeText, { color: badge.color }]}>
                  {user.role === "admin" && user.adminRole ? `🛡️ ${user.adminRole}` : badge.label}
                </Text>
              </View>
            </View>
          </>
        )}

        {isStudent && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>University ID</Text>
              <Text style={styles.infoValue}>{user.universityId || "—"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Major</Text>
              <Text style={styles.infoValue}>{user.major || "—"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Academic Year / Level</Text>
            <Text style={styles.infoValue}>{user.level || user.academicYear || "—"}</Text>
            </View>
          </>
        )}

        {user.role === "admin" && user.adminRole && (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assigned Department</Text>
              <Text style={styles.infoValue}>{user.adminRole}</Text>
            </View>
          </>
        )}
      </View>

      {!isStudent && (
        <TouchableOpacity style={styles.signOutBtn} onPress={onLogout}>
          <Text style={styles.signOutText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },

  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111" },

  avatarSection: {
    alignItems: "center", paddingVertical: 32, backgroundColor: "#fff",
    marginBottom: 16,
  },
  avatarWrapper: { position: "relative" },
  avatarImage: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: "#2554e8",
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#2554e8",
  },
  avatarInitials: { color: "#fff", fontSize: 32, fontWeight: "800" },
  avatarEditBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#2554e8", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  avatarEditIcon: { fontSize: 14 },
  avatarHint: { color: "#aaa", fontSize: 12, marginTop: 10, fontWeight: "600" },

  card: {
    backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16,
    padding: 20, marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#888", textTransform: "uppercase", marginBottom: 16 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  infoLabel: { fontSize: 14, color: "#888", fontWeight: "600" },
  infoValue: { fontSize: 14, color: "#111", fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  divider: { height: 1, backgroundColor: "#f3f4f6" },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },

  signOutBtn: {
    marginHorizontal: 16, backgroundColor: "#fef2f2",
    paddingVertical: 16, borderRadius: 14, alignItems: "center",
    borderWidth: 1.5, borderColor: "#fca5a5",
  },
  signOutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
});
