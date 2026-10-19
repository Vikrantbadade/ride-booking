import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Card, Badge } from '../../src/components/ui/Components';
import { getDriverProfile, type DriverProfile } from '../../src/services/drivers';

export default function DriverProfileScreen() {
  const { user, logout } = useAuthStore();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    getDriverProfile().then((profile) => {
      if (active) setDriver(profile);
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Could not load driver profile.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? <Text style={styles.docsSubtitle}>Loading driver profile…</Text> : null}
        {loadError ? <Text style={styles.loadError} accessibilityRole="alert">{loadError}</Text> : null}
        {/* Profile header */}
        <LinearGradient colors={['#059669', '#047857']} style={styles.profileHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatarWrapper}>
            <Ionicons name="person" size={44} color="#fff" />
          </View>
          <Badge label={driver?.verification === 'APPROVED' ? 'Verified Driver' : driver?.verification === 'REJECTED' ? 'Verification Rejected' : 'Verification Pending'} variant={driver?.verification === 'APPROVED' ? 'success' : driver?.verification === 'REJECTED' ? 'danger' : 'warning'} />
          <Text style={styles.profileName}>{user?.name || 'Driver'}</Text>
          <View style={styles.profileStats}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{driver?._count.rides ?? '—'}</Text>
              <Text style={styles.statLbl}>Total rides</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{driver?.online ? 'Online' : 'Offline'}</Text>
              <Text style={styles.statLbl}>Availability</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>—</Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Vehicle info */}
        <Card style={styles.vehicleCard}>
          <Text style={styles.cardTitle}>Vehicle Information</Text>
          {[
            { label: 'Vehicle', value: driver?.vehicle ? `${driver.vehicle.make || ''} ${driver.vehicle.model || driver.vehicle.type}`.trim() : 'Not registered' },
            { label: 'Color', value: driver?.vehicle?.color || '—' },
            { label: 'License Plate', value: driver?.vehicle?.licensePlate || '—', mono: true },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={[styles.infoValue, item.mono && styles.monoText]}>{item.value}</Text>
            </View>
          ))}
        </Card>

        {/* Documents */}
        <Card style={styles.docsCard}>
          <Text style={styles.cardTitle}>Document Status</Text>
          <Text style={styles.docsSubtitle}>Document upload and per-document review are not connected. Your account verification status is shown above.</Text>
          <Button title="Document uploads unavailable" variant="secondary" disabled onPress={() => undefined} />
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          {[
            { icon: 'notifications-outline', label: 'Notification Preferences' },
            { icon: 'shield-checkmark-outline', label: 'Safety Settings' },
            { icon: 'help-circle-outline', label: 'Help & Support' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.brand.start} />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.comingSoon}>Not connected</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>

        <Button title="Sign Out" variant="danger" onPress={async () => { try { await logout(); } finally { router.replace('/'); } }} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.lg, paddingBottom: 100 },
  profileHeader: { padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md },
  avatarWrapper: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  profileName: { fontSize: 24, fontWeight: '800', color: '#fff' },
  profileStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginTop: 4 },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  vehicleCard: { marginHorizontal: Spacing.xl, gap: Spacing.md },
  docsCard: { marginHorizontal: Spacing.xl, gap: Spacing.md },
  settingsCard: { marginHorizontal: Spacing.xl, padding: 0, overflow: 'hidden' },
  cardTitle: { ...Typography.heading, color: Colors.text.primary },
  docsSubtitle: { fontSize: 13, color: Colors.text.secondary, lineHeight: 18 },
  loadError: { marginHorizontal: Spacing.xl, color: Colors.status.danger, fontSize: 14, lineHeight: 20 },
  comingSoon: { fontSize: 11, color: Colors.text.muted },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 14, color: Colors.text.secondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  monoText: { fontFamily: 'monospace' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  docIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center' },
  docName: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text.primary },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.brand.start, borderStyle: 'dashed', justifyContent: 'center' },
  uploadText: { fontSize: 14, fontWeight: '600', color: Colors.brand.start },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  settingIcon: { width: 38, height: 38, borderRadius: Radius.sm, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.xl + 38 + Spacing.md },
});
