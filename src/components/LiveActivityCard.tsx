import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity, Footprints, Flame, Gauge, AlertOctagon, Bike } from 'lucide-react-native';
import { HydraXTelemetry, MotionType } from '../telemetry/telemetryTypes';
import { themeStore } from '../theme/ThemeStore';

interface LiveActivityCardProps {
  telemetry: HydraXTelemetry | null;
  isConnected: boolean;
  isDemoMode: boolean;
  onSelectActivityMode?: (mode: MotionType) => void;
}

export const LiveActivityCard: React.FC<LiveActivityCardProps> = ({
  telemetry,
  isConnected,
  isDemoMode,
  onSelectActivityMode,
}) => {
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    return themeStore.subscribe((m) => setThemeMode(m));
  }, []);

  const isDark = themeMode === 'dark';
  const showData = isConnected || isDemoMode;
  const motion: MotionType = showData && telemetry ? telemetry.motion : 'UNKNOWN';

  let activityTitle = 'RESTING / STATIONARY';
  let activityIcon = <Activity color="#0D9488" size={20} />;
  let badgeBg = 'rgba(13, 148, 136, 0.1)';
  let badgeColor = '#0D9488';

  if (motion === 'WALKING') {
    activityTitle = 'WALKING';
    activityIcon = <Footprints color="#0EA5E9" size={20} />;
    badgeBg = 'rgba(14, 165, 233, 0.12)';
    badgeColor = '#0EA5E9';
  } else if (motion === 'RUNNING') {
    activityTitle = 'RUNNING / JOGGING';
    activityIcon = <Activity color="#F59E0B" size={20} />;
    badgeBg = 'rgba(245, 158, 11, 0.12)';
    badgeColor = '#D97706';
  } else if (motion === 'CYCLING') {
    activityTitle = 'CYCLING';
    activityIcon = <Bike color="#8B5CF6" size={20} />;
    badgeBg = 'rgba(139, 92, 246, 0.12)';
    badgeColor = '#7C3AED';
  } else if (motion === 'IMPACT') {
    activityTitle = 'FALL / IMPACT ALERT';
    activityIcon = <AlertOctagon color="#EF4444" size={20} />;
    badgeBg = 'rgba(239, 68, 68, 0.15)';
    badgeColor = '#EF4444';
  }

  const stepsText = showData && telemetry ? telemetry.steps.toLocaleString() : '--';
  const cadenceText = showData && telemetry ? `${telemetry.cadence}` : '--';
  const speedText = showData && telemetry ? `${telemetry.speedKmh.toFixed(1)}` : '--';
  const calText = showData && telemetry ? `${telemetry.activeCalories}` : '--';

  return (
    <View style={[styles.card, isDark && styles.cardDark, motion === 'IMPACT' && styles.cardImpact]}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconCircle, { backgroundColor: badgeBg }]}>
            {activityIcon}
          </View>
          <View>
            <Text style={styles.cardHeaderLabel}>MPU6500 MOTION RECOGNITION</Text>
            <Text style={[styles.activityTitle, isDark && styles.activityTitleDark]}>{showData ? activityTitle : 'DISCONNECTED'}</Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <View style={[styles.dot, { backgroundColor: badgeColor }]} />
          <Text style={[styles.badgeText, { color: badgeColor }]}>{showData ? motion : 'OFFLINE'}</Text>
        </View>
      </View>

      {/* 4 Metrics Strip */}
      <View style={[styles.metricsGrid, isDark && styles.metricsGridDark]}>
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Footprints color="#0EA5E9" size={13} />
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Steps</Text>
          </View>
          <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>{stepsText}</Text>
        </View>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Gauge color="#8B5CF6" size={13} />
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Cadence</Text>
          </View>
          <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>
            {cadenceText} <Text style={styles.unitText}>{motion === 'CYCLING' ? 'RPM' : 'SPM'}</Text>
          </Text>
        </View>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Activity color="#F59E0B" size={13} />
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Speed</Text>
          </View>
          <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>
            {speedText} <Text style={styles.unitText}>km/h</Text>
          </Text>
        </View>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Flame color="#EF4444" size={13} />
            <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Calories</Text>
          </View>
          <Text style={[styles.metricValue, isDark && styles.metricValueDark]}>
            {calText} <Text style={styles.unitText}>kcal</Text>
          </Text>
        </View>
      </View>

      {/* Activity Switch Chips (Testing Controls) */}
      {onSelectActivityMode && (
        <View style={[styles.chipsContainer, isDark && styles.chipsContainerDark]}>
          <Text style={styles.chipsHeader}>SIMULATE MOTION SENSOR STATE:</Text>
          <View style={styles.chipsRow}>
            {(['RESTING', 'WALKING', 'RUNNING', 'CYCLING', 'IMPACT'] as MotionType[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.chip, isDark && styles.chipDark, motion === mode && styles.chipActive]}
                onPress={() => onSelectActivityMode(mode)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isDark && styles.chipTextDark, motion === mode && styles.chipTextActive]}>
                  {mode === 'RESTING' ? '🧘 Rest' : mode === 'WALKING' ? '🚶 Walk' : mode === 'RUNNING' ? '🏃 Run' : mode === 'CYCLING' ? '🚴 Cycle' : '🚨 Fall'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cardImpact: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  activityTitleDark: {
    color: '#F8FAFC',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 12,
  },
  metricsGridDark: {
    backgroundColor: '#0F172A',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  metricLabelDark: {
    color: '#94A3B8',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 3,
  },
  metricValueDark: {
    color: '#F8FAFC',
  },
  unitText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  dividerDark: {
    backgroundColor: '#334155',
  },
  chipsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chipsContainerDark: {
    borderTopColor: '#334155',
  },
  chipsHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipDark: {
    backgroundColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#0D9488',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextDark: {
    color: '#CBD5E1',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

