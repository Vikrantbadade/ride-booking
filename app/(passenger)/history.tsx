import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useRideStore } from '../../src/store/rideStore';
import { Badge, Card } from '../../src/components/ui/Components';

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  completed: 'success',
  cancelled: 'danger',
  in_progress: 'info',
};

export default function HistoryScreen() {
  const { rideHistory, fetchRideHistory, historyLoading, historyError } = useRideStore();

  useEffect(() => {
    void fetchRideHistory().catch(() => undefined);
  }, [fetchRideHistory]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.subtitle}>{rideHistory.length} trips total</Text>
      </View>

      <FlatList
        data={rideHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={historyLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={Colors.brand.start} />
            <Text style={styles.emptyText}>Loading your rides…</Text>
          </View>
        ) : historyError ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={44} color={Colors.status.danger} />
            <Text style={styles.emptyText}>{historyError}</Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>No rides yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Card style={styles.rideCard}>
            <View style={styles.rideTop}>
              <View style={styles.rideIconWrapper}>
                <Ionicons
                  name={item.status === 'completed' ? 'checkmark-circle' : item.status === 'cancelled' ? 'close-circle' : 'car'}
                  size={24}
                  color={item.status === 'completed' ? Colors.status.success : item.status === 'cancelled' ? Colors.status.danger : Colors.brand.start}
                />
              </View>
              <View style={styles.rideMain}>
                <View style={styles.rideHeader}>
                  <Text style={styles.rideDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  <Badge label={item.status.toUpperCase()} variant={STATUS_VARIANT[item.status] || 'default'} size="sm" />
                </View>
                <View style={styles.routeRow}>
                  <View style={styles.routeDot} />
                  <Text style={styles.routeText} numberOfLines={1}>{item.pickup.address}</Text>
                </View>
                <View style={styles.routeRow}>
                  <View style={[styles.routeDot, { backgroundColor: Colors.brand.start }]} />
                  <Text style={styles.routeText} numberOfLines={1}>{item.destination.address}</Text>
                </View>
              </View>
            </View>

            <View style={styles.rideMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="navigate" size={14} color={Colors.text.muted} />
                <Text style={styles.metaText}>{item.distance} km</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={14} color={Colors.text.muted} />
                <Text style={styles.metaText}>{item.duration} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="card" size={14} color={Colors.text.muted} />
                <Text style={styles.metaText}>{item.paymentMethod || (item.paymentStatus === 'pending' ? 'Unpaid' : '—')}</Text>
              </View>
              <Text style={styles.fareBadge}>₹{item.fare}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: 4 },
  title: { ...Typography.title, color: Colors.text.primary },
  subtitle: { fontSize: 14, color: Colors.text.secondary },
  list: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, gap: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', gap: Spacing.md, paddingTop: 80 },
  emptyText: { fontSize: 16, color: Colors.text.muted },
  rideCard: { gap: Spacing.md },
  rideTop: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  rideIconWrapper: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  rideMain: { flex: 1, gap: 6 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rideDate: { fontSize: 13, color: Colors.text.muted, fontWeight: '500' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.success },
  routeText: { flex: 1, fontSize: 13, color: Colors.text.primary, fontWeight: '500' },
  rideMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.text.muted },
  fareBadge: { marginLeft: 'auto', fontSize: 16, fontWeight: '800', color: Colors.text.primary },
});
