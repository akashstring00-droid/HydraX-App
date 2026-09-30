import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity, Footprints, Flame, Gauge, AlertOctagon, Bike } from 'lucide-react-native';
import { HydraXTelemetry, MotionType } from '../telemetry/telemetryTypes';

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
    <View style={[styles.card, motion === 'IMPACT' && styles.cardImpact]}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconCircle, { backgroundColor: badgeBg }]}>
            {activityIcon}
          </View>
          <View>
            <Text style={styles.cardHeaderLabel}>MPU6500 MOTION RECOGNITION</Text>
            <Text style={styles.activityTitle}>{showData ? activityTitle : 'DISCONNECTED'}</Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <View style={[styles.dot, { backgroundColor: badgeColor }]} />
          <Text style={[styles.badgeText, { color: badgeColor }]}>{showData ? motion : 'OFFLINE'}</Text>
        </View>
      </View>

      {/* 4 Metrics Strip */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Footprints color="#0EA5E9" size={13} />
            <Text style={styles.metricLabel}>Steps</Text>
          </View>
          <Text style={styles.metricValue}>{stepsText}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Gauge color="#8B5CF6" size={13} />
            <Text style={styles.metricLabel}>Cadence</Text>
          </View>
          <Text style={styles.metricValue}>
            {cadenceText} <Text style={styles.unitText}>{motion === 'CYCLING' ? 'RPM' : 'SPM'}</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Activity color="#F59E0B" size={13} />
            <Text style={styles.metricLabel}>Speed</Text>
          </View>
          <Text style={styles.metricValue}>
            {speedText} <Text style={styles.unitText}>km/h</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Flame color="#EF4444" size={13} />
            <Text style={styles.metricLabel}>Calories</Text>
          </View>
          <Text style={styles.metricValue}>
            {calText} <Text style={styles.unitText}>kcal</Text>
          </Text>
        </View>
      </View>

      {/* Activity Switch Chips (Testing Controls) */}
      {onSelectActivityMode && (
        <View style={styles.chipsContainer}>
          <Text style={styles.chipsHeader}>SIMULATE MOTION SENSOR STATE:</Text>
          <View style={styles.chipsRow}>
            {(['RESTING', 'WALKING', 'RUNNING', 'CYCLING', 'IMPACT'] as MotionType[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.chip, motion === mode && styles.chipActive]}
                onPress={() => onSelectActivityMode(mode)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, motion === mode && styles.chipTextActive]}>
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
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 3,
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
  chipsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
  chipActive: {
    backgroundColor: '#0D9488',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
