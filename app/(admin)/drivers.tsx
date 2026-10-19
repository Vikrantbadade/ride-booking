import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useAdminStore } from '../../src/store/adminStore';
import { Badge, Card } from '../../src/components/ui/Components';

export default function DriversScreen() {
  const { drivers, fetchDrivers, isLoadingDrivers, driversError } = useAdminStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'online'>('all');

  useEffect(() => {
    void fetchDrivers().catch(() => undefined);
  }, [fetchDrivers]);

  const filtered = drivers.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.vehicle.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'verified' && d.isVerified) || (filter === 'unverified' && !d.isVerified) || (filter === 'online' && d.isOnline);
    return matchSearch && matchFilter;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>All Drivers</Text>
        <Text style={styles.subtitle}>{drivers.length} registered · {drivers.filter((d) => d.isVerified).length} verified</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.text.muted} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search name or vehicle..." placeholderTextColor={Colors.text.muted} value={search} onChangeText={setSearch} />
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'verified', 'unverified', 'online'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
            accessibilityLabel={`Filter drivers: ${f}`}
            accessibilityState={{ selected: filter === f }}
          >
            <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card style={styles.driverCard}>
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, item.isOnline && styles.driverAvatarOnline]}>
                <Ionicons name="person" size={24} color={item.isVerified ? Colors.brand.start : Colors.text.muted} />
                {item.isOnline && <View style={styles.onlineDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{item.name}</Text>
                <Text style={styles.driverVehicle}>{item.vehicle} · {item.vehicleColor}</Text>
                <Text style={styles.driverPlate}>{item.licensePlate}</Text>
              </View>
              <View style={styles.statusColumn}>
                <Badge label={item.isVerified ? 'Verified' : 'Unverified'} variant={item.isVerified ? 'success' : 'warning'} size="sm" />
                {item.isOnline && <Badge label="Online" variant="info" size="sm" />}
              </View>
            </View>

            <View style={styles.driverStats}>
              <View style={styles.driverStat}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.driverStatText}>Not rated</Text>
              </View>
              <View style={styles.driverStat}>
                <Ionicons name="car" size={14} color={Colors.text.muted} />
                <Text style={styles.driverStatText}>{item.totalRides} rides</Text>
              </View>
              <View style={styles.driverStat}>
                <Ionicons name="call" size={14} color={Colors.text.muted} />
                <Text style={styles.driverStatText}>{item.phone}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={isLoadingDrivers ? (
          <View style={styles.empty}><ActivityIndicator color={Colors.brand.start} /><Text style={styles.emptyText}>Loading drivers…</Text></View>
        ) : driversError ? (
          <View style={styles.empty}><Text style={styles.emptyText}>{driversError}</Text></View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={Colors.text.muted} />
            <Text style={styles.emptyText}>No drivers found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: 4 },
  title: { ...Typography.title, color: Colors.text.primary },
  subtitle: { fontSize: 13, color: Colors.text.secondary },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: Colors.bg.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { paddingLeft: 14 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: Colors.text.primary, fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.md },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: 'rgba(217,119,6,0.15)', borderColor: '#D97706' },
  filterLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  filterLabelActive: { color: '#D97706' },
  list: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.xl, paddingTop: 0, gap: Spacing.md, paddingBottom: 100 },
  driverCard: { gap: Spacing.md },
  driverRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  driverAvatarOnline: { borderColor: Colors.status.success },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.status.success, borderWidth: 2, borderColor: Colors.bg.primary },
  driverName: { fontSize: 15, fontWeight: '700', color: Colors.text.primary },
  driverVehicle: { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  driverPlate: { fontSize: 12, color: Colors.text.muted, fontFamily: 'monospace', marginTop: 1 },
  statusColumn: { gap: 4, alignItems: 'flex-end' },
  driverStats: { flexDirection: 'row', gap: Spacing.lg, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  driverStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverStatText: { fontSize: 12, color: Colors.text.muted },
  empty: { alignItems: 'center', gap: Spacing.md, paddingTop: 60 },
  emptyText: { fontSize: 16, color: Colors.text.muted },
});
