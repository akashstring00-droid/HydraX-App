import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ShieldCheck, Bluetooth, Cpu, AlertOctagon, Info, ChevronRight, Zap, RefreshCw, Sun, Moon, User, LogOut } from 'lucide-react-native';
import { sensorService } from '../sensors/SensorService';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { DeviceConnectionState } from '../telemetry/telemetryTypes';
import { DisasterModeType, DemoScenarioKey } from '../types';
import { themeStore } from '../theme/ThemeStore';
import { authStore, AuthUser } from '../auth/AuthStore';

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
  const [themeMode, setThemeMode] = useState(themeStore.getMode());
  const [authUser, setAuthUser] = useState<AuthUser | null>(authStore.getAuthUser());

  useEffect(() => {
    const unsubTelemetry = telemetryStore.subscribe((_, s) => {
      setConnState(s);
    });
    const unsubTheme = themeStore.subscribe((m) => {
      setThemeMode(m);
    });
    const unsubAuth = authStore.subscribe((user) => {
      setAuthUser(user);
    });
    return () => {
      unsubTelemetry();
      unsubTheme();
      unsubAuth();
    };
  }, []);

  const isDark = themeMode === 'dark';

  const handleToggleDemo = (val: boolean) => {
    if (val) {
      sensorService.enableDemoMode('HEAT_WAVE');
    } else {
      sensorService.disableDemoMode();
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Top Header */}
      <View style={[styles.topHeader, isDark && styles.topHeaderDark]}>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>About & Settings</Text>
        <Text style={[styles.headerSub, isDark && styles.headerSubDark]}>HydraX Personal Risk Companion v2.0</Text>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* USER ACCOUNT CARD */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>ACTIVE ACCOUNT</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(13, 148, 136, 0.15)' }]}>
                <User color="#0D9488" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                  {authUser?.name || 'Akash'}
                </Text>
                <Text style={[styles.cardSub, isDark && styles.cardSubDark]}>
                  {authUser?.email || 'akash@hydrax.ai'}
                </Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={() => authStore.logout()} activeOpacity={0.8}>
                <LogOut color="#EF4444" size={14} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* HARDWARE DEVICE CARD */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>CONNECTED HARDWARE</Text>
          <TouchableOpacity style={[styles.card, isDark && styles.cardDark]} onPress={onOpenBLE} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
                <Bluetooth color="#0D9488" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>
                  {connState.isDemoMode ? 'HydraX-Demo-Sim (Simulator)' : connState.deviceName || 'HydraX-Health'}
                </Text>
                <Text style={[styles.cardSub, isDark && styles.cardSubDark]}>
                  {connState.connected ? `Connected • ${connState.dataFreshness.toUpperCase()}` : 'Tap to pair ESP32 BLE Hardware'}
                </Text>
              </View>
              <ChevronRight color={isDark ? '#64748B' : '#94A3B8'} size={18} />
            </View>
          </TouchableOpacity>

          {/* APPEARANCE & THEME */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>APPEARANCE</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                {isDark ? <Moon color="#0EA5E9" size={18} /> : <Sun color="#F59E0B" size={18} />}
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>{isDark ? 'Dark Theme' : 'Light Theme'}</Text>
                <Text style={[styles.cardSub, isDark && styles.cardSubDark]}>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => themeStore.toggleTheme()}
                trackColor={{ false: '#CBD5E1', true: '#0EA5E9' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* DEMO MODE TOGGLE */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>DEMO & TESTING</Text>
          <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Zap color="#F59E0B" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Hackathon Demo Mode</Text>
                <Text style={[styles.cardSub, isDark && styles.cardSubDark]}>Simulate Heat Wave, Dehydration & Fall Detection</Text>
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
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>DISASTER MODE</Text>
          <TouchableOpacity style={[styles.card, isDark && styles.cardDark]} onPress={onOpenDisasterModal} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <AlertOctagon color="#EF4444" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Active Scenario Context</Text>
                <Text style={[styles.cardSub, isDark && styles.cardSubDark]}>Current: {disasterMode} (Tap to switch)</Text>
              </View>
              <ChevronRight color={isDark ? '#64748B' : '#94A3B8'} size={18} />
            </View>
          </TouchableOpacity>

          {/* ARCHITECTURE & PRIVACY */}
          <Text style={[styles.sectionHeader, isDark && styles.sectionHeaderDark]}>TECHNICAL & PRIVACY</Text>

          <TouchableOpacity style={[styles.card, isDark && styles.cardDark]} onPress={onOpenArchitecture} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
                <Cpu color="#0D9488" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>6-Stage Data Pipeline</Text>
                <Text style={[styles.cardSub, isDark && styles.cardSubDark]}>On-device noise filtering & risk engine details</Text>
              </View>
              <ChevronRight color={isDark ? '#64748B' : '#94A3B8'} size={18} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.card, isDark && styles.cardDark]} onPress={onOpenPrivacy} activeOpacity={0.75}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, isDark && styles.iconCircleDark]}>
                <ShieldCheck color="#0D9488" size={18} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, isDark && styles.cardTitleDark]}>Zero-Trust Privacy Center</Text>
                <Text style={[styles.cardSub, isDark && styles.cardSubDark]}>Local computation guarantee & permissions</Text>
              </View>
              <ChevronRight color={isDark ? '#64748B' : '#94A3B8'} size={18} />
            </View>
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  headerTitleDark: {
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  headerSubDark: {
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
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
  iconCircleDark: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardTitleDark: {
    color: '#F8FAFC',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cardSubDark: {
    color: '#94A3B8',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
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

