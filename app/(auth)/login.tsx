/**
 * RideX Premium — Login Screen
 * Elegant entrance animations, refined form, accessible toggle,
 * proper keyboard handling, and polished error feedback.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { Colors, Gradients, Spacing, Radius, Typography } from '../../src/theme/colors';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { Input, GlassCard, GlowOrb, RolePill } from '../../src/components/ui/Components';
import { useFadeIn } from '../../src/hooks/useAnimations';

const ROLE_CONFIG = {
  passenger: { label: 'Passenger', color: Colors.brand.start, icon: 'person' as const, gradient: Gradients.passenger },
  driver:    { label: 'Driver',    color: '#059669',           icon: 'car-sport' as const, gradient: Gradients.driver },
  admin:     { label: 'Administrator', color: '#D97706',       icon: 'shield' as const, gradient: Gradients.admin },
} as const;

export default function LoginScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const roleKey = role && role in ROLE_CONFIG ? role as keyof typeof ROLE_CONFIG : 'passenger';
  const config = ROLE_CONFIG[roleKey];

  const headerFade = useFadeIn(0);
  const formFade   = useFadeIn(150);
  const footerFade = useFadeIn(300);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.includes('@')) errs.email = 'Enter a valid email address';
    if (password.length < 6)  errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const authenticatedRole = await login(email, password);
      router.replace(`/(${authenticatedRole})/home` as any);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#09090F', '#0D0D22', '#09090F']} style={StyleSheet.absoluteFill} />
      <GlowOrb color="#8B5CF6" size={280} style={{ top: -80, right: -80 }} opacity={0.12} />
      <GlowOrb color="#2563EB" size={220} style={{ bottom: 60, left: -80 }} opacity={0.09} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View style={[styles.header, headerFade]}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={22} color={Colors.text.primary} accessible={false} importantForAccessibility="no" />
              </TouchableOpacity>
              <RolePill role={roleKey} />
            </Animated.View>

            {/* Title */}
            <Animated.View style={[styles.titleSection, headerFade]}>
              <LinearGradient colors={Gradients.brand} style={styles.accentLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.title} accessibilityRole="header">Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue as {config.label.toLowerCase()}</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View style={formFade}>
              <GlassCard style={styles.formCard}>
                <Input
                  label="Email Address"
                  iconName="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  error={errors.email}
                  accessibilityLabel="Email Address"
                />

                {/* Password with accessible eye toggle */}
                <View>
                  <Input
                    label="Password"
                    iconName="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    error={errors.password}
                    accessibilityLabel="Password"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass(!showPass)}
                    accessibilityRole="button"
                    accessibilityLabel={showPass ? 'Hide password' : 'Show password'}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={Colors.text.muted}
                      accessible={false}
                      importantForAccessibility="no"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Forgot password"
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                  size="lg"
                  style={styles.submitBtn}
                />
              </GlassCard>
            </Animated.View>

            {/* Info */}
            <Animated.View style={[styles.infoBox, footerFade]}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.status.info} accessible={false} importantForAccessibility="no" />
              <Text style={styles.infoText}>Sign in with your registered RideX credentials.</Text>
            </Animated.View>

            {/* Register link */}
            <Animated.View style={[styles.registerRow, footerFade]}>
              <Text style={styles.registerText}>New to RideX? </Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(auth)/register', params: { role } })}
                accessibilityRole="link"
                accessibilityLabel="Create a new account"
              >
                <Text style={styles.registerLink}>Create account</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 48,
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  backBtn: {
    width: 44, height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg.glass,
    borderWidth: 1,
    borderColor: Colors.bg.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Title
  titleSection: { gap: Spacing.sm },
  accentLine: {
    width: 40, height: 3,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.hero,
    color: Colors.text.primary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  // Form
  formCard: {
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: {
    fontSize: 13,
    color: Colors.brand.accent,
    fontWeight: '600',
  },
  submitBtn: { marginTop: Spacing.xs },
  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.status.infoBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.status.infoBorder,
  },
  infoText: {
    fontSize: 13,
    color: Colors.status.info,
    flex: 1,
    lineHeight: 18,
  },
  // Register row
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: { color: Colors.text.secondary, fontSize: 15 },
  registerLink: { color: Colors.brand.accent, fontWeight: '700', fontSize: 15 },
});
