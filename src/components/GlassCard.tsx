import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSettingsStore } from '../store/useSettingsStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  borderColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  className = '',
  intensity,
  tint,
  borderColor,
}) => {
  const darkMode = useSettingsStore((state) => state.darkMode);

  // Set intelligent defaults based on theme state
  const activeTint = tint || (darkMode ? 'dark' : 'light');
  const activeIntensity = intensity !== undefined ? intensity : (darkMode ? 15 : 25);
  const activeBorderColor = borderColor || (darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)');
  const activeBgColor = darkMode ? 'rgba(11, 18, 32, 0.45)' : 'rgba(255, 255, 255, 0.75)';

  return (
    <View 
      className={`rounded-3xl overflow-hidden ${className}`} 
      style={[
        styles.cardContainer, 
        { borderColor: activeBorderColor, backgroundColor: activeBgColor }, 
        style
      ]}
    >
      <BlurView 
        intensity={activeIntensity} 
        tint={activeTint} 
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
});
