import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { 
  Home, 
  Calendar, 
  Brain, 
  User, 
  Cpu, 
  Signal,
  Droplet,
  Battery,
  Wifi,
  Sparkles,
  Sun,
  Moon,
  TrendingUp,
  FileText,
  Settings,
  Clock,
  Download,
  ShieldAlert
} from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useBLEStore } from '../store/useBLEStore';

// Screens
import { DashboardScreen } from '../screens/DashboardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { DeviceScreen } from '../screens/DeviceScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AICoachScreen } from '../screens/AICoachScreen';
import { RecoveryPlannerScreen } from '../screens/RecoveryPlannerScreen';
import { HydrationPlannerScreen } from '../screens/HydrationPlannerScreen';
import { WeeklyReportsScreen } from '../screens/WeeklyReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TimelineScreen } from '../screens/TimelineScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';

import { useAuthStore } from '../store/useAuthStore';
import { AuthScreen } from '../screens/AuthScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

// Voice Assistant
import { VoiceAssistant } from '../components/VoiceAssistant';
import { Toast } from '../components/Toast';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { width } = useWindowDimensions();
  const activeTab = useSettingsStore((state) => state.activeTab);
  const setActiveTab = useSettingsStore((state) => state.setActiveTab);
  const darkMode = useSettingsStore((state) => state.darkMode);
  const setDarkMode = useSettingsStore((state) => state.setDarkMode);

  const { connectedDevice, batteryLevel, isScanning, startScan } = useBLEStore();

  const isDesktop = width >= 768;

  // Render active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'device':
        return <DeviceScreen />;
      case 'insights':
        return <InsightsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'aiCoach':
        return <AICoachScreen />;
      case 'recoveryPlanner':
        return <RecoveryPlannerScreen />;
      case 'hydrationPlanner':
        return <HydrationPlannerScreen />;
      case 'weeklyReports':
        return <WeeklyReportsScreen />;
      case 'timeline':
        return <TimelineScreen />;
      case 'exportCenter':
        return <ExportScreen />;
      case 'emergencyMode':
        return <EmergencyScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'adminConsole':
        return <AdminDashboardScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'Journal Logs', icon: Calendar },
    { id: 'insights', label: 'AI Insights', icon: Brain },
    { id: 'device', label: 'Band Manager', icon: Cpu },
    { id: 'profile', label: 'Profile Setup', icon: User },
    { id: 'aiCoach', label: 'AI Coach', icon: Sparkles },
    { id: 'recoveryPlanner', label: 'Recovery Planner', icon: TrendingUp },
    { id: 'hydrationPlanner', label: 'Hydration Planner', icon: Droplet },
    { id: 'weeklyReports', label: 'Weekly Reports', icon: FileText },
    { id: 'timeline', label: 'Health Timeline', icon: Clock },
    { id: 'exportCenter', label: 'Export Center', icon: Download },
    { id: 'emergencyMode', label: 'Emergency Mode', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const menuItems = user?.isAdmin
    ? [...baseMenuItems, { id: 'adminConsole', label: 'Admin Console', icon: ShieldAlert } as const]
    : baseMenuItems;

  const handleMobileScanPress = () => {
    setActiveTab('device');
    setTimeout(() => {
      startScan();
    }, 100);
  };

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1 }}>
        <AuthScreen />
        <Toast />
      </View>
    );
  }

  if (!user?.isProfileSetup) {
    return (
      <View style={{ flex: 1 }}>
        <OnboardingScreen />
        <Toast />
      </View>
    );
  }

  // 1. DESKTOP SIDEBAR LAYOUT
  if (isDesktop) {
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.desktopContainer, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]}>
        {/* Left Sidebar */}
        <View style={[
          styles.sidebar, 
          { 
            backgroundColor: darkMode ? '#070D1E' : '#FFFFFF', 
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#E2E8F0' 
          }
        ]}>
          {/* Brand Logo Header */}
          <View style={styles.sidebarHeader}>
            <View style={styles.logoBadge}>
              <Droplet size={18} color="#00E5C3" fill="#00E5C3" />
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={[styles.brandTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>HYDRAX</Text>
              <Text style={styles.brandSubtitle}>BIO-INTELLIGENCE</Text>
            </View>
          </View>

          {/* Nav Items */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarMenu} contentContainerStyle={{ paddingBottom: 16 }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              const itemBgColor = isActive
                ? (darkMode ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9')
                : 'transparent';

              const itemTextColor = isActive
                ? (darkMode ? '#FFFFFF' : '#0F172A')
                : (darkMode ? '#8E9AA6' : '#64748B');

              const iconColor = isActive ? '#00E5C3' : (darkMode ? '#8E9AA6' : '#64748B');

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveTab(item.id)}
                  style={[
                    styles.sidebarMenuItem,
                    { backgroundColor: itemBgColor }
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon size={18} color={iconColor} />
                  <Text style={[
                    styles.sidebarMenuText,
                    { color: itemTextColor }
                  ]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Desktop Device Controller Status Widget */}
          <View style={styles.sidebarFooter}>
            {/* Theme Toggle Button */}
            <TouchableOpacity 
              onPress={() => setDarkMode(!darkMode)}
              style={[
                styles.sidebarThemeToggle,
                { 
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)'
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.themeToggleRow}>
                {darkMode ? (
                  <>
                    <Sun size={14} color="#00E5C3" style={{ marginRight: 10 }} />
                    <Text style={[styles.themeToggleText, { color: '#FFFFFF' }]}>Light Mode</Text>
                  </>
                ) : (
                  <>
                    <Moon size={14} color="#64748B" style={{ marginRight: 10 }} />
                    <Text style={[styles.themeToggleText, { color: '#0F172A' }]}>Dark Mode</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <View style={[
              styles.sidebarDeviceCard, 
              { 
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0'
              }
            ]}>
              <View style={styles.deviceRow}>
                <Cpu size={14} color={connectedDevice ? '#00FFB2' : (darkMode ? '#8E9AA6' : '#64748B')} />
                <Text style={[styles.deviceLabel, { color: darkMode ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
                  {connectedDevice ? connectedDevice.name : 'Band Offline'}
                </Text>
              </View>
              {connectedDevice && (
                <View style={styles.deviceStatsRow}>
                  <View style={[styles.statChip, { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9' }]}>
                    <Battery size={10} color="#00E5C3" />
                    <Text style={[styles.statText, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>{batteryLevel}%</Text>
                  </View>
                  <View style={[styles.statChip, { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9' }]}>
                    <Wifi size={10} color="#00FFB2" />
                    <Text style={[styles.statText, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>94%</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={[styles.mainContent, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]}>
          <View style={styles.centeredWrapper}>
            {renderScreen()}
          </View>
        </View>
        </View>
        <VoiceAssistant />
        <Toast />
      </View>
    );
  }

  // 2. MOBILE BOTTOM NAVIGATION LAYOUT
  const mobileBarBg = darkMode ? 'rgba(11, 18, 32, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  const mobileBarBorder = darkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  const mobileActiveColor = '#00E5C3';
  const mobileInactiveColor = darkMode ? '#8E9AA6' : '#64748B';

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.mobileContainer, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]}>
      {/* Active Screen rendering */}
      <View style={styles.mobileScreenContent}>
        {renderScreen()}
      </View>

      {/* Bottom Navigation tab bar */}
      <View style={[styles.mobileTabBar, { backgroundColor: mobileBarBg, borderColor: mobileBarBorder }]}>
        {/* Tab 1: Dashboard */}
        <TouchableOpacity 
          style={styles.mobileTabItem} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Home size={20} color={activeTab === 'dashboard' ? mobileActiveColor : mobileInactiveColor} />
        </TouchableOpacity>

        {/* Tab 2: History */}
        <TouchableOpacity 
          style={styles.mobileTabItem} 
          onPress={() => setActiveTab('history')}
        >
          <Calendar size={20} color={activeTab === 'history' ? mobileActiveColor : mobileInactiveColor} />
        </TouchableOpacity>

        {/* Tab 3: Center SCAN action button */}
        <View style={styles.mobileScanButtonWrapper}>
          <TouchableOpacity 
            style={styles.mobileScanButton}
            onPress={handleMobileScanPress}
            activeOpacity={0.85}
          >
            <View style={styles.scanButtonGlow} />
            <Signal size={22} color="#050B18" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Tab 4: Insights */}
        <TouchableOpacity 
          style={styles.mobileTabItem} 
          onPress={() => setActiveTab('insights')}
        >
          <Brain size={20} color={activeTab === 'insights' ? mobileActiveColor : mobileInactiveColor} />
        </TouchableOpacity>

        {/* Tab 5: Profile */}
        <TouchableOpacity 
          style={styles.mobileTabItem} 
          onPress={() => setActiveTab('profile')}
        >
          <User size={20} color={activeTab === 'profile' ? mobileActiveColor : mobileInactiveColor} />
        </TouchableOpacity>
      </View>
      </View>
      <VoiceAssistant />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  // Desktop
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    borderRightWidth: 1,
    paddingVertical: 24,
    justifyContent: 'space-between',
    zIndex: 10, // Ensure sidebar sits on top of absolute details on web
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 32,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 195, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.25)',
  },
  logoTextContainer: {
    marginLeft: 12,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    color: 'rgba(0, 229, 195, 0.7)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  sidebarMenu: {
    flex: 1,
    paddingHorizontal: 14,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    position: 'relative',
  },
  sidebarMenuText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 14,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    width: 3,
    height: 16,
    backgroundColor: '#00E5C3',
    borderRadius: 1.5,
  },
  sidebarFooter: {
    paddingHorizontal: 16,
  },
  sidebarDeviceCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  sidebarThemeToggle: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 8,
    flex: 1,
  },
  deviceStatsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
  },
  statText: {
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 4,
  },
  mainContent: {
    flex: 1,
  },
  centeredWrapper: {
    maxWidth: 1440,
    alignSelf: 'center',
    width: '100%',
    flex: 1,
  },

  // Mobile
  mobileContainer: {
    flex: 1,
  },
  mobileScreenContent: {
    flex: 1,
    paddingBottom: 72, // Space for floating bottom bar
  },
  mobileTabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileTabItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileScanButtonWrapper: {
    width: 60,
    height: 60,
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileScanButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00E5C3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#0B1220',
  },
  scanButtonGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00E5C3',
    opacity: 0.2,
  },
});
