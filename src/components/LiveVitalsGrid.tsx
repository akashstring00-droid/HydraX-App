import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart, Thermometer, Wind, Droplets, Activity, AlertOctagon } from 'lucide-react-native';
import { HydraXTelemetry } from '../telemetry/telemetryTypes';

interface LiveVitalsGridProps {
  telemetry: HydraXTelemetry | null;
  isConnected: boolean;
  isDemoMode: boolean;
}

export const LiveVitalsGrid: React.FC<LiveVitalsGridProps> = ({
  telemetry,
  isConnected,
  isDemoMode,
}) => {
  const showData = isConnected || isDemoMode;

  const hrVal = showData && telemetry && telemetry.hr > 0 ? `${telemetry.hr}` : '--';
  const skinTempVal = showData && telemetry && telemetry.skinTemp > 0 ? `${telemetry.skinTemp}` : '--';
  const ambientTempVal = showData && telemetry && telemetry.ambientTemp > 0 ? `${telemetry.ambientTemp}` : '--';
  const humidityVal = showData && telemetry && telemetry.humidity > 0 ? `${telemetry.humidity}` : '--';
  const motionVal = showData && telemetry ? telemetry.motion : '--';

  let motionColor = '#10B981'; // Green
  if (motionVal === 'ACTIVE') motionColor = '#0EA5E9';
  if (motionVal === 'IMPACT') motionColor = '#EF4444';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>LIVE HARDWARE SENSOR VITALS</Text>

      <View style={styles.grid}>
        {/* Heart Rate (MAX30102) */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Heart color="#F43F5E" size={15} />
            <Text style={styles.tileLabel}>Heart Rate</Text>
          </View>
          <View style={styles.valRow}>
            <Text style={styles.valText}>{hrVal}</Text>
            {hrVal !== '--' && <Text style={styles.unitText}>BPM</Text>}
          </View>
          <Text style={styles.sensorSource}>MAX30102 • {showData && telemetry?.hr ? (telemetry.hr > 100 ? 'Elevated' : 'Normal') : 'No Data'}</Text>
        </View>

        {/* Skin Temp (TMP117) */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Thermometer color="#D97706" size={15} />
            <Text style={styles.tileLabel}>Skin Temp</Text>
          </View>
          <View style={styles.valRow}>
            <Text style={styles.valText}>{skinTempVal}</Text>
            {skinTempVal !== '--' && <Text style={styles.unitText}>°C</Text>}
          </View>
          <Text style={styles.sensorSource}>TMP117 • {showData && telemetry?.skinTemp ? (telemetry.skinTemp > 35 ? 'Warm' : 'Normal') : 'No Data'}</Text>
        </View>

        {/* Ambient Temp (DHT11) */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Wind color="#0284C7" size={15} />
            <Text style={styles.tileLabel}>Ambient Temp</Text>
          </View>
          <View style={styles.valRow}>
            <Text style={styles.valText}>{ambientTempVal}</Text>
            {ambientTempVal !== '--' && <Text style={styles.unitText}>°C</Text>}
          </View>
          <Text style={styles.sensorSource}>DHT11 • {showData && telemetry?.ambientTemp ? (telemetry.ambientTemp > 34 ? 'Hot' : 'Normal') : 'No Data'}</Text>
        </View>

        {/* Humidity (DHT11) */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Droplets color="#0891B2" size={15} />
            <Text style={styles.tileLabel}>Humidity</Text>
          </View>
          <View style={styles.valRow}>
            <Text style={styles.valText}>{humidityVal}</Text>
            {humidityVal !== '--' && <Text style={styles.unitText}>%</Text>}
          </View>
          <Text style={styles.sensorSource}>DHT11 • {showData && telemetry?.humidity ? (telemetry.humidity > 70 ? 'High' : 'Normal') : 'No Data'}</Text>
        </View>
      </View>

      {/* MPU6500 Motion & Fall Sensor Card (Full Width Banner) */}
      <View style={[styles.motionTile, { borderColor: showData && motionVal === 'IMPACT' ? '#EF4444' : '#E2E8F0' }]}>
        <View style={styles.motionHeaderRow}>
          <View style={styles.motionTitleGroup}>
            {motionVal === 'IMPACT' ? (
              <AlertOctagon color="#EF4444" size={18} />
            ) : (
              <Activity color="#0D9488" size={18} />
            )}
            <View>
              <Text style={styles.motionTitle}>Motion & Fall Sensor</Text>
              <Text style={styles.motionSub}>MPU6500 6-Axis Accelerometer & Gyro</Text>
            </View>
          </View>

          <View style={[styles.motionBadge, { backgroundColor: `${motionColor}15` }]}>
            <View style={[styles.dot, { backgroundColor: motionColor }]} />
            <Text style={[styles.motionBadgeText, { color: motionColor }]}>
              {showData ? motionVal : 'DISCONNECTED'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  valRow: {
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
  sensorSource: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
  },
  motionTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  motionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  motionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  motionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  motionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  motionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  motionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
