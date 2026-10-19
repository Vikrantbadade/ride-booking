/**
 * RideX Premium — Landing Screen
 * Cinematic 3D car hero, staggered card entrances, ambient glow orbs,
 * role selection with spring animations.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, Easing, cancelAnimation, useReducedMotion,
} from 'react-native-reanimated';
import { Colors, Gradients, Spacing, Radius, Animation } from '../src/theme/colors';
import { useAuthStore } from '../src/store/authStore';
import { CarHero } from '../src/components/ui/CarHero';
import { GlowOrb } from '../src/components/ui/Components';
import { useFadeIn, usePressAnimation } from '../src/hooks/useAnimations';

const FEATURES = [
  { label: 'GPS Tracking', icon: 'navigate-circle' as const, color: Colors.brand.start },
  { label: 'Safe Rides', icon: 'shield-checkmark' as const, color: Colors.status.success },
  { label: 'Easy Pay', icon: 'card' as const, color: Colors.status.info },
] as const;

const ROLES = [
  {
    role: 'passenger' as const,
    name: 'Passenger',
    description: 'Book rides instantly',
    icon: 'person' as const,
    gradient: Gradients.passenger,
    accent: Colors.brand.start,
  },
  {
    role: 'driver' as const,
    name: 'Driver',
    description: 'Accept rides & earn',
    icon: 'car-sport' as const,
    gradient: Gradients.driver,
    accent: Colors.status.success,
  },
  {
    role: 'admin' as const,
    name: 'Administrator',
    description: 'Manage & verify',
    icon: 'shield' as const,
    gradient: Gradients.admin,
    accent: '#D97706',
  },
] as const;

export default function LandingScreen() {
  const { isAuthenticated, isHydrating, role } = useAuthStore();
  const reduceMotion = useReducedMotion();

  const logoOpacity = useSharedValue(0);
  const logoScale   = useSharedValue(0.7);
  const heroOpacity = useSharedValue(0);
  const heroY       = useSharedValue(30);

  useEffect(() => {
    if (isAuthenticated && role) {
      router.replace(`/(${role})/home` as any);
      return;
    }
    if (reduceMotion) {
      logoOpacity.value = 1;
      logoScale.value = 1;
      heroOpacity.value = 1;
      heroY.value = 0;
      return;
    }
    // Cinematic reveal sequence
    logoScale.value  = withDelay(100, withSpring(1, { damping: 12, stiffness: 100 }));
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    heroOpacity.value = withDelay(350, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    heroY.value       = withDelay(350, withSpring(0, Animation.spring));
    return () => {
      cancelAnimation(logoOpacity);
      cancelAnimation(logoScale);
      cancelAnimation(heroOpacity);
      cancelAnimation(heroY);
    };
  }, [isAuthenticated, isHydrating, role, reduceMotion, logoOpacity, logoScale, heroOpacity, heroY]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  const featuresFade = useFadeIn(500);
  const rolesFade    = useFadeIn(700);

  if (isHydrating) return <View style={styles.container} />;

  const handleRole = (selectedRole: 'passenger' | 'driver' | 'admin') =>
    router.push({ pathname: '/(auth)/login', params: { role: selectedRole } });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#09090F', '#0D0D22', '#09090F']} style={StyleSheet.absoluteFill} />

      {/* Ambient glow orbs */}
      <GlowOrb color="#8B5CF6" size={340} style={{ top: -100, right: -100 }} opacity={0.12} />
      <GlowOrb color="#2563EB" size={280} style={{ bottom: 80, left: -100 }} opacity={0.10} />
      <GlowOrb color="#8B5CF6" size={200} style={{ top: '45%', right: '5%' }} opacity={0.06} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Logo section */}
          <Animated.View style={[styles.logoSection, logoStyle]}>
            <LinearGradient colors={Gradients.brand} style={styles.logoMark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name="car-sport" size={32} color="#fff" accessible={false} importantForAccessibility="no" />
            </LinearGradient>
            <View>
              <Text style={styles.logoText} accessibilityRole="header">RideX</Text>
              <Text style={styles.tagline}>Your premium ride awaits</Text>
            </View>
          </Animated.View>

          {/* 3D Car Hero */}
          <Animated.View style={[styles.heroSection, heroStyle]}>
            <CarHero size="lg" color={Colors.brand.start} />
          </Animated.View>

          {/* Feature chips */}
          <Animated.View style={[styles.featuresRow, featuresFade]}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureChip}
                accessible accessibilityLabel={f.label}
              >
                <LinearGradient
                  colors={[f.color + '22', f.color + '0A']}
                  style={styles.featureIconBg}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={f.icon} size={18} color={f.color} accessible={false} importantForAccessibility="no" />
                </LinearGradient>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Role selector */}
          <Animated.View style={[styles.rolesSection, rolesFade]}>
            <Text style={styles.rolesTitle}>Continue as</Text>
            {ROLES.map((r, i) => (
              <RoleCard key={r.role} role={r} index={i} onPress={() => handleRole(r.role)} />
            ))}
          </Animated.View>

          <Text style={styles.footer}>RideX v1.0 · Crafted with care</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function RoleCard({
  role, index, onPress,
}: {
  role: typeof ROLES[number];
  index: number;
  onPress: () => void;
}) {
  const { pressStyle, onPressIn, onPressOut } = usePressAnimation();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateX.value = 0;
      return;
    }
    const delay = 800 + index * 100;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateX.value = withDelay(delay, withSpring(0, Animation.spring));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateX);
    };
  }, [index, opacity, translateX, reduceMotion]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.roleCard, pressStyle, entryStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.roleCardInner}
        accessibilityRole="button"
        accessibilityLabel={`Continue as ${role.name}: ${role.description}`}
      >
        <LinearGradient
          colors={role.gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.roleGradient}
        >
          {/* Icon box with glass surface */}
          <View style={styles.roleIconBox}>
            <Ionicons name={role.icon} size={24} color="#fff" accessible={false} importantForAccessibility="no" />
          </View>

          <View style={styles.roleInfo}>
            <Text style={styles.roleName}>{role.name}</Text>
            <Text style={styles.roleDesc}>{role.description}</Text>
          </View>

          {/* Chevron */}
          <View style={styles.roleChevron}>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" accessible={false} importantForAccessibility="no" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  // Logo
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brand.start,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text.primary,
    letterSpacing: -1.5,
    lineHeight: 38,
  },
  tagline: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  // Features
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  featureChip: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.bg.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bg.glassBorder,
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  // Roles
  rolesSection: {
    gap: Spacing.md,
  },
  rolesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  roleCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  roleCardInner: { borderRadius: Radius.xl, overflow: 'hidden' },
  roleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  roleInfo: { flex: 1 },
  roleName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  roleDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
    fontWeight: '400',
  },
  roleChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Footer
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.text.muted,
    letterSpacing: 0.3,
  },
});
