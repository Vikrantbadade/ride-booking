/**
 * RideX Premium — Shared Animation Utilities
 * Uses React Native Reanimated 4.x (already installed)
 * All looping animations respect `reduceMotion`.
 */
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Animation } from '../theme/colors';

// ── Fade In ────────────────────────────────────────────────────────────────
export function useFadeIn(delay = 0) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 24);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withDelay(delay, withTiming(1, { duration: Animation.slow, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withSpring(0, Animation.spring));
    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
    };
  }, [delay, opacity, translateY, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return style;
}

// ── Scale In (spring pop) ─────────────────────────────────────────────────
export function useScaleIn(delay = 0) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0.8);
  const opacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withDelay(delay, withSpring(1, Animation.springBouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [delay, scale, opacity, reduceMotion]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
}

// ── Stagger Children (returns per-index delay) ───────────────────────────
export function getStaggerDelay(index: number, base = 60) {
  return index * base;
}

// ── Pulse (for live indicators) — respects reduceMotion ──────────────────
export function usePulse(minScale = 0.95, maxScale = 1.08) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(minScale, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, // infinite
      false
    );
    return () => cancelAnimation(scale);
  }, [reduceMotion, scale, maxScale, minScale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

// ── Glow pulse (opacity) — respects reduceMotion ─────────────────────────
export function useGlowPulse() {
  const opacity = useSharedValue(0.4);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false
    );
    return () => cancelAnimation(opacity);
  }, [reduceMotion, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function useShimmer(minOpacity = 0.3, maxOpacity = 0.7) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? (minOpacity + maxOpacity) / 2 : minOpacity);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = (minOpacity + maxOpacity) / 2;
      return;
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(maxOpacity, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(minOpacity, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, [maxOpacity, minOpacity, opacity, reduceMotion]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ── Press Feedback (scale down on press) ─────────────────────────────────
export function usePressAnimation() {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const onPressIn = () => {
    if (!reduceMotion) scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
  };
  const onPressOut = () => {
    if (!reduceMotion) scale.value = withSpring(1, Animation.springSnappy);
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { pressStyle, onPressIn, onPressOut };
}

// ── Slide Up (bottom sheet / modals) ─────────────────────────────────────
export function useSlideUp(initialOffset = 300) {
  const translateY = useSharedValue(initialOffset);
  const opacity = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const show = () => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, Animation.spring);
  };

  const hide = () => {
    if (reduceMotion) {
      opacity.value = 0;
      translateY.value = initialOffset;
      return;
    }
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(initialOffset, Animation.springSnappy);
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { style, show, hide };
}

// ── Progress Bar ───────────────────────────────────────────────────────────
export function useProgressBar(target: number, delay = 0) {
  const width = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      width.value = target;
      return;
    }
    width.value = withDelay(
      delay,
      withTiming(target, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    return () => cancelAnimation(width);
  }, [target, delay, width, reduceMotion]);

  return useAnimatedStyle(() => ({ width: `${interpolate(width.value, [0, 100], [0, 100])}%` as any }));
}

// ── Number count-up ────────────────────────────────────────────────────────
export function useCountUp(target: number, duration = 800) {
  const reduceMotion = useReducedMotion();
  const value = useSharedValue(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      value.value = target;
      return;
    }
    value.value = withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(value);
  }, [target, duration, value, reduceMotion]);

  return value;
}
