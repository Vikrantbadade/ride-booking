import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Gradients, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { useRideStore } from '../../src/store/rideStore';
import { RIDE_TYPES, MOCK_PASSENGER } from '../../src/constants/mockData';
import { Button } from '../../src/components/ui/Button';
import { GlassCard } from '../../src/components/ui/Components';
import { MapVisual } from '../../src/components/ui/MapVisual';
import { useFadeIn } from '../../src/hooks/useAnimations';
import { estimateRide, type RideEstimate } from '../../src/services/rides';

// Simulated map pins for demo
const MUMBAI_LOCATIONS = [
  { address: 'Bandra West Station', latitude: 19.0596, longitude: 72.8295 },
  { address: 'Andheri East Metro', latitude: 19.1136, longitude: 72.8697 },
  { address: 'Juhu Beach', latitude: 19.0988, longitude: 72.8265 },
  { address: 'Powai Lake', latitude: 19.118, longitude: 72.9051 },
  { address: 'Churchgate Station', latitude: 18.9355, longitude: 72.8259 },
  { address: 'Lower Parel', latitude: 18.9949, longitude: 72.8273 },
  { address: 'BKC, Mumbai', latitude: 19.0627, longitude: 72.8649 },
  { address: 'Kurla Station', latitude: 19.0726, longitude: 72.8784 },
];

