import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { authApi } from "../utils/api";
import AccountManagement from "../components/AccountManagement";
import CourseManagement from "../components/CourseManagement";
import RegisterScreen from "../components/RegisterScreen";
import DashboardScreen from "../components/DashboardScreen";
import EnrollmentManagement from "../components/EnrollmentManagement";
import GradingManagement from "../components/GradingManagement";
import LoginScreen from "../components/LoginScreen";
import SuperAdminDashboard from "../components/SuperAdminDashboard";
import StudentCoursesScreen from "../components/StudentCoursesScreen";
import StudentScheduleScreen from "../components/StudentScheduleScreen";
import GPACalculatorScreen from "../components/GPACalculatorScreen";
import GradesScreen from "../components/GradesScreen";

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
        case "grading": return <GradingManagement />;
        default: return <SuperAdminDashboard />;
      }
    };
    return (
      <View style={styles.container}>
        <View style={styles.screen}>{renderSuperAdminScreen()}</View>
        <View style={styles.tabBar}>
          <BottomTab active={activeTab === "dashboard"} onPress={() => setActiveTab("dashboard")} icon="📊" label="Stats" />
          <BottomTab active={activeTab === "courses"} onPress={() => setActiveTab("courses")} icon="📚" label="Courses" />
          <BottomTab active={activeTab === "accounts"} onPress={() => setActiveTab("accounts")} icon="👥" label="Users" />
          <BottomTab active={activeTab === "enrollment"} onPress={() => setActiveTab("enrollment")} icon="📝" label="Enroll" />
          <BottomTab active={activeTab === "grading"} onPress={() => setActiveTab("grading")} icon="🎓" label="Degrees" />
          <BottomTab active={false} onPress={handleLogout} icon="🚪" label="Exit" />
        </View>
      </View>
    );
  }

  const renderStudentScreen = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardScreen onNavigateCourses={() => setActiveTab("courses")} />;
      case "courses": return <StudentCoursesScreen />;
      case "schedule": return <StudentScheduleScreen />;
      case "grades": return <GradesScreen onGoBack={() => setActiveTab("dashboard")} />;
      case "gpa": return <GPACalculatorScreen onGoBack={() => setActiveTab("settings")} />;
      case "settings":
        return (
          <View style={styles.settingsScreen}>
            <Text style={styles.settingsTitle}>⚙️ Settings</Text>

            <TouchableOpacity style={styles.gpaBtn} onPress={() => setActiveTab("gpa")}>
              <Text style={styles.gpaBtnIcon}>🧮</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpaBtnTitle}>Target GPA Calculator</Text>
                <Text style={styles.gpaBtnSub}>Calculate cumulative based on expected grades</Text>
              </View>
              <Text style={styles.gpaBtnArrow}>›</Text>
            </TouchableOpacity>

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
        <BottomTab active={activeTab === "grades"} onPress={() => setActiveTab("grades")} icon="📊" label="Grades" />
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
  settingsScreen: { flex: 1, padding: 20 },
  settingsTitle: { fontSize: 24, fontWeight: "800", color: "#111", marginBottom: 30 },
  gpaBtn: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  gpaBtnIcon: { fontSize: 24, marginRight: 16 },
  gpaBtnTitle: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 2 },
  gpaBtnSub: { fontSize: 13, color: "#888" },
  gpaBtnArrow: { fontSize: 24, color: "#ccc", marginLeft: 16 },
  logoutBtn: { backgroundColor: "#fee2e2", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  logoutBtnText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
});