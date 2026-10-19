import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../../src/theme/colors';
import { Card } from '../../src/components/ui/Components';

const WEEKLY_DATA = [
  { day: 'Mon', amount: 1240, rides: 6 },
  { day: 'Tue', amount: 1840, rides: 8 },
  { day: 'Wed', amount: 980, rides: 4 },
  { day: 'Thu', amount: 2100, rides: 9 },
  { day: 'Fri', amount: 2560, rides: 11 },
  { day: 'Sat', amount: 1920, rides: 7 },
  { day: 'Sun', amount: 1100, rides: 5 },
];

const MAX_AMOUNT = Math.max(...WEEKLY_DATA.map((d) => d.amount));

export default function EarningsScreen() {
  const totalWeek = WEEKLY_DATA.reduce((a, b) => a + b.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Earnings</Text>

        <View style={styles.demoNotice} accessibilityRole="text">
          <Ionicons name="information-circle-outline" size={18} color={Colors.status.warning} accessible={false} importantForAccessibility="no" />
          <Text style={styles.demoNoticeText}>Sample figures for layout preview. Live earnings and payouts are not available yet.</Text>
        </View>

        {/* Current sample period; period filtering is not connected to an earnings API. */}
        <View style={styles.periodSelector}>
          <Text style={styles.periodLabel}>Sample week</Text>
          <Ionicons name="calendar-outline" size={18} color={Colors.text.secondary} accessible={false} importantForAccessibility="no" />
        </View>

        {/* Total card */}
        <LinearGradient colors={Gradients.brand} style={styles.totalCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.totalLabel}>Total Earned</Text>
          <Text style={styles.totalAmount}>₹{totalWeek.toLocaleString('en-IN')}</Text>
          <Text style={styles.totalDetail}>{WEEKLY_DATA.reduce((a, b) => a + b.rides, 0)} rides · 7 days</Text>
          <View style={styles.totalMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaText}>+12% vs last week</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="car" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaText}>Avg ₹{Math.round(totalWeek / WEEKLY_DATA.reduce((a, b) => a + b.rides, 0))}/ride</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Bar chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Breakdown</Text>
          <View style={styles.chart}>
            {WEEKLY_DATA.map((d) => {
              const barHeight = (d.amount / MAX_AMOUNT) * 120;
              return (
                <View key={d.day} style={styles.barContainer}>
                  <Text style={styles.barAmount}>₹{(d.amount / 1000).toFixed(1)}k</Text>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={['rgba(139,92,246,0.55)', 'rgba(37,99,235,0.55)']}
                      style={[styles.bar, { height: barHeight }]}
                    />
                  </View>
                  <Text style={styles.barDay}>{d.day}</Text>
                  <Text style={styles.barRides}>{d.rides}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.chartNote}>Rides shown below bars</Text>
        </Card>

        {/* Recent transactions */}
        <Card style={styles.txCard}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          {[
            { time: '14:30', passenger: 'Ananya S.', dest: 'Lower Parel', amount: 285 },
            { time: '12:15', passenger: 'Rohan K.', dest: 'BKC', amount: 195 },
            { time: '10:45', passenger: 'Priya M.', dest: 'Juhu Beach', amount: 340 },
            { time: '09:20', passenger: 'Amit R.', dest: 'Andheri', amount: 220 },
          ].map((tx, i) => (
            <View key={i} style={styles.txRow}>
              <View style={styles.txIcon}>
                <Ionicons name="arrow-up" size={16} color={Colors.status.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txPassenger}>{tx.passenger} → {tx.dest}</Text>
                <Text style={styles.txTime}>{tx.time}</Text>
              </View>
              <Text style={styles.txAmount}>+₹{tx.amount}</Text>
            </View>
          ))}
        </Card>

        {/* Payout card */}
        <Card style={styles.payoutCard}>
          <View style={styles.payoutRow}>
            <View>
              <Text style={styles.payoutLabel}>Available for Payout</Text>
              <Text style={styles.payoutAmount}>₹{(totalWeek * 0.85).toFixed(0)}</Text>
              <Text style={styles.payoutNote}>Platform fee (15%) deducted</Text>
            </View>
            <View style={[styles.payoutBtn, styles.payoutUnavailable]} accessible accessibilityLabel="Withdraw, unavailable">
              <LinearGradient colors={Gradients.success} style={styles.payoutGradient}>
                <Ionicons name="wallet" size={18} color="#fff" />
                <Text style={styles.payoutBtnText}>Withdraw</Text>
              </LinearGradient>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  title: { ...Typography.title, color: Colors.text.primary },
  demoNotice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.status.warningBg, borderWidth: 1, borderColor: Colors.status.warningBorder, borderRadius: Radius.md },
  demoNoticeText: { flex: 1, color: Colors.status.warning, fontSize: 13, lineHeight: 19 },
  periodSelector: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bg.card, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  periodLabel: { fontSize: 14, color: Colors.text.primary, fontWeight: '600' },
  // Total
  totalCard: { borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.sm },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  totalAmount: { fontSize: 40, fontWeight: '900', color: '#fff', lineHeight: 48 },
  totalDetail: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  totalMeta: { flexDirection: 'row', gap: Spacing.xl, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  // Chart
  chartCard: { gap: Spacing.lg },
  chartTitle: { ...Typography.heading, color: Colors.text.primary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, paddingTop: 20 },
  barContainer: { alignItems: 'center', gap: 4, flex: 1 },
  barAmount: { fontSize: 9, color: Colors.text.muted, fontWeight: '500' },
  barTrack: { width: 20, height: 120, justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden', backgroundColor: Colors.bg.secondary },
  bar: { width: '100%', borderRadius: 4 },
  barDay: { fontSize: 11, color: Colors.text.muted, fontWeight: '600' },
  barRides: { fontSize: 10, color: Colors.text.muted },
  chartNote: { fontSize: 11, color: Colors.text.muted, textAlign: 'center' },
  // Transactions
  txCard: { gap: Spacing.md },
  cardTitle: { ...Typography.heading, color: Colors.text.primary },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  txIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.status.successBg, alignItems: 'center', justifyContent: 'center' },
  txPassenger: { fontSize: 14, fontWeight: '500', color: Colors.text.primary },
  txTime: { fontSize: 12, color: Colors.text.muted },
  txAmount: { fontSize: 16, fontWeight: '700', color: Colors.status.success },
  // Payout
  payoutCard: {},
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutLabel: { fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
  payoutAmount: { fontSize: 28, fontWeight: '800', color: Colors.text.primary },
  payoutNote: { fontSize: 11, color: Colors.text.muted },
  payoutBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  payoutUnavailable: { opacity: 0.55 },
  payoutGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  payoutBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

const Gradients = {
  brand: ['#7C3AED', '#2563EB'] as [string, string],
  success: ['#10B981', '#059669'] as [string, string],
};
