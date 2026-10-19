import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useDerivedValue, useReducedMotion, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Card, Badge, StatCard } from '../../src/components/ui/Components';
import { getDriverProfile, setDriverAvailability, type DriverProfile } from '../../src/services/drivers';
import { useRideStore } from '../../src/store/rideStore';

export default function DriverHome() {
  const { user } = useAuthStore();
  const { currentRide, refreshAssignedRide, declineCurrentRide } = useRideStore();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const hasIncomingRide = Boolean(isOnline && currentRide?.status === 'driver_assigned');
  const reduceMotion = useReducedMotion();
  const toggleProgress = useDerivedValue(() => reduceMotion ? (isOnline ? 1 : 0) : withTiming(isOnline ? 1 : 0, { duration: 220 }), [isOnline, reduceMotion]);
  const sheetOffset = useDerivedValue(() => reduceMotion ? (hasIncomingRide ? 0 : 200) : withSpring(hasIncomingRide ? 0 : 200, { damping: 18, stiffness: 150 }), [hasIncomingRide, reduceMotion]);
  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(toggleProgress.value, [0, 1], [2, 26]) }],
  }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetOffset.value }] }));

  useEffect(() => {
    let active = true;
    void getDriverProfile().then((profile) => {
      if (!active) return;
      setDriver(profile);
      setIsOnline(profile.online);
    }).catch((error: unknown) => {
      if (active) setProfileError(error instanceof Error ? error.message : 'Driver profile unavailable. Please try again.');
    }).finally(() => {
      if (active) setProfileLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    void refreshAssignedRide().catch(() => undefined);
    const timer = setInterval(() => { void refreshAssignedRide().catch(() => undefined); }, 5000);
    return () => clearInterval(timer);
  }, [refreshAssignedRide]);

  const acceptRide = () => {
    router.push('/(driver)/ride');
  };

  const declineRide = async () => {
    try {
      await declineCurrentRide();
    } catch (error) {
      Alert.alert('Could not decline ride', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const toggleOnline = async () => {
    setAvailabilityLoading(true);
    try {
      const status = await setDriverAvailability(!isOnline);
      setIsOnline(status.online);
    } catch (error) {
      Alert.alert('Availability not changed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const todayStats = [
    { label: 'Rides Today', value: '—', icon: 'car' as const, color: '#059669' },
    { label: 'Earned Today', value: '—', icon: 'wallet' as const, color: '#7C3AED' },
    { label: 'Hours Online', value: '—', icon: 'time' as const, color: '#2563EB' },
    { label: 'Avg Rating', value: '—', icon: 'star' as const, color: '#D97706' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Driver Dashboard</Text>
            <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
          </View>
          {/* Online toggle */}
          <TouchableOpacity
            disabled={availabilityLoading || !driver}
            style={[styles.toggle, isOnline ? styles.toggleOnline : styles.toggleOffline]}
            onPress={toggleOnline}
            accessibilityRole="switch"
            accessibilityLabel="Driver availability"
            accessibilityState={{ checked: isOnline, disabled: availabilityLoading || !driver, busy: availabilityLoading }}
          >
            <Animated.View style={[styles.toggleKnob, toggleStyle]} />
          </TouchableOpacity>
        </View>
        {profileLoading ? <Text style={styles.profileMessage}>Loading your driver account…</Text> : null}
        {profileError ? <Text style={styles.profileError} accessibilityRole="alert">{profileError}</Text> : null}

        {/* Status banner */}
        <View style={[styles.statusBanner, isOnline ? styles.statusOnline : styles.statusOffline]}>
          <Ionicons name={isOnline ? 'radio' : 'radio-button-off'} size={18} color={isOnline ? Colors.status.success : Colors.text.muted} />
          <Text style={[styles.statusText, { color: isOnline ? Colors.status.success : Colors.text.muted }]}>
            {availabilityLoading ? 'Updating availability…' : isOnline ? 'You are online and receiving ride requests' : 'You are offline — go online to receive rides'}
          </Text>
        </View>

        {/* Verification status (if not verified) */}
        {driver && driver.verification !== 'APPROVED' && (
          <View style={styles.verificationAlert}>
            <Ionicons name="time" size={20} color={Colors.status.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyTitle}>Verification Pending</Text>
              <Text style={styles.verifyDesc}>Your documents are under review. You cannot accept rides until verified. (SRS 4.1)</Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          {todayStats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
          ))}
        </View>

        {/* Vehicle info */}
        <Card style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIcon}>
              <Ionicons name="car-sport" size={24} color={Colors.status.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleTitle}>{driver?.vehicle ? `${driver.vehicle.make || ''} ${driver.vehicle.model || driver.vehicle.type} · ${driver.vehicle.color || 'Color not set'}` : 'Vehicle not registered'}</Text>
              <Text style={styles.vehiclePlate}>{driver?.vehicle?.licensePlate || 'Complete vehicle details to accept rides'}</Text>
            </View>
            <Badge label={driver?.verification === 'APPROVED' ? 'Verified' : driver?.verification || 'Loading'} variant={driver?.verification === 'APPROVED' ? 'success' : 'warning'} />
          </View>
        </Card>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: 'map', label: 'Navigation', color: Colors.brand.start },
              { icon: 'document-text', label: 'My Documents', color: '#D97706' },
              { icon: 'headset', label: 'Support', color: '#059669' },
              { icon: 'settings', label: 'Settings', color: Colors.text.muted },
            ].map((action) => (
              <View key={action.label} style={[styles.actionBtn, styles.actionUnavailable]} accessible accessibilityLabel={`${action.label}, unavailable`}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent history */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {[
            { time: '14:30', dest: 'Andheri East', fare: 285, status: 'completed' },
            { time: '12:15', dest: 'BKC', fare: 195, status: 'completed' },
            { time: '10:45', dest: 'Lower Parel', fare: 340, status: 'completed' },
          ].map((item, i) => (
            <View key={i} style={styles.historyItem}>
              <View style={styles.historyTime}>
                <Text style={styles.historyTimeText}>{item.time}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyDest}>To {item.dest}</Text>
              </View>
              <Text style={styles.historyFare}>+₹{item.fare}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Incoming ride bottom sheet */}
      <Animated.View pointerEvents={hasIncomingRide ? 'auto' : 'none'} style={[styles.rideSheet, sheetStyle]}>
        <LinearGradient colors={['#111128', '#0A0A1A']} style={styles.rideSheetContent}>
          <View style={styles.rideSheetHandle} />
          <Text style={styles.rideSheetTitle}>Ride Assigned</Text>

          <View style={styles.rideInfo}>
            <View style={styles.passengerRow}>
              <View style={styles.passengerAvatar}>
                <Ionicons name="person" size={22} color={Colors.brand.start} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.passengerName}>{currentRide?.passenger?.name || 'Passenger'}</Text>
                <Text style={{ fontSize: 12, color: Colors.text.secondary }}>{currentRide?.passenger?.phone || 'Contact details unavailable'}</Text>
              </View>
              <Text style={styles.rideFare}>₹{currentRide?.estimatedFare ?? '—'}</Text>
            </View>

            <View style={styles.routeInfo}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: Colors.status.success }]} />
                <Text style={styles.routeText}>{currentRide?.pickup?.address || 'Pickup'}</Text>
                <Text style={styles.routeDistance}>{currentRide?.estimatedDuration ?? '—'} min</Text>
              </View>
              <View style={[styles.routeRow, { marginTop: 8 }]}>
                <View style={[styles.routeDot, { backgroundColor: Colors.brand.start }]} />
                <Text style={styles.routeText}>{currentRide?.destination?.address || 'Destination'}</Text>
                <Text style={styles.routeDistance}>{currentRide?.estimatedDistance ?? '—'} km</Text>
              </View>
            </View>
          </View>

          <View style={styles.rideActions}>
            <Button title="Decline" variant="danger" onPress={declineRide} style={{ flex: 1 }} />
            <Button title="View Ride" onPress={acceptRide} style={{ flex: 2 }} />
          </View>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: Colors.text.muted, fontWeight: '500' },
  driverName: { ...Typography.title, color: Colors.text.primary, marginTop: 2 },
  toggle: { width: 52, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' },
  toggleOnline: { backgroundColor: Colors.status.success },
  toggleOffline: { backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  statusOnline: { backgroundColor: Colors.status.successBg },
  statusOffline: { backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border },
  statusText: { fontSize: 13, fontWeight: '500', flex: 1 },
  profileMessage: { color: Colors.text.secondary, fontSize: 14, textAlign: 'center' },
  profileError: { color: Colors.status.danger, fontSize: 14, textAlign: 'center' },
  verificationAlert: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.status.warningBg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.status.warning },
  verifyTitle: { fontSize: 14, fontWeight: '700', color: Colors.status.warning },
  verifyDesc: { fontSize: 12, color: Colors.status.warning, marginTop: 2, lineHeight: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  vehicleCard: { gap: Spacing.md },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  vehicleIcon: { width: 48, height: 48, borderRadius: Radius.md, backgroundColor: Colors.status.successBg, alignItems: 'center', justifyContent: 'center' },
  vehicleTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  vehiclePlate: { fontSize: 13, color: Colors.text.secondary, fontFamily: 'monospace', marginTop: 2 },
  quickActions: { gap: Spacing.md },
  sectionTitle: { ...Typography.heading, color: Colors.text.primary },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  actionLabel: { fontSize: 11, color: Colors.text.secondary, fontWeight: '500' },
  actionUnavailable: { opacity: 0.62 },
  historySection: { gap: Spacing.md },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.bg.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  historyTime: {},
  historyTimeText: { fontSize: 13, color: Colors.text.muted, fontWeight: '500' },
  historyDest: { fontSize: 14, fontWeight: '500', color: Colors.text.primary },
  historyFare: { fontSize: 16, fontWeight: '700', color: Colors.status.success },
  // Ride sheet
  rideSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 20 },
  rideSheetContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 40 },
  rideSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 4 },
  rideSheetTitle: { ...Typography.subtitle, color: Colors.text.primary },
  rideInfo: { gap: Spacing.md, backgroundColor: Colors.bg.card, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  passengerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.brand.start },
  passengerName: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  rideFare: { fontSize: 22, fontWeight: '900', color: Colors.text.primary },
  routeInfo: { paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1, fontSize: 13, color: Colors.text.primary, fontWeight: '500' },
  routeDistance: { fontSize: 12, color: Colors.text.muted },
  rideActions: { flexDirection: 'row', gap: Spacing.md },
});
