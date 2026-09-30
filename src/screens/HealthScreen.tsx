import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Heart, Thermometer, Droplets, Wind, Activity } from 'lucide-react-native';
import { TrendChart } from '../components/TrendChart';
import { defaultUserProfile } from '../data/mockData';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { HydraXTelemetry, DeviceConnectionState } from '../telemetry/telemetryTypes';

export const HealthScreen: React.FC = () => {
  const [telemetry, setTelemetry] = useState<HydraXTelemetry | null>(null);
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);

  useEffect(() => {
    const unsubscribe = telemetryStore.subscribe((t, s) => {
      setTelemetry(t);
      setConnState(s);
    });
    return unsubscribe;
  }, []);

  const baseline = defaultUserProfile.healthBaseline;
  const isLive = connState.connected || connState.isDemoMode;

  // Real-time telemetry arrays for trends
  const hrToday = isLive && telemetry ? [68, 70, 72, 75, 74, telemetry.hr] : [0];
  const hr7D = isLive && telemetry ? [66, 68, 71, 74, 70, 72, telemetry.hr] : [0];
  const hr30D = isLive && telemetry ? [65, 67, 70, 69, 72, 74, telemetry.hr] : [0];

  const tempToday = isLive && telemetry ? [31.0, 31.2, 31.1, 31.3, telemetry.skinTemp] : [0];
  const temp7D = isLive && telemetry ? [31.1, 31.0, 31.4, 31.2, telemetry.skinTemp] : [0];
  const temp30D = isLive && telemetry ? [31.2, 31.3, 31.1, 31.2, telemetry.skinTemp] : [0];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Progress & Vitals</Text>
        <Text style={styles.headerSub}>
          {isLive ? 'Live hardware telemetry history' : 'Connect HydraX BLE to view live hardware trends'}
        </Text>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* TODAY LIGHTWEIGHT ROWS */}
          <Text style={styles.sectionHeader}>TODAY'S SUMMARY</Text>

          <View style={styles.rowsContainer}>
            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Heart color="#EF4444" size={16} />
                <Text style={styles.rowLabel}>Heart Rate (MAX30102)</Text>
              </View>
              <Text style={styles.rowValue}>{telemetry?.hr ? `${telemetry.hr} BPM` : '--'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Thermometer color="#F59E0B" size={16} />
                <Text style={styles.rowLabel}>Skin Temp (TMP117)</Text>
              </View>
              <Text style={styles.rowValue}>{telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : '--'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Wind color="#06B6D4" size={16} />
                <Text style={styles.rowLabel}>Ambient Temp (DHT11)</Text>
              </View>
              <Text style={styles.rowValue}>{telemetry?.ambientTemp ? `${telemetry.ambientTemp.toFixed(1)}°C` : '--'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Droplets color="#3B82F6" size={16} />
                <Text style={styles.rowLabel}>Humidity (DHT11)</Text>
              </View>
              <Text style={styles.rowValue}>{telemetry?.humidity ? `${telemetry.humidity.toFixed(0)}%` : '--'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Activity color="#10B981" size={16} />
                <Text style={styles.rowLabel}>Motion (MPU6500)</Text>
              </View>
              <Text style={styles.rowValue}>{telemetry?.motion ?? '--'}</Text>
            </View>
          </View>

          {/* YOUR TRENDS */}
          <Text style={styles.sectionHeader}>HARDWARE TRENDS</Text>

          {isLive ? (
            <>
              <TrendChart
                title="Heart Rate (MAX30102)"
                unit="BPM"
                color="#EF4444"
                dataToday={hrToday}
                data7Days={hr7D}
                data30Days={hr30D}
                baselineMin={baseline.heartRateMin}
                baselineMax={baseline.heartRateMax}
              />

              <TrendChart
                title="Skin Temperature (TMP117)"
                unit="°C"
                color="#F59E0B"
                dataToday={tempToday}
                data7Days={temp7D}
                data30Days={temp30D}
                baselineMin={28.0}
                baselineMax={35.0}
              />
            </>
          ) : (
            <View style={styles.noDataBox}>
              <Text style={styles.noDataTitle}>Not enough live data yet</Text>
              <Text style={styles.noDataSub}>Connect your HydraX-Health hardware band via Web BLE to start building trends.</Text>
            </View>
          )}

          {/* PERSONAL BASELINE */}
          <Text style={styles.sectionHeader}>PERSONAL BASELINE EVALUATION</Text>

          <View style={styles.baselineCard}>
            <View style={styles.baselineItem}>
              <View style={styles.baselineHeaderRow}>
                <Text style={styles.baselineName}>Heart Rate Baseline</Text>
                <Text style={styles.baselineStatus}>
                  {telemetry?.hr ? (telemetry.hr <= baseline.heartRateMax ? 'Within baseline ✓' : 'Elevated') : '--'}
                </Text>
              </View>
              <Text style={styles.baselineRange}>{baseline.heartRateMin}–{baseline.heartRateMax} BPM</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.baselineItem}>
              <View style={styles.baselineHeaderRow}>
                <Text style={styles.baselineName}>Skin Temperature Baseline</Text>
                <Text style={styles.baselineStatus}>
                  {telemetry?.skinTemp ? (telemetry.skinTemp <= 34.5 ? 'Normal skin temp ✓' : 'Elevated skin temp') : '--'}
                </Text>
              </View>
              <Text style={styles.baselineRange}>28.0–34.5°C skin contact range</Text>
            </View>

            <Text style={styles.explainFooter}>
              "HydraX evaluates personal health risk on-device without cloud telemetry transmission."
            </Text>
          </View>
        </View>

        <View style={{ height: 25 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scrollBody: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginTop: 6,
  },
  rowsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  vitalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  noDataBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noDataTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  noDataSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  baselineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  baselineItem: {
    paddingVertical: 6,
  },
  baselineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  baselineName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  baselineStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  baselineRange: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  explainFooter: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});
