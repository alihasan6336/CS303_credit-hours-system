import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminHome from './AdminHome';
import CourseManagement from './CourseManagement';
import AccountManagement from './AccountManagement';
import EnrollmentManagement from './EnrollmentManagement';
import GradingManagement from './GradingManagement';

const { width } = Dimensions.get('window');

function BottomTab({ active, onPress, icon, label }) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboard({ user, activeTab, setActiveTab, onLogout }) {
  // Check permissions helper
  const hasPermission = (perm) => {
    if (user.role === 'superadmin') return true;
    return user.permissions?.includes(perm);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": 
        return <AdminHome user={user} hasPermission={hasPermission} />;
      case "courses": 
        return hasPermission('manage_courses') ? <CourseManagement /> : null;
      case "accounts": 
        return hasPermission('manage_users') ? <AccountManagement /> : null;
      case "enrollment": 
        return hasPermission('manage_enrollments') ? <EnrollmentManagement /> : null;
      case "grading": 
        return hasPermission('manage_degrees') ? <GradingManagement /> : null;
      default: 
        return <SuperAdminDashboard />;
    }
  };

  // Define tabs with permission requirements
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Stats', permission: 'view_stats' },
    { id: 'courses', icon: '📚', label: 'Courses', permission: 'manage_courses' },
    { id: 'accounts', icon: '👥', label: 'Users', permission: 'manage_users' },
    { id: 'enrollment', icon: '📝', label: 'Enroll', permission: 'manage_enrollments' },
    { id: 'grading', icon: '🎓', label: 'Degrees', permission: 'manage_degrees' },
  ];

  // Filter tabs based on user permissions
  const visibleTabs = tabs.filter(tab => hasPermission(tab.permission));

  return (
    <View style={styles.container}>
      <View style={styles.screen}>{renderContent()}</View>
      <View style={styles.tabBar}>
        {visibleTabs.map(tab => (
          <BottomTab 
            key={tab.id}
            active={activeTab === tab.id} 
            onPress={() => setActiveTab(tab.id)} 
            icon={tab.icon} 
            label={tab.label} 
          />
        ))}
        <BottomTab active={false} onPress={onLogout} icon="🚪" label="Exit" />
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
  tabIcon: { fontSize: 20, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: "#aaa", fontWeight: "600" },
  tabLabelActive: { color: "#2554e8" },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  placeholderIcon: { fontSize: 60, marginBottom: 16 },
  placeholderTitle: { fontSize: 24, fontWeight: '800', color: '#111' },
  placeholderSub: { fontSize: 14, color: '#888', marginTop: 8 },
  mockCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  mockCardText: { color: '#666', fontSize: 14, textAlign: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  headerSub: { fontSize: 12, color: '#888' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
});
