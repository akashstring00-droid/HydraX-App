import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart, Activity, Thermometer, Droplets } from 'lucide-react-native';

export type VitalType = 'heartRate' | 'spO2' | 'temperature' | 'hydration';

interface VitalsCardProps {
  type: VitalType;
  value: string | number;
  unit?: string;
  statusText: string;
  isNormal?: boolean;
}

export const VitalsCard: React.FC<VitalsCardProps> = ({
  type,
  value,
  unit = '',
  statusText,
  isNormal = true,
}) => {
  let title = '';
  let IconComp = Heart;
  let iconColor = '#F43F5E';

  if (type === 'heartRate') {
    title = 'Heart Rate';
    IconComp = Heart;
    iconColor = '#F43F5E';
  } else if (type === 'spO2') {
    title = 'SpO₂';
    IconComp = Activity;
    iconColor = '#0284C7';
  } else if (type === 'temperature') {
    title = 'Temp';
    IconComp = Thermometer;
    iconColor = '#D97706';
  } else if (type === 'hydration') {
    title = 'Hydration';
    IconComp = Droplets;
    iconColor = '#0891B2';
  }

  const statusColor = isNormal ? '#059669' : '#DC2626';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <IconComp color={iconColor} size={16} />
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valText}>{value}</Text>
        {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    gap: 2,
  },
  valText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
