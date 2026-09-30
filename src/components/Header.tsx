import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Activity, ShieldAlert, Cpu, Sparkles, User, Sun, Moon } from 'lucide-react-native';
import { themeStore } from '../theme/ThemeStore';

interface HeaderProps {
  userName: string;
  isOffline: boolean;
  activeDisaster: string;
  onOpenDisasterModal: () => void;
  onOpenDemoCenter: () => void;
  onOpenArchitecture: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  isOffline,
  activeDisaster,
  onOpenDisasterModal,
  onOpenDemoCenter,
  onOpenArchitecture,
  onOpenSettings,
}) => {
  const isDisasterActive = activeDisaster !== 'NORMAL';
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    const unsub = themeStore.subscribe((m) => {
      setThemeMode(m);
    });
    return unsub;
  }, []);

  const isDark = themeMode === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Top Bar */}
      <View style={styles.topRow}>
        {/* Left Branding & Avatar */}
        <View style={styles.leftGroup}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>AK</Text>
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={[styles.appName, isDark && styles.textDark]}>HydraX</Text>
              <View style={styles.edgeBadgeSmall}>
                <View style={styles.greenDot} />
                <Text style={styles.edgeBadgeText}>Local AI</Text>
              </View>
            </View>
            <Text style={[styles.greetingText, isDark && styles.subDark]}>Good morning, {userName}</Text>
          </View>
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {/* Theme Switcher Moon/Sun Button */}
          <TouchableOpacity
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
            onPress={() => themeStore.toggleTheme()}
            activeOpacity={0.7}
            title="Toggle Theme"
          >
            {isDark ? <Sun color="#F59E0B" size={15} /> : <Moon color="#0EA5E9" size={15} />}
          </TouchableOpacity>

          {/* Disaster Mode Small Outline Action */}
          <TouchableOpacity
            style={[styles.disasterOutlineBtn, isDisasterActive && styles.disasterActiveBtn]}
            onPress={onOpenDisasterModal}
            activeOpacity={0.8}
          >
            <ShieldAlert color={isDisasterActive ? '#FFFFFF' : '#D97706'} size={13} />
            <Text style={[styles.disasterBtnText, isDisasterActive && styles.disasterBtnTextActive]}>
              {isDisasterActive ? activeDisaster.replace('_', ' ') : 'Disaster Mode'}
            </Text>
          </TouchableOpacity>

          {/* Hackathon Demo Center Button */}
          <TouchableOpacity
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
            onPress={onOpenDemoCenter}
            activeOpacity={0.7}
          >
            <Sparkles color="#D97706" size={15} />
          </TouchableOpacity>

          {/* Architecture / How it Works Button */}
          <TouchableOpacity
            style={[styles.iconBtn, isDark && styles.iconBtnDark]}
            onPress={onOpenArchitecture}
            activeOpacity={0.7}
          >
            <Cpu color="#0284C7" size={15} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Human Subtitle Statement */}
      <Text style={[styles.humanSubtitle, isDark && styles.subDark]}>Here's how your body is doing today.</Text>

      {/* Active Disaster Banner (Visible ONLY when active) */}
      {isDisasterActive && (
        <View style={styles.activeDisasterBanner}>
          <View style={styles.disasterBannerTextCol}>
            <Text style={styles.disasterBannerTitle}>
              ⚠ {activeDisaster.replace('_', ' ')} ACTIVE
            </Text>
            <Text style={styles.disasterBannerSub}>
              Environmental heat risk: HIGH • Stay hydrated, reduce activity, seek shade.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.guidanceBtn} 
            onPress={onOpenDisasterModal}
            activeOpacity={0.8}
          >
            <Text style={styles.guidanceBtnText}>View Safety Guidance</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  containerDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.25)',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  textDark: {
    color: '#F8FAFC',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  subDark: {
    color: '#94A3B8',
  },
  edgeBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  edgeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disasterOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  disasterActiveBtn: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  disasterBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  disasterBtnTextActive: {
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDark: {
    backgroundColor: '#1E293B',
  },
  humanSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  activeDisasterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 10,
  },
  disasterBannerTextCol: {
    flex: 1,
  },
  disasterBannerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  disasterBannerSub: {
    fontSize: 11,
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 15,
  },
  guidanceBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guidanceBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
