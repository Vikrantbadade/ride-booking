import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Gradients, Spacing, Radius, Typography } from '../../src/theme/colors';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Components';
import { useRideStore } from '../../src/store/rideStore';

type RidePhase = 'arriving' | 'picked_up' | 'en_route' | 'completed';

export default function DriverRideScreen() {
  const { currentRide, transitionRideStatus, updateDriverLocation } = useRideStore();
  const [elapsed, setElapsed] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [actionError, setActionError] = useState('');
  const phase: RidePhase = currentRide?.status === 'driver_arriving'
    ? 'picked_up'
    : currentRide?.status === 'in_progress'
      ? 'en_route'
      : currentRide?.status === 'completed'
        ? 'completed'
        : 'arriving';
  const fare = currentRide?.finalFare ?? currentRide?.estimatedFare ?? 0;

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentRide?.id || !['driver_assigned', 'driver_arriving', 'in_progress'].includes(currentRide.status)) return;
    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    const startLocationUpdates = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (active) setLocationError('Allow foreground location access to share your position during this ride.');
          return;
        }
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 25 },
          (position) => {
            void updateDriverLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).catch((error: unknown) => {
              if (active) setLocationError(error instanceof Error ? error.message : 'Driver location update failed.');
            });
          },
        );
      } catch (error) {
        if (active) setLocationError(error instanceof Error ? error.message : 'Could not start location updates.');
      }
    };

    void startLocationUpdates();
    return () => {
      active = false;
      subscription?.remove();
    };
  }, [currentRide?.id, currentRide?.status, updateDriverLocation]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const phaseActions: Record<RidePhase, { label: string; next: RidePhase | null }> = {
    arriving: { label: "I've Arrived at Pickup", next: 'picked_up' },
    picked_up: { label: 'Start Ride', next: 'en_route' },
    en_route: { label: 'Complete Ride', next: 'completed' },
    completed: { label: 'Back to Dashboard', next: null },
  };

  const handleAction = async () => {
    const action = phaseActions[phase];
    if (!action.next) {
      router.replace('/(driver)/home');
      return;
    }
    const status = action.next === 'picked_up' ? 'ARRIVING' : action.next === 'en_route' ? 'IN_PROGRESS' : 'COMPLETED';
    setIsUpdating(true);
    setActionError('');
    try {
      await transitionRideStatus(status);
      if (action.next === 'completed') Alert.alert('Ride Completed', `Final fare: ₹${fare}. Invoice generated.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update ride status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const phaseLabels: Record<RidePhase, { title: string; subtitle: string; color: string }> = {
    arriving: { title: 'Heading to Pickup', subtitle: 'Navigate to passenger pickup point', color: Colors.status.warning },
    picked_up: { title: 'Passenger Boarded', subtitle: 'Ready to start the ride', color: Colors.status.info },
    en_route: { title: 'En Route', subtitle: 'Navigating to destination', color: Colors.status.success },
    completed: { title: 'Ride Completed!', subtitle: 'Great job! Payment will be processed shortly', color: Colors.brand.start },
  };

  const info = phaseLabels[phase];

  if (!currentRide || !currentRide.passenger) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={56} color={Colors.text.muted} />
          <Text style={styles.passengerName}>No assigned ride</Text>
          <Button title="Back to Dashboard" onPress={() => router.replace('/(driver)/home')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status */}
        <LinearGradient colors={[info.color + '20', 'transparent']} style={styles.statusBanner}>
          <View style={[styles.statusDot, { backgroundColor: info.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: info.color }]}>{info.title}</Text>
            <Text style={styles.statusSubtitle}>{info.subtitle}</Text>
          </View>
          {phase === 'en_route' && (
            <View style={styles.timer}>
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Map placeholder */}
        <View style={styles.mapBox}>
          <LinearGradient colors={['#0D1B2A', '#0A1020']} style={styles.mapBg}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={`h${i}`} style={[styles.mapGridLine, { top: i * 40 }]} />
            ))}
            {/* Route */}
            <View style={styles.routeLine} />
            {/* Pickup */}
            <View style={[styles.mapPin, styles.pickupMapPin]}>
              <Ionicons name="person" size={20} color={Colors.status.success} />
            </View>
            {/* Dest */}
            <View style={[styles.mapPin, styles.destMapPin]}>
              <Ionicons name="flag" size={20} color={Colors.brand.start} />
            </View>
            {/* Driver car */}
            <View style={styles.driverMarker}>
              <LinearGradient colors={Gradients.brand} style={styles.driverMarkerGradient}>
                <Ionicons name="car-sport" size={18} color="#fff" />
              </LinearGradient>
            </View>

            <View style={styles.mapOverlay}>
              <Ionicons name={currentRide.driver?.location ? 'navigate' : 'location-outline'} size={20} color={Colors.brand.start} />
                <Text style={styles.mapOverlayText}>{currentRide.driver?.location ? 'Location shared with passenger' : 'Waiting for location'}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Passenger card */}
        <Card style={styles.passengerCard}>
          <View style={styles.passengerRow}>
            <View style={styles.passengerAvatar}>
              <Ionicons name="person" size={28} color={Colors.brand.start} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.passengerName}>{currentRide.passenger.name}</Text>
              <Text style={styles.passengerRating}>Passenger</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert('Contact passenger', currentRide.passenger?.phone || 'No phone number is available.') }>
              <LinearGradient colors={Gradients.brand} style={styles.callGradient}>
                <Ionicons name="call" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Route */}
        <Card style={styles.routeCard}>
          <Text style={styles.cardTitle}>Trip Route</Text>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.status.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddress}>{currentRide.pickup?.address}</Text>
            </View>
          </View>
          <View style={styles.routeSpacer} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: Colors.brand.start }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeAddress}>{currentRide.destination?.address}</Text>
            </View>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fareValue}>₹{fare}</Text>
          </View>
        </Card>

        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

        {/* Action button */}
        <Button title={phaseActions[phase].label} onPress={handleAction} loading={isUpdating} size="lg"
          style={{ marginHorizontal: Spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.lg, paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  locationError: { color: Colors.status.warning, marginHorizontal: Spacing.xl, fontSize: 12 },
  actionError: { color: Colors.status.danger, marginHorizontal: Spacing.xl, fontSize: 13 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, marginHorizontal: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  statusSubtitle: { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  timer: { backgroundColor: Colors.bg.secondary, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  timerText: { fontSize: 16, fontWeight: '700', color: Colors.text.primary, fontFamily: 'monospace' },
  // Map
  mapBox: { marginHorizontal: Spacing.xl, height: 200, borderRadius: Radius.xl, overflow: 'hidden' },
  mapBg: { flex: 1, position: 'relative' },
  mapGridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  routeLine: { position: 'absolute', top: 60, left: 100, width: 160, height: 3, backgroundColor: Colors.brand.start, borderRadius: 2, opacity: 0.7, transform: [{ rotate: '30deg' }] },
  mapPin: { position: 'absolute' },
  pickupMapPin: { bottom: 50, left: 70 },
  destMapPin: { top: 30, right: 80 },
  driverMarker: { position: 'absolute', bottom: 80, left: 130 },
  driverMarkerGradient: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mapOverlay: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapOverlayText: { fontSize: 13, color: Colors.brand.start, fontWeight: '600' },
  // Passenger
  passengerCard: { marginHorizontal: Spacing.xl },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  passengerAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.brand.start },
  passengerName: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  passengerRating: { fontSize: 13, color: Colors.text.secondary },
  callBtn: {},
  callGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  // Route
  routeCard: { marginHorizontal: Spacing.xl, gap: Spacing.md },
  cardTitle: { ...Typography.heading, color: Colors.text.primary },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routeLabel: { fontSize: 11, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '500' },
  routeAddress: { fontSize: 15, color: Colors.text.primary, fontWeight: '600', marginTop: 2 },
  routeSpacer: { width: 2, height: 18, backgroundColor: Colors.border, marginLeft: 5 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  fareLabel: { fontSize: 14, color: Colors.text.secondary },
  fareValue: { fontSize: 22, fontWeight: '800', color: Colors.text.primary },
});
