import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Droplets } from 'lucide-react-native';
import { HydrationRiskType } from '../telemetry/telemetryTypes';

interface HydrationCardProps {
  hydrationRisk: HydrationRiskType;
  consumedLiters: number;
  targetLiters: number;
  onAddWater: () => void;
}

export const HydrationCard: React.FC<HydrationCardProps> = ({
  hydrationRisk,
  consumedLiters,
  targetLiters,
  onAddWater,
}) => {
  const percentage = Math.min(100, Math.round((consumedLiters / Math.max(1, targetLiters)) * 100));
  const remainingMl = Math.max(0, Math.round((targetLiters - consumedLiters) * 1000));

  let riskColor = '#059669'; // Low
  if (hydrationRisk === 'MODERATE') riskColor = '#D97706';
  if (hydrationRisk === 'HIGH') riskColor = '#DC2626';

  return (
    <View style={styles.card}>
      <View style={styles.topHeader}>
        <View style={styles.titleGroup}>
          <Droplets color="#0891B2" size={15} />
          <Text style={styles.cardTitle}>Hydration estimate</Text>
        </View>

        <View style={[styles.riskTag, { backgroundColor: `${riskColor}15` }]}>
          <Text style={[styles.riskTagText, { color: riskColor }]}>
            Fluid Risk: {hydrationRisk}
          </Text>
        </View>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.textCol}>
          <Text style={styles.intakeVal}>
            {consumedLiters.toFixed(1)} L <Text style={styles.targetSub}>/ {targetLiters} L</Text>
          </Text>
          <Text style={styles.remainingSub}>
            {remainingMl > 0 ? `${remainingMl} ml remaining to offset thermal loss` : 'Daily fluid target met'}
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={onAddWater} activeOpacity={0.8}>
          <Plus color="#FFFFFF" size={14} />
          <Text style={styles.addBtnText}>+250 ml</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0891B2',
    letterSpacing: 0.5,
  },
  riskTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  textCol: {
    flex: 1,
  },
  intakeVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  targetSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  remainingSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0891B2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0891B2',
    borderRadius: 3,
  },
});
