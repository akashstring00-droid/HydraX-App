import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ShieldCheck, Bluetooth, Cpu, AlertOctagon, Info, ChevronRight, Zap, RefreshCw } from 'lucide-react-native';
import { sensorService } from '../sensors/SensorService';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { DeviceConnectionState } from '../telemetry/telemetryTypes';
import { DisasterModeType, DemoScenarioKey } from '../types';

interface AboutScreenProps {
  onOpenBLE: () => void;
  onOpenPrivacy: () => void;
  onOpenArchitecture: () => void;
  onOpenDemoModal: () => void;
  onOpenDisasterModal: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onOpenBLE,
  onOpenPrivacy,
  onOpenArchitecture,
  onOpenDemoModal,
  onOpenDisasterModal,
}) => {
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);
  const [disasterMode, setDisasterMode] = useState<DisasterModeType>(sensorService.getDisasterMode());

  useEffect(() => {
    const unsubscribe = telemetryStore.subscribe((_, s) => {
      setConnState(s);
    });
    return unsubscribe;
  }, []);

  const handleToggleDemo = (val: boolean) => {
    if (val) {
      sensorService.enableDemoMode('HEAT_WAVE');
    } else {
      sensorService.disableDemoMode();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>About & Settings</Text>
        <Text style={styles.headerSub}>HydraX Personal Risk Companion v2.0</Text>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* HARDWARE DEVICE CARD */}
          <Text style={styles.sectionHeader}>CONNECTED HARDWARE</Text>
          <TouchableOpacity style={styles.card} onPress={onOpenBLE} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircle}>
                <Bluetooth color="#0D9488" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>
                  {connState.isDemoMode ? 'HydraX-Demo-Sim (Simulator)' : connState.deviceName || 'HydraX-Health'}
                </Text>
                <Text style={styles.cardSub}>
                  {connState.connected ? `Connected • ${connState.dataFreshness.toUpperCase()}` : 'Tap to pair ESP32 BLE Hardware'}
                </Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </View>
          </TouchableOpacity>

          {/* DEMO MODE TOGGLE */}
          <Text style={styles.sectionHeader}>DEMO & TESTING</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Zap color="#F59E0B" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>Hackathon Demo Mode</Text>
                <Text style={styles.cardSub}>Simulate Heat Wave, Dehydration & Fall Detection</Text>
              </View>
              <Switch
                value={connState.isDemoMode}
                onValueChange={handleToggleDemo}
                trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {connState.isDemoMode && (
              <TouchableOpacity style={styles.scenarioBtn} onPress={onOpenDemoModal} activeOpacity={0.8}>
                <RefreshCw color="#0D9488" size={14} />
                <Text style={styles.scenarioBtnText}>
                  Active Scenario: {connState.activeDemoScenarioKey || 'HEAT_WAVE'} (Change)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* DISASTER MODE SELECTOR */}
          <Text style={styles.sectionHeader}>DISASTER MODE</Text>
          <TouchableOpacity style={styles.card} onPress={onOpenDisasterModal} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <AlertOctagon color="#EF4444" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>Active Scenario Context</Text>
                <Text style={styles.cardSub}>Current: {disasterMode} (Tap to switch)</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </View>
          </TouchableOpacity>

          {/* ARCHITECTURE & PRIVACY */}
          <Text style={styles.sectionHeader}>TECHNICAL & PRIVACY</Text>

          <TouchableOpacity style={styles.card} onPress={onOpenArchitecture} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircle}>
                <Cpu color="#0D9488" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>6-Stage Data Pipeline</Text>
                <Text style={styles.cardSub}>On-device noise filtering & risk engine details</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={onOpenPrivacy} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircle}>
                <ShieldCheck color="#0D9488" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>Zero-Trust Privacy Center</Text>
                <Text style={styles.cardSub}>Local computation guarantee & permissions</Text>
              </View>
              <ChevronRight color="#94A3B8" size={18} />
            </View>
          </TouchableOpacity>

          {/* SYSTEM INFO FOOTER */}
          <View style={styles.footerBox}>
            <Info color="#94A3B8" size={16} />
            <Text style={styles.footerTitle}>HydraX SIH 2026 • Medical Tech Companion</Text>
            <Text style={styles.footerSub}>Built for Smart India Hackathon 2026 • ESP32 BLE Integration</Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scenarioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  scenarioBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  footerBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    gap: 4,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  footerSub: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
