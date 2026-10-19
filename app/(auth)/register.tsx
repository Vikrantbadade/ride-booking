/**
 * RideX Premium — Register Screen
 * Multi-step form entrance, driver vehicle fields, accessible inputs.
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

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    vehicleMake: '', vehicleModel: '', vehicleColor: '', licensePlate: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const roleKey: 'passenger' | 'driver' | 'admin' = role === 'driver' ? 'driver' : role === 'admin' ? 'admin' : 'passenger';
  const isDriver = roleKey === 'driver';

  const headerFade = useFadeIn(0);
  const formFade   = useFadeIn(100);
  const vehicleFade = useFadeIn(200);
  const securityFade = useFadeIn(isDriver ? 300 : 200);
  const footerFade = useFadeIn(250);

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const errs: Partial<typeof form> = {};
    if (form.name.length < 2)               errs.name = 'Full name is required';
    if (!form.email.includes('@'))           errs.email = 'Valid email required';
    if (form.phone.length < 10)              errs.phone = 'Valid phone number required';
    if (form.password.length < 10)           errs.password = 'Use at least 10 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (isDriver) {
      if (form.vehicleMake.trim().length < 2)  errs.vehicleMake = 'Vehicle make is required';
      if (form.vehicleModel.trim().length < 1) errs.vehicleModel = 'Vehicle model is required';
      if (form.vehicleColor.trim().length < 2) errs.vehicleColor = 'Vehicle color is required';
      if (form.licensePlate.trim().length < 4) errs.licensePlate = 'Enter a valid license plate';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (roleKey === 'admin') {
      Alert.alert('Administrator access', 'Admin accounts must be provisioned by an authorized operator.');
      return;
    }
    if (!validate()) return;
    try {
      const registeredRole = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: isDriver ? 'driver' : 'passenger',
        ...(isDriver ? {
          vehicle: {
            type: 'economy',
            make: form.vehicleMake,
            model: form.vehicleModel,
            color: form.vehicleColor,
            licensePlate: form.licensePlate,
          },
        } : {}),
      });
      router.replace(`/(${registeredRole})/home` as any);
    } catch (error) {
      Alert.alert('Account creation failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#09090F', '#0D0D22', '#09090F']} style={StyleSheet.absoluteFill} />
      <GlowOrb color="#8B5CF6" size={260} style={{ top: -80, right: -80 }} opacity={0.10} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

            <Animated.View style={[styles.titleSection, headerFade]}>
              <LinearGradient colors={Gradients.brand} style={styles.accentLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.title} accessibilityRole="header">Create Account</Text>
              <Text style={styles.subtitle}>
                {isDriver ? 'Register as a driver to start earning' : 'Join RideX for a premium experience'}
              </Text>
            </Animated.View>

            {/* Personal info */}
            <Animated.View style={formFade}>
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: Colors.brand.start }]} />
                  <Text style={styles.sectionLabel}>Personal Details</Text>
                </View>
                <Input label="Full Name"     iconName="person-outline"  value={form.name}     onChangeText={update('name')}     placeholder="Your full name"      error={errors.name} />
                <Input label="Email Address" iconName="mail-outline"     value={form.email}    onChangeText={update('email')}    placeholder="you@example.com"     keyboardType="email-address" autoCapitalize="none" error={errors.email} />
                <Input label="Phone Number"  iconName="call-outline"     value={form.phone}    onChangeText={update('phone')}    placeholder="+91 98765 43210"     keyboardType="phone-pad" error={errors.phone} />
              </GlassCard>
            </Animated.View>

            {/* Vehicle info (driver only) */}
            {isDriver && (
              <Animated.View style={vehicleFade}>
                <GlassCard style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <View style={[styles.sectionDot, { backgroundColor: Colors.status.success }]} />
                    <Text style={styles.sectionLabel}>Vehicle Details</Text>
                  </View>
                  <Input label="Vehicle Make"   iconName="car-outline"           value={form.vehicleMake}   onChangeText={update('vehicleMake')}   placeholder="Honda"         error={errors.vehicleMake} />
                  <Input label="Vehicle Model"  iconName="car-sport-outline"     value={form.vehicleModel}  onChangeText={update('vehicleModel')}  placeholder="City"          error={errors.vehicleModel} />
                  <Input label="Vehicle Color"  iconName="color-palette-outline" value={form.vehicleColor}  onChangeText={update('vehicleColor')}  placeholder="Silver"        error={errors.vehicleColor} />
                  <Input label="License Plate"  iconName="document-text-outline" value={form.licensePlate}  onChangeText={update('licensePlate')}  placeholder="MH12 AB 1234" autoCapitalize="characters" error={errors.licensePlate} />

                  <View style={styles.verifyNote}>
                    <Ionicons name="time-outline" size={16} color={Colors.status.warning} accessible={false} importantForAccessibility="no" />
                    <Text style={styles.verifyNoteText}>
                      Driver accounts require admin verification before accepting rides.
                    </Text>
                  </View>
                </GlassCard>
              </Animated.View>
            )}

            {/* Password */}
            <Animated.View style={securityFade}>
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: Colors.brand.end }]} />
                  <Text style={styles.sectionLabel}>Security</Text>
                </View>
                <Input label="Password"         iconName="lock-closed-outline" value={form.password}        onChangeText={update('password')}        placeholder="Min. 10 characters" secureTextEntry error={errors.password} />
                <Input label="Confirm Password" iconName="lock-closed-outline" value={form.confirmPassword} onChangeText={update('confirmPassword')} placeholder="Re-enter password"    secureTextEntry error={errors.confirmPassword} />
              </GlassCard>
            </Animated.View>

            <Animated.View style={footerFade}>
              <Button title="Create Account" onPress={handleRegister} loading={isLoading} size="lg" />
            </Animated.View>

            <Animated.View style={[styles.loginRow, footerFade]}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.replace({ pathname: '/(auth)/login', params: { role } })}
                accessibilityRole="link"
                accessibilityLabel="Sign in to your existing account"
              >
                <Text style={styles.loginLink}>Sign In</Text>
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
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 48, gap: Spacing.lg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.sm,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.bg.glass, borderWidth: 1,
    borderColor: Colors.bg.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  titleSection: { gap: Spacing.sm },
  accentLine: { width: 40, height: 3, borderRadius: 2, marginBottom: Spacing.xs },
  title: { ...Typography.hero, color: Colors.text.primary },
  subtitle: { ...Typography.body, color: Colors.text.secondary },
  sectionCard: { gap: Spacing.lg, padding: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 },
  verifyNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.status.warningBg,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.status.warningBorder,
  },
  verifyNoteText: { flex: 1, fontSize: 13, color: Colors.status.warning, lineHeight: 18 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: Colors.text.secondary, fontSize: 15 },
  loginLink: { color: Colors.brand.accent, fontWeight: '700', fontSize: 15 },
});
