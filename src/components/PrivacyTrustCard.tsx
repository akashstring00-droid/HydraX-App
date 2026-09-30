import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, Check } from 'lucide-react-native';
import { themeStore } from '../theme/ThemeStore';

interface PrivacyTrustCardProps {
  onOpenPrivacy: () => void;
}

export const PrivacyTrustCard: React.FC<PrivacyTrustCardProps> = ({ onOpenPrivacy }) => {
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    return themeStore.subscribe((m) => setThemeMode(m));
  }, []);

  const isDark = themeMode === 'dark';

  return (
    <TouchableOpacity 
      style={[styles.container, isDark && styles.containerDark]} 
      onPress={onOpenPrivacy}
      activeOpacity={0.8}
    >
      <View style={styles.leftGroup}>
        <ShieldCheck color="#059669" size={15} />
        <View style={styles.textCol}>
          <Text style={styles.title}>Your health data stays private</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Health analysis is processed locally on your device.</Text>
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>LOCAL PROCESSING ✓</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    gap: 8,
  },
  containerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  subtitle: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  subtitleDark: {
    color: '#94A3B8',
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
});

