import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore, DiarrheaLog } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from '../components/GlassCard';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Activity, 
  AlertTriangle, 
  Smile, 
  Calendar,
  Droplet
} from 'lucide-react-native';
import Svg, { Rect, Line, Text as SvgText, Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HistoryScreen: React.FC = () => {
  const { logs: waterLogs, currentIntake, dailyWaterTarget, removeLog: removeWaterLog } = useWaterStore();
  const { logs: diarrheaLogs, logSymptoms, deleteLog: deleteDiarrheaLog, recoveryScore } = useDiarrheaStore();

  const darkMode = useSettingsStore((state) => state.darkMode);
  const styles = getStyles(darkMode);

  // Bowel symptom log state
  const [stoolType, setStoolType] = useState<number>(4); // Normal by default
  const [frequency, setFrequency] = useState<string>('1');
  const [cramping, setCramping] = useState<'None' | 'Mild' | 'Moderate' | 'Severe'>('None');
  const [fever, setFever] = useState<boolean>(false);
  const [nausea, setNausea] = useState<boolean>(false);
  const [bloodInStool, setBloodInStool] = useState<boolean>(false);
  const [showAddLog, setShowAddLog] = useState<boolean>(false);

  const handleAddSymptomLog = () => {
    const freqNum = parseInt(frequency, 10);
    if (isNaN(freqNum) || freqNum <= 0) {
      Alert.alert('Invalid Entry', 'Please enter a valid daily frequency count.');
      return;
    }

    logSymptoms({
      stoolType,
      frequency: freqNum,
      cramping,
      fever,
      nausea,
      bloodInStool
    });

    // Reset log form state
    setStoolType(4);
    setFrequency('1');
    setCramping('None');
    setFever(false);
    setNausea(false);
    setBloodInStool(false);
    setShowAddLog(false);

    Alert.alert('Symptoms Logged', 'Vitals and recovery metrics have been successfully updated.');
  };

  // Get Bristol Stool description
  const getBristolDescription = (type: number) => {
    switch (type) {
      case 1: return 'Separate hard lumps (Severe constipation)';
      case 2: return 'Lumpy and sausage-like (Mild constipation)';
      case 3: return 'Sausage shape with cracks (Normal)';
      case 4: return 'Smooth, soft sausage (Ideal)';
      case 5: return 'Soft blobs with clear-cut edges (Lacking fiber)';
      case 6: return 'Mushy pieces, ragged edges (Mild Diarrhea)';
      case 7: return 'Watery, no solid pieces (Severe Diarrhea)';
      default: return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title Banner */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.bannerSubtitle}>Logs & Symptoms</Text>
          <Text style={styles.bannerTitle}>History Journal</Text>
        </View>

        {/* Recovery Score card */}
        <GlassCard style={styles.recoveryCard} borderColor={darkMode ? 'rgba(0,229,195,0.1)' : 'rgba(0,229,195,0.15)'}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.recoveryLabel}>Digestive Recovery</Text>
              <Text style={styles.recoveryStatusText}>Status: {recoveryScore > 85 ? 'Optimal' : recoveryScore > 65 ? 'Stabilizing' : 'At Risk'}</Text>
              <Text style={styles.recoveryDescText}>
                The score represents bowel health based on symptom inputs. Hydrate actively to recover faster.
              </Text>
            </View>
            <View style={styles.recoveryBadge}>
              <Text style={styles.recoveryBadgeScore}>{recoveryScore}</Text>
              <Text style={styles.recoveryBadgeLabel}>INDEX</Text>
            </View>
          </View>
        </GlassCard>

        {/* Bristol Stool Trend Chart */}
        <GlassCard style={styles.chartBlockCard}>
          <Text style={styles.chartBlockTitle}>Bristol Stool Trend (Last 7 logs)</Text>
          {diarrheaLogs.length < 2 ? (
            <View style={styles.emptyChartContainer}>
              <Activity size={18} color={darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.25)'} />
              <Text style={styles.emptyChartText}>
                Log bowel symptoms over multiple days to{'\n'}populate historical gut health trends.
              </Text>
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              {(() => {
                const chartHeight = 85;
                const chartWidth = SCREEN_WIDTH - 72;
                
                const trendLogs = [...diarrheaLogs].slice(0, 7).reverse();
                const xSpacing = chartWidth / (trendLogs.length - 1);
                
                let linePath = '';
                trendLogs.forEach((log, i) => {
                  const x = i * xSpacing;
                  const y = chartHeight - ((log.stoolType - 1) / 6) * (chartHeight - 20) - 10;
                  
                  if (i === 0) linePath = `M ${x} ${y}`;
                  else linePath += ` L ${x} ${y}`;
                });

                return (
                  <Svg width={chartWidth} height={chartHeight}>
                    {/* Normal range boundary band */}
                    <Line
                      x1={0}
                      y1={chartHeight - ((4 - 1) / 6) * (chartHeight - 20) - 10}
                      x2={chartWidth}
                      y2={chartHeight - ((4 - 1) / 6) * (chartHeight - 20) - 10}
                      stroke="rgba(0, 255, 178, 0.25)"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                    {/* Diarrhea range boundary band */}
                    <Line
                      x1={0}
                      y1={chartHeight - ((6 - 1) / 6) * (chartHeight - 20) - 10}
                      x2={chartWidth}
                      y2={chartHeight - ((6 - 1) / 6) * (chartHeight - 20) - 10}
                      stroke="rgba(255, 77, 109, 0.25)"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                    
                    {/* Trend Line */}
                    <Path
                      d={linePath}
                      fill="transparent"
                      stroke="#00E5C3"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />

                    {/* Nodes */}
                    {trendLogs.map((log, i) => {
                      const x = i * xSpacing;
                      const y = chartHeight - ((log.stoolType - 1) / 6) * (chartHeight - 20) - 10;
                      const isWarning = log.stoolType >= 6;
                      return (
                        <Circle
                          key={i}
                          cx={x}
                          cy={y}
                          r={3.5}
                          fill={isWarning ? '#FF4D6D' : '#00FFB2'}
                        />
                      );
                    })}
                  </Svg>
                );
              })()}
              <View style={styles.chartFootLabels}>
                <Text style={styles.looseLabel}>Loose / Watery</Text>
                <Text style={styles.optimalLabel}>Optimal (Type 4)</Text>
                <Text style={styles.constipLabel}>Constipated</Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Log Toggle Button */}
        <TouchableOpacity
          onPress={() => setShowAddLog(!showAddLog)}
          style={[styles.toggleLogBtn, styles.shadowBtn]}
        >
          <Plus size={16} color="#050B18" strokeWidth={3} />
          <Text style={styles.toggleLogBtnText}>
            {showAddLog ? 'Close Symptom Logger' : 'Log Bowel Symptoms'}
          </Text>
        </TouchableOpacity>

        {/* Symptom Logger Form */}
        {showAddLog && (
          <GlassCard style={styles.formCard} borderColor="rgba(255, 173, 51, 0.2)">
            <Text style={styles.formCardTitle}>Log Bowel Event</Text>
            
            {/* Bristol Stool Chart Scale */}
            <View style={{ marginBottom: 20 }}>
              <View style={styles.formLabelRow}>
                <Text style={styles.formSectionLabel}>Bristol Stool Scale:</Text>
                <Text style={styles.formValueHighlight}>Type {stoolType}</Text>
              </View>
              
              {/* Scale Toggles */}
              <View style={styles.bristolTogglesRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setStoolType(type)}
                    style={[
                      styles.bristolBtn,
                      stoolType === type 
                        ? styles.bristolBtnActive 
                        : styles.bristolBtnInactive
                    ]}
                  >
                    <Text style={[
                      styles.bristolBtnText,
                      { color: stoolType === type ? '#050B18' : (darkMode ? '#FFFFFF' : '#0F172A') }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.bristolDescText}>
                {getBristolDescription(stoolType)}
              </Text>
            </View>

            {/* Frequency input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.formSectionLabel}>Bowel Movements Today:</Text>
              <TextInput
                keyboardType="numeric"
                value={frequency}
                onChangeText={setFrequency}
                style={styles.formInput}
                placeholder="e.g. 1"
                placeholderTextColor={darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)'}
              />
            </View>

            {/* Cramping Selector */}
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.formSectionLabel}>Abdominal Cramping:</Text>
              <View style={styles.crampingRow}>
                {(['None', 'Mild', 'Moderate', 'Severe'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setCramping(level)}
                    style={[
                      styles.crampingBtn,
                      cramping === level 
                        ? styles.crampingBtnActive 
                        : styles.crampingBtnInactive
                    ]}
                  >
                    <Text style={styles.crampingBtnText}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Switch Toggles */}
            <View style={styles.switchSection}>
              <View style={styles.switchItem}>
                <Text style={styles.formSectionLabel}>Experiencing Fever?</Text>
                <Switch
                  value={fever}
                  onValueChange={setFever}
                  trackColor={{ false: '#3A506B', true: '#FF4D6D' }}
                  thumbColor={fever ? '#FFFFFF' : '#8E9AA6'}
                />
              </View>

              <View style={styles.switchItem}>
                <Text style={styles.formSectionLabel}>Experiencing Nausea?</Text>
                <Switch
                  value={nausea}
                  onValueChange={setNausea}
                  trackColor={{ false: '#3A506B', true: '#FFAD33' }}
                  thumbColor={nausea ? '#FFFFFF' : '#8E9AA6'}
                />
              </View>

              <View style={styles.switchItem}>
                <Text style={[styles.formSectionLabel, { color: '#FF4D6D' }]}>Blood in Stool?</Text>
                <Switch
                  value={bloodInStool}
                  onValueChange={setBloodInStool}
                  trackColor={{ false: '#3A506B', true: '#FF4D6D' }}
                  thumbColor={bloodInStool ? '#FFFFFF' : '#8E9AA6'}
                />
              </View>
            </View>

            {/* Save Log */}
            <TouchableOpacity
              onPress={handleAddSymptomLog}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>Submit Symptoms Log</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Water logs listing */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.listHeaderTitle}>Today's Water Log</Text>
          {waterLogs.length === 0 ? (
            <GlassCard style={styles.emptyListCard}>
              <Droplet size={24} color={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} />
              <Text style={styles.emptyListText}>No water intake logged yet today.</Text>
            </GlassCard>
          ) : (
            waterLogs.map((log) => (
              <GlassCard key={log.id} style={styles.logListItem}>
                <View style={styles.listItemRow}>
                  <View style={styles.listItemLeft}>
                    <View style={styles.itemIconContainer}>
                      <Droplet size={14} color="#14B8FF" fill="#14B8FF" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.logItemBold}>+{log.amount} ml</Text>
                      <Text style={styles.logItemSmall}>
                        Logged at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeWaterLog(log.id)} style={styles.trashBtn}>
                    <Trash2 size={12} color="#FF4D6D" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        {/* Diarrhea & Bowel logs listing */}
        <View style={{ marginBottom: 32 }}>
          <Text style={styles.listHeaderTitle}>Bowel & Symptom Log</Text>
          {diarrheaLogs.length === 0 ? (
            <GlassCard style={styles.emptyListCard}>
              <Activity size={24} color={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} />
              <Text style={styles.emptyListText}>No bowel symptoms logged recently.</Text>
            </GlassCard>
          ) : (
            diarrheaLogs.map((log) => {
              const isWarning = log.stoolType >= 6 || log.severity === 'Severe';
              const warningBorder = isWarning ? { borderColor: 'rgba(255, 77, 109, 0.25)', borderLeftWidth: 3, borderLeftColor: '#FF4D6D' } : {};
              
              return (
                <GlassCard 
                  key={log.id} 
                  style={[styles.logListItem, warningBorder]}
                >
                  <View style={styles.listItemRow}>
                    <View style={[styles.listItemLeft, { alignItems: 'flex-start' }]}>
                      <View style={[styles.itemIconContainer, { backgroundColor: isWarning ? 'rgba(255, 77, 109, 0.1)' : 'rgba(0, 229, 195, 0.1)' }]}>
                        <AlertTriangle size={14} color={isWarning ? '#FF4D6D' : '#00E5C3'} />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <View style={styles.badgeLabelRow}>
                          <Text style={styles.logItemBold}>Bristol Type {log.stoolType}</Text>
                          <View style={[styles.severityBadge, { backgroundColor: isWarning ? 'rgba(255, 77, 109, 0.1)' : 'rgba(0, 229, 195, 0.1)' }]}>
                            <Text style={[styles.severityBadgeText, { color: isWarning ? '#FF4D6D' : '#00E5C3' }]}>
                              {log.severity} Severity
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.logItemDesc}>
                          Frequency: {log.frequency}x • Cramping: {log.cramping}
                        </Text>
                        <Text style={styles.logItemIndicators}>
                          {log.fever && '🌡️ Fever '} {log.nausea && '🤢 Nausea '} {log.bloodInStool && '⚠️ Blood Stool'}
                        </Text>
                        <Text style={styles.logItemSmall}>
                          Logged at {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.listItemRight}>
                      <Text style={styles.fluidLossValue}>-{log.fluidLossEstimate}ml fluid</Text>
                      <TouchableOpacity 
                        onPress={() => deleteDiarrheaLog(log.id)} 
                        style={styles.trashBtn}
                      >
                        <Trash2 size={12} color="#FF4D6D" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              );
            })
          )}
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

  // Recovery Card
  recoveryCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recoveryLabel: {
    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recoveryStatusText: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  recoveryDescText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#334155',
    fontSize: 10,
    marginTop: 6,
    lineHeight: 14,
    fontWeight: '600',
  },
  recoveryBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 195, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recoveryBadgeScore: {
    color: '#00E5C3',
    fontSize: 22,
    fontWeight: '900',
  },
  recoveryBadgeLabel: {
    color: 'rgba(0, 229, 195, 0.6)',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Bristol Chart Block
  chartBlockCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  chartBlockTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyChartContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyChartText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkMode ? 'rgba(5, 11, 24, 0.35)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#E2E8F0',
    padding: 12,
    borderRadius: 16,
  },
  chartFootLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
    paddingTop: 8,
  },
  looseLabel: {
    color: '#FF4D6D',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  optimalLabel: {
    color: '#00FFB2',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  constipLabel: {
    color: '#FFAD33',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  // Toggle btn
  toggleLogBtn: {
    backgroundColor: '#00E5C3',
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleLogBtnText: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  shadowBtn: {
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },

  // Form styling
  formCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  formCardTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    borderBottomWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    paddingBottom: 8,
    marginBottom: 16,
  },
  formLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formSectionLabel: {
    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#334155',
    fontSize: 10,
    fontWeight: '800',
  },
  formValueHighlight: {
    color: '#00E5C3',
    fontSize: 11,
    fontWeight: '900',
  },
  bristolTogglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bristolBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bristolBtnActive: {
    backgroundColor: '#00E5C3',
    borderColor: '#00E5C3',
  },
  bristolBtnInactive: {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.1)',
  },
  bristolBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  bristolDescText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.45)' : '#64748B',
    fontSize: 9,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  formInput: {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.1)',
    color: darkMode ? '#FFFFFF' : '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
  },
  crampingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  crampingBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 4,
  },
  crampingBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  crampingBtnInactive: {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.1)',
  },
  crampingBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  switchSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#00FFB2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#050B18',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Lists view
  listHeaderTitle: {
    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  emptyListCard: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
  },
  emptyListText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
  },
  logListItem: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  listItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 184, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logItemBold: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  logItemSmall: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 8,
    marginTop: 2,
    fontWeight: '600',
  },
  trashBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 77, 109, 0.05)',
    borderRadius: 8,
  },

  // Bowel log details
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  severityBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  logItemDesc: {
    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#334155',
    fontSize: 9,
    marginTop: 2,
    fontWeight: '700',
  },
  logItemIndicators: {
    color: darkMode ? 'rgba(255, 255, 255, 0.45)' : '#64748B',
    fontSize: 8,
    marginTop: 2,
    fontWeight: '700',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  fluidLossValue: {
    color: '#FF4D6D',
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});
