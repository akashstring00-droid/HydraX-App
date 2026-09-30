import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EnvironmentalMetrics } from '../types';

interface EnvironmentalPanelProps {
  metrics: EnvironmentalMetrics;
}

export const EnvironmentalPanel: React.FC<EnvironmentalPanelProps> = ({ metrics }) => {
  let riskColor = '#059669';
  if (metrics.heatRiskLevel === 'Moderate') riskColor = '#D97706';
  if (metrics.heatRiskLevel === 'High' || metrics.heatRiskLevel === 'Extreme') riskColor = '#DC2626';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ENVIRONMENT</Text>

      <View style={styles.metricsStrip}>
        <View style={styles.item}>
          <Text style={styles.val}>{metrics.temperature}°C</Text>
          <Text style={styles.label}>Temperature</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.item}>
          <Text style={styles.val}>{metrics.humidity}%</Text>
          <Text style={styles.label}>Humidity</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.item}>
          <Text style={styles.val}>AQI {metrics.aqi}</Text>
          <Text style={styles.label}>Air Quality</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.amberDot, { backgroundColor: riskColor }]} />
        <Text style={[styles.statusText, { color: riskColor }]}>
          {metrics.heatRiskLevel} heat exposure
        </Text>
        <Text style={styles.subtext}>• {metrics.conditionText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  metricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  item: {
    alignItems: 'center',
  },
  val: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  label: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  amberDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
});
