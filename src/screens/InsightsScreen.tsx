import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from '../components/GlassCard';
import { 
  Sparkles, 
  Brain, 
  Droplet, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Zap,
  Moon,
  Clock
} from 'lucide-react-native';
import Svg, { Circle, G, Text as SvgText, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export const InsightsScreen: React.FC = () => {
  const { prediction, currentVitals } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { logs, recoveryScore } = useDiarrheaStore();

  const darkMode = useSettingsStore((state) => state.darkMode);
  const styles = getStyles(darkMode);

  const totalLogsToday = logs.filter(log => {
    const hours = (new Date().getTime() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60);
    return hours < 24;
  });

  const totalFluidLoss = totalLogsToday.reduce((sum, log) => sum + log.fluidLossEstimate, 0);

  // Compute breakdown percentages for a custom SVG fluid balance chart
  const baseMetabolic = 1200;
  const sweatActivityLoss = Math.round(currentVitals.motion * 800);
  const totalDepletion = baseMetabolic + sweatActivityLoss + totalFluidLoss;

  const intakePercentage = Math.round(Math.min(100, (currentIntake / (totalDepletion || 1)) * 100));

  // Renders a custom SVG fluid distribution Donut chart
  const renderFluidDistribution = () => {
    const size = 160;
    const strokeWidth = 14;
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;

    // Split segments
    const metShare = 0.45;
    const sweatShare = 0.25;
    const diarrheaShare = totalFluidLoss > 0 ? 0.30 : 0.0;
    
    // Normalize shares to sum to 1
    const totalShare = metShare + sweatShare + diarrheaShare;
    const metPct = (metShare / totalShare) * circ;
    const sweatPct = (sweatShare / totalShare) * circ;
    const diarrheaPct = (diarrheaShare / totalShare) * circ;

    return (
      <View style={{ alignItems: 'center', paddingVertical: 8, justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="metGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#14B8FF" />
              <Stop offset="100%" stopColor="#7C3AED" />
            </LinearGradient>
            <LinearGradient id="sweatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFAD33" />
              <Stop offset="100%" stopColor="#FF4D6D" />
            </LinearGradient>
            <LinearGradient id="diarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF4D6D" />
              <Stop offset="100%" stopColor="#7C3AED" />
            </LinearGradient>
          </Defs>
          <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {/* Metabolic Segment */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="url(#metGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={0}
              fill="transparent"
            />
            {/* Sweat Segment */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="url(#sweatGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={metPct}
              fill="transparent"
            />
            {/* Diarrhea Segment */}
            {totalFluidLoss > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="url(#diarGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circ}
                strokeDashoffset={metPct + sweatPct}
                fill="transparent"
              />
            )}
          </G>
        </Svg>
        <View style={styles.donutTextContainer}>
          <Text style={styles.donutTextVal}>{intakePercentage}%</Text>
          <Text style={styles.donutTextSub}>Met Daily</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.bannerSubtitle}>AI Core Insights</Text>
          <Text style={styles.bannerTitle}>Dehydration & Risks</Text>
        </View>

        {/* AI Prediction Board */}
        <GlassCard style={styles.predictionCard} borderColor={darkMode ? 'rgba(0, 229, 195, 0.1)' : 'rgba(0, 229, 195, 0.15)'}>
          <View style={styles.predictionHeader}>
            <View style={styles.predictionTitleRow}>
              <Brain size={18} color="#00E5C3" />
              <Text style={styles.cardHeaderTitle}>AI Status Report</Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>CONFIDENCE: {prediction.confidenceScore}%</Text>
            </View>
          </View>

          {/* Risk assessment grid */}
          <View style={styles.riskGrid}>
            <View style={{ width: '48%' }}>
              <Text style={styles.riskGridLabel}>Dehydration Risk</Text>
              <Text 
                style={[
                  styles.riskGridVal,
                  { 
                    color: prediction.riskLevel === 'Low' ? '#00FFB2' : prediction.riskLevel === 'Medium' ? '#FFAD33' : '#FF4D6D' 
                  }
                ]}
              >
                {prediction.riskLevel} Risk
              </Text>
            </View>

            <View style={{ width: '48%' }}>
              <Text style={styles.riskGridLabel}>Current Deficit</Text>
              <Text style={styles.riskGridVal}>
                {Math.max(0, totalDepletion - currentIntake)} ml
              </Text>
            </View>
          </View>

          <View style={styles.reportBorderLine}>
            <Text style={styles.reportDescText}>
              {prediction.riskLevel === 'High' 
                ? 'CRITICAL ALERT: Continuous fluid depletion detected due to gastrointestinal loss. Immediate electrolyte intervention is required.'
                : prediction.riskLevel === 'Medium'
                ? 'ALERT: Your hydration levels are lagging due to elevated heart rate and activity. Consider drinking 300ml of mineral water.'
                : 'OPTIMAL: Hydration level is fully aligned with metabolic consumption. Maintain regular sipping intervals.'
              }
            </Text>
          </View>
        </GlassCard>

        {/* Fluid distribution chart */}
        <GlassCard style={{ padding: 20, marginBottom: 20 }} borderColor={borderTheme(darkMode)}>
          <Text style={styles.cardHeaderTitle}>Total Fluid Depletion Breakdown</Text>
          <View style={styles.donutRow}>
            
            {/* Left: Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#14B8FF' }]} />
                <View>
                  <Text style={styles.legendLabelBold}>Metabolic Basal</Text>
                  <Text style={styles.legendLabelSmall}>{baseMetabolic} ml / day</Text>
                </View>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFAD33' }]} />
                <View>
                  <Text style={styles.legendLabelBold}>Sweat & Activity</Text>
                  <Text style={styles.legendLabelSmall}>{sweatActivityLoss} ml estimated</Text>
                </View>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF4D6D' }]} />
                <View>
                  <Text style={styles.legendLabelBold}>Bowel Fluid Loss</Text>
                  <Text style={styles.legendLabelSmall}>{totalFluidLoss} ml today</Text>
                </View>
              </View>
            </View>

            {/* Right: Chart */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {renderFluidDistribution()}
            </View>

          </View>
        </GlassCard>

        {/* Sleep Stages Analysis Card */}
        <GlassCard style={{ padding: 20, marginBottom: 20 }} borderColor={borderTheme(darkMode)}>
          <View style={styles.sleepCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Moon size={18} color="#7C3AED" />
              <Text style={styles.cardHeaderTitle}>WHOOP Style Sleep Analysis</Text>
            </View>
            <View style={styles.sleepScoreBadge}>
              <Text style={styles.sleepScoreBadgeText}>Sleep Score: 88</Text>
            </View>
          </View>

          {/* Stacked bar */}
          <View style={styles.sleepStackedBarTrack}>
            <View style={{ width: '22%' }} className="h-full bg-[#7C3AED]" /> 
            <View style={{ width: '25%' }} className="h-full bg-[#00E5C3]" /> 
            <View style={{ width: '45%' }} className="h-full bg-[#14B8FF]" /> 
            <View style={{ width: '8%' }} className="h-full bg-[#FF4D6D]" />  
          </View>

          {/* Legend Grid */}
          <View style={styles.sleepLegendGrid}>
            {[
              { label: 'Deep Sleep', val: '1h 42m', pct: '22%', color: '#7C3AED' },
              { label: 'REM Sleep', val: '1h 56m', pct: '25%', color: '#00E5C3' },
              { label: 'Light Sleep', val: '3h 29m', pct: '45%', color: '#14B8FF' },
              { label: 'Time Awake', val: '38m', pct: '8%', color: '#FF4D6D' }
            ].map((stg, idx) => (
              <View key={idx} style={styles.sleepGridItem}>
                <View style={[styles.sleepColorBox, { backgroundColor: stg.color }]} />
                <View>
                  <Text style={styles.sleepGridLabelBold}>{stg.label}</Text>
                  <Text style={styles.sleepGridLabelSmall}>{stg.val} ({stg.pct})</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Efficiency details */}
          <View style={styles.sleepFootDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={14} color={darkMode ? '#8E9AA6' : '#64748B'} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.smallFooterTitle}>Restless Time</Text>
                <Text style={styles.boldFooterVal}>42 minutes</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TrendingUp size={14} color="#00FFB2" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.smallFooterTitle}>Sleep Efficiency</Text>
                <Text style={[styles.boldFooterVal, { color: '#00FFB2' }]}>89.4%</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* AI Correlation Insights */}
        <View style={{ marginBottom: 32 }}>
          <Text style={styles.sectionHeaderTitle}>AI Health Correlations</Text>

          {/* Diarrhea fluid correlation */}
          {totalFluidLoss > 0 && (
            <GlassCard style={styles.warningCorrelationCard} borderColor="rgba(255, 77, 109, 0.2)">
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#FF4D6D" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.warningCorrelationTitle}>Primary Depletion Factor: GI Loss</Text>
                  <Text style={styles.warningCorrelationText}>
                    A total of {totalFluidLoss}ml has been lost in bowel events today. Dehydration risk multiplier is elevated by 2.4x.
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Motion/Sweat correlation */}
          <GlassCard style={styles.correlationCard} borderColor={borderTheme(darkMode)}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Activity size={18} color="#00E5C3" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.correlationTitle}>Sweat Rate vs Sensor Motion</Text>
                <Text style={styles.correlationText}>
                  Your motion levels averages {currentVitals.motion.toFixed(2)} Gs. This requires a 10% increase in basal hydration replenishment intervals.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* HRV & Stress correlation */}
          <GlassCard style={styles.correlationCard} borderColor={borderTheme(darkMode)}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Zap size={18} color="#7C3AED" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.correlationTitle}>HRV vs Fluid Status</Text>
                <Text style={styles.correlationText}>
                  Low cellular hydration decreases blood volume. A {currentVitals.hrv < 60 ? 'depressed' : 'stable'} HRV reading of {currentVitals.hrv}ms is currently monitored.
                </Text>
              </View>
            </View>
          </GlassCard>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#050B18' : '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  bannerTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  bannerSubtitle: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // AI Prediction Card
  predictionCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 8,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0, 229, 195, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    color: '#00E5C3',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  riskGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  riskGridLabel: {
    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : '#64748B',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riskGridVal: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  reportBorderLine: {
    borderTopWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
    marginTop: 12,
    paddingTop: 12,
  },
  reportDescText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.85)' : '#1E293B',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Donut Layout
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  donutTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTextVal: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  donutTextSub: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  legendContainer: {
    flex: 1,
    paddingRight: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  legendLabelBold: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  legendLabelSmall: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },

  // Sleep card analysis
  sleepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sleepScoreBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sleepScoreBadgeText: {
    color: '#7C3AED',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sleepStackedBarTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: borderTheme(darkMode),
  },
  sleepLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: borderTheme(darkMode),
    paddingBottom: 4,
  },
  sleepGridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepColorBox: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 8,
  },
  sleepGridLabelBold: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 10,
    fontWeight: '800',
  },
  sleepGridLabelSmall: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
  sleepFootDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  smallFooterTitle: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  boldFooterVal: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1,
  },

  // AI correlations
  sectionHeaderTitle: {
    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  warningCorrelationCard: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 77, 109, 0.05)',
  },
  warningCorrelationTitle: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '900',
  },
  warningCorrelationText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#334155',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '600',
  },
  correlationCard: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  correlationTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  correlationText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.65)' : '#334155',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '600',
  },
});

const borderTheme = (darkMode: boolean) => darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
