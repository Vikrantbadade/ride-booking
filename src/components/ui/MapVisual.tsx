/**
 * RideX Premium — Decorative Map Visual
 * A clearly-labeled decorative map surface (not real navigation).
 * Features: grid lines, gradient route line, animated location pins,
 * floating mini-vehicles, and glassmorphic info overlay.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing, cancelAnimation, withDelay, useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../../theme/colors';

interface MapVisualProps {
  pickupLabel?: string;
  destLabel?: string;
  showRoute?: boolean;
  height?: number;
  style?: ViewStyle;
  label?: string;
}

export function MapVisual({
  pickupLabel,
  destLabel,
  showRoute = false,
  height = 240,
  style,
  label,
}: MapVisualProps) {
  const routeProgress = useSharedValue(0);
  const pin1Scale = useSharedValue(0.8);
  const pin2Scale = useSharedValue(0.8);
  const carX = useSharedValue(80);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      routeProgress.value = 1;
      pin1Scale.value = 1;
      pin2Scale.value = 1;
      return;
    }

    pin1Scale.value = withDelay(300, withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.95, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    ));

    pin2Scale.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(1.1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.92, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    ));

    if (showRoute) {
      routeProgress.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
      carX.value = withDelay(1000, withRepeat(
        withSequence(
          withTiming(200, { duration: 3000, easing: Easing.inOut(Easing.cubic) }),
          withTiming(80, { duration: 3000, easing: Easing.inOut(Easing.cubic) }),
        ), -1, true
      ));
    }

    return () => {
      cancelAnimation(routeProgress);
      cancelAnimation(pin1Scale);
      cancelAnimation(pin2Scale);
      cancelAnimation(carX);
    };
  }, [showRoute, routeProgress, pin1Scale, pin2Scale, carX, reduceMotion]);

  const pin1Style = useAnimatedStyle(() => ({ transform: [{ scale: pin1Scale.value }] }));
  const pin2Style = useAnimatedStyle(() => ({ transform: [{ scale: pin2Scale.value }] }));
  const carStyle  = useAnimatedStyle(() => ({ transform: [{ translateX: carX.value }] }));
  const routeStyle = useAnimatedStyle(() => ({ width: `${routeProgress.value * 65}%` as any, opacity: routeProgress.value }));

  return (
    <View style={[styles.container, { height }, style]}
      accessible={false}
      importantForAccessibility="no"
    >
      {/* Map background */}
      <LinearGradient colors={['#06091A', '#0A0E25', '#07091A']} style={StyleSheet.absoluteFill} />

      {/* Grid lines — horizontal */}
      {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((ratio, i) => (
        <View key={`h${i}`} style={[styles.gridLine, { top: `${ratio * 100}%`, left: 0, right: 0, height: 1 }]} />
      ))}
      {/* Grid lines — vertical */}
      {[0.12, 0.28, 0.44, 0.6, 0.76, 0.9].map((ratio, i) => (
        <View key={`v${i}`} style={[styles.gridLine, { left: `${ratio * 100}%`, top: 0, bottom: 0, width: 1 }]} />
      ))}

      {/* "Roads" — thicker accent lines */}
      <View style={[styles.road, { top: '42%', left: '8%', right: '8%' }]} />
      <View style={[styles.road, { left: '35%', top: '10%', bottom: '10%', width: 2, height: undefined }]} />

      {/* Glowing route line */}
      {showRoute && (
        <View style={styles.routeTrack}>
          <Animated.View style={[styles.routeGlow, routeStyle]}>
            <LinearGradient
              colors={[Colors.status.success, Colors.brand.start]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      )}

      {/* Floating mini vehicles */}
      {!showRoute && (
        <>
          <MiniCar style={{ top: '20%', left: '18%' }} delay={0} />
          <MiniCar style={{ top: '55%', left: '62%' }} delay={400} />
          <MiniCar style={{ top: '35%', left: '78%' }} delay={800} />
        </>
      )}

      {/* Moving car on route */}
      {showRoute && (
        <Animated.View style={[styles.routeCar, carStyle, { top: height * 0.37 }]}>
          <LinearGradient colors={[Colors.brand.start, Colors.brand.end]} style={styles.routeCarInner}>
            <Ionicons name="car-sport" size={14} color="#fff" />
          </LinearGradient>
        </Animated.View>
      )}

      {/* Pickup pin */}
      {pickupLabel && (
        <Animated.View style={[styles.pinWrapper, { bottom: '30%', left: '12%' }, pin1Style]}>
          <View style={[styles.pinDot, { backgroundColor: Colors.status.success }]}>
            <View style={styles.pinDotInner} />
          </View>
          <View style={styles.pinRing} />
          {pickupLabel !== '__silent' && (
            <View style={styles.pinLabel}>
              <Text style={styles.pinLabelText} numberOfLines={1}>{pickupLabel}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Destination pin */}
      {destLabel && (
        <Animated.View style={[styles.pinWrapper, { top: '15%', right: '15%' }, pin2Style]}>
          <View style={[styles.pinDot, { backgroundColor: Colors.brand.start }]}>
            <View style={styles.pinDotInner} />
          </View>
          <View style={[styles.pinRing, { borderColor: Colors.brand.start }]} />
          {destLabel !== '__silent' && (
            <View style={[styles.pinLabel, { backgroundColor: 'rgba(139,92,246,0.2)', borderColor: 'rgba(139,92,246,0.4)' }]}>
              <Text style={[styles.pinLabelText, { color: Colors.brand.accent }]} numberOfLines={1}>{destLabel}</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Dark gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(9,9,15,0.65)']}
        style={[StyleSheet.absoluteFill, { top: '60%' }]}
        pointerEvents="none"
      />

      {/* Info label */}
      {label && (
        <View style={styles.infoOverlay}>
          <Ionicons name="information-circle" size={14} color={Colors.text.muted} />
          <Text style={styles.infoText}>{label}</Text>
        </View>
      )}

      {/* "Decorative map" disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>Illustrative map · Not real navigation</Text>
      </View>
    </View>
  );
}

function MiniCar({ style, delay = 0 }: { style?: ViewStyle; delay?: number }) {
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) { opacity.value = 0.7; return; }
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 }),
      ), -1, true
    ));
    return () => cancelAnimation(opacity);
  }, [opacity, delay, reduceMotion]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.miniCar, style as ViewStyle, animStyle]}>
      <Ionicons name="car" size={12} color={Colors.brand.accent} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  road: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 1,
  },
  routeTrack: {
    position: 'absolute',
    top: '41%',
    left: '12%',
    right: '18%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  routeGlow: {
    height: 4,
    borderRadius: 2,
    top: 0,
    left: 0,
    right: 0,
    shadowColor: Colors.brand.start,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  routeCar: {
    position: 'absolute',
    left: '10%',
  },
  routeCarInner: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.start,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  pinDotInner: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#fff',
  },
  pinRing: {
    position: 'absolute',
    width: 30, height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.status.success,
    opacity: 0.4,
  },
  pinLabel: {
    marginTop: 6,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 120,
  },
  pinLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.success,
    letterSpacing: 0.2,
  },
  miniCar: {
    position: 'absolute',
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(139,92,246,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
  },
  infoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(9,9,15,0.7)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  disclaimer: {
    position: 'absolute',
    bottom: 8,
    right: 10,
  },
  disclaimerText: {
    fontSize: 9,
    color: Colors.text.muted,
    opacity: 0.6,
  },
});
