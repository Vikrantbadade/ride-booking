import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Gradients, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useRideStore } from '../../src/store/rideStore';
import { Button } from '../../src/components/ui/Button';
import { Card, Badge } from '../../src/components/ui/Components';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI (GPay / PhonePe)', icon: 'phone-portrait', color: '#6366F1' },
  { id: 'card', label: 'Credit / Debit Card', icon: 'card', color: '#2563EB' },
  { id: 'wallet', label: 'RideX Wallet', icon: 'wallet', color: '#059669' },
  { id: 'cash', label: 'Cash', icon: 'cash', color: '#D97706' },
];

export default function PaymentScreen() {
  const { currentRide, payForRide, resetRide } = useRideStore();
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(currentRide?.paymentStatus === 'paid');

  const handlePay = async () => {
    if (!currentRide || currentRide.status !== 'completed') return;
    setIsPaying(true);
    try {
      await payForRide(selectedMethod);
      setPaid(true);
    } catch (error) {
      Alert.alert('Payment not completed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  const fare = currentRide?.finalFare || currentRide?.estimatedFare || 0;

  // Invoice view (after payment)
  if (paid) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Success animation */}
          <View style={styles.successContainer}>
            <LinearGradient colors={Gradients.success} style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>Your invoice has been generated</Text>
          </View>

          {/* Invoice */}
          <Card style={styles.invoice}>
            {/* Invoice header */}
            <View style={styles.invoiceHeader}>
              <LinearGradient colors={Gradients.brand} style={styles.invoiceLogo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="car-sport" size={20} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={styles.invoiceTitle}>RideX Invoice</Text>
                <Text style={styles.invoiceId}>{currentRide?.invoiceNo || 'Invoice unavailable'}</Text>
              </View>
              <Badge label="PAID" variant="success" />
            </View>

            <View style={styles.invoiceDivider} />

            {/* Trip details */}
            <View style={styles.invoiceSection}>
              <Text style={styles.invoiceSectionTitle}>Trip Details</Text>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Date & Time</Text>
                <Text style={styles.invoiceValue}>{currentRide?.invoiceIssuedAt ? new Date(currentRide.invoiceIssuedAt).toLocaleString('en-IN') : '—'}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Pickup</Text>
                <Text style={[styles.invoiceValue, { flex: 1, textAlign: 'right' }]}>{currentRide?.pickup?.address}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Drop-off</Text>
                <Text style={[styles.invoiceValue, { flex: 1, textAlign: 'right' }]}>{currentRide?.destination?.address}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Driver</Text>
                <Text style={styles.invoiceValue}>{currentRide?.driver?.name}</Text>
              </View>
              <View style={styles.invoiceRow}>
                <Text style={styles.invoiceLabel}>Vehicle</Text>
                <Text style={styles.invoiceValue}>{currentRide?.driver?.vehicle} · {currentRide?.driver?.licensePlate}</Text>
              </View>
            </View>

            <View style={styles.invoiceDivider} />

            {/* Persisted invoice total */}
            <View style={styles.invoiceSection}>
              <Text style={styles.invoiceSectionTitle}>Invoice Total</Text>
              <View style={[styles.invoiceRow, styles.invoiceTotalRow]}>
                <Text style={styles.invoiceTotalLabel}>Total Paid</Text>
                <Text style={styles.invoiceTotalValue}>₹{fare}</Text>
              </View>
            </View>

            <View style={styles.invoiceDivider} />

            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Payment Method</Text>
              <Text style={styles.invoiceValue}>{currentRide?.paymentMethod?.toUpperCase()}</Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button title="Share Invoice" variant="secondary" onPress={() => Alert.alert('Invoice sharing', 'Invoice sharing is not connected yet.')} icon={<Ionicons name="share-outline" size={18} color={Colors.text.primary} />} />
            <Button title="Book Another Ride" onPress={() => { resetRide(); router.replace('/(passenger)/home'); }} />
          </View>

          {/* Rating prompt */}
          <Card style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Ride rating</Text>
            <Text style={styles.ratingSubtitle}>Rating submission is not available yet.</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star-outline" size={24} color={Colors.text.muted} />
              ))}
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Payment selection
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Payment</Text>
        <Text style={styles.pageSubtitle}>Ride completed · Select payment method</Text>
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.status.warning} />
          <Text style={styles.demoNoticeText}>Development payment simulation — no real payment is processed.</Text>
        </View>

        {/* Fare display */}
        <LinearGradient colors={Gradients.brand} style={styles.fareCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.fareLabelText}>Total Fare</Text>
          <Text style={styles.fareAmount}>₹{fare}</Text>
          <Text style={styles.fareBreakdown}>{currentRide?.estimatedDistance} km · ~{currentRide?.estimatedDuration} min</Text>
        </LinearGradient>

        {/* Payment methods */}
        <View style={styles.methodsSection}>
          <Text style={styles.methodsTitle}>Payment Method</Text>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.methodCard, selectedMethod === method.id && styles.methodSelected]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
                <Ionicons name={method.icon as any} size={22} color={method.color} />
              </View>
              <Text style={styles.methodLabel}>{method.label}</Text>
              <View style={[styles.radio, selectedMethod === method.id && styles.radioSelected]}>
                {selectedMethod === method.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={`Pay ₹${fare}`}
          onPress={handlePay}
          loading={isPaying}
          size="lg"
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  pageTitle: { ...Typography.title, color: Colors.text.primary },
  pageSubtitle: { color: Colors.text.secondary, fontSize: 14 },
  demoNotice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.status.warningBg, borderColor: Colors.status.warningBorder, borderWidth: 1, borderRadius: Radius.md },
  demoNoticeText: { flex: 1, color: Colors.status.warning, fontSize: 12, lineHeight: 18 },
  // Fare card
  fareCard: { borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  fareLabelText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  fareAmount: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 56 },
  fareBreakdown: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  // Payment methods
  methodsSection: { gap: Spacing.md },
  methodsTitle: { ...Typography.heading, color: Colors.text.primary },
  methodCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.bg.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  methodSelected: { borderColor: Colors.brand.start, backgroundColor: 'rgba(124,58,237,0.08)' },
  methodIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text.primary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.brand.start },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand.start },
  // Success
  successContainer: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...Typography.title, color: Colors.text.primary },
  successSubtitle: { color: Colors.text.secondary },
  // Invoice
  invoice: { gap: Spacing.md },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  invoiceLogo: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  invoiceTitle: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  invoiceId: { fontSize: 12, color: Colors.text.muted, fontFamily: 'monospace' },
  invoiceDivider: { height: 1, backgroundColor: Colors.border },
  invoiceSection: { gap: Spacing.sm },
  invoiceSectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceLabel: { fontSize: 14, color: Colors.text.secondary },
  invoiceValue: { fontSize: 14, fontWeight: '500', color: Colors.text.primary },
  invoiceTotalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  invoiceTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text.primary },
  invoiceTotalValue: { fontSize: 22, fontWeight: '800', color: Colors.text.primary },
  // Actions
  actions: { flexDirection: 'row', gap: Spacing.md },
  // Rating
  ratingCard: { alignItems: 'center', gap: Spacing.md },
  ratingTitle: { ...Typography.heading, color: Colors.text.primary },
  ratingSubtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: Spacing.sm },
});
