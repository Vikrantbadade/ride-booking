import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Gradients, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useRideStore } from '../../src/store/rideStore';
import { Button } from '../../src/components/ui/Button';
import { Badge, Card } from '../../src/components/ui/Components';
import { usePulse } from '../../src/hooks/useAnimations';

const STATUS_STEPS = [
  { key: 'searching', label: 'Finding Driver', icon: 'search', description: 'Matching you with a nearby verified driver...' },
  { key: 'driver_assigned', label: 'Driver Assigned', icon: 'checkmark-circle', description: 'A driver has accepted your ride' },
  { key: 'driver_arriving', label: 'Driver Arriving', icon: 'navigate', description: 'Your driver is on the way to pick you up' },
  { key: 'in_progress', label: 'Ride In Progress', icon: 'car-sport', description: 'Enjoy your ride!' },
  { key: 'completed', label: 'Ride Completed', icon: 'flag', description: 'You have arrived at your destination' },
];

export default function BookingScreen() {
  const { currentRide, cancelRide, refreshCurrentRide, retryMatching } = useRideStore();
  const pulseStyle = usePulse(1, 1.06);
  const [isRetrying, setIsRetrying] = useState(false);
  const [actionError, setActionError] = useState('');

  const statusIndex = STATUS_STEPS.findIndex((s) => s.key === currentRide?.status);
  const currentStep = STATUS_STEPS[statusIndex] || STATUS_STEPS[0];

  useEffect(() => {
    if (!currentRide?.id || !['searching', 'driver_assigned', 'driver_arriving', 'in_progress'].includes(currentRide.status)) return;
    const timer = setInterval(() => {
      void refreshCurrentRide().catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentRide?.id, currentRide?.status, refreshCurrentRide]);

  useEffect(() => {
    if (currentRide?.status === 'completed') {
      router.replace('/(passenger)/payment');
    }
  }, [currentRide?.status]);

  const handleCancel = () => {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'Keep Ride', style: 'cancel' },
      { text: 'Cancel Ride', style: 'destructive', onPress: async () => {
        try {
          await cancelRide();
          router.replace('/(passenger)/home');
        } catch (error) {
          Alert.alert('Could not cancel ride', error instanceof Error ? error.message : 'Please try again.');
        }
      } },
    ]);
  };

  const handleRetryMatching = async () => {
    setIsRetrying(true);
    setActionError('');
    try {
      await retryMatching();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not retry driver matching.');
    } finally {
      setIsRetrying(false);
    }
  };

  if (!currentRide || currentRide.status === 'idle' || currentRide.status === 'cancelled') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>No Active Ride</Text>
          <Text style={styles.emptySubtitle}>Book a ride from the home screen</Text>
          <Button title="Book a Ride" onPress={() => router.replace('/(passenger)/home')} style={{ marginTop: Spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Ride</Text>
          <Badge
            label={currentStep.label}
            variant={currentRide.status === 'in_progress' ? 'success' : currentRide.status === 'searching' ? 'warning' : 'info'}
          />
        </View>

        {/* Animated status indicator */}
        <View style={styles.statusIndicator}>
          <Animated.View style={[styles.statusPulse, pulseStyle]}>
            <LinearGradient colors={Gradients.brand} style={styles.statusIcon}>
              <Ionicons name={currentStep.icon as any} size={32} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.statusLabel}>{currentStep.label}</Text>
          <Text style={styles.statusDesc}>{currentStep.description}</Text>
          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
        </View>

        {currentRide.status === 'searching' && !currentRide.driver && (
          <Button title="Search for Drivers Again" onPress={handleRetryMatching} loading={isRetrying} variant="secondary" />
        )}

        {/* Progress steps */}
        <View style={styles.stepsContainer}>
          {STATUS_STEPS.slice(0, 4).map((step, i) => {
            const isDone = i < statusIndex;
            const isCurrent = i === statusIndex;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={[styles.stepCircle, isDone && styles.stepDone, isCurrent && styles.stepCurrent]}>
                  {isDone ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.stepNum}>{i + 1}</Text>}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, (isDone || isCurrent) && styles.stepLabelActive]}>{step.label}</Text>
                </View>
                {i < 3 && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
              </View>
            );
          })}
        </View>

        {/* Driver Card */}
        {currentRide.driver && (
          <Card style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatarWrapper}>
                <View style={styles.driverAvatar}>
                  <Ionicons name="person" size={32} color={Colors.brand.start} />
                </View>
                <View style={styles.driverOnline} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{currentRide.driver.name}</Text>
                <View style={styles.driverRating}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{currentRide.driver.rating}</Text>
                </View>
                <Text style={styles.vehicleText}>{currentRide.driver.vehicle} · {currentRide.driver.vehicleColor}</Text>
              </View>
              <View style={styles.plateBox}>
                <Text style={styles.plateText}>{currentRide.driver.licensePlate}</Text>
              </View>
            </View>

            {currentRide.driver.eta && currentRide.status === 'driver_arriving' && (
              <View style={styles.etaRow}>
                <Ionicons name="time" size={16} color={Colors.status.info} />
                <Text style={styles.etaText}>ETA: ~{currentRide.driver.eta} minutes</Text>
              </View>
            )}

            {/* Contact actions */}
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.contactBtn} accessibilityRole="button" accessibilityLabel="Call driver, unavailable" onPress={() => Alert.alert('Calling unavailable', 'Calling is not connected in this version of RideX.')}>
                <LinearGradient colors={Gradients.brand} style={styles.contactGradient}>
                  <Ionicons name="call" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.contactLabel}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} accessibilityRole="button" accessibilityLabel="Message driver, unavailable" onPress={() => Alert.alert('Messaging unavailable', 'Messaging is not connected in this version of RideX.')}>
                <View style={styles.contactGradient2}>
                  <Ionicons name="chatbubble" size={20} color={Colors.brand.start} />
                </View>
                <Text style={styles.contactLabel}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} accessibilityRole="button" accessibilityLabel="Emergency support unavailable" onPress={() => Alert.alert('Emergency support unavailable', 'RideX has not connected emergency calling. Contact local emergency services directly if you need immediate help.')}>
                <View style={[styles.contactGradient2, { backgroundColor: Colors.status.dangerBg }]}>
                  <Ionicons name="warning" size={20} color={Colors.status.danger} />
                </View>
                <Text style={[styles.contactLabel, { color: Colors.status.danger }]}>SOS</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Trip details */}
        <Card style={styles.tripCard}>
          <Text style={styles.tripTitle}>Trip Details</Text>
          <View style={styles.tripRow}>
            <View style={styles.tripDot} />
            <View style={styles.tripInfo}>
              <Text style={styles.tripLabel}>Pickup</Text>
              <Text style={styles.tripAddress}>{currentRide.pickup?.address || 'Your location'}</Text>
            </View>
          </View>
          <View style={styles.tripDividerLine} />
          <View style={styles.tripRow}>
            <View style={[styles.tripDot, { backgroundColor: Colors.brand.start }]} />
            <View style={styles.tripInfo}>
              <Text style={styles.tripLabel}>Destination</Text>
              <Text style={styles.tripAddress}>{currentRide.destination?.address || 'Destination'}</Text>
            </View>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Est. Fare</Text>
            <Text style={styles.fareValue}>₹{currentRide.estimatedFare}</Text>
          </View>
        </Card>

        {/* Cancel button (only before in_progress) */}
        {['searching', 'driver_assigned', 'driver_arriving'].includes(currentRide.status) && (
          <Button title="Cancel Ride" variant="danger" onPress={handleCancel} style={{ marginHorizontal: Spacing.xl }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...Typography.title, color: Colors.text.primary },
  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyTitle: { ...Typography.heading, color: Colors.text.primary },
  emptySubtitle: { color: Colors.text.secondary },
  // Status indicator
  statusIndicator: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  statusPulse: {},
  statusIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { ...Typography.subtitle, color: Colors.text.primary },
  statusDesc: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
  actionError: { fontSize: 13, color: Colors.status.danger, textAlign: 'center' },
  // Steps
  stepsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 0 },
  stepRow: { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg.card, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDone: { backgroundColor: Colors.status.success, borderColor: Colors.status.success },
  stepCurrent: { borderColor: Colors.brand.start, backgroundColor: 'rgba(124,58,237,0.15)' },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.text.muted },
  stepContent: { marginTop: 6, alignItems: 'center' },
  stepLabel: { fontSize: 10, color: Colors.text.muted, textAlign: 'center' },
  stepLabelActive: { color: Colors.text.primary, fontWeight: '600' },
  stepLine: { position: 'absolute', top: 16, left: '50%', right: '-50%', height: 2, backgroundColor: Colors.border },
  stepLineDone: { backgroundColor: Colors.status.success },
  // Driver card
  driverCard: { gap: Spacing.md },
  driverHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  driverAvatarWrapper: { position: 'relative' },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.brand.start },
  driverOnline: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.status.success, borderWidth: 2, borderColor: Colors.bg.primary },
  driverInfo: { flex: 1, gap: 3 },
  driverName: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  driverRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '600', color: Colors.text.primary },
  vehicleText: { fontSize: 13, color: Colors.text.secondary },
  plateBox: { backgroundColor: Colors.bg.secondary, borderRadius: Radius.sm, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  plateText: { fontSize: 12, fontWeight: '700', color: Colors.text.primary, letterSpacing: 1 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, backgroundColor: Colors.status.infoBg, borderRadius: Radius.md },
  etaText: { fontSize: 14, color: Colors.status.info, fontWeight: '600' },
  contactActions: { flexDirection: 'row', justifyContent: 'space-around' },
  contactBtn: { alignItems: 'center', gap: 6 },
  contactGradient: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contactGradient2: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  contactLabel: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },
  // Trip card
  tripCard: { gap: Spacing.md },
  tripTitle: { ...Typography.heading, color: Colors.text.primary },
  tripRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  tripDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.status.success, marginTop: 4 },
  tripInfo: { flex: 1, gap: 2 },
  tripLabel: { fontSize: 11, color: Colors.text.muted, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  tripAddress: { fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  tripDividerLine: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 5 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md },
  fareLabel: { fontSize: 14, color: Colors.text.secondary },
  fareValue: { fontSize: 22, fontWeight: '800', color: Colors.text.primary },
});
