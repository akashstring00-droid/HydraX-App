import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Home, Activity, Bot, Info, AlertOctagon } from 'lucide-react-native';
import { ResponsiveLayout } from '../components/ResponsiveLayout';
import { HomeScreen } from '../screens/HomeScreen';
import { HealthScreen } from '../screens/HealthScreen';
import { AICoachScreen } from '../screens/AICoachScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { PrivacyCenterScreen } from '../screens/PrivacyCenterScreen';
import { WearableConnectScreen } from '../screens/WearableConnectScreen';
import { ArchitectureScreen } from '../screens/ArchitectureScreen';
import { DemoCenterModal } from '../components/DemoCenterModal';
import { DisasterModeModal } from '../components/DisasterModeModal';
import { sensorService } from '../sensors/SensorService';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { DisasterModeType, DemoScenarioKey } from '../types';
import { themeStore } from '../theme/ThemeStore';

export type PrimaryTab = 'Home' | 'Progress' | 'AICoach' | 'About';
export type SubScreen = 'None' | 'Privacy' | 'BLE' | 'Architecture' | 'EmergencyOverlay';

export const RootNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrimaryTab>('Home');
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>('None');

  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [showDisasterModal, setShowDisasterModal] = useState<boolean>(false);
  const [disasterMode, setDisasterMode] = useState<DisasterModeType>(sensorService.getDisasterMode());
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    const unsub = themeStore.subscribe((m) => {
      setThemeMode(m);
    });
    return unsub;
  }, []);

  const isDark = themeMode === 'dark';
  const activeColor = isDark ? '#38BDF8' : '#0D9488';
  const inactiveColor = isDark ? '#64748B' : '#94A3B8';

  const handleSelectScenario = (key: DemoScenarioKey) => {
    sensorService.enableDemoMode(key);
  };

  const handleSelectDisaster = (type: DisasterModeType) => {
    setDisasterMode(type);
    sensorService.setDisasterMode(type);
  };

  const renderScreen = () => {
    if (activeSubScreen === 'Privacy') {
      return <PrivacyCenterScreen onBack={() => setActiveSubScreen('None')} />;
    }
    if (activeSubScreen === 'BLE') {
      return <WearableConnectScreen onBack={() => setActiveSubScreen('None')} />;
    }
    if (activeSubScreen === 'Architecture') {
      return <ArchitectureScreen onBack={() => setActiveSubScreen('None')} />;
    }
    if (activeSubScreen === 'EmergencyOverlay') {
      return <EmergencyScreen />;
    }

    switch (activeTab) {
      case 'Home':
        return (
          <HomeScreen
            onOpenArchitecture={() => setActiveSubScreen('Architecture')}
            onOpenPrivacy={() => setActiveSubScreen('Privacy')}
            onOpenBLE={() => setActiveSubScreen('BLE')}
            onTriggerSOS={() => setActiveSubScreen('EmergencyOverlay')}
          />
        );
      case 'Progress':
        return <HealthScreen />;
      case 'AICoach':
        return <AICoachScreen />;
      case 'About':
        return (
          <AboutScreen
            onOpenBLE={() => setActiveSubScreen('BLE')}
            onOpenPrivacy={() => setActiveSubScreen('Privacy')}
            onOpenArchitecture={() => setActiveSubScreen('Architecture')}
            onOpenDemoModal={() => setShowDemoModal(true)}
            onOpenDisasterModal={() => setShowDisasterModal(true)}
          />
        );
      default:
        return (
          <HomeScreen
            onOpenArchitecture={() => setActiveSubScreen('Architecture')}
            onOpenPrivacy={() => setActiveSubScreen('Privacy')}
            onOpenBLE={() => setActiveSubScreen('BLE')}
            onTriggerSOS={() => setActiveSubScreen('EmergencyOverlay')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safeContainer, isDark && styles.safeContainerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0F172A' : '#F8FAFC'} />

      <ResponsiveLayout maxWidth={440}>
        {/* Main Viewport */}
        <View style={styles.contentArea}>
          {renderScreen()}
        </View>

        {/* 4 Primary Bottom Navigation Tabs */}
        {activeSubScreen === 'None' && (
          <View style={[styles.bottomBar, isDark && styles.bottomBarDark]}>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('Home')}
              activeOpacity={0.7}
            >
              <Home color={activeTab === 'Home' ? activeColor : inactiveColor} size={20} />
              <Text style={[styles.tabLabel, isDark && styles.tabLabelDark, activeTab === 'Home' && { color: activeColor, fontWeight: '800' }]}>Home</Text>
              {activeTab === 'Home' && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('Progress')}
              activeOpacity={0.7}
            >
              <Activity color={activeTab === 'Progress' ? activeColor : inactiveColor} size={20} />
              <Text style={[styles.tabLabel, isDark && styles.tabLabelDark, activeTab === 'Progress' && { color: activeColor, fontWeight: '800' }]}>Progress</Text>
              {activeTab === 'Progress' && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('AICoach')}
              activeOpacity={0.7}
            >
              <Bot color={activeTab === 'AICoach' ? activeColor : inactiveColor} size={20} />
              <Text style={[styles.tabLabel, isDark && styles.tabLabelDark, activeTab === 'AICoach' && { color: activeColor, fontWeight: '800' }]}>AI Coach</Text>
              {activeTab === 'AICoach' && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('About')}
              activeOpacity={0.7}
            >
              <Info color={activeTab === 'About' ? activeColor : inactiveColor} size={20} />
              <Text style={[styles.tabLabel, isDark && styles.tabLabelDark, activeTab === 'About' && { color: activeColor, fontWeight: '800' }]}>About</Text>
              {activeTab === 'About' && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </TouchableOpacity>
          </View>
        )}
      </ResponsiveLayout>

      {/* Global Modals for About / Header */}
      <DemoCenterModal
        visible={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        currentScenario={telemetryStore.getSnapshot().state.activeDemoScenarioKey as DemoScenarioKey}
        onSelectScenario={handleSelectScenario}
      />

      <DisasterModeModal
        visible={showDisasterModal}
        onClose={() => setShowDisasterModal(false)}
        activeDisaster={disasterMode}
        onSelectDisaster={handleSelectDisaster}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  safeContainerDark: {
    backgroundColor: '#070D1A',
  },
  contentArea: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomBarDark: {
    backgroundColor: '#0F172A',
    borderTopColor: '#1E293B',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  tabLabelDark: {
    color: '#64748B',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0D9488',
    marginTop: 2,
  },
});
