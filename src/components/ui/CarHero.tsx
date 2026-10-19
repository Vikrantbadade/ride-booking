/**
 * RideX Premium — 3D Car Hero Visual
 * Uses layered SVG-like views, transforms, and gradients to simulate a
 * dimensional car illustration. Reanimated for subtle float animation.
 * No external 3D library — pure RN views + LinearGradient.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing, cancelAnimation, useReducedMotion } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';

interface CarHeroProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  glowColor?: string;
}

export function CarHero({ size = 'md', color = Colors.brand.start, glowColor = 'rgba(139,92,246,0.3)' }: CarHeroProps) {
  const dimensions = { sm: 120, md: 180, lg: 240 }[size];
  const float = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      float.value = 0;
      return;
    }
    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true
    );
    return () => cancelAnimation(float);
  }, [float, reduceMotion]);

  const scale = dimensions / 180;
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }, { scale }],
  }));

  return (
    <View style={[styles.container, { width: dimensions * 1.6, height: dimensions }]}>
      {/* Ground glow shadow */}
      <View style={[styles.groundGlow, {
        width: dimensions * 1.2,
        backgroundColor: glowColor,
        bottom: dimensions * 0.05,
      }]} />

      <Animated.View style={[styles.carWrapper, floatStyle]}>
        {/* Car body — main chassis */}
        <View style={styles.carBody}>
          {/* Roof / cabin */}
          <View style={styles.roof}>
            <LinearGradient
              colors={[color, Colors.brand.end]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.roofGradient}
            />
            {/* Window left */}
            <View style={[styles.window, styles.windowLeft]} />
            {/* Window right */}
            <View style={[styles.window, styles.windowRight]} />
          </View>

          {/* Lower body */}
          <LinearGradient
            colors={[color, Colors.brand.end]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.lowerBody}
          >
            {/* Door panel lines */}
            <View style={styles.doorLine} />
            {/* Side accent stripe */}
            <View style={[styles.sideStripe, { backgroundColor: glowColor }]} />
          </LinearGradient>

          {/* Front hood */}
          <View style={styles.frontHood}>
            <LinearGradient
              colors={[Colors.brand.end, color]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.hoodGradient}
            />
            {/* Headlight */}
            <View style={styles.headlight}>
              <LinearGradient colors={['#60A5FA', '#BFDBFE']} style={styles.headlightInner} />
            </View>
          </View>

          {/* Rear */}
          <View style={styles.rear}>
            {/* Taillight */}
            <View style={styles.taillight} />
          </View>
        </View>

        {/* Wheels */}
        <View style={styles.wheelsRow}>
          <Wheel glowColor={glowColor} />
          <View style={styles.wheelSpacer} />
          <Wheel glowColor={glowColor} />
        </View>

        {/* Reflection underneath car */}
        <View style={[styles.reflection, { borderColor: glowColor }]} />
      </Animated.View>
    </View>
  );
}

function Wheel({ glowColor }: { glowColor: string }) {
  return (
    <View style={styles.wheelWrapper}>
      <View style={[styles.wheelGlow, { backgroundColor: glowColor }]} />
      <View style={styles.wheel}>
        <View style={styles.wheelRim}>
          <View style={styles.wheelHub} />
          {/* Spokes */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <View key={deg} style={[styles.spoke, { transform: [{ rotate: `${deg}deg` }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  groundGlow: {
    position: 'absolute',
    height: 16,
    borderRadius: 50,
    opacity: 0.6,
    alignSelf: 'center',
    bottom: 2,
    left: '10%',
    right: '10%',
  },
  carWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  carBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    height: 80,
    width: 200,
  },
  roof: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 30,
    height: 44,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  roofGradient: { flex: 1 },
  window: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    width: 46,
    borderRadius: 8,
    backgroundColor: 'rgba(147,210,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(147,210,255,0.5)',
  },
  windowLeft: { left: 6 },
  windowRight: { right: 6 },
  lowerBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 42,
    borderRadius: 8,
    overflow: 'hidden',
  },
  doorLine: {
    position: 'absolute',
    top: '50%',
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sideStripe: {
    position: 'absolute',
    bottom: 8,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 2,
    opacity: 0.8,
  },
  frontHood: {
    position: 'absolute',
    right: -16,
    bottom: 0,
    width: 28,
    height: 36,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  hoodGradient: { flex: 1 },
  headlight: {
    position: 'absolute',
    top: 10,
    right: 3,
    width: 14,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  headlightInner: { flex: 1 },
  rear: {
    position: 'absolute',
    left: -12,
    bottom: 0,
    width: 20,
    height: 30,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.6)',
  },
  taillight: {
    position: 'absolute',
    top: 6,
    left: 3,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    opacity: 0.9,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    paddingHorizontal: 20,
    width: 200,
  },
  wheelSpacer: { flex: 1 },
  wheelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelGlow: {
    position: 'absolute',
    width: 36,
    height: 16,
    borderRadius: 18,
    opacity: 0.5,
    bottom: -2,
  },
  wheel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wheelRim: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wheelHub: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64748B',
    position: 'absolute',
  },
  spoke: {
    position: 'absolute',
    width: 1,
    height: 12,
    backgroundColor: '#64748B',
    top: 2,
    left: 13.5,
    borderRadius: 1,
  },
  reflection: {
    width: 160,
    height: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    backgroundColor: 'rgba(139,92,246,0.08)',
    marginTop: 4,
  },
});
