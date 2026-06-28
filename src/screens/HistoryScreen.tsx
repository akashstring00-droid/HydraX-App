import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Switch, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore, DiarrheaLog } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { GlassCard } from '../components/GlassCard';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  Activity, 
  AlertTriangle, 
  Smile, 
  Calendar,
  Droplet,
  Edit2,
  Search,
  X
} from 'lucide-react-native';
import Svg, { Rect, Line, Text as SvgText, Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HistoryScreen: React.FC = () => {
  const { logs: waterLogs, currentIntake, dailyWaterTarget, removeLog: removeWaterLog, updateLog: updateWaterLog } = useWaterStore();
  const { logs: diarrheaLogs, logSymptoms, deleteLog: deleteDiarrheaLog, editLog: editDiarrheaLog, recoveryScore } = useDiarrheaStore();
  const showToast = useToastStore((state) => state.showToast);

  const darkMode = useSettingsStore((state) => state.darkMode);
  const styles = getStyles(darkMode);

  // Search, filter and view mode states
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Water' | 'Symptoms'>('All');
  const [viewMode, setViewMode] = useState<'List' | 'Timeline'>('List');

  // Confirmation Delete modal state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'water' | 'symptom' } | null>(null);

  // Edit Log state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    id: string;
    type: 'water' | 'symptom';
    amount?: number; // for water
    stoolType?: number; // for symptom
    frequency?: string; // for symptom
    cramping?: 'None' | 'Mild' | 'Moderate' | 'Severe'; // for symptom
    fever?: boolean;
    nausea?: boolean;
    bloodInStool?: boolean;
  } | null>(null);

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

  const promptDelete = (id: string, type: 'water' | 'symptom') => {
    setDeleteTarget({ id, type });
    setShowConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'water') {
      removeWaterLog(deleteTarget.id);
      showToast('Water log entry deleted.', 'info');
    } else {
      deleteDiarrheaLog(deleteTarget.id);
      showToast('Symptom log entry deleted.', 'info');
    }
    setShowConfirmDelete(false);
    setDeleteTarget(null);
  };

  const startEdit = (log: any) => {
    if (log.logType === 'water') {
      setEditTarget({
        id: log.id,
        type: 'water',
        amount: log.amount,
      });
    } else {
      setEditTarget({
        id: log.id,
        type: 'symptom',
        stoolType: log.stoolType,
        frequency: String(log.frequency),
        cramping: log.cramping,
        fever: log.fever,
        nausea: log.nausea,
        bloodInStool: log.bloodInStool,
      });
    }
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editTarget) return;
    if (editTarget.type === 'water') {
      const amt = editTarget.amount ?? 0;
      if (amt <= 0) {
        showToast('Please enter a valid water amount.', 'error');
        return;
      }
      updateWaterLog(editTarget.id, amt);
      showToast('Water entry updated successfully.', 'success');
    } else {
      const freqNum = parseInt(editTarget.frequency || '0', 10);
      if (isNaN(freqNum) || freqNum <= 0) {
        showToast('Please enter a valid daily frequency count.', 'error');
        return;
      }
      editDiarrheaLog(editTarget.id, {
        stoolType: editTarget.stoolType,
        frequency: freqNum,
        cramping: editTarget.cramping,
        fever: editTarget.fever,
        nausea: editTarget.nausea,
        bloodInStool: editTarget.bloodInStool,
      });
      showToast('Symptom entry updated successfully.', 'success');
    }
    setShowEditModal(false);
    setEditTarget(null);
  };

  // Combine all logs for timeline
  const combinedLogs = [
    ...waterLogs.map(log => ({ ...log, logType: 'water' as const })),
    ...diarrheaLogs.map(log => ({ ...log, logType: 'symptom' as const }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredLogs = combinedLogs.filter(log => {
    // Filter by type
    if (filterType === 'Water' && log.logType !== 'water') return false;
    if (filterType === 'Symptoms' && log.logType !== 'symptom') return false;

    // Filter by search text
    if (searchText.trim() === '') return true;
    
    if (log.logType === 'water') {
      return `water intake ${log.amount}ml`.toLowerCase().includes(searchText.toLowerCase());
    } else {
      const desc = getBristolDescription(log.stoolType) || '';
      return `bristol type ${log.stoolType} ${log.severity} severity ${log.cramping} cramping ${desc}`
        .toLowerCase()
        .includes(searchText.toLowerCase());
    }
  });

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

        {/* Search & Filter Bar */}
        <GlassCard style={{ padding: 12, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10 }}>
              <Search size={14} color={darkMode ? '#8E9AA6' : '#64748B'} style={{ marginRight: 6 }} />
              <TextInput
                placeholder="Search history..."
                placeholderTextColor={darkMode ? '#8E9AA6' : '#64748B'}
                value={searchText}
                onChangeText={setSearchText}
                style={{
                  flex: 1,
                  height: 36,
                  color: darkMode ? '#FFFFFF' : '#0F172A',
                  fontSize: 12,
                  fontWeight: '600',
                }}
              />
            </View>
            
            {/* View Mode Toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 2 }}>
              {(['List', 'Timeline'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: viewMode === mode ? '#00E5C3' : 'transparent',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: viewMode === mode ? '#050B18' : (darkMode ? '#8E9AA6' : '#64748B') }}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['All', 'Water', 'Symptoms'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setFilterType(type)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: filterType === type ? 'rgba(0, 229, 195, 0.1)' : 'transparent',
                  borderColor: filterType === type ? '#00E5C3' : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'),
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: filterType === type ? '#00E5C3' : (darkMode ? '#8E9AA6' : '#64748B') }}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
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

        {/* Toggle List/Timeline views */}
        {viewMode === 'Timeline' ? (
          <View style={{ paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: darkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0', marginLeft: 10, marginBottom: 32 }}>
            {filteredLogs.length === 0 ? (
              <Text style={{ color: darkMode ? '#8E9AA6' : '#64748B', fontSize: 12, paddingLeft: 12 }}>No logs found matching filters.</Text>
            ) : (
              filteredLogs.map((log) => {
                const isWater = log.logType === 'water';
                const isWarning = !isWater && (log.stoolType >= 6 || log.severity === 'Severe');
                const warningBorder = isWarning ? { borderColor: 'rgba(255, 77, 109, 0.25)', borderLeftWidth: 3, borderLeftColor: '#FF4D6D' } : {};
                
                return (
                  <View key={log.id} style={{ position: 'relative', paddingLeft: 20, marginBottom: 20 }}>
                    {/* Timeline Node dot */}
                    <View style={{
                      position: 'absolute',
                      left: -27,
                      top: 14,
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: isWater ? '#14B8FF' : (isWarning ? '#FF4D6D' : '#00E5C3'),
                      borderWidth: 2,
                      borderColor: darkMode ? '#050B18' : '#F8FAFC'
                    }} />

                    <GlassCard style={[{ padding: 14, borderRadius: 16 }, warningBorder]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            {isWater ? (
                              <Droplet size={12} color="#14B8FF" fill="#14B8FF" />
                            ) : (
                              <AlertTriangle size={12} color={isWarning ? '#FF4D6D' : '#00E5C3'} />
                            )}
                            <Text style={{ fontSize: 12, fontWeight: '800', color: darkMode ? '#FFFFFF' : '#0F172A' }}>
                              {isWater ? `Water Intake: +${log.amount} ml` : `Bowel Event: Bristol Type ${log.stoolType}`}
                            </Text>
                          </View>

                          <Text style={{ fontSize: 10, color: darkMode ? '#8E9AA6' : '#64748B' }}>
                            {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>

                          {!isWater && (
                            <View style={{ marginTop: 6 }}>
                              <Text style={{ fontSize: 11, color: darkMode ? 'rgba(255,255,255,0.7)' : '#0F172A' }}>
                                Frequency: {log.frequency}x • Cramping: {log.cramping} • Loss: -{log.fluidLossEstimate}ml
                              </Text>
                              {(log.fever || log.nausea || log.bloodInStool) && (
                                <Text style={{ fontSize: 10, color: '#FF4D6D', marginTop: 2 }}>
                                  {log.fever && '🌡️ Fever '} {log.nausea && '🤢 Nausea '} {log.bloodInStool && '⚠️ Blood Stool'}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, marginLeft: 10 }}>
                          <TouchableOpacity onPress={() => startEdit(log)} style={{ padding: 4 }}>
                            <Edit2 size={12} color={darkMode ? '#8E9AA6' : '#64748B'} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => promptDelete(log.id, log.logType)} style={{ padding: 4 }}>
                            <Trash2 size={12} color="#FF4D6D" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassCard>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* List View */
          <View>
            {/* Water logs listing */}
            {(filterType === 'All' || filterType === 'Water') && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.listHeaderTitle}>Today's Water Log</Text>
                {waterLogs.filter(log => searchText === '' || `water intake ${log.amount}ml`.toLowerCase().includes(searchText.toLowerCase())).length === 0 ? (
                  <GlassCard style={styles.emptyListCard}>
                    <Droplet size={24} color={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} />
                    <Text style={styles.emptyListText}>No matching water logs found.</Text>
                  </GlassCard>
                ) : (
                  waterLogs.filter(log => searchText === '' || `water intake ${log.amount}ml`.toLowerCase().includes(searchText.toLowerCase())).map((log) => (
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
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity onPress={() => startEdit({ ...log, logType: 'water' })} style={{ padding: 4 }}>
                            <Edit2 size={12} color={darkMode ? '#8E9AA6' : '#64748B'} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => promptDelete(log.id, 'water')} style={{ padding: 4 }}>
                            <Trash2 size={12} color="#FF4D6D" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassCard>
                  ))
                )}
              </View>
            )}

            {/* Diarrhea & Bowel logs listing */}
            {(filterType === 'All' || filterType === 'Symptoms') && (
              <View style={{ marginBottom: 32 }}>
                <Text style={styles.listHeaderTitle}>Bowel & Symptom Log</Text>
                {diarrheaLogs.filter(log => {
                  if (searchText === '') return true;
                  const desc = getBristolDescription(log.stoolType) || '';
                  return `bristol type ${log.stoolType} ${log.severity} severity ${log.cramping} cramping ${desc}`
                    .toLowerCase()
                    .includes(searchText.toLowerCase());
                }).length === 0 ? (
                  <GlassCard style={styles.emptyListCard}>
                    <Activity size={24} color={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} />
                    <Text style={styles.emptyListText}>No matching bowel symptoms found.</Text>
                  </GlassCard>
                ) : (
                  diarrheaLogs.filter(log => {
                    if (searchText === '') return true;
                    const desc = getBristolDescription(log.stoolType) || '';
                    return `bristol type ${log.stoolType} ${log.severity} severity ${log.cramping} cramping ${desc}`
                      .toLowerCase()
                      .includes(searchText.toLowerCase());
                  }).map((log) => {
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
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, justifyContent: 'flex-end' }}>
                              <TouchableOpacity onPress={() => startEdit({ ...log, logType: 'symptom' })} style={{ padding: 4 }}>
                                <Edit2 size={12} color={darkMode ? '#8E9AA6' : '#64748B'} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => promptDelete(log.id, 'symptom')} style={{ padding: 4 }}>
                                <Trash2 size={12} color="#FF4D6D" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </GlassCard>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Confirmation Delete modal */}
      {showConfirmDelete && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <GlassCard style={{ width: '90%', maxWidth: 360, padding: 20, borderRadius: 20 }} borderColor="rgba(255, 77, 109, 0.3)">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <AlertTriangle size={18} color="#FF4D6D" />
              <Text style={{ fontSize: 14, fontWeight: '900', color: darkMode ? '#FFFFFF' : '#0F172A' }}>Confirm Delete</Text>
            </View>
            <Text style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : '#64748B', fontSize: 12, lineHeight: 18, marginBottom: 20 }}>
              Are you sure you want to permanently delete this log entry? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowConfirmDelete(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }}
              >
                <Text style={{ color: darkMode ? '#FFFFFF' : '#0F172A', fontSize: 11, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FF4D6D' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      )}

      {/* Edit Log Modal */}
      {showEditModal && editTarget && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 99999 }}>
          <GlassCard style={{ width: '90%', maxWidth: 400, padding: 20, borderRadius: 20 }} borderColor="rgba(0, 229, 195, 0.3)">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit2 size={16} color="#00E5C3" />
                <Text style={{ fontSize: 14, fontWeight: '900', color: darkMode ? '#FFFFFF' : '#0F172A' }}>
                  Edit {editTarget.type === 'water' ? 'Water Intake' : 'Symptom Entry'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={16} color={darkMode ? '#FFFFFF' : '#0F172A'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, marginBottom: 20 }}>
              {editTarget.type === 'water' ? (
                <View>
                  <Text style={styles.formSectionLabel}>Amount (ml):</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={String(editTarget.amount || '')}
                    onChangeText={(val) => setEditTarget({ ...editTarget, amount: parseInt(val, 10) || 0 })}
                    style={styles.formInput}
                  />
                </View>
              ) : (
                <View>
                  {/* Bristol Scale */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formSectionLabel}>Bristol Stool Type ({editTarget.stoolType}):</Text>
                    <View style={styles.bristolTogglesRow}>
                      {[1, 2, 3, 4, 5, 6, 7].map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setEditTarget({ ...editTarget, stoolType: type })}
                          style={[
                            styles.bristolBtn,
                            editTarget.stoolType === type ? styles.bristolBtnActive : styles.bristolBtnInactive
                          ]}
                        >
                          <Text style={[styles.bristolBtnText, { color: editTarget.stoolType === type ? '#050B18' : (darkMode ? '#FFFFFF' : '#0F172A') }]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Frequency */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formSectionLabel}>Frequency Today:</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={editTarget.frequency}
                      onChangeText={(val) => setEditTarget({ ...editTarget, frequency: val })}
                      style={styles.formInput}
                    />
                  </View>

                  {/* Cramping */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.formSectionLabel}>Cramping Level:</Text>
                    <View style={styles.crampingRow}>
                      {(['None', 'Mild', 'Moderate', 'Severe'] as const).map((level) => (
                        <TouchableOpacity
                          key={level}
                          onPress={() => setEditTarget({ ...editTarget, cramping: level })}
                          style={[
                            styles.crampingBtn,
                            editTarget.cramping === level ? styles.crampingBtnActive : styles.crampingBtnInactive
                          ]}
                        >
                          <Text style={styles.crampingBtnText}>{level}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Switch toggles */}
                  <View style={styles.switchSection}>
                    <View style={styles.switchItem}>
                      <Text style={styles.formSectionLabel}>Fever?</Text>
                      <Switch
                        value={editTarget.fever}
                        onValueChange={(val) => setEditTarget({ ...editTarget, fever: val })}
                        trackColor={{ false: '#3A506B', true: '#FF4D6D' }}
                        thumbColor={editTarget.fever ? '#FFFFFF' : '#8E9AA6'}
                      />
                    </View>
                    <View style={styles.switchItem}>
                      <Text style={styles.formSectionLabel}>Nausea?</Text>
                      <Switch
                        value={editTarget.nausea}
                        onValueChange={(val) => setEditTarget({ ...editTarget, nausea: val })}
                        trackColor={{ false: '#3A506B', true: '#FFAD33' }}
                        thumbColor={editTarget.nausea ? '#FFFFFF' : '#8E9AA6'}
                      />
                    </View>
                    <View style={styles.switchItem}>
                      <Text style={[styles.formSectionLabel, { color: '#FF4D6D' }]}>Blood in Stool?</Text>
                      <Switch
                        value={editTarget.bloodInStool}
                        onValueChange={(val) => setEditTarget({ ...editTarget, bloodInStool: val })}
                        trackColor={{ false: '#3A506B', true: '#FF4D6D' }}
                        thumbColor={editTarget.bloodInStool ? '#FFFFFF' : '#8E9AA6'}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0' }}
              >
                <Text style={{ color: darkMode ? '#FFFFFF' : '#0F172A', fontSize: 11, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#00E5C3' }}
              >
                <Text style={{ color: '#050B18', fontSize: 11, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
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
