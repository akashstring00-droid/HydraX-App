import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSettingsStore } from '../store/useSettingsStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularRingProps {
  size?: number;
  strokeWidth?: number;
  value: number; // 0 to 100
  label: string; // Big text (e.g., "76%" or "Low")
  subtitle: string; // Underneath label
  gradientColors: [string, string];
  glowColor: string;
  hasGlow?: boolean;
  icon?: React.ReactNode;
}

export const CircularRing: React.FC<CircularRingProps> = ({
  size = 110,
  strokeWidth = 9,
  value,
  label,
  subtitle,
  gradientColors,
  glowColor,
  hasGlow = true,
  icon,
}) => {
  const darkMode = useSettingsStore((state) => state.darkMode);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Calculate coordinates for circle
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  }, [value]);

  // Interpolate the dash offset
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const uniqueId = `grad-${gradientColors[0].replace('#', '')}-${gradientColors[1].replace('#', '')}`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background shadow glow */}
      {hasGlow && (
        <View
          style={[
            styles.glow,
            {
              width: size - 15,
              height: size - 15,
              borderRadius: (size - 15) / 2,
              backgroundColor: glowColor,
              shadowColor: glowColor,
            },
          ]}
        />
      )}

      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id={uniqueId} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientColors[0]} />
            <Stop offset="100%" stopColor={gradientColors[1]} />
          </LinearGradient>
        </Defs>

        {/* Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)"}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${uniqueId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Internal Text / Value Container */}
      <View style={styles.contentContainer}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text style={[styles.labelText, { fontSize: Math.max(10, size * 0.22), color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitleText, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    opacity: 0.12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  contentContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: 2,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: '#8E9AA6',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
