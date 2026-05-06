import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function AdminHome({ user, hasPermission }) {
  // If Super Admin or has explicit stats permission, show the full dashboard
  if (user.role === 'superadmin' || hasPermission('view_stats')) {
    return <SuperAdminDashboard />;
  }

  // For other admins without stats access, show a personalized welcome screen
  return (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user.role}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Management Console</Text>
        <Text style={styles.infoSub}>
          Use the menu below to access your assigned modules.
          Your account has been granted access to:
        </Text>

        <View style={styles.permsList}>
          {user.permissions?.map((perm, index) => (
            <View key={index} style={styles.permItem}>
              <Text style={styles.permDot}>•</Text>
              <Text style={styles.permText}>{perm.replace('_', ' ').toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  welcomeCard: {
    backgroundColor: '#fff', margin: 16, padding: 24, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#2554e820', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#2554e8', fontWeight: '800', fontSize: 20 },
  greeting: { fontSize: 14, color: '#888' },
  name: { fontSize: 22, fontWeight: '800', color: '#111' },
  roleBadge: {
    backgroundColor: '#2554e810', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4,
  },
  roleBadgeText: { color: '#2554e8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  infoBox: { paddingHorizontal: 20, marginTop: 8 },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 8 },
  infoSub: { fontSize: 13, color: '#666', lineHeight: 20 },
  permsList: { marginTop: 16, gap: 10 },
  permItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permDot: { color: '#2554e8', fontWeight: '900' },
  permText: { fontSize: 12, fontWeight: '600', color: '#444' },
});
