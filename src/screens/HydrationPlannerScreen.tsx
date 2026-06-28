import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Sparkles, 
  Droplet, 
  Flame, 
  Award, 
  User, 
  Plus,
  Compass,
  Zap,
  ShieldCheck,
  TrendingUp,
  CloudSun
} from 'lucide-react-native';
import { useWaterStore } from '../store/useWaterStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { GlassCard } from '../components/GlassCard';
import Svg, { Circle, Line, Text as SvgText, Path, G, Rect } from 'react-native-svg';

export const HydrationPlannerScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const darkMode = useSettingsStore((state) => state.darkMode);

  // Water Store
  const { 
    currentIntake, 
    dailyWaterTarget, 
    logWater, 
    setDailyTarget, 
    remindersEnabled, 
    reminderInterval, 
    toggleReminders, 
    setReminderInterval 
  } = useWaterStore();
  const showToast = useToastStore((state) => state.showToast);

  // Inputs state
  const [age, setAge] = useState('26');
  const [weight, setWeight] = useState('74');
  const [weatherTemp, setWeatherTemp] = useState('30'); // Ambient temperature in C
  const [activityHrs, setActivityHrs] = useState('1.5');
  const [sleepHrs, setSleepHrs] = useState('7.5');
  const [customAmount, setCustomAmount] = useState('');

  const [calculatedGoal, setCalculatedGoal] = useState(dailyWaterTarget);
  
  // Goals & Streak Store bindings
  const { currentStreak, badges: storeBadges } = useGoalsStore();

  // Recalculate daily water goal based on inputs
  useEffect(() => {
    const baseGoal = 2000; // base ml
    const w = parseFloat(weight) || 70;
    const temp = parseFloat(weatherTemp) || 25;
    const act = parseFloat(activityHrs) || 1.0;
    
    // Weight factor: 35ml per kg
    const weightAddition = w * 35;
    // Activity factor: 500ml per hour of sweat
    const activityAddition = act * 500;
    // Temp factor: 100ml per degree above 22C
    const tempAddition = Math.max(0, temp - 22) * 100;

    const total = Math.round(baseGoal + weightAddition * 0.3 + activityAddition + tempAddition);
    setCalculatedGoal(total);
  }, [weight, weatherTemp, activityHrs]);

  const handleApplyCalculatedGoal = () => {
    setDailyTarget(calculatedGoal);
    showToast(`Daily water target updated to ${calculatedGoal}ml!`, 'success');
  };

  const handleQuickAdd = (amount: number) => {
    logWater(amount);
    showToast(`Logged +${amount}ml water!`, 'success');
  };

  const handleCustomAdd = () => {
    const amt = parseInt(customAmount);
    if (amt > 0) {
      logWater(amt);
      showToast(`Logged +${amt}ml water!`, 'success');
      setCustomAmount('');
    } else {
      showToast('Please enter a valid amount.', 'error');
    }
  };

  // Gamification badge helpers
  const getBadgeIcon = (iconName: string) => {
    if (iconName === 'Flame') return Flame;
    if (iconName === 'Award') return Award;
    if (iconName === 'Moon') return ShieldCheck;
    return Sparkles;
  };

  const getTierColor = (tier: string) => {
    if (tier === 'platinum') return '#E5E7EB';
    if (tier === 'gold') return '#FFD700';
    if (tier === 'silver') return '#C0C0C0';
    return '#CD7F32';
  };

  // Progress Calculations
  const progressPercent = Math.min(100, Math.round((currentIntake / (dailyWaterTarget || 2500)) * 100));
  const remaining = Math.max(0, (dailyWaterTarget || 2500) - currentIntake);

  // SVG circle progress
  const radius = 55;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const inputBg = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>Hydration Planner</Text>
            <Text style={styles.subtitle}>Smart intake calculations tuned to environment & biometrics</Text>
          </View>
          <View style={styles.streakWrapper}>
            <Flame size={16} color="#FFAD33" fill="#FFAD33" />
            <Text style={[styles.streakText, { color: '#FFAD33' }]}>{currentStreak} Day Streak</Text>
          </View>
        </View>

        <View style={isDesktop ? styles.desktopGrid : styles.mobileGrid}>
          
          {/* COLUMN 1: Biometric Inputs & Calculations */}
          <View style={styles.leftCol}>
            
            {/* Dossier Inputs Card */}
            <GlassCard style={styles.dossierCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Biometrics Dossier Inputs</Text>
              
              <View style={styles.inputsGrid}>
                {[
                  { label: 'Weight (kg)', val: weight, set: setWeight },
                  { label: 'Age (yrs)', val: age, set: setAge },
                  { label: 'Temp Weather (°C)', val: weatherTemp, set: setWeatherTemp },
                  { label: 'Activity Target (hrs)', val: activityHrs, set: setActivityHrs },
                  { label: 'Sleep Target (hrs)', val: sleepHrs, set: setSleepHrs }
                ].map((item, idx) => (
                  <View key={idx} style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>{item.label}</Text>
                    <TextInput
                      value={item.val}
                      onChangeText={item.set}
                      keyboardType="numeric"
                      style={[styles.textInput, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                onPress={handleApplyCalculatedGoal}
                style={[styles.calculatedCard, { backgroundColor: darkMode ? 'rgba(20, 184, 255, 0.08)' : '#F1F5F9', borderStyle: 'dashed', borderWidth: 1, borderColor: '#14B8FF' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.calcLabel}>Calculated Daily Fluid Goal (Click to Apply)</Text>
                <Text style={[styles.calcValue, { color: '#14B8FF' }]}>{calculatedGoal} ml</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Quick Add Intake */}
            <GlassCard style={styles.quickAddCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Log Fluid Intake</Text>
              
              <View style={styles.quickAddRow}>
                {[250, 500, 750].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => handleQuickAdd(amount)}
                    style={[styles.chipAdd, { backgroundColor: inputBg, borderColor: borderCol }]}
                    activeOpacity={0.7}
                  >
                    <Plus size={12} color="#00E5C3" style={{ marginRight: 4 }} />
                    <Text style={[styles.chipText, { color: textPrimary }]}>+{amount}ml</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Input */}
              <View style={styles.customAddWrapper}>
                <TextInput
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  placeholder="Custom amount (ml)..."
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  style={[styles.customInput, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                />
                <TouchableOpacity
                  onPress={handleCustomAdd}
                  style={styles.customAddBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customAddText}>Log</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Reminder Scheduling Card */}
            <GlassCard style={{ padding: 20, borderRadius: 24, marginBottom: 20 }} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Reminder Scheduling</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: textPrimary }}>Intake Reminders</Text>
                  <Text style={{ fontSize: 10, color: textSecondary }}>Receive desktop notifications to sip water</Text>
                </View>
                <Switch
                  value={remindersEnabled}
                  onValueChange={() => {
                    toggleReminders();
                    showToast(remindersEnabled ? "Intake reminders deactivated." : "Intake reminders activated!", "success");
                  }}
                  trackColor={{ false: '#3A506B', true: '#00E5C3' }}
                  thumbColor={remindersEnabled ? '#FFFFFF' : '#8E9AA6'}
                />
              </View>
              
              {remindersEnabled && (
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: textSecondary, marginBottom: 8 }}>REMINDER INTERVAL</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([30, 60, 120] as const).map((interval) => (
                      <TouchableOpacity
                        key={interval}
                        onPress={() => {
                          setReminderInterval(interval);
                          showToast(`Reminder interval set to ${interval} minutes.`, 'success');
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: reminderInterval === interval ? '#00E5C3' : borderCol,
                          backgroundColor: reminderInterval === interval ? 'rgba(0,229,195,0.08)' : 'transparent',
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: reminderInterval === interval ? '#00E5C3' : textSecondary }}>
                          {interval} min
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </GlassCard>
          </View>

          {/* COLUMN 2: Progress Progress Circle & Hourly Predictions */}
          <View style={styles.rightCol}>
            
            {/* Progress Visualization */}
            <GlassCard style={styles.progressCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Fluid Target Progress</Text>
              
              <View style={styles.progressRow}>
                <View style={styles.ringWrapper}>
                  <Svg width={140} height={140}>
                    <Circle
                      cx={70}
                      cy={70}
                      r={radius}
                      stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    <Circle
                      cx={70}
                      cy={70}
                      r={radius}
                      stroke="#14B8FF"
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform="rotate(-90 70 70)"
                    />
                  </Svg>
                  <View style={styles.ringTextWrapper}>
                    <Text style={[styles.ringValue, { color: textPrimary }]}>{progressPercent}%</Text>
                    <Text style={styles.ringLabel}>Intake</Text>
                  </View>
                </View>

                <View style={styles.progressStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Current Intake</Text>
                    <Text style={[styles.statValue, { color: '#14B8FF' }]}>{currentIntake} ml</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Remaining Goal</Text>
                    <Text style={[styles.statValue, { color: textPrimary }]}>{remaining} ml</Text>
                  </View>
                </View>
              </View>

              {/* Recommendations Box */}
              <View style={[styles.recsBox, { borderTopColor: borderCol }]}>
                <Sparkles size={14} color="#FFAD33" style={{ marginRight: 8 }} />
                <Text style={[styles.recsText, { color: textPrimary }]}>
                  AI Advice: <Text style={{ color: '#FFAD33', fontWeight: '800' }}>Drink now</Text>. Sweat losses elevated due to weather temperature ({weatherTemp}°C).
                </Text>
              </View>
            </GlassCard>

            {/* Hourly Hydration Line Chart */}
            <GlassCard style={styles.chartCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Hourly Hydration Forecast (8 hr)</Text>
              
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
                  
                  {/* X and Y labels */}
                  <SvgText x={25} y={44} fill={textSecondary} fontSize={7} fontWeight="700" textAnchor="end">100%</SvgText>
                  <SvgText x={25} y={84} fill={textSecondary} fontSize={7} fontWeight="700" textAnchor="end">70%</SvgText>
                  <SvgText x={25} y={124} fill={textSecondary} fontSize={7} fontWeight="700" textAnchor="end">40%</SvgText>

                  {/* Hourly forecast points path */}
                  <Path
                    d="M 40 45 L 80 50 L 120 70 L 160 85 L 200 60 L 240 48 L 280 40 L 320 50"
                    fill="transparent"
                    stroke="#14B8FF"
                    strokeWidth={3}
                  />

                  {/* Nodes */}
                  {[
                    { x: 40, y: 45, val: '10 AM' },
                    { x: 80, y: 50, val: '11 AM' },
                    { x: 120, y: 70, val: '12 PM' },
                    { x: 160, y: 85, val: '1 PM' },
                    { x: 200, y: 60, val: '2 PM' },
                    { x: 240, y: 48, val: '3 PM' },
                    { x: 280, y: 40, val: '4 PM' },
                    { x: 320, y: 50, val: '5 PM' }
                  ].map((pt, idx) => (
                    <G key={idx}>
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={4}
                        fill="#050B18"
                        stroke="#14B8FF"
                        strokeWidth={2}
                      />
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
              </View>
            </GlassCard>

            {/* Achievements Cards */}
            <GlassCard style={styles.badgesCard} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Streaks & Badges Achievements</Text>
              <View style={styles.badgesGrid}>
                {storeBadges.map((b) => {
                  const Icon = getBadgeIcon(b.iconName);
                  const badgeColor = getTierColor(b.tier);
                  return (
                    <View 
                      key={b.id} 
                      style={[
                        styles.badgeItem, 
                        { 
                          borderColor: borderCol, 
                          opacity: 1,
                          backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
                        }
                      ]}
                    >
                      <View style={[styles.badgeIconContainer, { backgroundColor: badgeColor + '15' }]}>
                        <Icon size={16} color={badgeColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.badgeName, { color: textPrimary }]}>{b.name}</Text>
                        <Text style={styles.badgeDesc}>{b.description}</Text>
                      </View>
                    </View>
                  );
                })}
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
  streakWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 173, 51, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 173, 51, 0.2)',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
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
  dossierCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
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
  inputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inputWrapper: {
    width: '48%',
    marginBottom: 14,
  },
  inputLabel: {
    color: '#8E9AA6',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  calculatedCard: {
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  calcLabel: {
    color: '#8E9AA6',
    fontSize: 9,
    fontWeight: '700',
  },
  calcValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  quickAddCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    width: '30%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  customAddWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '700',
  },
  customAddBtn: {
    backgroundColor: '#00E5C3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  customAddText: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '800',
  },
  progressCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  ringLabel: {
    color: '#8E9AA6',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  progressStats: {
    marginLeft: 24,
    flex: 1,
  },
  statItem: {
    marginBottom: 14,
  },
  statLabel: {
    color: '#8E9AA6',
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  recsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 14,
  },
  recsText: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
    lineHeight: 14,
  },
  chartCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  chartWrapper: {
    marginTop: 10,
  },
  badgesCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeDesc: {
    color: '#8E9AA6',
    fontSize: 8,
    marginTop: 2,
    lineHeight: 10,
  },
});
