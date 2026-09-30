import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wind, Thermometer, Droplets, AlertCircle } from 'lucide-react-native';
import { HydraXTelemetry, HeatRiskType } from '../telemetry/telemetryTypes';
import { themeStore } from '../theme/ThemeStore';

interface EnvironmentCardProps {
  telemetry: HydraXTelemetry | null;
  isConnected: boolean;
  isDemoMode: boolean;
}

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  telemetry,
  isConnected,
  isDemoMode,
}) => {
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    return themeStore.subscribe((m) => setThemeMode(m));
  }, []);

  const isDark = themeMode === 'dark';
  const showData = isConnected || isDemoMode;
  const temp = showData && telemetry && telemetry.ambientTemp > 0 ? `${telemetry.ambientTemp}°C` : '--';
  const humidity = showData && telemetry && telemetry.humidity > 0 ? `${telemetry.humidity}%` : '--';
  const heatRisk: HeatRiskType = showData && telemetry ? telemetry.heatRisk : 'WAITING';

  let riskColor = '#059669';
  if (heatRisk === 'MODERATE') riskColor = '#D97706';
  if (heatRisk === 'HIGH') riskColor = '#DC2626';

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <View style={styles.topHeader}>
        <View style={styles.titleGroup}>
          <Wind color="#0284C7" size={15} />
          <Text style={styles.cardTitle}>Environment</Text>
        </View>

        <View style={[styles.heatBadge, { backgroundColor: `${riskColor}15` }]}>
          <Text style={[styles.heatBadgeText, { color: riskColor }]}>
            Heat Exposure: {heatRisk}
          </Text>
        </View>
      </View>

      <View style={[styles.mainRow, isDark && styles.mainRowDark]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, isDark && styles.metricValDark]}>{temp}</Text>
          <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Ambient Temperature</Text>
        </View>

        <View style={[styles.divider, isDark && styles.dividerDark]} />

        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, isDark && styles.metricValDark]}>{humidity}</Text>
          <Text style={[styles.metricLabel, isDark && styles.metricLabelDark]}>Relative Humidity</Text>
        </View>
      </View>

      {heatRisk !== 'LOW' && heatRisk !== 'WAITING' && (
        <View style={styles.warningBox}>
          <AlertCircle color="#D97706" size={14} />
          <Text style={styles.warningText}>
            Elevated environmental thermal stress detected. Prolonged outdoor exposure increases fluid loss.
          </Text>
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
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  heatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heatBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  mainRowDark: {
    backgroundColor: '#0F172A',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricValDark: {
    color: '#F8FAFC',
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  metricLabelDark: {
    color: '#94A3B8',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  dividerDark: {
    backgroundColor: '#334155',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    flex: 1,
  },
});

