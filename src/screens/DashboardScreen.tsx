import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, useWindowDimensions, Platform } from 'react-native';
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
  ChevronDown
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

import Svg, { Path, Circle, Rect, Line, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

export const DashboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const { currentVitals, prediction } = useVitalsStore();
  const { currentIntake, dailyWaterTarget, logWater } = useWaterStore();
  const { connectedDevice, batteryLevel } = useBLEStore();
  const { recoveryScore } = useDiarrheaStore();

  // Theme states
  const darkMode = useSettingsStore((state) => state.darkMode);
  const setDarkMode = useSettingsStore((state) => state.setDarkMode);
  const setActiveTab = useSettingsStore((state) => state.setActiveTab);

  // Timeframe states
  const [hydrationTimeframe, setHydrationTimeframe] = useState<'7 Days' | '30 Days'>('7 Days');
  const [hrvTimeframe, setHrvTimeframe] = useState<'7 Days' | '30 Days'>('7 Days');

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencySMSState, setEmergencySMSState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const isDesktop = width >= 768;
  const quickLogAmounts = [250, 350, 500];

  const handleTriggerEmergencySMS = () => {
    setEmergencySMSState('sending');
    setTimeout(() => {
      setEmergencySMSState('sent');
    }, 1500);
  };

  const isHighRisk = prediction.riskLevel === 'High';

  // Fluid Balance Donut Calculation
  const totalIntake = currentIntake;
  const sweatLoss = Math.round(currentVitals.motion * 800) || 800;
  const bowelLoss = 100; // Mock base loss
  const netBalance = totalIntake - (sweatLoss + bowelLoss);

  // SVG Donut Segment Drawer Helper
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

  return (
    <SafeAreaView style={styles.container} edges={isDesktop ? [] : ['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Good Morning, {user?.displayName || 'Akash'} 👋</Text>
            <Text style={styles.subtitleText}>Here's your health overview for today</Text>
          </View>
          
          <View style={styles.headerRightRow}>
            {/* Connection badge */}
            <View style={styles.connectedBadge}>
              <View style={[styles.connectedDot, { backgroundColor: connectedDevice ? '#00E5C3' : '#FF4D6D' }]} />
              <Text style={styles.connectedText}>{connectedDevice ? 'Band Connected' : 'Band Offline'}</Text>
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
              activeOpacity={0.7}
              onPress={() => setActiveTab('insights')}
            >
              <Bell size={16} color={darkMode ? '#FFFFFF' : '#0F172A'} />
              <View style={styles.bellBadge} />
            </TouchableOpacity>

            {/* User Profile avatar */}
            <TouchableOpacity 
              style={styles.userProfileWrapper}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.7}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.avatarLetter}>{(user?.displayName || 'A')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.userInfoText}>
                <Text style={styles.usernameText}>{user?.displayName || 'Akash'}</Text>
                <Text style={styles.premiumText}>Premium</Text>
              </View>
              <ChevronDown size={14} color={darkMode ? '#8E9AA6' : '#64748B'} style={styles.dropdownChevron} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pulsing Emergency Warning Banner */}
        {isHighRisk && (
          <TouchableOpacity
            onPress={() => setShowEmergencyModal(true)}
            activeOpacity={0.9}
            style={styles.emergencyBanner}
          >
            <View style={styles.bannerLeftRow}>
              <AlertTriangle size={18} color="#FF4D6D" />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Critical Dehydration Risk</Text>
                <Text style={styles.bannerSubtitle}>Severe GI fluid deficit monitored. Triage emergency protocol.</Text>
              </View>
            </View>
            <View style={styles.bannerActionBadge}>
              <Text style={styles.bannerActionText}>ALERT</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Hero Section: Grid of 4 Vitals Cards */}
        <View style={isDesktop ? styles.heroRowDesktop : styles.heroGridMobile}>
          
          {/* Card 1: Hydration Level */}
          <GlassCard style={isDesktop ? styles.heroCardDesktop : styles.heroCardMobile}>
            <View style={styles.heroCardContent}>
              <View style={styles.heroCardLeft}>
                <View style={styles.cardHeaderRow}>
                  <Droplet size={14} color="#00E5C3" fill="#00E5C3" style={{ marginRight: 6 }} />
                  <Text style={styles.heroCardTitle}>Hydration Level</Text>
                </View>
                <Text style={[styles.heroCardValue, { color: '#00E5C3' }]}>{prediction.hydrationScore}%</Text>
                <Text style={styles.heroCardStatus}>• Optimal</Text>
                <Text style={[styles.heroCardTrend, { color: '#00E5C3' }]}>↗ 8% vs yesterday</Text>
              </View>
              <View style={styles.heroCardRight}>
                <CircularRing
                  size={64}
                  strokeWidth={5}
                  value={prediction.hydrationScore}
                  label={`${prediction.hydrationScore}%`}
                  subtitle=""
                  gradientColors={['#00E5C3', '#00FFB2']}
                  glowColor="#00E5C3"
                  hasGlow={false}
                />
              </View>
            </View>
          </GlassCard>

          {/* Card 2: Dehydration Risk */}
          <GlassCard style={isDesktop ? styles.heroCardDesktop : styles.heroCardMobile}>
            <View style={styles.heroCardContent}>
              <View style={styles.heroCardLeft}>
                <View style={styles.cardHeaderRow}>
                  <Shield size={14} color="#00FFB2" style={{ marginRight: 6 }} />
                  <Text style={styles.heroCardTitle}>Dehydration Risk</Text>
                </View>
                <Text style={[styles.heroCardValue, { color: '#00FFB2' }]}>{prediction.riskLevel}</Text>
                <Text style={styles.heroCardSubStatus}>Risk Level</Text>
                <Text style={[styles.heroCardTrend, { color: '#00FFB2' }]}>↘ Improved</Text>
              </View>
              <View style={styles.heroCardRight}>
                <CircularRing
                  size={64}
                  strokeWidth={5}
                  value={prediction.riskLevel === 'Low' ? 25 : prediction.riskLevel === 'Medium' ? 60 : 90}
                  label={prediction.riskLevel}
                  subtitle=""
                  gradientColors={
                    prediction.riskLevel === 'Low' 
                      ? ['#00FFB2', '#00E5C3'] 
                      : prediction.riskLevel === 'Medium' 
                      ? ['#FFAD33', '#FF4D6D'] 
                      : ['#FF4D6D', '#7C3AED']
                  }
                  glowColor={prediction.riskLevel === 'Low' ? '#00FFB2' : '#FF4D6D'}
                  hasGlow={false}
                />
              </View>
            </View>
          </GlassCard>

          {/* Card 3: Heart Rate */}
          <GlassCard style={isDesktop ? styles.heroCardDesktop : styles.heroCardMobile}>
            <View style={styles.heroCardContent}>
              <View style={styles.heroCardLeft}>
                <View style={styles.cardHeaderRow}>
                  <Heart size={14} color="#FF4D6D" fill="#FF4D6D" style={{ marginRight: 6 }} />
                  <Text style={styles.heroCardTitle}>Heart Rate</Text>
                </View>
                <Text style={[styles.heroCardValue, { color: '#FF4D6D' }]}>{currentVitals.heartRate} BPM</Text>
                <Text style={styles.heroCardSubStatus}>Normal Range</Text>
                <Text style={[styles.heroCardTrend, { color: '#FF4D6D' }]}>↗ 5 bpm vs yesterday</Text>
              </View>
              <View style={styles.heroCardRight}>
                <CircularRing
                  size={64}
                  strokeWidth={5}
                  value={Math.min(100, Math.max(0, ((currentVitals.heartRate - 50) / 70) * 100))}
                  label={`${currentVitals.heartRate}`}
                  subtitle=""
                  gradientColors={['#FF4D6D', '#7C3AED']}
                  glowColor="#FF4D6D"
                  hasGlow={false}
                />
              </View>
            </View>
          </GlassCard>

          {/* Card 4: Recovery Score */}
          <GlassCard style={isDesktop ? styles.heroCardDesktop : styles.heroCardMobile}>
            <View style={styles.heroCardContent}>
              <View style={styles.heroCardLeft}>
                <View style={styles.cardHeaderRow}>
                  <RefreshCw size={14} color="#7C3AED" style={{ marginRight: 6 }} />
                  <Text style={styles.heroCardTitle}>Recovery Score</Text>
                </View>
                <Text style={[styles.heroCardValue, { color: '#C084FC' }]}>{recoveryScore}%</Text>
                <Text style={styles.heroCardSubStatus}>Good Recovery</Text>
                <Text style={[styles.heroCardTrend, { color: '#C084FC' }]}>↗ 6% vs yesterday</Text>
              </View>
              <View style={styles.heroCardRight}>
                <CircularRing
                  size={64}
                  strokeWidth={5}
                  value={recoveryScore}
                  label={`${recoveryScore}%`}
                  subtitle=""
                  gradientColors={['#7C3AED', '#00FFB2']}
                  glowColor="#7C3AED"
                  hasGlow={false}
                />
              </View>
            </View>
          </GlassCard>

        </View>

        {/* Analytics Section: Charts */}
        <View style={isDesktop ? styles.analyticsGridDesktop : styles.analyticsGridMobile}>
          
          {/* Chart 1: Hydration Trend */}
          <GlassCard style={isDesktop ? styles.chartCardColumn : styles.chartCardMobile}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeaderLabelRow}>
                <Droplet size={14} color="#00E5C3" fill="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={styles.analyticsCardTitle}>Hydration Trend</Text>
              </View>
              <TouchableOpacity 
                style={styles.durationSelector}
                onPress={() => setHydrationTimeframe(hydrationTimeframe === '7 Days' ? '30 Days' : '7 Days')}
                activeOpacity={0.7}
              >
                <Text style={styles.durationText}>{hydrationTimeframe}</Text>
                <ChevronDown size={12} color={darkMode ? '#8E9AA6' : '#64748B'} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* SVG Line Chart */}
            <View style={styles.chartViewport}>
              {(() => {
                const chartHeight = 160;
                const chartWidth = isDesktop ? (width - 260 - 48) * 0.375 - 32 : width - 72;
                const paddingLeft = 32;
                const paddingBottom = 20;
                const graphWidth = chartWidth - paddingLeft - 16;
                const graphHeight = chartHeight - paddingBottom - 10;

                const points = hydrationTimeframe === '7 Days'
                  ? [85, 83, 89, 92, 91, 93, 95]
                  : [80, 82, 81, 84, 83, 85, 86, 84, 87, 85, 88, 86, 89, 87, 90, 89, 91, 88, 92, 90, 93, 91, 94, 92, 95, 93, 96, 94, 96, 95];
                const xSpacing = graphWidth / (points.length - 1);
                
                let linePath = '';
                let areaPath = '';
                
                points.forEach((val, i) => {
                  const x = paddingLeft + i * xSpacing;
                  const y = graphHeight - (val / 100) * graphHeight + 10;
                  
                  if (i === 0) {
                    linePath = `M ${x} ${y}`;
                    areaPath = `M ${x} ${graphHeight + 10} L ${x} ${y}`;
                  } else {
                    linePath += ` L ${x} ${y}`;
                    areaPath += ` L ${x} ${y}`;
                  }
                  
                  if (i === points.length - 1) {
                    areaPath += ` L ${x} ${graphHeight + 10} Z`;
                  }
                });

                const labels = hydrationTimeframe === '7 Days'
                  ? ['Jun 02', 'Jun 03', 'Jun 04', 'Jun 05', 'Jun 06', 'Jun 07', 'Jun 08']
                  : ['May 10', 'May 17', 'May 24', 'May 31', 'Jun 08'];

                return (
                  <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                      <LinearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#00E5C3" stopOpacity={0.25} />
                        <Stop offset="100%" stopColor="#00E5C3" stopOpacity={0.0} />
                      </LinearGradient>
                    </Defs>
                    
                    {/* Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                      const y = graphHeight * p + 10;
                      const val = 100 - p * 100;
                      return (
                        <G key={idx}>
                          <Line x1={paddingLeft} y1={y} x2={chartWidth - 16} y2={y} stroke={svgLineColor} strokeWidth={1} />
                          <SvgText x={paddingLeft - 8} y={y + 3} fill={textSecondary} fontSize="8" fontWeight="bold" textAnchor="end">{val}%</SvgText>
                        </G>
                      );
                    })}

                    {/* Area shading */}
                    <Path d={areaPath} fill="url(#blueGrad)" />

                    {/* Trend Line */}
                    <Path d={linePath} fill="none" stroke="#00E5C3" strokeWidth={2} strokeLinecap="round" />

                    {/* Nodes */}
                    {points.map((val, i) => {
                      const x = paddingLeft + i * xSpacing;
                      const y = graphHeight - (val / 100) * graphHeight + 10;
                      const isLast = i === points.length - 1;

                      return (
                        <G key={i}>
                          <Circle cx={x} cy={y} r={points.length > 15 ? 1.5 : 3} fill="#00E5C3" />
                          {isLast && (
                            <G>
                              <Rect x={x - 16} y={y - 18} width={26} height={12} rx={3} fill="#00E5C3" />
                              <SvgText x={x - 3} y={y - 9} fill="#050B18" fontSize="8" fontWeight="900" textAnchor="middle">{val}%</SvgText>
                            </G>
                          )}
                        </G>
                      );
                    })}

                    {/* X-axis labels */}
                    {labels.map((lbl, i) => {
                      const x = paddingLeft + i * (graphWidth / (labels.length - 1));
                      return (
                        <SvgText key={i} x={x} y={chartHeight - 2} fill={textSecondary} fontSize="8" fontWeight="bold" textAnchor="middle">
                          {lbl}
                        </SvgText>
                      );
                    })}
                  </Svg>
                );
              })()}
            </View>

            {/* Bottom Legend */}
            <View style={styles.chartLegendRow}>
              <View style={styles.legendDotBox}>
                <View style={[styles.legendDotSquare, { backgroundColor: '#00E5C3' }]} />
                <Text style={styles.legendLabelText}>Hydration Level</Text>
              </View>
            </View>
          </GlassCard>

          {/* Chart 2: Heart Rate Variability */}
          <GlassCard style={isDesktop ? styles.chartCardColumn : styles.chartCardMobile}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeaderLabelRow}>
                <Heart size={14} color="#FF4D6D" fill="#FF4D6D" style={{ marginRight: 8 }} />
                <Text style={styles.analyticsCardTitle}>Heart Rate Variability</Text>
              </View>
              <TouchableOpacity 
                style={styles.durationSelector}
                onPress={() => setHrvTimeframe(hrvTimeframe === '7 Days' ? '30 Days' : '7 Days')}
                activeOpacity={0.7}
              >
                <Text style={styles.durationText}>{hrvTimeframe}</Text>
                <ChevronDown size={12} color={darkMode ? '#8E9AA6' : '#64748B'} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* SVG Bar Chart */}
            <View style={styles.chartViewport}>
              {(() => {
                const chartHeight = 160;
                const chartWidth = isDesktop ? (width - 260 - 48) * 0.375 - 32 : width - 72;
                const paddingLeft = 28;
                const paddingBottom = 20;
                const graphWidth = chartWidth - paddingLeft - 16;
                const graphHeight = chartHeight - paddingBottom - 10;

                const values = hrvTimeframe === '7 Days'
                  ? [62, 65, 72, 68, 60, 75, 78]
                  : [58, 60, 62, 61, 63, 62, 64, 63, 65, 64, 66, 65, 67, 66, 68, 67, 69, 68, 70, 69, 71, 70, 72, 71, 73, 72, 74, 73, 75, 78];
                const xSpacing = graphWidth / (values.length - 1);
                const barWidth = hrvTimeframe === '7 Days' ? 8 : 3;

                const labels = hrvTimeframe === '7 Days'
                  ? ['Jun 02', 'Jun 03', 'Jun 04', 'Jun 05', 'Jun 06', 'Jun 07', 'Jun 08']
                  : ['May 10', 'May 17', 'May 24', 'May 31', 'Jun 08'];

                return (
                  <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                      <LinearGradient id="purplePinkGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#FF4D6D" />
                        <Stop offset="100%" stopColor="#7C3AED" />
                      </LinearGradient>
                    </Defs>

                    {/* Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                      const y = graphHeight * p + 10;
                      const val = 100 - p * 100;
                      return (
                        <G key={idx}>
                          <Line x1={paddingLeft} y1={y} x2={chartWidth - 16} y2={y} stroke={svgLineColor} strokeWidth={1} />
                          <SvgText x={paddingLeft - 8} y={y + 3} fill={textSecondary} fontSize="8" fontWeight="bold" textAnchor="end">{val}</SvgText>
                        </G>
                      );
                    })}

                    {/* Vertical Bars */}
                    {values.map((val, i) => {
                      const x = paddingLeft + i * xSpacing - barWidth / 2;
                      const barHeight = (val / 100) * graphHeight;
                      const y = graphHeight - barHeight + 10;

                      return (
                        <Rect
                          key={i}
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx={barWidth > 4 ? 3 : 1}
                          fill="url(#purplePinkGrad)"
                        />
                      );
                    })}

                    {/* X-axis labels */}
                    {labels.map((lbl, i) => {
                      const x = paddingLeft + i * (graphWidth / (labels.length - 1));
                      return (
                        <SvgText key={i} x={x} y={chartHeight - 2} fill={textSecondary} fontSize="8" fontWeight="bold" textAnchor="middle">
                          {lbl}
                        </SvgText>
                      );
                    })}
                  </Svg>
                );
              })()}
            </View>

            {/* Bottom Legend */}
            <View style={styles.chartLegendRow}>
              <View style={styles.legendDotBox}>
                <View style={[styles.legendDotSquare, { backgroundColor: '#FF4D6D' }]} />
                <Text style={styles.legendLabelText}>HRV (ms)</Text>
              </View>
            </View>
          </GlassCard>

          {/* AI Status Report */}
          <GlassCard style={isDesktop ? styles.aiReportColumn : styles.chartCardMobile}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeaderLabelRow}>
                <Sparkles size={14} color="#00E5C3" fill="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={styles.analyticsCardTitle}>AI Status Report</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>CONFIDENCE: 94%</Text>
              </View>
            </View>

            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Dehydration Risk</Text>
              <Text style={[styles.reportValue, { color: '#00FFB2' }]}>Low Risk</Text>
            </View>

            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>Current Deficit</Text>
              <Text style={styles.reportValue}>0 ml</Text>
            </View>

            <View style={styles.reportTextContainer}>
              <Text style={styles.reportDescText}>
                Optimal: Hydration level is fully aligned with metabolic consumption. Maintain regular sipping intervals.
              </Text>
            </View>

            {/* Quick Water Logging Card */}
            <View style={styles.quickLogWrapper}>
              <Text style={styles.quickLogTitle}>QUICK LOG WATER</Text>
              <View style={styles.logButtonsRow}>
                {quickLogAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => logWater(amount)}
                    style={[styles.logChip, { backgroundColor: logChipBg, borderColor: logChipBorder }]}
                  >
                    <Text style={styles.logChipText}>+{amount}ml</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </GlassCard>

        </View>

        {/* Bottom Section: Overview and Recommendations */}
        <View style={isDesktop ? styles.analyticsGridDesktop : styles.analyticsGridMobile}>
          
          {/* Donut Chart 1: Fluid Balance Overview */}
          <GlassCard style={isDesktop ? styles.chartCardColumn : styles.chartCardMobile}>
            <View style={styles.cardHeaderLabelRow}>
              <Droplet size={14} color="#00E5C3" style={{ marginRight: 8 }} />
              <Text style={styles.analyticsCardTitle}>Fluid Balance Overview</Text>
            </View>

            <View style={styles.donutContainerRow}>
              {/* Donut Draw */}
              <View style={styles.donutWrapper}>
                <Svg width={120} height={120}>
                  {/* Track base */}
                  <Circle cx={60} cy={60} r={45} stroke={svgTrackColor} strokeWidth={10} fill="transparent" />
                  {/* Segment 1: Total Intake (70%) */}
                  {drawDonutSegment(70, 0, '#14B8FF', 120, 10)}
                  {/* Segment 2: Sweat & Activity (20%) */}
                  {drawDonutSegment(20, 70, '#FF4D6D', 120, 10)}
                  {/* Segment 3: Bowel fluid loss (10%) */}
                  {drawDonutSegment(10, 90, '#FFAD33', 120, 10)}
                </Svg>
              </View>

              {/* Legend List */}
              <View style={styles.donutLegendContainer}>
                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#14B8FF' }]} />
                  <Text style={styles.donutLegendLabel}>Total Intake</Text>
                  <Text style={styles.donutLegendValue}>{totalIntake} ml</Text>
                </View>

                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#FF4D6D' }]} />
                  <Text style={styles.donutLegendLabel}>Sweat & Loss</Text>
                  <Text style={styles.donutLegendValue}>{sweatLoss} ml</Text>
                </View>

                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#FFAD33' }]} />
                  <Text style={styles.donutLegendLabel}>Bowel Loss</Text>
                  <Text style={styles.donutLegendValue}>{bowelLoss} ml</Text>
                </View>

                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#00E5C3' }]} />
                  <Text style={styles.donutLegendLabel}>Net Balance</Text>
                  <Text style={[styles.donutLegendValue, { color: '#00E5C3' }]}>+{netBalance >= 0 ? netBalance : 0} ml</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.breakdownBtn} 
              activeOpacity={0.7}
              onPress={() => setActiveTab('history')}
            >
              <Text style={styles.breakdownBtnText}>View Full Breakdown</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Donut Chart 2: Sleep Analysis */}
          <GlassCard style={isDesktop ? styles.chartCardColumn : styles.chartCardMobile}>
            <View style={styles.cardHeaderLabelRow}>
              <Moon size={14} color="#7C3AED" style={{ marginRight: 8 }} />
              <Text style={styles.analyticsCardTitle}>Sleep Analysis (WHOOP Style)</Text>
            </View>

            <View style={styles.donutContainerRow}>
              {/* Donut Draw */}
              <View style={styles.donutWrapper}>
                <Svg width={120} height={120}>
                  {/* Track base */}
                  <Circle cx={60} cy={60} r={45} stroke={svgTrackColor} strokeWidth={10} fill="transparent" />
                  {/* Segment 1: Light Sleep (58%) */}
                  {drawDonutSegment(58, 0, '#14B8FF', 120, 10)}
                  {/* Segment 2: REM Sleep (20%) */}
                  {drawDonutSegment(20, 58, '#00E5C3', 120, 10)}
                  {/* Segment 3: Deep Sleep (22%) */}
                  {drawDonutSegment(22, 78, '#7C3AED', 120, 10)}
                </Svg>
                <View style={styles.donutCenterTextWrapper}>
                  <Text style={styles.donutCenterValue}>88</Text>
                  <Text style={styles.donutCenterLabel}>Sleep Score</Text>
                </View>
              </View>

              {/* Legend List */}
              <View style={styles.donutLegendContainer}>
                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#7C3AED' }]} />
                  <Text style={styles.donutLegendLabel}>Total Sleep</Text>
                  <Text style={styles.donutLegendValue}>7h 42m</Text>
                </View>

                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#7C3AED', opacity: 0.6 }]} />
                  <Text style={styles.donutLegendLabel}>Deep Sleep</Text>
                  <Text style={styles.donutLegendValue}>1h 42m (22%)</Text>
                </View>

                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#00E5C3' }]} />
                  <Text style={styles.donutLegendLabel}>REM Sleep</Text>
                  <Text style={styles.donutLegendValue}>1h 36m (20%)</Text>
                </View>

                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#14B8FF' }]} />
                  <Text style={styles.donutLegendLabel}>Light Sleep</Text>
                  <Text style={styles.donutLegendValue}>4h 24m (58%)</Text>
                </View>

                <View style={styles.donutLegendItem}>
                  <View style={[styles.donutDot, { backgroundColor: '#FF4D6D' }]} />
                  <Text style={styles.donutLegendLabel}>Wake Events</Text>
                  <Text style={styles.donutLegendValue}>2</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.breakdownBtn} 
              activeOpacity={0.7}
              onPress={() => setActiveTab('insights')}
            >
              <Text style={styles.breakdownBtnText}>View Sleep Calibration</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Insights & Recommendations */}
          <GlassCard style={isDesktop ? styles.aiReportColumn : styles.chartCardMobile}>
            <View style={styles.cardHeaderLabelRow}>
              <Lightbulb size={14} color="#FFAD33" style={{ marginRight: 8 }} />
              <Text style={styles.analyticsCardTitle}>Insights & Recommendations</Text>
            </View>

            <View style={styles.recommendationList}>
              {/* Rec 1 */}
              <TouchableOpacity 
                style={styles.recItem} 
                activeOpacity={0.7}
                onPress={() => setActiveTab('history')}
              >
                <View style={styles.recLeftRow}>
                  <View style={[styles.recIconWrapper, { backgroundColor: 'rgba(0, 229, 195, 0.08)' }]}>
                    <Droplet size={12} color="#00E5C3" fill="#00E5C3" />
                  </View>
                  <Text style={styles.recText} numberOfLines={2}>
                    Great hydration! Keep maintaining your fluid intake.
                  </Text>
                </View>
                <ChevronRight size={12} color={textSecondary} />
              </TouchableOpacity>

              {/* Rec 2 */}
              <TouchableOpacity 
                style={styles.recItem} 
                activeOpacity={0.7}
                onPress={() => setActiveTab('insights')}
              >
                <View style={styles.recLeftRow}>
                  <View style={[styles.recIconWrapper, { backgroundColor: 'rgba(20, 184, 255, 0.08)' }]}>
                    <TrendingUp size={12} color="#14B8FF" />
                  </View>
                  <Text style={styles.recText} numberOfLines={2}>
                    Recovery is trending up. Excellent consistency.
                  </Text>
                </View>
                <ChevronRight size={12} color={textSecondary} />
              </TouchableOpacity>

              {/* Rec 3 */}
              <TouchableOpacity 
                style={styles.recItem} 
                activeOpacity={0.7}
                onPress={() => setActiveTab('insights')}
              >
                <View style={styles.recLeftRow}>
                  <View style={[styles.recIconWrapper, { backgroundColor: 'rgba(124, 58, 237, 0.08)' }]}>
                    <Moon size={12} color="#7C3AED" />
                  </View>
                  <Text style={styles.recText} numberOfLines={2}>
                    Try to reduce late-night screen time for sleep.
                  </Text>
                </View>
                <ChevronRight size={12} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.breakdownBtn} 
              activeOpacity={0.7}
              onPress={() => setActiveTab('insights')}
            >
              <Text style={styles.breakdownBtnText}>View All Insights</Text>
            </TouchableOpacity>
          </GlassCard>

        </View>

      </ScrollView>

      {/* High Risk Emergency Console Modal Overlay */}
      {showEmergencyModal && (
        <View style={StyleSheet.absoluteFill} className="bg-black/90 z-50 items-center justify-center p-6">
          <GlassCard style={styles.modalCard} className="w-full max-w-lg border-[#FF4D6D]/30 bg-[#050B18]/95 p-5">
            
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleRow}>
                <AlertOctagon size={18} color="#FF4D6D" />
                <Text style={styles.modalTitle}>Emergency Medical Dispatch</Text>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setShowEmergencyModal(false);
                  setEmergencySMSState('idle');
                }} 
                style={styles.modalCloseBtn}
              >
                <X size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalWarnBox}>
                <Text style={styles.warnBoxTitle}>Dehydration Alert Active</Text>
                <Text style={styles.warnBoxText}>
                  Wearable telemetry tracks severe gastrointestinal fluid depletion. Deficit is estimated to exceed 1.4 L.
                </Text>
              </View>

              <Text style={styles.modalSectionLabel}>Active Telemetry Packet</Text>
              <View style={styles.telemetryGrid}>
                {[
                  { label: 'HR', val: `${currentVitals.heartRate} BPM`, color: '#FF4D6D' },
                  { label: 'HRV', val: `${currentVitals.hrv} ms`, color: '#7C3AED' },
                  { label: 'Dehydration', val: `${prediction.dehydrationPercent}%`, color: '#FFAD33' },
                  { label: 'Fluid Deficit', val: '1,450 ml', color: '#14B8FF' }
                ].map((item, idx) => (
                  <View key={idx} style={styles.telemetryChip}>
                    <Text style={styles.telemetryLabel}>{item.label}</Text>
                    <Text style={[styles.telemetryVal, { color: item.color }]}>{item.val}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.modalSectionLabel}>Clinical Contacts Queued</Text>
              <View style={styles.contactsList}>
                {[
                  { name: 'Dr. Jane Smith (Primary Clinic)', phone: '+1-555-0199' },
                  { name: 'Family Emergency Backup', phone: '+1-555-9876' }
                ].map((c, i) => (
                  <View key={i} style={styles.contactRow}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                  </View>
                ))}
              </View>

              {emergencySMSState === 'idle' ? (
                <TouchableOpacity
                  onPress={handleTriggerEmergencySMS}
                  style={styles.smsButton}
                >
                  <Send size={14} color="#FFFFFF" />
                  <Text style={styles.smsButtonText}>Send Telemetry SMS</Text>
                </TouchableOpacity>
              ) : emergencySMSState === 'sending' ? (
                <View style={[styles.smsButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                  <Text style={[styles.smsButtonText, { color: '#8E9AA6' }]}>Transmitting Payload...</Text>
                </View>
              ) : (
                <View style={[styles.smsButton, { backgroundColor: 'rgba(0, 255, 178, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 255, 178, 0.2)' }]}>
                  <Text style={[styles.smsButtonText, { color: '#00FFB2' }]}>Alert Dispatched</Text>
                </View>
              )}

              {emergencySMSState === 'sent' && (
                <View style={styles.consoleLog}>
                  <Text style={styles.consoleText}>
                    [SECURE_SMS] Package delivered to Dr. Jane Smith (+1-555-0199).{'\n'}
                    [METRICS] HR: {currentVitals.heartRate} | HRV: {currentVitals.hrv}ms | Est. Loss: 1450ml.
                  </Text>
                </View>
              )}
            </ScrollView>

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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  
  // Top Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    width: '100%',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
    color: darkMode ? '#8E9AA6' : '#64748B',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
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
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },
  bellBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5C3',
  },
  userProfileWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
  },
  userAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  userInfoText: {
    marginRight: 8,
  },
  usernameText: {
    fontSize: 10,
    fontWeight: '800',
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },
  premiumText: {
    color: '#00E5C3',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 0.5,
  },
  dropdownChevron: {
    marginLeft: 2,
  },

  // Emergency banner
  emergencyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    borderColor: 'rgba(255, 77, 109, 0.25)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 24,
  },
  bannerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#FF4D6D',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  bannerActionBadge: {
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bannerActionText: {
    color: '#FF4D6D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  
  // Hero section (4 cards row)
  heroRowDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroCardDesktop: {
    flex: 1,
    marginRight: 12,
    borderRadius: 20,
    padding: 14,
  },
  heroCardMobile: {
    width: '48.5%',
    marginBottom: 12,
    borderRadius: 20,
    padding: 14,
  },
  heroCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCardLeft: {
    flex: 1,
    paddingRight: 4,
  },
  heroCardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: darkMode ? '#8E9AA6' : '#475569',
  },
  heroCardValue: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  heroCardStatus: {
    color: '#00FFB2',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  heroCardSubStatus: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    color: darkMode ? '#8E9AA6' : '#64748B',
  },
  heroCardTrend: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 6,
  },
  heroCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // Analytics Layout Grid
  analyticsGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  analyticsGridMobile: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  chartCardColumn: {
    width: '37.5%',
    borderRadius: 24,
    padding: 20,
  },
  aiReportColumn: {
    width: '22.5%',
    borderRadius: 24,
    padding: 20,
  },
  chartCardMobile: {
    width: '100%',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  
  // Header with actions inside cards
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
  },
  durationText: {
    fontSize: 9,
    fontWeight: '800',
    color: darkMode ? '#8E9AA6' : '#64748B',
  },
  chartViewport: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
    paddingTop: 12,
  },
  legendDotBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDotSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: darkMode ? '#8E9AA6' : '#64748B',
  },

  // AI report details
  confidenceBadge: {
    backgroundColor: 'rgba(0, 229, 195, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    color: '#00E5C3',
    fontSize: 8,
    fontWeight: '900',
  },
  reportItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
    paddingBottom: 8,
  },
  reportLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: darkMode ? '#8E9AA6' : '#64748B',
  },
  reportValue: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },
  reportTextContainer: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
    marginBottom: 14,
  },
  reportDescText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: darkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.85)',
  },

  // Quick logging
  quickLogWrapper: {
    borderTopWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
    paddingTop: 12,
  },
  quickLogTitle: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    color: darkMode ? '#8E9AA6' : '#64748B',
  },
  logButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  logChipText: {
    fontSize: 9,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },

  // Bottom section donuts
  donutContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  donutWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenterTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterValue: {
    fontSize: 20,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },
  donutCenterLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
    color: darkMode ? '#8E9AA6' : '#64748B',
  },
  donutLegendContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  donutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  donutLegendLabel: {
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
    color: darkMode ? '#8E9AA6' : '#64748B',
  },
  donutLegendValue: {
    fontSize: 10,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },
  breakdownBtn: {
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.25)',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  breakdownBtnText: {
    color: '#00E5C3',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Recommendations
  recommendationList: {
    marginVertical: 10,
    flex: 1,
    justifyContent: 'center',
  },
  recItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
  },
  recLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  recIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recText: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
    color: darkMode ? '#FFFFFF' : '#0F172A',
  },

  // Modal styling
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },
  modalCloseBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalWarnBox: {
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.2)',
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  warnBoxTitle: {
    color: '#FF4D6D',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  warnBoxText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 14,
  },
  modalSectionLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  telemetryChip: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    marginBottom: 8,
  },
  telemetryLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 8,
    fontWeight: '700',
  },
  telemetryVal: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  contactsList: {
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  contactPhone: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
  },
  smsButton: {
    backgroundColor: '#FF4D6D',
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  consoleLog: {
    backgroundColor: 'rgba(5, 11, 24, 0.8)',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  consoleText: {
    color: '#00FFB2',
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 12,
  },
});
