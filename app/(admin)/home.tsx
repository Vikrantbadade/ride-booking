import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { useAdminStore } from '../../src/store/adminStore';
import { Card } from '../../src/components/ui/Components';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { drivers, pendingVerifications, fetchDrivers, isLoadingDrivers, driversError } = useAdminStore();
  const pendingCount = pendingVerifications.filter((verification) => verification.overallStatus === 'pending').length;

  useEffect(() => {
    void fetchDrivers().catch(() => undefined);
  }, [fetchDrivers]);

  const stats = [
    { label: 'Registered Drivers', value: isLoadingDrivers && !drivers.length ? '…' : drivers.length.toString(), icon: 'people', color: Colors.brand.start },
    { label: 'Online Now', value: drivers.filter((driver) => driver.isOnline).length.toString(), icon: 'radio', color: Colors.status.success },
    { label: 'Verified', value: drivers.filter((driver) => driver.isVerified).length.toString(), icon: 'shield-checkmark', color: Colors.status.info },
    { label: 'Pending Review', value: pendingCount.toString(), icon: 'time', color: Colors.status.warning },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.adminRole}>Administrator</Text>
            <Text style={styles.adminName}>{user?.name || 'Admin User'}</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={18} color="#D97706" />
          </View>
        </View>

        {/* Admin scope */}
        <LinearGradient colors={Gradients.brand} style={styles.statusCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.statusRow}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={styles.statusText}>Driver Operations</Text>
          </View>
          <Text style={styles.statusDetails}>Review driver verification and availability from live account records.</Text>
        </LinearGradient>

        {driversError ? <Text style={styles.loadError}>{driversError}</Text> : null}

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent alerts */}
        {pendingCount > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={18} color={Colors.status.warning} />
              <Text style={styles.alertTitle}>Pending Actions</Text>
            </View>
            <Text style={styles.alertText}>{pendingCount} driver verification(s) awaiting your review</Text>
          </Card>
        )}

        {/* Scope note */}
        <Card style={styles.srsCard}>
          <Text style={styles.srsTitle}>Workspace data scope</Text>
          <Text style={styles.srsLabel}>Ride totals, passenger counts, revenue, and payment-provider reporting are not available through the current admin API.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminRole: { fontSize: 13, color: '#D97706', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  adminName: { ...Typography.title, color: Colors.text.primary, marginTop: 2 },
  adminBadge: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: '#D97706' + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D97706' + '40' },
  statusCard: { borderRadius: Radius.xl, padding: Spacing.lg, gap: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadError: { fontSize: 13, color: Colors.status.danger },
  statusText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statusDetails: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { backgroundColor: Colors.bg.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center', gap: 6, width: '31%' },
  statIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text.primary },
  statLabel: { fontSize: 11, color: Colors.text.muted, textAlign: 'center' },
  alertCard: { backgroundColor: Colors.status.warningBg, borderColor: Colors.status.warning, gap: Spacing.sm },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: Colors.status.warning },
  alertText: { fontSize: 13, color: Colors.status.warning },
  srsCard: { gap: Spacing.md },
  srsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  srsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  srsLabel: { fontSize: 13, color: Colors.text.secondary },
});
