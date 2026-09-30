import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart, Thermometer, Wind, Droplets } from 'lucide-react-native';
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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>LIVE VITALS</Text>

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
          <Text style={styles.sensorSource}>MAX30102 Sensor • {showData && telemetry?.hr ? (telemetry.hr > 100 ? 'Elevated' : 'Normal') : 'No Data'}</Text>
        </View>

        {/* Skin Temp (TMP117) */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Thermometer color="#D97706" size={15} />
            <Text style={styles.tileLabel}>Skin Temperature</Text>
          </View>
          <View style={styles.valRow}>
            <Text style={styles.valText}>{skinTempVal}</Text>
            {skinTempVal !== '--' && <Text style={styles.unitText}>°C</Text>}
          </View>
          <Text style={styles.sensorSource}>TMP117 Contact • {showData && telemetry?.skinTemp ? (telemetry.skinTemp > 35 ? 'Warm' : 'Normal') : 'No Data'}</Text>
        </View>

        {/* Ambient Temp (DHT11) */}
        <View style={styles.tile}>
          <View style={styles.tileHeader}>
            <Thermometer color="#0284C7" size={15} />
            <Text style={styles.tileLabel}>Ambient Temp</Text>
          </View>
          <View style={styles.valRow}>
            <Text style={styles.valText}>{ambientTempVal}</Text>
            {ambientTempVal !== '--' && <Text style={styles.unitText}>°C</Text>}
          </View>
          <Text style={styles.sensorSource}>DHT11 Climate • {showData && telemetry?.ambientTemp ? (telemetry.ambientTemp > 34 ? 'Hot' : 'Normal') : 'No Data'}</Text>
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
          <Text style={styles.sensorSource}>DHT11 Relative • {showData && telemetry?.humidity ? (telemetry.humidity > 70 ? 'High' : 'Normal') : 'No Data'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
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
});
