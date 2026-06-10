import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Sparkles, 
  FileText, 
  Share2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb,
  Heart,
  Droplet,
  Moon,
  TrendingUp,
  Activity
} from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { GlassCard } from '../components/GlassCard';
import Svg, { Circle, Line, Text as SvgText, Path, G, Rect } from 'react-native-svg';

export const WeeklyReportsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const darkMode = useSettingsStore((state) => state.darkMode);

  // Vitals Context
  const { currentVitals } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { recoveryScore } = useDiarrheaStore();

  const handleExportPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    } else {
      alert("PDF Export is available on web browsers via window.print()");
    }
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  // Weekly Stats List
  const weeklyMetrics = [
    { name: 'Hydration Avg', val: '86%', status: 'Optimal', icon: Droplet, color: '#14B8FF' },
    { name: 'Sleep Avg', val: '7h 38m', status: 'Optimal', icon: Moon, color: '#7C3AED' },
    { name: 'Recovery Avg', val: `${recoveryScore - 2}%`, status: 'Balanced', icon: TrendingUp, color: '#00E5C3' },
    { name: 'HRV Avg', val: `${currentVitals.hrv - 3} ms`, status: 'Stable', icon: Heart, color: '#FF4D6D' },
    { name: 'Avg Fluid Loss', val: '950 ml/day', status: 'Normal', icon: Droplet, color: '#FFAD33' },
    { name: 'Active Energy', val: '480 kcal/day', status: 'Active', icon: Activity, color: '#FFAD33' }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>Weekly Report Center</Text>
            <Text style={styles.subtitle}>Consolidated biological performance and clinical auditing</Text>
          </View>
          <View style={styles.btnGroup}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { borderColor: borderCol }]}
              onPress={() => alert("DOCX report downloaded successfully.")}
              activeOpacity={0.7}
            >
              <Download size={14} color={textPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: textPrimary }]}>DOCX</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { borderColor: borderCol }]}
              onPress={handleExportPDF}
              activeOpacity={0.7}
            >
              <FileText size={14} color={textPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: textPrimary }]}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => alert("Weekly report link copied to clipboard. Ready to share.")}
              activeOpacity={0.7}
            >
              <Share2 size={14} color="#050B18" style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: '#050B18' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Executive Summary Banner */}
        <GlassCard style={styles.summaryBanner} borderColor="rgba(0, 229, 195, 0.25)">
          <View style={styles.summaryBadge}>
            <Sparkles size={16} color="#050B18" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Weekly Executive Summary</Text>
            <Text style={styles.summaryText}>
              Your overall physiological health score improved by <Text style={{ color: '#00E5C3', fontWeight: '900' }}>8.4%</Text> this week. Fluid balance calculations indicate regular hydration logs decreased estimated gastrointestinal risk index levels by 15%.
            </Text>
          </View>
        </GlassCard>

        <View style={isDesktop ? styles.desktopGrid : styles.mobileGrid}>
          
          {/* COLUMN 1: Weekly Score Ring & Stats */}
          <View style={styles.leftCol}>
            {/* Health Score Gauge */}
            <GlassCard style={styles.scoreCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Weekly Health Score</Text>
              
              <View style={styles.gaugeWrapper}>
                <Svg width={140} height={140}>
                  <Circle
                    cx={70}
                    cy={70}
                    r={50}
                    stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                    strokeWidth={10}
                    fill="transparent"
                  />
                  <Circle
                    cx={70}
                    cy={70}
                    r={50}
                    stroke="#00E5C3"
                    strokeWidth={10}
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={(2 * Math.PI * 50) - (84 / 100) * (2 * Math.PI * 50)}
                    strokeLinecap="round"
                    fill="transparent"
                    transform="rotate(-90 70 70)"
                  />
                </Svg>
                <View style={styles.gaugeTextWrapper}>
                  <Text style={[styles.gaugeValue, { color: textPrimary }]}>84</Text>
                  <Text style={styles.gaugeLabel}>HEALTH INDEX</Text>
                </View>
              </View>

              <Text style={[styles.scoreStatusText, { color: '#00E5C3' }]}>Optimal State - Readiness High</Text>
            </GlassCard>

            {/* Metrics List */}
            <GlassCard style={styles.metricsCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Performance Averages</Text>
              <View style={styles.metricsGrid}>
                {weeklyMetrics.map((m, idx) => {
                  const Icon = m.icon;
                  return (
                    <View key={idx} style={[styles.metricItem, { borderBottomColor: borderCol }]}>
                      <View style={styles.metricLeft}>
                        <View style={[styles.iconBg, { backgroundColor: m.color + '10' }]}>
                          <Icon size={14} color={m.color} />
                        </View>
                        <Text style={[styles.metricName, { color: textPrimary }]}>{m.name}</Text>
                      </View>
                      <View style={styles.metricRight}>
                        <Text style={[styles.metricVal, { color: textPrimary }]}>{m.val}</Text>
                        <View style={[styles.statusTag, { backgroundColor: m.status === 'Optimal' ? 'rgba(0, 229, 195, 0.08)' : 'rgba(20, 184, 255, 0.08)' }]}>
                          <Text style={[styles.statusText, { color: m.status === 'Optimal' ? '#00E5C3' : '#14B8FF' }]}>{m.status}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </View>

          {/* COLUMN 2: Wins, Risks, Recommendations & Weekly Charts */}
          <View style={styles.rightCol}>
            {/* Audit Details */}
            <GlassCard style={styles.auditCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Auditing Details</Text>
              
              {/* Wins */}
              <View style={styles.auditBlock}>
                <View style={styles.auditHeader}>
                  <CheckCircle2 size={14} color="#00E5C3" style={{ marginRight: 8 }} />
                  <Text style={[styles.auditTitle, { color: textPrimary }]}>Wins</Text>
                </View>
                <Text style={styles.auditText}>
                  - Fluid intake targets met on 6 out of 7 days, maintaining cellular hydration.{'\n'}
                  - Deep sleep ratio increased by 4%, assisting immune and bowel cell restoration.
                </Text>
              </View>

              {/* Risks */}
              <View style={styles.auditBlock}>
                <View style={styles.auditHeader}>
                  <AlertTriangle size={14} color="#FFAD33" style={{ marginRight: 8 }} />
                  <Text style={[styles.auditTitle, { color: textPrimary }]}>Risks</Text>
                </View>
                <Text style={styles.auditText}>
                  - Brief dehydration window detected on Tuesday morning post-workout.{'\n'}
                  - HRV variability saw slight fatigue drops during high stress segments.
                </Text>
              </View>

              {/* Recommendations */}
              <View style={[styles.auditBlock, { marginBottom: 0 }]}>
                <View style={styles.auditHeader}>
                  <Lightbulb size={14} color="#14B8FF" style={{ marginRight: 8 }} />
                  <Text style={[styles.auditTitle, { color: textPrimary }]}>Recommendations</Text>
                </View>
                <Text style={styles.auditText}>
                  - Consume an extra 250ml electrolyte loading packet during early exercise windows.{'\n'}
                  - Maintain sleeping chamber temperature at 19°C (66°F) for deeper slow-wave sleep.
                </Text>
              </View>
            </GlassCard>

            {/* aggregate trend chart */}
            <GlassCard style={styles.chartCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Monthly Comparison (Score Trends)</Text>
              
              <View style={styles.chartWrapper}>
                <Svg width="100%" height={160}>
                  {/* Grid Lines */}
                  {[40, 80, 120].map((y, idx) => (
                    <Line
                      key={idx}
                      x1="30"
                      y1={y}
                      x2="95%"
                      y2={y}
                      stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'}
                      strokeWidth={1}
                    />
                  ))}

                  {/* Dual comparison lines */}
                  {/* Line 1: Hydration Score */}
                  <Path
                    d="M 40 45 L 90 40 L 140 60 L 190 35 L 240 45 L 290 30 L 330 35"
                    fill="transparent"
                    stroke="#14B8FF"
                    strokeWidth={2}
                  />

                  {/* Line 2: Sleep Score */}
                  <Path
                    d="M 40 70 L 90 65 L 140 55 L 190 75 L 240 50 L 290 40 L 330 45"
                    fill="transparent"
                    stroke="#7C3AED"
                    strokeWidth={2}
                  />

                  {/* Nodes */}
                  {[
                    { x: 40, val: 'Wk 1' },
                    { x: 90, val: 'Wk 2' },
                    { x: 140, val: 'Wk 3' },
                    { x: 190, val: 'Wk 4' },
                    { x: 240, val: 'Wk 5' },
                    { x: 290, val: 'Wk 6' },
                    { x: 330, val: 'Wk 7' }
                  ].map((pt, idx) => (
                    <G key={idx}>
                      <Circle cx={pt.x} cy={45} r={3} fill="#14B8FF" />
                      <Circle cx={pt.x} cy={70} r={3} fill="#7C3AED" />
                      <SvgText
                        x={pt.x}
                        y={150}
                        fill={textSecondary}
                        fontSize={7}
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {pt.val}
                      </SvgText>
                    </G>
                  ))}
                </Svg>
                
                {/* Legend */}
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#14B8FF' }]} />
                    <Text style={[styles.legendText, { color: textSecondary }]}>Hydration Index</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
                    <Text style={[styles.legendText, { color: textSecondary }]}>Sleep Quality Index</Text>
                  </View>
                </View>

              </View>
            </GlassCard>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#8E9AA6',
    fontSize: 12,
    marginTop: 2,
  },
  btnGroup: {
    flexDirection: 'row',
    marginTop: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 8,
  },
  btnPrimary: {
    backgroundColor: '#00E5C3',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 195, 0.03)',
    marginBottom: 24,
    borderWidth: 1,
  },
  summaryBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#00E5C3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryTitle: {
    color: '#00E5C3',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  summaryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  desktopGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mobileGrid: {
    flexDirection: 'column',
  },
  leftCol: {
    flex: 1,
    marginRight: Platform.OS === 'web' ? 24 : 0,
  },
  rightCol: {
    flex: 1.5,
  },
  scoreCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  gaugeWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  gaugeLabel: {
    color: '#8E9AA6',
    fontSize: 7,
    fontWeight: '800',
    marginTop: 2,
  },
  scoreStatusText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 16,
  },
  metricsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  metricsGrid: {
    marginTop: 8,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricName: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 10,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  auditCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  auditBlock: {
    marginBottom: 16,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  auditTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  auditText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    paddingLeft: 22,
  },
  chartCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  chartWrapper: {
    marginTop: 10,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
