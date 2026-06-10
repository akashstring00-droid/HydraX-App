import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, useWindowDimensions, Platform, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Bell, 
  Droplet, 
  Heart, 
  Shield,
  RefreshCw, 
  Sparkles,
  ChevronRight,
  AlertTriangle,
  X,
  Send,
  AlertOctagon,
  Lightbulb,
  Moon,
  Sun,
  TrendingUp,
  ChevronDown,
  Activity,
  Printer,
  Calendar,
  Thermometer,
  Gauge,
  TrendingDown,
  User
} from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useBLEStore } from '../store/useBLEStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';

import { GlassCard } from '../components/GlassCard';
import { CircularRing } from '../components/CircularRing';
import { Waveform } from '../components/Waveform';
import { NotificationCenter } from '../components/NotificationCenter';
import { Timeline } from '../components/Timeline';
import { useTranslation } from '../store/i18n';

import Svg, { Path, Circle, Rect, Line, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

export const DashboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentVitals, prediction, dailyHistory } = useVitalsStore();
  const { currentIntake, dailyWaterTarget, logWater } = useWaterStore();
  const { connectedDevice, batteryLevel } = useBLEStore();
  const { logs: diarrheaLogs, recoveryScore } = useDiarrheaStore();

  // Theme states
  const darkMode = useSettingsStore((state) => state.darkMode);
  const setDarkMode = useSettingsStore((state) => state.setDarkMode);
  const setActiveTab = useSettingsStore((state) => state.setActiveTab);
  const addNotification = useSettingsStore((state) => state.addNotification);

  // Timeframe states
  const [hydrationTimeframe, setHydrationTimeframe] = useState<'7 Days' | '30 Days'>('7 Days');
  const [hrvTimeframe, setHrvTimeframe] = useState<'7 Days' | '30 Days'>('7 Days');

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencySMSState, setEmergencySMSState] = useState<'idle' | 'sending' | 'sent'>('idle');

  // New UI features states
  const [notifCenterVisible, setNotifCenterVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Skeleton loading state

  const isDesktop = width >= 768;
  const quickLogAmounts = [250, 350, 500];

  // Force a loading simulation when pulling sync
  const triggerManualSync = () => {
    setIsLoading(true);
    addNotification('Manual Sync Started', 'Syncing physiological metrics from wearable...', 'info');
    setTimeout(() => {
      setIsLoading(false);
      addNotification('Biometrics Synchronized', 'Vitals and hydration databases successfully updated.', 'success');
    }, 1500);
  };

  const handleTriggerEmergencySMS = () => {
    setEmergencySMSState('sending');
    setTimeout(() => {
      setEmergencySMSState('sent');
      addNotification('Emergency Broadcast Sent', 'Dehydration alert dispatched to primary contacts.', 'critical');
    }, 1500);
  };

  const isHighRisk = prediction.riskLevel === 'High';

  // Derived metrics calculations
  const hydrationPct = Math.round(Math.min(100, (currentIntake / dailyWaterTarget) * 100));
  const heartRateValue = currentVitals.heartRate;
  const hrvValue = currentVitals.hrv;
  const skinTempValue = currentVitals.skinTemp;
  const recoveryValue = recoveryScore;

  // Stool Health Trend
  const getStoolHealthTrend = () => {
    if (diarrheaLogs.length === 0) return 'Optimal (Bristol 4)';
    const lastLog = diarrheaLogs[0];
    if (lastLog.stoolType >= 6) return 'Diarrhea Symptoms';
    if (lastLog.stoolType <= 2) return 'Constipation Detected';
    return 'Optimal (Ideal)';
  };

  const stoolHealth = getStoolHealthTrend();
  
  // Stress index calculation based on HRV and heart rate
  const stressIndex = Math.max(10, Math.min(100, Math.round(100 - (hrvValue * 1.2) + (heartRateValue - 70))));

  // Fluid balance donut
  const totalIntake = currentIntake;
  const sweatLoss = Math.round(currentVitals.motion * 800) || 800;
  const bowelLoss = 100;
  const netBalance = totalIntake - (sweatLoss + bowelLoss);

  // SVG Donut segment
  const drawDonutSegment = (
    pct: number, 
    offsetPct: number, 
    color: string, 
    size = 110, 
    strokeWidth = 10
  ) => {
    const r = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * r;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (pct / 100) * circumference;
    const rotateAngle = -90 + (offsetPct / 100) * 360;

    return (
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        fill="transparent"
        transform={`rotate(${rotateAngle} ${size / 2} ${size / 2})`}
      />
    );
  };

  // Browser PDF Report Export
  const triggerPDFExport = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      Alert.alert('Export PDF', 'PDF export is supported on web browsers.');
    }
  };

  // Dynamic Theme Colors
  const containerBg = darkMode ? '#050B18' : '#F8FAFC';
  const borderThemeColor = darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)';
  const badgeBgColor = darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)';
  const svgLineColor = darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
  const svgTrackColor = darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
  const logChipBg = darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)';
  const logChipBorder = darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';

  const styles = getStyles(darkMode);

  // Render a Premium Healthtech card
  const renderMetricCard = (
    title: string,
    value: string | number,
    sub: string,
    icon: React.ReactNode,
    color: string,
    badgeText?: string
  ) => {
    if (isLoading) {
      return (
        <GlassCard style={styles.premiumCard}>
          <ActivityIndicator size="small" color="#00E5C3" style={{ alignSelf: 'flex-start', marginBottom: 10 }} />
          <View style={styles.skeletonText} />
          <View style={[styles.skeletonText, { width: '80%', marginTop: 8 }]} />
          <View style={[styles.skeletonText, { width: '50%', marginTop: 12 }]} />
        </GlassCard>
      );
    }

    return (
      <GlassCard style={styles.premiumCard} borderColor={borderThemeColor}>
        <View style={styles.metricCardHeader}>
          <View style={[styles.metricIconBox, { backgroundColor: color }]}>
            {icon}
          </View>
          {badgeText && (
            <View style={[styles.metricBadge, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
              <Text style={[styles.metricBadgeText, { color: color }]}>{badgeText}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.metricValue, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{value}</Text>
        <Text style={[styles.metricTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{title}</Text>
        <Text style={styles.metricSub}>{sub}</Text>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      
      {/* Notifications overlay panel */}
      <NotificationCenter visible={notifCenterVisible} onClose={() => setNotifCenterVisible(false)} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{t('greeting')}, {user?.displayName || 'Akash'} 👋</Text>
            <Text style={styles.subtitleText}>{t('overview')}</Text>
          </View>
          
          <View style={styles.headerRightRow}>
            {/* Sync Trigger button */}
            <TouchableOpacity style={styles.syncBtn} onPress={triggerManualSync}>
              <RefreshCw size={14} color="#00E5C3" />
            </TouchableOpacity>

            {/* Connection badge */}
            <View style={styles.connectedBadge}>
              <View style={[styles.connectedDot, { backgroundColor: connectedDevice ? '#00E5C3' : '#FF4D6D' }]} />
              <Text style={styles.connectedText}>{connectedDevice ? t('bandConnected') : t('bandOffline')}</Text>
            </View>

            {/* Light/Dark mode switcher */}
            <TouchableOpacity 
              style={styles.bellBtn} 
              onPress={() => setDarkMode(!darkMode)}
              activeOpacity={0.7}
            >
              {darkMode ? (
                <Sun size={16} color="#FFFFFF" />
              ) : (
                <Moon size={16} color="#0F172A" />
              )}
            </TouchableOpacity>

            {/* Notification bell */}
            <TouchableOpacity 
              style={styles.bellBtn} 
              onPress={() => setNotifCenterVisible(true)}
              activeOpacity={0.7}
            >
              <Bell size={16} color={darkMode ? '#FFFFFF' : '#0F172A'} />
              {/* Unread dot indicator */}
              <View style={styles.bellUnreadDot} />
            </TouchableOpacity>

            {/* Profile trigger */}
            <TouchableOpacity 
              style={styles.profileBtn} 
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <User size={16} color="#050B18" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* High Dehydration Risk alert */}
        {isHighRisk && (
          <View style={styles.dangerAlertBanner}>
            <AlertTriangle size={20} color="#FFFFFF" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>Dehydration Alert: High Physiological Strain</Text>
              <Text style={styles.dangerDesc}>
                Sensors register abnormal PPG deflection. Fluid replenishment recommended immediately.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.triggerAlertBtn} 
              onPress={() => setShowEmergencyModal(true)}
            >
              <Text style={styles.triggerAlertText}>Emergency Dispatches</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Core Vitals Rings Grid */}
        <View style={styles.ringsSectionGrid}>
          
          <GlassCard style={styles.ringCard} borderColor={borderThemeColor}>
            <CircularRing 
              size={120}
              strokeWidth={10}
              value={hydrationPct}
              label={`${hydrationPct}%`}
              subtitle="Hydration"
              gradientColors={['#14B8FF', '#00E5C3']}
              glowColor="rgba(0, 229, 195, 0.4)"
              icon={<Droplet size={14} color="#00E5C3" />}
            />
          </GlassCard>

          <GlassCard style={styles.ringCard} borderColor={borderThemeColor}>
            <CircularRing 
              size={120}
              strokeWidth={10}
              value={Math.round(Math.min(100, (hrvValue / 120) * 100))}
              label={`${hrvValue}`}
              subtitle="HRV (ms)"
              gradientColors={['#7C3AED', '#FF4D6D']}
              glowColor="rgba(255, 77, 109, 0.4)"
              icon={<Activity size={14} color="#FF4D6D" />}
            />
          </GlassCard>

          <GlassCard style={styles.ringCard} borderColor={borderThemeColor}>
            <CircularRing 
              size={120}
              strokeWidth={10}
              value={Math.round(Math.min(100, (heartRateValue / 180) * 100))}
              label={`${heartRateValue}`}
              subtitle="Resting HR"
              gradientColors={['#FFAD33', '#FF4D6D']}
              glowColor="rgba(255, 173, 51, 0.4)"
              icon={<Heart size={14} color="#FFAD33" />}
            />
          </GlassCard>

          <GlassCard style={styles.ringCard} borderColor={borderThemeColor}>
            <CircularRing 
              size={120}
              strokeWidth={10}
              value={recoveryValue}
              label={`${recoveryValue}%`}
              subtitle="Recovery"
              gradientColors={['#00FFB2', '#7C3AED']}
              glowColor="rgba(0, 255, 178, 0.4)"
              icon={<Shield size={14} color="#00FFB2" />}
            />
          </GlassCard>
        </View>

        {/* Dynamic 10-Metric Healthtech Grid */}
        <Text style={[styles.sectionTitle, { color: darkMode ? '#FFFFFF' : '#0F172A', marginTop: 28, marginBottom: 12 }]}>
          Premium Health Baselines
        </Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard(t('hydrationScore'), `${hydrationPct}%`, 'Fluid level balance', <Droplet size={18} color="#FFFFFF" />, '#14B8FF', 'Optimal')}
          {renderMetricCard('Heart Rate Variability', `${hrvValue} ms`, 'Vagal system indicator', <Activity size={18} color="#FFFFFF" />, '#7C3AED', '+4.2%')}
          {renderMetricCard('Resting Heart Rate', `${heartRateValue - 5} bpm`, 'Cardiac efficiency rate', <Heart size={18} color="#FFFFFF" />, '#FF4D6D', 'Stable')}
          {renderMetricCard(t('sleepScore'), '88%', 'Sleep recovery metric', <Moon size={18} color="#FFFFFF" />, '#8A5CF5', 'Restful')}
          {renderMetricCard(t('recoveryScore'), `${recoveryValue}%`, 'Ready for workout strain', <Shield size={18} color="#FFFFFF" />, '#00FFB2', 'Optimal')}
          {renderMetricCard(t('stressIndex'), `${stressIndex}%`, 'Somatic stress level', <Gauge size={18} color="#FFFFFF" />, '#FFAD33', stressIndex > 50 ? 'Moderate' : 'Low')}
          {renderMetricCard(t('skinTemp'), `${skinTempValue}°C`, 'Sensor physiological baseline', <Thermometer size={18} color="#FFFFFF" />, '#10B981', 'Normal')}
          {renderMetricCard(t('dailyFluidGoal'), `${currentIntake} / ${dailyWaterTarget} ml`, 'Progress vs absolute goal', <Droplet size={18} color="#FFFFFF" />, '#3B82F6', `${hydrationPct}%`)}
          {renderMetricCard(t('stoolHealth'), stoolHealth, 'Log summary', <Calendar size={18} color="#FFFFFF" />, '#D97706', 'Gut Feed')}
          {renderMetricCard(t('diarrheaRisk'), prediction.riskLevel, 'AI risk classification', <AlertTriangle size={18} color="#FFFFFF" />, '#EF4444', 'Computed')}
        </View>

        {/* Middle split: SVG Line Chart & Quick Log Panel */}
        <View style={styles.splitGrid}>
          
          {/* Chart Section */}
          <GlassCard style={[styles.splitColCard, { flex: isDesktop ? 7 : undefined }]} borderColor={borderThemeColor}>
            <View style={styles.chartHeaderRow}>
              <View>
                <Text style={[styles.chartHeaderTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Hydration History</Text>
                <Text style={styles.chartHeaderSub}>Fluid logs trend analysis</Text>
              </View>

              {/* Timeframe Toggle Buttons */}
              <View style={styles.chartTogglesBg}>
                <TouchableOpacity 
                  style={[styles.chartToggleBtn, hydrationTimeframe === '7 Days' && styles.chartToggleBtnActive]}
                  onPress={() => setHydrationTimeframe('7 Days')}
                >
                  <Text style={[styles.chartToggleText, hydrationTimeframe === '7 Days' && styles.chartToggleTextActive]}>7D</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chartToggleBtn, hydrationTimeframe === '30 Days' && styles.chartToggleBtnActive]}
                  onPress={() => setHydrationTimeframe('30 Days')}
                >
                  <Text style={[styles.chartToggleText, hydrationTimeframe === '30 Days' && styles.chartToggleTextActive]}>30D</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom SVG Line Chart */}
            <View style={styles.svgContainer}>
              <Svg width="100%" height="220">
                <Defs>
                  <LinearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#00E5C3" stopOpacity="0.25" />
                    <Stop offset="100%" stopColor="#00E5C3" stopOpacity="0.0" />
                  </LinearGradient>
                </Defs>

                {/* Y Axis line grids */}
                <Line x1="40" y1="30" x2="100%" y2="30" stroke={svgLineColor} strokeDasharray="3,3" />
                <Line x1="40" y1="80" x2="100%" y2="80" stroke={svgLineColor} strokeDasharray="3,3" />
                <Line x1="40" y1="130" x2="100%" y2="130" stroke={svgLineColor} strokeDasharray="3,3" />
                <Line x1="40" y1="180" x2="100%" y2="180" stroke={svgLineColor} strokeDasharray="3,3" />

                {/* Axis Labels */}
                <SvgText x="10" y="34" fill={textSecondary} fontSize="10" fontWeight="600">100</SvgText>
                <SvgText x="10" y="84" fill={textSecondary} fontSize="10" fontWeight="600">75</SvgText>
                <SvgText x="10" y="134" fill={textSecondary} fontSize="10" fontWeight="600">50</SvgText>
                <SvgText x="10" y="184" fill={textSecondary} fontSize="10" fontWeight="600">25</SvgText>

                {/* Simulated Chart Line */}
                {hydrationTimeframe === '7 Days' ? (
                  <>
                    <Path
                      d="M 50 120 L 100 90 L 150 140 L 200 110 L 250 80 L 300 50 L 350 40 L 400 90 L 450 70 L 500 50"
                      fill="transparent"
                      stroke="#00E5C3"
                      strokeWidth="3.5"
                    />
                    <Path
                      d="M 50 120 L 100 90 L 150 140 L 200 110 L 250 80 L 300 50 L 350 40 L 400 90 L 450 70 L 500 50 L 500 180 L 50 180 Z"
                      fill="url(#chartGrad)"
                    />
                    {/* Nodes */}
                    <Circle cx="50" cy="120" r="4.5" fill="#050B18" stroke="#00E5C3" strokeWidth="2.5" />
                    <Circle cx="100" cy="90" r="4.5" fill="#050B18" stroke="#00E5C3" strokeWidth="2.5" />
                    <Circle cx="200" cy="110" r="4.5" fill="#050B18" stroke="#00E5C3" strokeWidth="2.5" />
                    <Circle cx="300" cy="50" r="4.5" fill="#050B18" stroke="#00E5C3" strokeWidth="2.5" />
                    <Circle cx="400" cy="90" r="4.5" fill="#050B18" stroke="#00E5C3" strokeWidth="2.5" />
                    <Circle cx="500" cy="50" r="4.5" fill="#050B18" stroke="#00E5C3" strokeWidth="2.5" />
                  </>
                ) : (
                  <>
                    <Path
                      d="M 50 140 L 80 120 L 110 130 L 140 100 L 170 110 L 200 90 L 230 75 L 260 95 L 290 80 L 320 60 L 350 70 L 380 50 L 410 40 L 440 65 L 470 50 L 500 35 L 530 45 L 560 30"
                      fill="transparent"
                      stroke="#00E5C3"
                      strokeWidth="2.5"
                    />
                    <Path
                      d="M 50 140 L 80 120 L 110 130 L 140 100 L 170 110 L 200 90 L 230 75 L 260 95 L 290 80 L 320 60 L 350 70 L 380 50 L 410 40 L 440 65 L 470 50 L 500 35 L 530 45 L 560 30 L 560 180 L 50 180 Z"
                      fill="url(#chartGrad)"
                    />
                  </>
                )}
              </Svg>
            </View>
          </GlassCard>

          {/* Quick Actions Panel */}
          <View style={[styles.splitColCard, { flex: isDesktop ? 5 : undefined, gap: 20 }]}>
            
            {/* Quick fluid log */}
            <GlassCard style={styles.quickLogCard} borderColor={borderThemeColor}>
              <Text style={[styles.quickLogTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Water Logger</Text>
              <Text style={styles.quickLogSub}>Add quick fluid logs</Text>
              
              <View style={styles.logChipsRow}>
                {quickLogAmounts.map((amount) => (
                  <TouchableOpacity 
                    key={amount} 
                    style={styles.logChip}
                    onPress={() => {
                      logWater(amount);
                      addNotification('Fluid Intake Logged', `Added +${amount}ml to daily fluid levels.`, 'success');
                    }}
                  >
                    <Droplet size={14} color="#00E5C3" style={{ marginRight: 6 }} />
                    <Text style={styles.logChipText}>+{amount}ml</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.targetProgressRow}>
                <Text style={styles.progressText}>Goal Progress: {currentIntake} / {dailyWaterTarget} ml</Text>
              </View>
            </GlassCard>

            {/* Print PDF report and Notification actions */}
            <GlassCard style={styles.quickLogCard} borderColor={borderThemeColor}>
              <Text style={[styles.quickLogTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('quickActions')}</Text>
              <Text style={styles.quickLogSub}>System triggers</Text>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.actionTriggerBtn} onPress={triggerPDFExport}>
                  <Printer size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                  <Text style={styles.actionTriggerBtnText}>{t('exportReport')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionTriggerBtn, { borderColor: 'rgba(255, 77, 109, 0.15)' }]} onPress={triggerManualSync}>
                  <RefreshCw size={14} color="#FF4D6D" style={{ marginRight: 8 }} />
                  <Text style={[styles.actionTriggerBtnText, { color: '#FF4D6D' }]}>Force Cloud Sync</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

          </View>
        </View>

        {/* Activity Timeline section */}
        <GlassCard style={styles.timelineCard} borderColor={borderThemeColor}>
          <View style={styles.timelineHeader}>
            <Activity size={18} color="#00E5C3" style={{ marginRight: 8 }} />
            <Text style={[styles.timelineHeaderTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('viewTimeline')}</Text>
          </View>
          <Timeline />
        </GlassCard>

      </ScrollView>

      {/* EMERGENCY ACTION MODAL */}
      {showEmergencyModal && (
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalBox} borderColor="#FF4D6D">
            <View style={styles.modalHeader}>
              <AlertOctagon size={24} color="#FF4D6D" />
              <Text style={styles.modalTitle}>CRITICAL EMERGENCY BROADCAST</Text>
              <TouchableOpacity onPress={() => setShowEmergencyModal(false)}>
                <X size={20} color={darkMode ? '#FFFFFF' : '#050B18'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              This will dispatch emergency bio-intelligence warnings and active GPS location telemetry to your registered clinic contacts.
            </Text>

            <TouchableOpacity 
              style={[
                styles.emergencyModalTrigger, 
                emergencySMSState === 'sending' && { backgroundColor: '#FFAD33' },
                emergencySMSState === 'sent' && { backgroundColor: '#00cc66' }
              ]} 
              onPress={handleTriggerEmergencySMS}
            >
              <Text style={styles.emergencyModalTriggerText}>
                {emergencySMSState === 'idle' ? t('emergencyTrigger') : emergencySMSState === 'sending' ? t('emergencySending') : t('emergencySent')}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

    </SafeAreaView>
  );
};

const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#050B18' : '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 13,
    color: '#8E9AA6',
    fontWeight: '500',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E9AA6',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bellBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
    position: 'relative',
  },
  bellUnreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5C3',
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 32,
    height: 32,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    backgroundColor: '#00E5C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerAlertBanner: {
    backgroundColor: '#FF4D6D',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  dangerDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  triggerAlertBtn: {
    backgroundColor: '#050B18',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  triggerAlertText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ringsSectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ringCard: {
    flex: 1,
    minWidth: 140,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  premiumCard: {
    flex: 1,
    minWidth: 160,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'flex-start',
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconBox: {
    padding: 8,
    borderRadius: 8,
  },
  metricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  skeletonText: {
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  splitGrid: {
    flexDirection: Platform.OS === 'web' && Dimensions.get('window').width >= 768 ? 'row' : 'column',
    gap: 24,
    marginBottom: 24,
  },
  splitColCard: {
    padding: 24,
    borderRadius: 24,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  chartHeaderSub: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  chartTogglesBg: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  chartToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 18,
  },
  chartToggleBtnActive: {
    backgroundColor: '#00E5C3',
  },
  chartToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E9AA6',
  },
  chartToggleTextActive: {
    color: '#050B18',
  },
  svgContainer: {
    width: '100%',
    alignItems: 'center',
  },
  quickLogCard: {
    padding: 20,
    borderRadius: 20,
    width: '100%',
  },
  quickLogTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  quickLogSub: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '600',
    marginBottom: 14,
  },
  logChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  logChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 195, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.15)',
  },
  logChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E5C3',
  },
  targetProgressRow: {
    width: '100%',
  },
  progressText: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  actionTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  actionTriggerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E5C3',
  },
  timelineCard: {
    padding: 24,
    borderRadius: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 450,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF4D6D',
    flex: 1,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 12,
    color: '#8E9AA6',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: '500',
  },
  emergencyModalTrigger: {
    width: '100%',
    backgroundColor: '#FF4D6D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  emergencyModalTriggerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
