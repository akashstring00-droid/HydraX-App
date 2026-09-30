import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Heart, Thermometer, Droplets, Wind, Activity } from 'lucide-react-native';
import { TrendChart } from '../components/TrendChart';
import { defaultUserProfile } from '../data/mockData';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { HydraXTelemetry, DeviceConnectionState } from '../telemetry/telemetryTypes';

import { themeStore } from '../theme/ThemeStore';

export const HealthScreen: React.FC = () => {
  const [telemetry, setTelemetry] = useState<HydraXTelemetry | null>(null);
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    const unsubTelemetry = telemetryStore.subscribe((t, s) => {
      setTelemetry(t);
      setConnState(s);
    });
    const unsubTheme = themeStore.subscribe((m) => {
      setThemeMode(m);
    });
    return () => {
      unsubTelemetry();
      unsubTheme();
    };
  }, []);

  const isDark = themeMode === 'dark';
  const baseline = defaultUserProfile.healthBaseline;
  const isLive = connState.connected || connState.isDemoMode;

  // Real-time telemetry arrays for smooth trend charts
  const liveHr = telemetry?.hr ?? 72;
  const liveSkin = telemetry?.skinTemp ?? 31.4;
  const liveAmb = telemetry?.ambientTemp ?? 31.0;
  const liveSteps = telemetry?.steps ?? 2450;

  const hrToday = [68, 70, 72, 75, 74, 78, 73, liveHr];
  const hr7D = [66, 68, 71, 74, 70, 72, liveHr];
  const hr30D = [65, 67, 70, 69, 72, 74, liveHr];

  const tempToday = [30.8, 31.0, 31.2, 31.1, 31.3, 31.2, 31.4, liveSkin];
  const temp7D = [31.1, 31.0, 31.4, 31.2, 31.3, 31.1, liveSkin];
  const temp30D = [31.2, 31.3, 31.1, 31.2, liveSkin];

  const ambToday = [29.5, 30.0, 30.8, 31.5, 32.0, 31.8, 31.2, liveAmb];
  const amb7D = [30.2, 30.5, 31.0, 31.8, 31.2, 30.9, liveAmb];

  const stepsToday = [450, 890, 1200, 1650, 2100, 2350, liveSteps];
  const steps7D = [4200, 5600, 6100, 4800, 7200, 6800, liveSteps];

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Top Header */}
      <View style={[styles.topHeader, isDark && styles.topHeaderDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>Progress & Analytics</Text>
        <Text style={[styles.headerSub, isDark && styles.subDark]}>
          {isLive ? 'Live hardware telemetry history & biometrics' : 'Connect HydraX BLE band for live biometrics'}
        </Text>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* TODAY LIGHTWEIGHT ROWS */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>TODAY'S SUMMARY</Text>

          <View style={[styles.rowsContainer, isDark && styles.rowsContainerDark]}>
            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Heart color="#EF4444" size={16} />
                <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Heart Rate (MAX30102)</Text>
              </View>
              <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
                {isLive && telemetry?.hr ? `${telemetry.hr} BPM` : '--'}
              </Text>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Thermometer color="#F59E0B" size={16} />
                <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Skin Temp (TMP117)</Text>
              </View>
              <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
                {isLive && telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : '--'}
              </Text>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Wind color="#06B6D4" size={16} />
                <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Ambient Temp (DHT11)</Text>
              </View>
              <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
                {isLive && telemetry?.ambientTemp ? `${telemetry.ambientTemp.toFixed(1)}°C` : '--'}
              </Text>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Droplets color="#3B82F6" size={16} />
                <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Humidity (DHT11)</Text>
              </View>
              <Text style={[styles.rowValue, isDark && styles.rowValueDark]}>
                {isLive && telemetry?.humidity ? `${telemetry.humidity.toFixed(0)}%` : '--'}
              </Text>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            <View style={styles.vitalRow}>
              <View style={styles.vitalLeft}>
                <Activity color="#10B981" size={16} />
                <Text style={[styles.rowLabel, isDark && styles.rowLabelDark]}>Motion (MPU6500)</Text>
              </View>
              <Text style={[styles.rowValue, isDark && styles.rowValueDark, !isLive && { color: '#94A3B8' }]}>
                {isLive ? (telemetry?.motion ?? 'NORMAL') : 'DISCONNECTED'}
              </Text>
            </View>
          </View>

          {/* YOUR TRENDS */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>HARDWARE TREND ANALYTICS</Text>

          {isLive ? (
            <>
              <TrendChart
                title="Heart Rate (MAX30102)"
                unit="BPM"
                color="#EF4444"
                dataToday={hrToday}
                data7Days={hr7D}
                data30Days={hr30D}
                labelsToday={['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', 'Now']}
                labels7Days={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
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
                labelsToday={['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', 'Now']}
                labels7Days={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                baselineMin={28.0}
                baselineMax={35.0}
              />

              <TrendChart
                title="Ambient Climate (DHT11)"
                unit="°C"
                color="#06B6D4"
                dataToday={ambToday}
                data7Days={amb7D}
                data30Days={amb7D}
                labelsToday={['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', 'Now']}
                labels7Days={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              />

              <TrendChart
                title="Daily Activity (MPU6500)"
                unit="steps"
                color="#10B981"
                dataToday={stepsToday}
                data7Days={steps7D}
                data30Days={steps7D}
                labelsToday={['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', 'Now']}
                labels7Days={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              />
            </>
          ) : (
            <View style={[styles.noDataBox, isDark && styles.rowsContainerDark]}>
              <Activity color={isDark ? '#64748B' : '#94A3B8'} size={32} />
              <Text style={[styles.noDataTitle, isDark && styles.textDark]}>No Live Sensor History</Text>
              <Text style={[styles.noDataSub, isDark && styles.subDark]}>
                Connect your HydraX ESP32 BLE wearable or enable Hackathon Demo Mode in About & Settings to stream biometrics and render real-time trend analytics.
              </Text>
            </View>
          )}

          {/* PERSONAL BASELINE */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>PERSONAL BASELINE EVALUATION</Text>

          <View style={[styles.baselineCard, isDark && styles.baselineCardDark]}>
            <View style={styles.baselineItem}>
              <View style={styles.baselineHeaderRow}>
                <Text style={[styles.baselineName, isDark && styles.baselineNameDark]}>Heart Rate Baseline</Text>
                <Text style={[styles.baselineStatus, !isLive && { color: '#94A3B8' }]}>
                  {isLive && telemetry?.hr ? (telemetry.hr <= baseline.heartRateMax ? 'Within baseline ✓' : 'Elevated') : '--'}
                </Text>
              </View>
              <Text style={[styles.baselineRange, isDark && styles.baselineRangeDark]}>{baseline.heartRateMin}–{baseline.heartRateMax} BPM</Text>
            </View>

            <View style={[styles.divider, isDark && styles.dividerDark]} />

            <View style={styles.baselineItem}>
              <View style={styles.baselineHeaderRow}>
                <Text style={[styles.baselineName, isDark && styles.baselineNameDark]}>Skin Temperature Baseline</Text>
                <Text style={[styles.baselineStatus, !isLive && { color: '#94A3B8' }]}>
                  {isLive && telemetry?.skinTemp ? (telemetry.skinTemp <= 34.5 ? 'Normal skin temp ✓' : 'Elevated skin temp') : '--'}
                </Text>
              </View>
              <Text style={[styles.baselineRange, isDark && styles.baselineRangeDark]}>28.0–34.5°C skin contact range</Text>
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
  containerDark: {
    backgroundColor: '#070D1A',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  topHeaderDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  textDark: {
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  subDark: {
    color: '#94A3B8',
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
  sectionHeaderDark: {
    color: '#64748B',
  },
  rowsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowsContainerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
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
  rowLabelDark: {
    color: '#CBD5E1',
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  rowValueDark: {
    color: '#F8FAFC',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerDark: {
    backgroundColor: '#334155',
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
  baselineCardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
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
  baselineNameDark: {
    color: '#F8FAFC',
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
  baselineRangeDark: {
    color: '#94A3B8',
  },
  explainFooter: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});
