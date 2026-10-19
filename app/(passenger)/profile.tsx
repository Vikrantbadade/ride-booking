import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Gradients, Spacing, Radius } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Components';
import { useRideStore } from '../../src/store/rideStore';

const MENU_ITEMS = [
  { icon: 'card-outline', label: 'Payment Methods' },
  { icon: 'location-outline', label: 'Saved Places' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'shield-checkmark-outline', label: 'Safety Settings' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'document-text-outline', label: 'Terms & Privacy' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { rideHistory, fetchRideHistory } = useRideStore();

  useEffect(() => {
    void fetchRideHistory().catch(() => undefined);
  }, [fetchRideHistory]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await logout(); } finally { router.replace('/'); } } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile header */}
        <LinearGradient colors={Gradients.brand} style={styles.profileHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatarWrapper}>
            <Ionicons name="person" size={44} color="#fff" />
          </View>
          <Text style={styles.profileName}>{user?.name || 'Passenger'}</Text>
          <Text style={styles.profilePhone}>{user?.phone || user?.email || ''}</Text>
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.statNum}>{rideHistory.filter((ride) => ride.status === 'completed').length}</Text>
              <Text style={styles.statLbl}>Rides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.statNum}>—</Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.statNum}>—</Text>
              <Text style={styles.statLbl}>Saved</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu items */}
        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <View style={styles.menuItem}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.brand.start} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.comingSoon}>Not connected</Text>
              </View>
              {i < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </Card>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>RideX · Passenger account</Text>
        </View>

        <Button title="Sign Out" variant="danger" onPress={handleLogout} size="lg" />
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
  profilePhone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  profileStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginTop: Spacing.sm },
  profileStat: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  menuCard: { marginHorizontal: Spacing.xl, padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  menuIcon: { width: 38, height: 38, borderRadius: Radius.sm, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text.primary },
  comingSoon: { fontSize: 11, color: Colors.text.muted },
  menuDivider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.xl + 38 + Spacing.md },
  appInfo: { alignItems: 'center', gap: 2 },
  appInfoText: { fontSize: 12, color: Colors.text.muted },
});
