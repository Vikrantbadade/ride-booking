/**
 * RideX Premium — Shared UI Components
 * Card, Badge, Input, Divider, StatCard, Skeleton, GlassCard
 * All accessible. Icons use Ionicons vector, no emojis.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ViewStyle, TextInput, TextInputProps,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Typography, Elevation } from '../../theme/colors';
import { useShimmer } from '../../hooks/useAnimations';

// ── Glass Card ────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  glowing?: boolean;
}
export function GlassCard({ children, style, padding = Spacing.lg, glowing = false }: GlassCardProps) {
  return (
    <View style={[styles.glassCard, glowing && styles.glassCardGlow, { padding }, style]}>
      {children}
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}
export function Card({ children, style, padding = Spacing.lg }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'brand';
interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}
export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  const v = badgeVariants[variant];
  return (
    <View
      style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }, size === 'sm' && styles.badgeSm]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      <Text style={[styles.badgeText, { color: v.text }, size === 'sm' && styles.badgeTextSm]}>
        {label}
      </Text>
    </View>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  error?: string;
  containerStyle?: ViewStyle;
  hint?: string;
}
export function Input({ label, iconName, error, containerStyle, hint, ...props }: InputProps) {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={styles.inputLabel} accessibilityRole="text">
          {label}
        </Text>
      )}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={18}
            color={error ? Colors.status.danger : Colors.text.muted}
            style={styles.inputIcon}
            accessible={false}
            importantForAccessibility="no"
          />
        )}
        <TextInput
          placeholderTextColor={Colors.text.muted}
          style={[styles.input, iconName ? styles.inputWithIcon : null]}
          accessibilityLabel={label}
          accessibilityHint={hint ?? error}
          {...props}
        />
      </View>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={Colors.status.danger} accessible={false} importantForAccessibility="no" />
          <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
        </View>
      )}
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider({ label }: { label?: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      {label && <Text style={styles.dividerLabel}>{label}</Text>}
      {label && <View style={styles.dividerLine} />}
    </View>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  style?: ViewStyle;
  subtitle?: string;
}
export function StatCard({
  label, value, icon, color = Colors.brand.start, style, subtitle,
}: StatCardProps) {
  return (
    <View style={[styles.statCard, style]} accessible accessibilityLabel={`${label}: ${value}`}>
      <LinearGradient
        colors={[color + '22', color + '08']}
        style={styles.statIconWrapper}
      >
        <Ionicons name={icon} size={20} color={color} accessible={false} importantForAccessibility="no" />
      </LinearGradient>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}
export function Skeleton({ width = '100%', height = 20, borderRadius = Radius.sm, style }: SkeletonProps) {
  const shimmerStyle = useShimmer();

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: Colors.bg.cardHover }, shimmerStyle, style]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

// ── Section Header ────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ── Role Pill ─────────────────────────────────────────────────────────────
interface RolePillProps {
  role: 'passenger' | 'driver' | 'admin';
  size?: 'sm' | 'md';
}
const ROLE_PILL_CONFIG = {
  passenger: { gradient: ['#8B5CF6', '#6D28D9'] as [string, string], icon: 'person' as const, label: 'Passenger' },
  driver:    { gradient: ['#059669', '#047857'] as [string, string], icon: 'car-sport' as const, label: 'Driver' },
  admin:     { gradient: ['#D97706', '#B45309'] as [string, string], icon: 'shield' as const, label: 'Administrator' },
};
export function RolePill({ role, size = 'md' }: RolePillProps) {
  const config = ROLE_PILL_CONFIG[role];
  return (
    <LinearGradient colors={config.gradient} style={[styles.rolePill, size === 'sm' && styles.rolePillSm]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <Ionicons name={config.icon} size={size === 'sm' ? 12 : 14} color="#fff" accessible={false} importantForAccessibility="no" />
      <Text style={[styles.rolePillText, size === 'sm' && styles.rolePillTextSm]}>{config.label}</Text>
    </LinearGradient>
  );
}

// ── Glow Orb (decorative background) ─────────────────────────────────────
interface GlowOrbProps {
  color?: string;
  size?: number;
  style?: ViewStyle;
  opacity?: number;
}
export function GlowOrb({ color = '#8B5CF6', size = 280, style, opacity = 0.15 }: GlowOrbProps) {
  return (
    <View
      style={[{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }, style]}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

// ── Info Row (key-value display) ──────────────────────────────────────────
export function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.monoValue]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const badgeVariants: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: Colors.status.successBg, text: Colors.text.success, border: Colors.status.successBorder },
  warning: { bg: Colors.status.warningBg, text: Colors.text.warning, border: Colors.status.warningBorder },
  danger:  { bg: Colors.status.dangerBg,  text: Colors.text.danger,  border: Colors.status.dangerBorder  },
  info:    { bg: Colors.status.infoBg,    text: Colors.status.info,   border: Colors.status.infoBorder    },
  brand:   { bg: 'rgba(139,92,246,0.15)', text: Colors.brand.accent,  border: 'rgba(139,92,246,0.3)'     },
  default: { bg: Colors.bg.card,          text: Colors.text.secondary, border: Colors.border             },
};

const styles = StyleSheet.create({
  // Glass Card
  glassCard: {
    backgroundColor: Colors.bg.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bg.glassBorder,
    ...Elevation.mid,
  },
  glassCardGlow: {
    ...Elevation.glow,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  // Card
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bg.cardBorder,
    ...Elevation.low,
  },
  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  badgeTextSm: { fontSize: 10, letterSpacing: 0.3 },
  // Input
  inputContainer: { gap: 6 },
  inputLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginLeft: 2,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    backgroundColor: Colors.bg.glass,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bg.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
  inputError: { borderColor: Colors.status.danger },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Colors.text.primary,
    fontSize: 16,
    minHeight: 52,
  },
  inputWithIcon: { paddingLeft: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 2 },
  errorText: { fontSize: 12, color: Colors.status.danger },
  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerLabel: { fontSize: 13, fontWeight: '500', lineHeight: 18, letterSpacing: 0.1, color: Colors.text.muted },
  // Stat Card
  statCard: {
    backgroundColor: Colors.bg.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.bg.glassBorder,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 6,
    flex: 1,
    ...Elevation.low,
  },
  statIconWrapper: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { ...Typography.subtitle, color: Colors.text.primary },
  statLabel: { ...Typography.caption, color: Colors.text.secondary, textAlign: 'center' },
  statSubtitle: { fontSize: 10, color: Colors.text.muted },
  // Section Header
  sectionHeader: { gap: 3 },
  sectionTitle: { ...Typography.heading, color: Colors.text.primary },
  sectionSubtitle: { fontSize: 13, color: Colors.text.secondary },
  // Role Pill
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
  },
  rolePillSm: { paddingHorizontal: 10, paddingVertical: 5 },
  rolePillText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  rolePillTextSm: { fontSize: 11 },
  // Info Row
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: Colors.text.secondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  monoValue: { fontFamily: 'monospace', letterSpacing: 1 },
});
