import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AccountManagement from "../components/AccountManagement";
import CourseManagement from "../components/CourseManagement";
import DashboardScreen from "../components/DashboardScreen";
import EnrollmentManagement from "../components/EnrollmentManagement";
import LoginScreen from "../components/LoginScreen";
import SuperAdminDashboard from "../components/SuperAdminDashboard";

const SUPER_ADMIN_EMAIL = "superadmin@sci.com";
const SUPER_ADMIN_PASSWORD = "SuperMan1";

const initialStudentAccounts = [
  { email: "ahmed@sci.com", password: "Ahmed123", name: "Ahmed Al-Rashidi" },
  { email: "sara.m@sci.com", password: "Sara123", name: "Sara Mohammed" },
  { email: "omar@sci.com", password: "Omar123", name: "Omar Hassan" },
];

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
  const [loginError, setLoginError] = useState("");
  const [studentAccounts, setStudentAccounts] = useState(initialStudentAccounts);

  const handleLogin = (email, password) => {
    setLoginError("");
    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      setUser({ role: "superadmin", email });
      setActiveTab("dashboard");
      return;
    }
    const studentAccount = studentAccounts.find(
      (a) => a.email === email && a.password === password
    );
    if (studentAccount) {
      setUser({ role: "student", email, name: studentAccount.name });
      setActiveTab("dashboard");
      return;
    }
    setLoginError("Invalid email or password. Please try again.");
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} errorMessage={loginError} />;
  }

  if (user.role === "superadmin") {
    const renderSuperAdminScreen = () => {
      switch (activeTab) {
        case "dashboard": return <SuperAdminDashboard />;
        case "courses": return <CourseManagement />;
        case "accounts": return <AccountManagement onAccountCreated={(acc) => setStudentAccounts([...studentAccounts, acc])} />;
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
        </View>
      </View>
    );
  }

  const renderStudentScreen = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardScreen />;
      case "courses":
        return <View style={styles.placeholder}><Text style={styles.placeholderText}>📚 My Courses</Text><Text style={styles.placeholderSub}>Coming soon</Text></View>;
      case "schedule":
        return <View style={styles.placeholder}><Text style={styles.placeholderText}>📅 Schedule</Text><Text style={styles.placeholderSub}>Coming soon</Text></View>;
      case "settings":
        return <View style={styles.placeholder}><Text style={styles.placeholderText}>⚙️ Settings</Text><Text style={styles.placeholderSub}>Coming soon</Text></View>;
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
});