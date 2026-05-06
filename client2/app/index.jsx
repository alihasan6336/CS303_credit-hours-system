import { useState, useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { authApi } from "../utils/api";
import { ALL_PERMISSIONS } from "../constants/data";
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
import TableManagement from "../components/TableManagement";
import SettingsScreen from "../components/AdminSettingsScreen";

const ADMIN_TABS = [
  { key: "dashboard", icon: "📊", label: "Stats", permission: "dashboard" },
  { key: "courses", icon: "📚", label: "Courses", permission: "courses" },
  { key: "accounts", icon: "👥", label: "Users", permission: "accounts" },
  { key: "enrollment", icon: "📝", label: "Enroll", permission: "enrollment" },
  { key: "grading", icon: "🎓", label: "Degrees", permission: "grading" },
  { key: "table", icon: "📅", label: "Table", permission: "table" },
];

const STUDENT_TABS = [
  { key: "dashboard", icon: "🏠", label: "Dashboard" },
  { key: "courses", icon: "📚", label: "Courses" },
  { key: "schedule", icon: "📅", label: "Schedule" },
  { key: "grades", icon: "📊", label: "Grades" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];

import { Modal, Animated } from "react-native";

function SidebarDrawer({ isOpen, onClose, user, activeTab, onTabPress, tabs, onLogout }) {
  const slideAnim = useState(new Animated.Value(-280))[0];

  useEffect(() => {
    if (isOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -280,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal transparent visible={isOpen} onRequestClose={onClose}>
      <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[styles.drawerContent, { transform: [{ translateX: slideAnim }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.drawerHeader}>
            <View style={styles.drawerUserBox}>
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>
                  {user.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                </Text>
              </View>
              <View>
                <Text style={styles.drawerUserName} numberOfLines={1}>{user.fullName}</Text>
                <Text style={styles.drawerUserRole}>{user.role === 'admin' ? user.adminRole : user.role}</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.drawerScroll}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.drawerItem, activeTab === tab.key && styles.drawerItemActive]}
                onPress={() => {
                  onTabPress(tab.key);
                  onClose();
                }}
              >
                <Text style={styles.drawerItemIcon}>{tab.icon}</Text>
                <Text style={[styles.drawerItemLabel, activeTab === tab.key && styles.drawerItemLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.drawerFooter} onPress={onLogout}>
            <Text style={styles.drawerFooterIcon}>🚪</Text>
            <Text style={styles.drawerFooterLabel}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function AppHeader({ title, onMenuPress }) {
  return (
    <View style={styles.appHeader}>
      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
        <Text style={styles.menuBtnText}>☰</Text>
      </TouchableOpacity>
      <Text style={styles.appHeaderTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authScreen, setAuthScreen] = useState("login");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogin = (loggedInUser) => {
    const u = { ...loggedInUser, role: loggedInUser.role || "student" };
    setUser(u);
    // Set default tab to first available permission for admins
    if (u.role === "admin" && u.permissions && u.permissions.length > 0) {
      setActiveTab(u.permissions[0]);
    } else {
      setActiveTab("dashboard");
    }
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

  // Unified Navigation Content
  const tabs = user.role === 'student'
    ? STUDENT_TABS
    : ADMIN_TABS.filter(t => (user.role === 'superadmin' ? ALL_PERMISSIONS : (user.permissions || [])).includes(t.permission)).concat([{ key: "settings", icon: "⚙️", label: "Settings" }]);

  const activeTabLabel = tabs.find(t => t.key === activeTab)?.label || "Dashboard";

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return user.role === 'student'
          ? <DashboardScreen 
              onNavigateCourses={() => setActiveTab("courses")} 
            />
          : <SuperAdminDashboard />;
      case "courses":
        return user.role === 'student' ? <StudentCoursesScreen /> : <CourseManagement />;
      case "accounts": return <AccountManagement />;
      case "enrollment": return <EnrollmentManagement />;
      case "grading": return <GradingManagement />;
      case "table": return <TableManagement />;
      case "schedule": return <StudentScheduleScreen />;
      case "grades": return <GradesScreen onGoBack={() => setActiveTab("dashboard")} />;
      case "settings": return <SettingsScreen user={user} onLogout={handleLogout} />;
      case "gpa": return <GPACalculatorScreen onGoBack={() => setActiveTab("settings")} />;
      default: return user.role === 'student' ? <DashboardScreen /> : <SuperAdminDashboard />;
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={activeTabLabel} onMenuPress={() => setIsDrawerOpen(true)} />
      <View style={styles.screen}>{renderScreen()}</View>
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        tabs={tabs}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f2f5" },
  screen: { flex: 1 },
  appHeader: {
    height: 100,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtnText: {
    fontSize: 28,
    color: "#111",
  },
  appHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawerContent: {
    width: 280,
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  drawerUserBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  drawerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2554e8",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  drawerUserName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    width: 170,
  },
  drawerUserRole: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    textTransform: "capitalize",
  },
  drawerScroll: {
    flex: 1,
    paddingVertical: 20,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
  },
  drawerItemActive: {
    backgroundColor: "#2554e810",
    borderRightWidth: 4,
    borderRightColor: "#2554e8",
  },
  drawerItemIcon: {
    fontSize: 20,
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  drawerItemLabelActive: {
    color: "#2554e8",
  },
  drawerFooter: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginBottom: 40,
  },
  drawerFooterIcon: {
    fontSize: 20,
  },
  drawerFooterLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ef4444",
  },
  settingsScreen: { flex: 1, padding: 20 },
});