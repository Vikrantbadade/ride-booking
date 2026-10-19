/**
 * RideX Premium — Button Component
 * Gradient primary, glassmorphic secondary, danger, ghost variants.
 * Tactile press feedback via Reanimated. Accessible roles and labels.
 */
import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle,
  ActivityIndicator, View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Radius } from '../../theme/colors';
import { usePressAnimation } from '../../hooks/useAnimations';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, style, textStyle, icon, accessibilityLabel,
}: ButtonProps) {
  const { pressStyle, onPressIn, onPressOut } = usePressAnimation();
  const sizeStyle = sizes[size];
  const isDisabled = disabled || loading;

  const content = loading ? (
    <ActivityIndicator color="#fff" size="small" />
  ) : (
    <>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={[styles.text, sizeStyle.text, textStyle]}>{title}</Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <Animated.View style={[styles.wrapper, pressStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          disabled={isDisabled}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
          <LinearGradient
            colors={isDisabled ? ['#334155', '#1E293B'] : Gradients.brand}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.base, sizeStyle.container, isDisabled && styles.disabledOpacity]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'success') {
    return (
      <Animated.View style={[styles.wrapper, pressStyle, style]}>
        <TouchableOpacity
          onPress={onPress}
          disabled={isDisabled}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          accessibilityState={{ disabled: isDisabled, busy: loading }}
        >
          <LinearGradient
            colors={isDisabled ? ['#334155', '#1E293B'] : Gradients.success}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.base, sizeStyle.container, isDisabled && styles.disabledOpacity]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const variantStyle = variants[variant as keyof typeof variants];
  return (
    <Animated.View style={[styles.wrapper, pressStyle, style]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.base, sizeStyle.container, variantStyle.container,
          isDisabled && styles.disabledOpacity,
        ]}
      >
        {loading
          ? <ActivityIndicator color={variantStyle.textColor} size="small" />
          : <>
              {icon && <View style={styles.iconWrapper}>{icon}</View>}
              <Text style={[styles.text, sizeStyle.text, { color: variantStyle.textColor }, textStyle]}>
                {title}
              </Text>
            </>
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

const variants = {
  secondary: {
    container: {
      backgroundColor: Colors.bg.glass,
      borderWidth: 1,
      borderColor: Colors.bg.glassBorder,
    },
    textColor: Colors.text.primary,
  },
  danger: {
    container: {
      backgroundColor: Colors.status.dangerBg,
      borderWidth: 1,
      borderColor: Colors.status.dangerBorder,
    },
    textColor: Colors.status.danger,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    textColor: Colors.text.secondary,
  },
};

const sizes = {
  sm: {
    container: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 18, borderRadius: Radius.md },
    text: { fontSize: 14, letterSpacing: 0.2 },
  },
  md: {
    container: { minHeight: 48, paddingVertical: 13, paddingHorizontal: 24, borderRadius: Radius.lg },
    text: { fontSize: 15, letterSpacing: 0.2 },
  },
  lg: {
    container: { minHeight: 52, paddingVertical: 15, paddingHorizontal: 32, borderRadius: Radius.xl },
    text: { fontSize: 16, letterSpacing: 0.3 },
  },
};

const styles = StyleSheet.create({
  wrapper: { borderRadius: Radius.xl, overflow: 'hidden' },
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconWrapper: { marginRight: 2 },
  disabledOpacity: { opacity: 0.5 },
});