export default function PassengerHome() {
  const { user } = useAuthStore();
  const { currentRide, setPickup, setDestination, selectedRideType, setRideType, bookRide } = useRideStore();
  const [activeField, setActiveField] = useState<'pickup' | 'dest' | null>(null);
  const [suggestions, setSuggestions] = useState(MUMBAI_LOCATIONS);
  const [searchModal, setSearchModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [fareQuote, setFareQuote] = useState<{ routeKey: string; quotes: Record<string, RideEstimate> } | null>(null);
  const [estimateFailure, setEstimateFailure] = useState<{ routeKey: string; message: string } | null>(null);
  const fadeAnim = useFadeIn(0);
  const pickupText = currentRide?.pickup?.address || '';
  const destText = currentRide?.destination?.address || '';
  const pickupSet = Boolean(currentRide?.pickup);
  const destSet = Boolean(currentRide?.destination);

  const pickupAddress = currentRide?.pickup?.address;
  const pickupLatitude = currentRide?.pickup?.latitude;
  const pickupLongitude = currentRide?.pickup?.longitude;
  const destinationAddress = currentRide?.destination?.address;
  const destinationLatitude = currentRide?.destination?.latitude;
  const destinationLongitude = currentRide?.destination?.longitude;
  const routeKey = pickupAddress && destinationAddress && pickupAddress !== destinationAddress
    ? [pickupAddress, pickupLatitude, pickupLongitude, destinationAddress, destinationLatitude, destinationLongitude].join('|')
    : '';
  const fareEstimates = fareQuote?.routeKey === routeKey ? fareQuote.quotes : {};
  const fareEstimate = fareEstimates[selectedRideType] || null;
  const estimateError = estimateFailure?.routeKey === routeKey ? estimateFailure.message : '';
  const isEstimating = Boolean(routeKey && fareQuote?.routeKey !== routeKey && estimateFailure?.routeKey !== routeKey);
  const distance = fareEstimate?.distanceKm ?? 0;
  const fare = fareEstimate?.estimatedFare ?? 0;

  useEffect(() => {
    if (!routeKey || !pickupAddress || pickupLatitude === undefined || pickupLongitude === undefined || !destinationAddress || destinationLatitude === undefined || destinationLongitude === undefined) return;

    let active = true;
    const pickup = { address: pickupAddress, latitude: pickupLatitude, longitude: pickupLongitude };
    const destination = { address: destinationAddress, latitude: destinationLatitude, longitude: destinationLongitude };
    const apiPickup = { ...pickup, address: pickup.address || '' };
    const apiDestination = { ...destination, address: destination.address || '' };
    Promise.all(RIDE_TYPES.map((type) => estimateRide({ pickup: apiPickup, destination: apiDestination, rideType: type.id })))
      .then((estimates) => {
        if (active) {
          setFareQuote({ routeKey, quotes: Object.fromEntries(estimates.map((estimate) => [estimate.rideType, estimate])) });
          setEstimateFailure(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setEstimateFailure({ routeKey, message: error instanceof Error ? error.message : 'Fare estimate unavailable.' });
      });
    return () => { active = false; };
  }, [routeKey, pickupAddress, pickupLatitude, pickupLongitude, destinationAddress, destinationLatitude, destinationLongitude]);

  useEffect(() => {
    if (currentRide?.status === 'searching' || currentRide?.status === 'driver_assigned' || currentRide?.status === 'driver_arriving' || currentRide?.status === 'in_progress' || currentRide?.status === 'completed') {
      router.replace('/(passenger)/booking');
    }
  }, [currentRide?.status]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    const filtered = MUMBAI_LOCATIONS.filter((l) => l.address.toLowerCase().includes(text.toLowerCase()));
    setSuggestions(filtered);
  };

  const selectLocation = (location: typeof MUMBAI_LOCATIONS[0]) => {
    const isSameRouteEndpoint = activeField === 'pickup'
      ? destSet && location.address === destText
      : pickupSet && location.address === pickupText;
    if (isSameRouteEndpoint) {
      Alert.alert('Choose a different location', 'Pickup and destination must be different.');
      return;
    }

    if (activeField === 'pickup') {
      setPickup(location);
    } else {
      setDestination(location);
    }
    setSearchText('');
    setSearchModal(false);
  };

  const openSearch = (field: 'pickup' | 'dest') => {
    setActiveField(field);
    const initialText = field === 'pickup' ? pickupText : destText;
    setSearchText(initialText);
    setSuggestions(initialText
      ? MUMBAI_LOCATIONS.filter((location) => location.address.toLowerCase().includes(initialText.toLowerCase()))
      : MUMBAI_LOCATIONS);
    setSearchModal(true);
  };

  const handleBook = async () => {
    if (!pickupSet || !destSet) {
      Alert.alert('Missing Locations', 'Please set both pickup and destination');
      return;
    }
    if (pickupText === destText) {
      Alert.alert('Choose a different location', 'Pickup and destination must be different.');
      return;
    }
    if (!fareEstimate) {
      Alert.alert('Fare estimate unavailable', estimateError || 'Wait for the server estimate, then try again.');
      return;
    }
    setIsBooking(true);
    try {
      await bookRide();
    } catch (error) {
      Alert.alert('Could not book ride', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[{ flex: 1 }, fadeAnim]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Passenger'}</Text>
          </View>
          <View style={styles.notifBtn} accessible={false}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text.primary} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.mapContainer}>
            <MapVisual
              height={208}
              pickupLabel={pickupSet ? pickupText : undefined}
              destLabel={destSet ? destText : undefined}
              showRoute={pickupSet && destSet}
              label={pickupSet && destSet ? 'Route preview' : 'Choose a pickup and destination'}
            />
          </View>

          {/* Location inputs */}
          <GlassCard style={styles.locationCard}>
            {/* Pickup */}
            <TouchableOpacity style={[styles.locationInput, pickupSet && styles.locationInputActive]} onPress={() => openSearch('pickup')} accessibilityRole="button" accessibilityLabel={`Pickup location: ${pickupText || 'Set pickup location'}`}>
              <View style={[styles.locationDot, { backgroundColor: Colors.status.success }]} />
              <Text style={[styles.locationText, !pickupText && styles.placeholder]}>{pickupText || 'Set pickup location'}</Text>
              {pickupSet && <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />}
            </TouchableOpacity>

            <View style={styles.locationDivider}>
              <View style={styles.locationDividerLine} />
              <Ionicons name="swap-vertical" size={18} color={Colors.text.muted} />
            </View>

            {/* Destination */}
            <TouchableOpacity style={[styles.locationInput, destSet && styles.locationInputActive]} onPress={() => openSearch('dest')} accessibilityRole="button" accessibilityLabel={`Destination: ${destText || 'Choose destination'}`}>
              <View style={[styles.locationDot, { backgroundColor: Colors.brand.start }]} />
              <Text style={[styles.locationText, !destText && styles.placeholder]}>{destText || 'Where to?'}</Text>
              {destSet && <Ionicons name="checkmark-circle" size={18} color={Colors.brand.start} />}
            </TouchableOpacity>
          </GlassCard>

          {/* Saved places */}
          <View style={styles.savedPlaces}>
            {MOCK_PASSENGER.savedPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.savedPlaceBtn}
                onPress={() => {
                  const duplicatesEndpoint = pickupSet
                    ? place.address === pickupText
                    : destSet && place.address === destText;
                  if (duplicatesEndpoint) {
                    Alert.alert('Choose a different location', 'Pickup and destination must be different.');
                    return;
                  }
                  if (!pickupSet) {
                    setPickup(place);
                  } else {
                    setDestination(place);
                  }
                }}
              >
                <View style={styles.savedPlaceIcon}>
                  <Ionicons name={place.icon as any} size={16} color={Colors.brand.start} />
                </View>
                <Text style={styles.savedPlaceName}>{place.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ride type selector */}
          {pickupSet && destSet && (
            <View style={styles.rideTypesSection}>
              <Text style={styles.sectionTitle}>Choose Ride</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.xl }}>
                <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingVertical: 4 }}>
                  {RIDE_TYPES.map((type) => {
                    const isSelected = selectedRideType === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.rideTypeCard, isSelected && styles.rideTypeSelected]}
                        onPress={() => setRideType(type.id)}
                      >
                        {isSelected && (
                          <LinearGradient colors={Gradients.brand} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                            <View />
                          </LinearGradient>
                        )}
                        <Ionicons name={type.icon as any} size={28} color={isSelected ? '#fff' : Colors.brand.start} />
                        <Text style={[styles.rideTypeName, isSelected && styles.rideTypeNameSelected]}>{type.name}</Text>
                        <Text style={[styles.rideTypeFare, isSelected && { color: '#fff' }]}>
                          {fareEstimates[type.id] ? `₹${fareEstimates[type.id].estimatedFare}` : '—'}
                        </Text>
                        <Text style={[styles.rideTypeEta, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>{type.eta}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Fare summary */}
          {pickupSet && destSet && (
            <View style={styles.fareSummary}>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Estimated Fare</Text>
                <Text style={styles.fareValue}>{fareEstimate ? `₹${fare}` : isEstimating ? '…' : '—'}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Distance</Text>
                <Text style={styles.fareDetail}>{fareEstimate ? `${distance} km` : '—'}</Text>
              </View>
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Duration</Text>
                <Text style={styles.fareDetail}>{fareEstimate ? `~${fareEstimate.durationMinutes} min` : '—'}</Text>
              </View>
              <Text style={styles.estimateNote}>Approximate straight-line estimate; road routing is not connected.</Text>
              {estimateError ? <Text style={styles.estimateError}>{estimateError}</Text> : null}
            </View>
          )}

          {/* Book button */}
          <View style={styles.bookSection}>
            <Button
              title={isBooking ? 'Requesting Ride...' : isEstimating ? 'Calculating Fare...' : pickupSet && destSet && fareEstimate ? `Book ${RIDE_TYPES.find(r => r.id === selectedRideType)?.name} · ₹${fare}` : 'Set Locations to Continue'}
              onPress={handleBook}
              loading={isBooking || isEstimating}
              disabled={!pickupSet || !destSet || !fareEstimate}
              size="lg"
              style={styles.bookBtn}
            />
          </View>
        </ScrollView>
      </Animated.View>

      {/* Search Modal */}
      <Modal visible={searchModal} animationType="slide" transparent>
        <View style={styles.searchModal}>
          <SafeAreaView style={styles.searchModalInner}>
            <View style={styles.searchHeader}>
              <Text style={styles.searchTitle}>{activeField === 'pickup' ? 'Set Pickup' : 'Set Destination'}</Text>
              <TouchableOpacity onPress={() => setSearchModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color={Colors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor={Colors.text.muted}
                value={searchText}
                onChangeText={handleSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.address}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => selectLocation(item)}>
                  <View style={styles.suggestionIcon}>
                    <Ionicons name="location-outline" size={18} color={Colors.brand.start} />
                  </View>
                  <Text style={styles.suggestionText}>{item.address}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={(
                <Text style={styles.noLocations}>No matching locations. Try another search.</Text>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  greeting: { fontSize: 13, color: Colors.text.muted, fontWeight: '500' },
  userName: { ...Typography.title, color: Colors.text.primary, marginTop: 2 },
  notifBtn: { position: 'relative', width: 44, height: 44, backgroundColor: Colors.bg.card, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.danger },
  // Map
  mapContainer: { marginHorizontal: Spacing.xl, borderRadius: Radius.xl, overflow: 'hidden', height: 200, marginBottom: Spacing.lg },
  mapBg: { flex: 1, position: 'relative' },
  mapLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.04)' },
  routeLine: { position: 'absolute', top: 70, left: 80, width: 180, height: 3, borderRadius: 2, transform: [{ rotate: '25deg' }] },
  pin: { position: 'absolute' },
  pickupPin: { bottom: 40, left: 60 },
  destPin: { top: 30, right: 70 },
  miniCar: { position: 'absolute', width: 24, height: 24, backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  mapPrompt: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center', gap: 4 },
  mapPromptText: { fontSize: 13, color: Colors.text.muted },
  // Location Card
  locationCard: { marginHorizontal: Spacing.xl, backgroundColor: Colors.bg.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: 4, marginBottom: Spacing.md },
  locationInput: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md },
  locationInputActive: { backgroundColor: 'rgba(124,58,237,0.08)' },
  locationDot: { width: 10, height: 10, borderRadius: 5 },
  locationText: { flex: 1, fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  placeholder: { color: Colors.text.muted, fontWeight: '400' },
  locationDivider: { flexDirection: 'row', alignItems: 'center', paddingLeft: 6, gap: 8 },
  locationDividerLine: { width: 2, height: 16, backgroundColor: Colors.border, marginLeft: 4 },
  // Saved places
  savedPlaces: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.lg },
  savedPlaceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bg.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  savedPlaceIcon: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: 'rgba(124,58,237,0.15)', alignItems: 'center', justifyContent: 'center' },
  savedPlaceName: { fontSize: 13, fontWeight: '600', color: Colors.text.primary },
  // Ride types
  rideTypesSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg, gap: Spacing.md },
  sectionTitle: { ...Typography.heading, color: Colors.text.primary },
  rideTypeCard: { width: 100, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 6, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  rideTypeSelected: { borderColor: Colors.brand.start },
  rideTypeName: { fontSize: 13, fontWeight: '700', color: Colors.text.primary },
  rideTypeNameSelected: { color: '#fff' },
  rideTypeFare: { fontSize: 14, fontWeight: '800', color: Colors.brand.start },
  rideTypeEta: { fontSize: 11, color: Colors.text.muted },
  // Fare
  fareSummary: { marginHorizontal: Spacing.xl, backgroundColor: Colors.bg.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fareLabel: { fontSize: 14, color: Colors.text.secondary },
  fareValue: { fontSize: 24, fontWeight: '800', color: Colors.text.primary },
  fareDetail: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  estimateNote: { fontSize: 11, lineHeight: 16, color: Colors.text.muted },
  estimateError: { fontSize: 12, color: Colors.status.danger },
  // Book
  bookSection: { paddingHorizontal: Spacing.xl },
  bookBtn: { width: '100%' },
  // Search Modal
  searchModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  searchModalInner: { flex: 1, backgroundColor: Colors.bg.secondary, marginTop: 80, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  searchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchTitle: { ...Typography.heading, color: Colors.text.primary },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, margin: Spacing.xl, backgroundColor: Colors.bg.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg },
  searchInput: { flex: 1, paddingVertical: 14, color: Colors.text.primary, fontSize: 15 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  suggestionIcon: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: 'rgba(124,58,237,0.1)', alignItems: 'center', justifyContent: 'center' },
  suggestionText: { flex: 1, fontSize: 15, color: Colors.text.primary },
  noLocations: { color: Colors.text.muted, textAlign: 'center', padding: Spacing.xl },
});
