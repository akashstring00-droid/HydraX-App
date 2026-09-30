import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { EnvironmentalMetrics, HealthMetrics } from '../types';
import { themeStore } from '../theme/ThemeStore';

interface AIInsightCardProps {
  health: HealthMetrics;
  env: EnvironmentalMetrics;
  onViewAnalysis: () => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  health,
  env,
  onViewAnalysis,
}) => {
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    return themeStore.subscribe((m) => setThemeMode(m));
  }, []);

  const isDark = themeMode === 'dark';
  const hydrationPct = Math.round((health.hydrationLiters / Math.max(1, health.hydrationTarget)) * 100);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <Sparkles color="#0D9488" size={14} />
          <Text style={styles.sectionLabel}>HYDRAX AI</Text>
        </View>

        <TouchableOpacity onPress={onViewAnalysis} style={styles.linkBtn}>
          <Text style={styles.linkText}>View full insight</Text>
          <ArrowRight color="#0D9488" size={12} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.statementText, isDark && styles.statementTextDark]}>
        "Your body is handling today's heat well, but your environment may increase dehydration risk."
      </Text>

      {/* Tiny Factor Pills */}
      <View style={styles.factorsRow}>
        <Text style={[styles.factorPill, isDark && styles.factorPillDark]}>{env.temperature}°C temp</Text>
        <Text style={[styles.factorPill, isDark && styles.factorPillDark]}>{env.humidity}% humidity</Text>
        <Text style={[styles.factorPill, isDark && styles.factorPillDark]}>AQI {env.aqi}</Text>
        <Text style={[styles.factorPill, isDark && styles.factorPillDark]}>{hydrationPct}% hydration</Text>
      </View>

      {/* Recommended Action */}
      <View style={[styles.recommendedBox, isDark && styles.recommendedBoxDark]}>
        <Text style={styles.recLabel}>RECOMMENDED</Text>
        <Text style={[styles.recBody, isDark && styles.recBodyDark]}>Drink 250–300 ml of water and take a short break in the shade.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  containerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  statementText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  statementTextDark: {
    color: '#F8FAFC',
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 10,
  },
  factorPill: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  factorPillDark: {
    color: '#CBD5E1',
    backgroundColor: '#0F172A',
  },
  recommendedBox: {
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  recommendedBoxDark: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  recLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  recBody: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 15,
  },
  recBodyDark: {
    color: '#F8FAFC',
  },
});

