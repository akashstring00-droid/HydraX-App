import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Sparkles, 
  Moon, 
  Droplet, 
  Heart, 
  Activity, 
  FileText, 
  CheckSquare, 
  RefreshCw,
  Sun,
  Smile,
  ShieldCheck,
  ChevronRight
} from 'lucide-react-native';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { GlassCard } from '../components/GlassCard';
import Svg, { Circle, Rect, Line, G, Text as SvgText, Path } from 'react-native-svg';

interface PlanItem {
  id: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  text: string;
  completed: boolean;
}

export const RecoveryPlannerScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const darkMode = useSettingsStore((state) => state.darkMode);

  // Vitals Context
  const { currentVitals, prediction } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { recoveryScore } = useDiarrheaStore();

  const [isLoading, setIsLoading] = useState(false);
  const [expectedTomorrow, setExpectedTomorrow] = useState(90);

  const initialPlan: PlanItem[] = [
    { id: '1', timeOfDay: 'Morning', text: 'Drink warm water with electrolytes (350ml)', completed: false },
    { id: '2', timeOfDay: 'Morning', text: '10-minute deep diaphragmatic breathing', completed: false },
    { id: '3', timeOfDay: 'Afternoon', text: 'Rehydrate post-activity (+500ml)', completed: false },
    { id: '4', timeOfDay: 'Afternoon', text: '20-minute active recovery walk', completed: false },
    { id: '5', timeOfDay: 'Evening', text: 'Magnesium hydration intake (250ml)', completed: false },
    { id: '6', timeOfDay: 'Evening', text: 'Disconnect screens 1 hour before sleep', completed: false }
  ];

  const showToast = useToastStore((state) => state.showToast);

  const [planItems, setPlanItems] = useState<PlanItem[]>(initialPlan);

  const handleToggleItem = (id: string) => {
    let newlyCompleted = false;
    setPlanItems(prev => prev.map(item => {
      if (item.id === id) {
        newlyCompleted = !item.completed;
        return { ...item, completed: newlyCompleted };
      }
      return item;
    }));
    
    // Defer toast so state updates first
    setTimeout(() => {
      showToast(newlyCompleted ? "Action completed!" : "Action incomplete.", "info");
    }, 50);
  };

  const handleGeneratePlan = () => {
    setIsLoading(true);
    showToast("Generating dynamic recovery plan...", "info");
    setTimeout(() => {
      setIsLoading(false);
      setExpectedTomorrow(Math.min(98, Math.round(recoveryScore + 5 + Math.random() * 5)));
      setPlanItems(prev => prev.map(item => ({ ...item, completed: false })));
      showToast("Dynamic recovery plan generated!", "success");
    }, 1500);
  };

  const handleExportPDF = () => {
    showToast("Preparing PDF export...", "info");
    if (typeof window !== 'undefined') {
      window.print();
    } else {
      showToast("PDF Export is available on web browsers.", "error");
    }
  };

  const completedCount = planItems.filter(item => item.completed).length;
  const progressPercent = Math.round((completedCount / planItems.length) * 100);

  // Core metrics factors list
  const factors = [
    { name: 'Sleep', score: 88, status: 'Optimal', icon: Moon, color: '#7C3AED' },
    { name: 'Hydration', score: Math.round((currentIntake / (dailyWaterTarget || 2500)) * 100), status: currentIntake >= dailyWaterTarget ? 'Optimal' : 'Needs Hydration', icon: Droplet, color: '#14B8FF' },
    { name: 'HRV', score: Math.min(100, Math.round(((currentVitals.hrv || 60) / 85) * 100)), status: 'Balanced', icon: Heart, color: '#FF4D6D' },
    { name: 'Stress', score: 78, status: 'Low', icon: Smile, color: '#00E5C3' },
    { name: 'Activity', score: Math.round((currentVitals.motion || 0.1) * 100), status: 'Active', icon: Activity, color: '#FFAD33' }
  ];

  const getAdaptiveRecommendation = () => {
    if (prediction.riskLevel === 'High') {
      return {
        title: 'Critical Dehydration Penalty',
        desc: 'Optical sensors indicate extracellular fluid suppression. Prioritize electrolyte load (+500ml) immediately. Suspend intense workouts.',
        color: '#FF4D6D'
      };
    }
    if ((currentVitals.hrv || 60) < 55) {
      return {
        title: 'Parasympathetic Fatigue',
        desc: `Your HRV is suppressed at ${currentVitals.hrv || 60}ms. We recommend adding a diaphragmatic breathing session and going to bed 30 minutes earlier tonight.`,
        color: '#7C3AED'
      };
    }
    if (recoveryScore < 70) {
      return {
        title: 'Increased Autonomic Strain',
        desc: 'Gut irritation or fluid loss is putting extra strain on your system. Keep physical load light and increase water sipping frequency.',
        color: '#FFAD33'
      };
    }
    return {
      title: 'Peak Recovery Capacity',
      desc: 'All physiological indicators are green. Your body is ready for high physical today.',
      color: '#00E5C3'
    };
  };

  const activeRec = getAdaptiveRecommendation();

  // Recovery Calendar (Simulated past 14 days)
  const calendarDays = [
    { day: '28', score: 85 },
    { day: '29', score: 92 },
    { day: '30', score: 78 },
    { day: '31', score: 62 },
    { day: '1', score: 54 },
    { day: '2', score: 79 },
    { day: '3', score: 88 },
    { day: '4', score: 91 },
    { day: '5', score: 73 },
    { day: '6', score: 68 },
    { day: '7', score: 84 },
    { day: '8', score: 90 },
    { day: '9', score: 77 },
    { day: '10', score: recoveryScore }, // Today
  ];

  // SVG Circular progress configs
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (recoveryScore / 100) * circumference;

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header row with action buttons */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>Recovery Planner</Text>
            <Text style={styles.subtitle}>Optimize bio-readiness with real-time planning</Text>
          </View>
          <View style={styles.btnGroup}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { borderColor: borderCol }]}
              onPress={handleExportPDF}
              activeOpacity={0.7}
            >
              <FileText size={14} color={textPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.btnText, { color: textPrimary }]}>Export PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleGeneratePlan}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#050B18" />
              ) : (
                <>
                  <RefreshCw size={14} color="#050B18" style={{ marginRight: 6 }} />
                  <Text style={[styles.btnText, { color: '#050B18' }]}>Generate Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={isDesktop ? styles.desktopGrid : styles.mobileGrid}>
          
          {/* COLUMN 1: Score Gauge & Readiness Factors */}
          <View style={styles.leftCol}>
            {/* Score Ring */}
            <GlassCard style={styles.scoreCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Current Readiness State</Text>
              
              <View style={styles.gaugeContainer}>
                <Svg width={160} height={160}>
                  <Circle
                    cx={80}
                    cy={80}
                    r={radius}
                    stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <Circle
                    cx={80}
                    cy={80}
                    r={radius}
                    stroke="#00E5C3"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    transform="rotate(-90 80 80)"
                  />
                </Svg>
                <View style={styles.gaugeTextWrapper}>
                  <Text style={[styles.gaugeValue, { color: textPrimary }]}>{recoveryScore}%</Text>
                  <Text style={styles.gaugeLabel}>RECOVERY</Text>
                </View>
              </View>

              <View style={styles.tomorrowBox}>
                <Sparkles size={14} color="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={[styles.tomorrowText, { color: textPrimary }]}>
                  Tomorrow Forecast: <Text style={{ color: '#00E5C3', fontWeight: '900' }}>{expectedTomorrow}% Recovery</Text>
                </Text>
              </View>
            </GlassCard>

            {/* Factors List */}
            <GlassCard style={styles.factorsCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Biometric Factors Breakdown</Text>
              
              {factors.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <View key={idx} style={[styles.factorRow, { borderBottomColor: borderCol }]}>
                    <View style={styles.factorLeft}>
                      <View style={[styles.factorIconBg, { backgroundColor: f.color + '10' }]}>
                        <Icon size={14} color={f.color} />
                      </View>
                      <Text style={[styles.factorName, { color: textPrimary }]}>{f.name}</Text>
                    </View>
                    <View style={styles.factorRight}>
                      <Text style={[styles.factorScore, { color: textPrimary }]}>{f.score}%</Text>
                      <View style={[styles.factorStatusChip, { backgroundColor: f.score >= 80 ? 'rgba(0, 229, 195, 0.08)' : 'rgba(255, 173, 51, 0.08)' }]}>
                        <Text style={[styles.factorStatusText, { color: f.score >= 80 ? '#00E5C3' : '#FFAD33' }]}>{f.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </GlassCard>

            {/* Recovery Calendar Grid */}
            <GlassCard style={{ padding: 18, borderRadius: 24, marginBottom: 20 }} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Recovery History Calendar</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginTop: 8 }}>
                {calendarDays.map((d, idx) => {
                  const isOptimal = d.score >= 80;
                  const isWarning = d.score >= 60 && d.score < 80;
                  const scoreColor = isOptimal ? '#00E5C3' : isWarning ? '#FFAD33' : '#FF4D6D';
                  
                  return (
                    <View key={idx} style={{ alignItems: 'center', width: '12%', minWidth: 32, marginBottom: 8 }}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: textSecondary, marginBottom: 4 }}>{d.day}</Text>
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: scoreColor + '15',
                        borderColor: scoreColor,
                        borderWidth: 1,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: scoreColor }}>{d.score}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </View>

          {/* COLUMN 2: Today's Recovery Plan */}
          <View style={styles.rightCol}>
            <GlassCard style={styles.planCard} borderColor={borderCol}>
              <View style={styles.planHeader}>
                <Text style={styles.sectionLabel}>Today's Autonomic Plan</Text>
                <Text style={[styles.progressLabel, { color: '#00E5C3' }]}>{progressPercent}% Done</Text>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBarBase, { backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>

              {/* Checklist grouped by Morning, Afternoon, Evening */}
              {['Morning', 'Afternoon', 'Evening'].map((time) => {
                const items = planItems.filter(item => item.timeOfDay === time);
                return (
                  <View key={time} style={styles.planGroup}>
                    <Text style={styles.groupTitle}>{time.toUpperCase()}</Text>
                    {items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleToggleItem(item.id)}
                        style={[
                          styles.planCheckRow, 
                          { 
                            backgroundColor: item.completed 
                              ? (darkMode ? 'rgba(0, 229, 195, 0.03)' : 'rgba(0, 229, 195, 0.02)') 
                              : 'transparent',
                            borderColor: item.completed ? 'rgba(0, 229, 195, 0.1)' : borderCol
                          }
                        ]}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkbox,
                          { 
                            borderColor: item.completed ? '#00E5C3' : textSecondary,
                            backgroundColor: item.completed ? '#00E5C3' : 'transparent' 
                          }
                        ]}>
                          {item.completed && <CheckSquare size={12} color="#050B18" />}
                        </View>
                        <Text style={[
                          styles.planCheckText, 
                          { 
                            color: item.completed ? textSecondary : textPrimary,
                            textDecorationLine: item.completed ? 'line-through' : 'none' 
                          }
                        ]}>
                          {item.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </GlassCard>

            {/* Adaptive Bio-Recommendation */}
            <GlassCard style={{ padding: 18, borderRadius: 24, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: activeRec.color }} borderColor={borderCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Sparkles size={14} color={activeRec.color} />
                <Text style={{ fontSize: 10, fontWeight: '900', color: activeRec.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Adaptive Bio-Recommendation
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '900', color: textPrimary, marginBottom: 4 }}>{activeRec.title}</Text>
              <Text style={{ fontSize: 11, color: textSecondary, lineHeight: 16 }}>{activeRec.desc}</Text>
            </GlassCard>

            {/* Recovery Timeline Charts */}
            <GlassCard style={styles.chartCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Weekly Recovery Trajectory</Text>
              
              <View style={styles.chartWrapper}>
                {/* Custom SVG Bar Graph */}
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
                  {/* Bars representing daily recovery */}
                  {[
                    { day: 'Mon', val: 78, color: '#00E5C3' },
                    { day: 'Tue', val: 64, color: '#FFAD33' },
                    { day: 'Wed', val: 82, color: '#00E5C3' },
                    { day: 'Thu', val: 88, color: '#00E5C3' },
                    { day: 'Fri', val: 55, color: '#FF4D6D' },
                    { day: 'Sat', val: 74, color: '#00E5C3' },
                    { day: 'Sun', val: recoveryScore, color: '#00E5C3' }
                  ].map((bar, idx) => {
                    const barHeight = (bar.val / 100) * 120;
                    const x = 40 + idx * 42;
                    const y = 140 - barHeight;
                    return (
                      <G key={idx}>
                        {/* Shadow Column background */}
                        <Rect
                          x={x}
                          y={20}
                          width={14}
                          height={120}
                          rx={7}
                          fill={darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'}
                        />
                        {/* Active value column bar */}
                        <Rect
                          x={x}
                          y={y}
                          width={14}
                          height={barHeight}
                          rx={7}
                          fill={bar.color}
                        />
                        <SvgText
                          x={x + 7}
                          y={155}
                          fill={textSecondary}
                          fontSize={8}
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {bar.day}
                        </SvgText>
                        <SvgText
                          x={x + 7}
                          y={y - 4}
                          fill={textPrimary}
                          fontSize={7}
                          fontWeight="900"
                          textAnchor="middle"
                        >
                          {bar.val}%
                        </SvgText>
                      </G>
                    );
                  })}
                </Svg>
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
    marginBottom: 24,
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
  gaugeContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  gaugeValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  gaugeLabel: {
    color: '#8E9AA6',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  tomorrowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: 20,
  },
  tomorrowText: {
    fontSize: 11,
    fontWeight: '700',
  },
  factorsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  factorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  factorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  factorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factorScore: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 10,
  },
  factorStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  factorStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  planCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarBase: {
    height: 6,
    borderRadius: 3,
    marginVertical: 12,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E5C3',
    borderRadius: 3,
  },
  planGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    color: '#00E5C3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  planCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planCheckText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  chartCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  chartWrapper: {
    marginTop: 10,
  },
});
