import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { authApi } from "../utils/api";
import AccountManagement from "../components/AccountManagement";
import CourseManagement from "../components/CourseManagement";
import RegisterScreen from "../components/RegisterScreen";
import DashboardScreen from "../components/DashboardScreen";
import EnrollmentManagement from "../components/EnrollmentManagement";
import LoginScreen from "../components/LoginScreen";
import SuperAdminDashboard from "../components/SuperAdminDashboard";
import StudentCoursesScreen from "../components/StudentCoursesScreen";
import StudentScheduleScreen from "../components/StudentScheduleScreen";

function BottomTab({ active, onPress, icon, label }) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authScreen, setAuthScreen] = useState("login");

  const handleLogin = (loggedInUser) => {
    setUser({ ...loggedInUser, role: loggedInUser.role || "student" });
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authApi.logout();
          setUser(null);
          setActiveTab("dashboard");
          setAuthScreen("login");
        },
      },
    ]);
  };

  if (!user) {
    if (authScreen === "register") {
      return (
        <RegisterScreen
          onNavigateLogin={() => setAuthScreen("login")}
          onRegister={(data) => handleLogin(data)}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={handleLogin}
        onNavigateRegister={() => setAuthScreen("register")}
      />
    );
  }

  if (user.role === "superadmin") {
    const renderSuperAdminScreen = () => {
      switch (activeTab) {
        case "dashboard": return <SuperAdminDashboard />;
        case "courses": return <CourseManagement />;
        case "accounts": return <AccountManagement />;
        case "register": return <RegisterScreen />;
        case "enrollment": return <EnrollmentManagement />;
        default: return <SuperAdminDashboard />;
      }
    };
    return (
      <View style={styles.container}>
        <View style={styles.screen}>{renderSuperAdminScreen()}</View>
        <View style={styles.tabBar}>
          <BottomTab active={activeTab === "dashboard"} onPress={() => setActiveTab("dashboard")} icon="📊" label="Dashboard" />
          <BottomTab active={activeTab === "courses"} onPress={() => setActiveTab("courses")} icon="📚" label="Courses" />
          <BottomTab active={activeTab === "accounts"} onPress={() => setActiveTab("accounts")} icon="👥" label="Accounts" />
          <BottomTab active={activeTab === "enrollment"} onPress={() => setActiveTab("enrollment")} icon="✅" label="Enroll" />
          <BottomTab active={false} onPress={handleLogout} icon="🚪" label="Logout" />
        </View>
      </View>
    );
  }

  const renderStudentScreen = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardScreen onNavigateCourses={() => setActiveTab("courses")} />;
      case "courses": return <StudentCoursesScreen />;
      case "schedule": return <StudentScheduleScreen />;
      case "settings":
        return (
          <View style={styles.settingsScreen}>
            <Text style={styles.settingsTitle}>⚙️ Settings</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>🚪 Logout</Text>
            </TouchableOpacity>
          </View>
        );
      default: return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screen}>{renderStudentScreen()}</View>
      <View style={styles.tabBar}>
        <BottomTab active={activeTab === "dashboard"} onPress={() => setActiveTab("dashboard")} icon="🏠" label="Dashboard" />
        <BottomTab active={activeTab === "courses"} onPress={() => setActiveTab("courses")} icon="📚" label="Courses" />
        <BottomTab active={activeTab === "schedule"} onPress={() => setActiveTab("schedule")} icon="📅" label="Schedule" />
        <BottomTab active={activeTab === "settings"} onPress={() => setActiveTab("settings")} icon="⚙️" label="Settings" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: "row", backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#e5e7eb",
    paddingBottom: 20, paddingTop: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: "#aaa", fontWeight: "600" },
  tabLabelActive: { color: "#2554e8" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f0f2f5" },
  placeholderText: { fontSize: 28, marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: "#aaa" },
  settingsScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f0f2f5", padding: 20 },
  settingsTitle: { fontSize: 28, fontWeight: "800", marginBottom: 40 },
  logoutBtn: {
    backgroundColor: "#ef4444", paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 12, shadowColor: "#ef4444", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  logoutBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});