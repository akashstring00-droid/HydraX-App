import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  FileText, 
  Download, 
  ShieldAlert, 
  Cpu, 
  Search, 
  AlertTriangle,
  User,
  Heart,
  Droplet,
  Moon,
  Star,
  Trash,
  Terminal,
  ChevronRight
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import Svg, { Path, Circle, Rect, Line, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { GlassCard } from '../components/GlassCard';

export const AdminDashboardScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const darkMode = useSettingsStore((state) => state.darkMode);
  const showToast = useToastStore((state) => state.showToast);
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'kpi' | 'users' | 'feedback' | 'errors' | 'system'>('kpi');
  const [searchQuery, setSearchQuery] = useState('');

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const loadFeedbacks = () => {
    try {
      const data = localStorage.getItem('hydrax-admin-feedbacks');
      setFeedbacks(data ? JSON.parse(data) : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadErrorLogs = () => {
    try {
      const data = localStorage.getItem('hydrax-error-logs');
      setErrorLogs(data ? JSON.parse(data) : []);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    loadFeedbacks();
    loadErrorLogs();

    if (typeof window !== 'undefined') {
      window.addEventListener('hydrax-new-feedback-submitted', loadFeedbacks);
      window.addEventListener('hydrax-new-error-logged', loadErrorLogs);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hydrax-new-feedback-submitted', loadFeedbacks);
        window.removeEventListener('hydrax-new-error-logged', loadErrorLogs);
      }
    };
  }, []);

  const handleClearFeedbacks = () => {
    const confirmWipe = window.confirm("Are you sure you want to clear the entire feedback vault?");
    if (confirmWipe) {
      localStorage.removeItem('hydrax-admin-feedbacks');
      loadFeedbacks();
      showToast("Feedback vault wiped.", "success");
    }
  };

  const handleClearErrors = () => {
    const confirmWipe = window.confirm("Are you sure you want to clear all logged software exceptions?");
    if (confirmWipe) {
      localStorage.removeItem('hydrax-error-logs');
      loadErrorLogs();
      showToast("Error logs journal cleared.", "success");
    }
  };

  const handleDeleteFeedback = (id: string) => {
    try {
      const updated = feedbacks.filter((f) => f.id !== id);
      localStorage.setItem('hydrax-admin-feedbacks', JSON.stringify(updated));
      loadFeedbacks();
      showToast("Feedback entry deleted.", "info");
    } catch (e) {
      showToast("Failed to delete feedback.", "error");
    }
  };

  // Mock Admin telemetry datasets
  const systemMetrics = {
    totalUsers: 1482,
    activeUsers24h: 914,
    dailyVisits: 3840,
    retentionRate: '94.8%',
    averageHydration: 86.4,
    averageHRV: 62.8,
    averageHR: 71.5,
    averageSleep: 81.2,
  };

  const usersList = [
    { id: '1', name: 'John Doe', email: 'john@gmail.com', hr: 72, hrv: 62, hydration: 90, risk: 'Low', status: 'Active' },
    { id: '2', name: 'Sarah Connor', email: 'sarah.c@gmail.com', hr: 98, hrv: 45, hydration: 62, risk: 'High', status: 'Active' },
    { id: '3', name: 'Alex Mercer', email: 'mercer@outlook.com', hr: 84, hrv: 55, hydration: 75, risk: 'Medium', status: 'Active' },
    { id: '4', name: 'Elena Fisher', email: 'elena@hydrax.io', hr: 64, hrv: 72, hydration: 95, risk: 'Low', status: 'Active' },
    { id: '5', name: 'Marcus Fenix', email: 'fenix.m@outlook.com', hr: 104, hrv: 38, hydration: 54, risk: 'High', status: 'Offline' },
    { id: '6', name: 'Chloe Frazer', email: 'chloe@frazer.net', hr: 78, hrv: 60, hydration: 88, risk: 'Low', status: 'Active' },
    { id: '7', name: 'Bruce Wayne', email: 'bruce@waynecorp.com', hr: 58, hrv: 85, hydration: 98, risk: 'Low', status: 'Active' },
  ];

  const handleSimulateAlert = (userName: string, level: 'warning' | 'critical') => {
    showToast(`Dispatched ${level} hydration advisory alert to ${userName}!`, level === 'critical' ? 'error' : 'info');
  };

  const handleExportCSV = () => {
    showToast('Compiling admin database report...', 'info');
    
    // Build CSV Content
    let csvContent = 'ID,Name,Email,Heart Rate (BPM),HRV (ms),Hydration Score (%),Dehydration Risk,Status\n';
    usersList.forEach(u => {
      csvContent += `${u.id},${u.name},${u.email},${u.hr},${u.hrv},${u.hydration},${u.risk},${u.status}\n`;
    });

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'hydrax_admin_users_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Users registry CSV downloaded successfully!', 'success');
    } else {
      showToast('CSV compilation complete! Stored locally.', 'success');
    }
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';
  const svgTrackColor = darkMode ? 'rgba(255, 255, 255, 0.04)' : '#E2E8F0';

  // Svg draw segments helper
  const drawLineChart = () => {
    const chartHeight = 160;
    const chartWidth = isDesktop ? 600 : width - 72;
    const paddingLeft = 32;
    const paddingBottom = 20;
    const graphWidth = chartWidth - paddingLeft - 16;
    const graphHeight = chartHeight - paddingBottom - 10;

    const dataset = [320, 480, 560, 410, 680, 790, 914]; // active users over past 7 days
    const maxVal = 1000;
    const xSpacing = graphWidth / (dataset.length - 1);

    let linePath = '';
    let areaPath = '';

    dataset.forEach((val, i) => {
      const x = paddingLeft + i * xSpacing;
      const y = graphHeight - (val / maxVal) * graphHeight + 10;

      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${graphHeight + 10} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }

      if (i === dataset.length - 1) {
        areaPath += ` L ${x} ${graphHeight + 10} Z`;
      }
    });

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#00E5C3" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#00E5C3" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* X Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = graphHeight * ratio + 10;
          return (
            <Line key={idx} x1={paddingLeft} y1={y} x2={chartWidth - 16} y2={y} stroke={svgTrackColor} strokeDasharray="3,3" />
          );
        })}

        {/* Areas */}
        <Path d={areaPath} fill="url(#activeGrad)" />
        {/* Line */}
        <Path d={linePath} stroke="#00E5C3" strokeWidth={2.5} fill="none" />

        {/* Data points */}
        {dataset.map((val, i) => {
          const x = paddingLeft + i * xSpacing;
          const y = graphHeight - (val / maxVal) * graphHeight + 10;
          return (
            <Circle key={i} cx={x} cy={y} r={4} fill="#050B18" stroke="#00E5C3" strokeWidth={2} />
          );
        })}
      </Svg>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Header Banner */}
        <View style={styles.header}>
          <View>
            <Text style={styles.bannerSubtitle}>OPERATIONAL OVERWATCH</Text>
            <Text style={[styles.bannerTitle, { color: textPrimary }]}>Hydrax Admin Console</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} activeOpacity={0.7}>
            <Download size={14} color="#050B18" style={{ marginRight: 6 }} />
            <Text style={styles.exportText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Admin Tab selector */}
        <View style={[styles.tabRow, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
          {(['kpi', 'users', 'feedback', 'errors', 'system'] as const).map((t) => {
            const labels = { 
              kpi: 'Analytics', 
              users: 'Vitals Stream', 
              feedback: 'User Feedbacks',
              errors: 'Error Logs',
              system: 'Console Controls' 
            };
            const isActive = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabBtnText, { color: isActive ? '#050B18' : textSecondary }]}>{labels[t]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECTION 1: ANALYTICS OVERVIEW */}
        {activeTab === 'kpi' && (
          <View style={styles.sectionContainer}>
            {/* KPI grid of 4 cards */}
            <View style={isDesktop ? styles.kpiGridDesktop : styles.kpiGridMobile}>
              
              {/* Card 1: Total registrations */}
              <GlassCard style={styles.kpiCard} borderColor={borderCol}>
                <View style={styles.kpiHeaderRow}>
                  <Users size={16} color="#14B8FF" />
                  <Text style={styles.kpiCardTitle}>Total Accounts</Text>
                </View>
                <Text style={[styles.kpiCardVal, { color: textPrimary }]}>{systemMetrics.totalUsers}</Text>
                <Text style={styles.kpiCardTrend}>↗ +12% this week</Text>
              </GlassCard>

              {/* Card 2: Active Users */}
              <GlassCard style={styles.kpiCard} borderColor={borderCol}>
                <View style={styles.kpiHeaderRow}>
                  <Activity size={16} color="#00E5C3" />
                  <Text style={styles.kpiCardTitle}>Active Users (24h)</Text>
                </View>
                <Text style={[styles.kpiCardVal, { color: textPrimary }]}>{systemMetrics.activeUsers24h}</Text>
                <Text style={styles.kpiCardTrend}>↗ +18% active coefficient</Text>
              </GlassCard>

              {/* Card 3: Daily visits */}
              <GlassCard style={styles.kpiCard} borderColor={borderCol}>
                <View style={styles.kpiHeaderRow}>
                  <Cpu size={16} color="#FFAD33" />
                  <Text style={styles.kpiCardTitle}>API Hits / Daily visits</Text>
                </View>
                <Text style={[styles.kpiCardVal, { color: textPrimary }]}>{systemMetrics.dailyVisits}</Text>
                <Text style={styles.kpiCardTrend}>→ Stable load profiles</Text>
              </GlassCard>

              {/* Card 4: Retention */}
              <GlassCard style={styles.kpiCard} borderColor={borderCol}>
                <View style={styles.kpiHeaderRow}>
                  <TrendingUp size={16} color="#7C3AED" />
                  <Text style={styles.kpiCardTitle}>User Retention</Text>
                </View>
                <Text style={[styles.kpiCardVal, { color: textPrimary }]}>{systemMetrics.retentionRate}</Text>
                <Text style={styles.kpiCardTrend}>↗ Industry peak benchmark</Text>
              </GlassCard>

            </View>

            {/* SVG Charts Card */}
            <View style={isDesktop ? styles.kpiGridDesktop : styles.kpiGridMobile}>
              <GlassCard style={[styles.chartCard, { flex: isDesktop ? 2 : undefined }]} borderColor={borderCol}>
                <Text style={[styles.sectionHeading, { color: textPrimary }]}>Monthly Active Users Trend</Text>
                <View style={styles.chartContainer}>
                  {drawLineChart()}
                </View>
              </GlassCard>

              <GlassCard style={[styles.chartCard, { flex: isDesktop ? 1 : undefined }]} borderColor={borderCol}>
                <Text style={[styles.sectionHeading, { color: textPrimary }]}>Average Cohort Health</Text>
                <View style={{ gap: 12, marginTop: 12 }}>
                  {[
                    { label: 'Hydration index', val: `${systemMetrics.averageHydration}%`, color: '#00E5C3', icon: Droplet },
                    { label: 'HRV baseline', val: `${systemMetrics.averageHRV} ms`, color: '#7C3AED', icon: Activity },
                    { label: 'Heart Rate', val: `${systemMetrics.averageHR} BPM`, color: '#FF4D6D', icon: Heart },
                    { label: 'Sleep Score', val: `${systemMetrics.averageSleep}/100`, color: '#14B8FF', icon: Moon },
                  ].map((h, i) => {
                    const Icon = h.icon;
                    return (
                      <View key={i} style={styles.healthCohortRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon size={12} color={h.color} style={{ marginRight: 8 }} />
                          <Text style={{ color: textSecondary, fontSize: 11, fontWeight: '700' }}>{h.label}</Text>
                        </View>
                        <Text style={{ color: textPrimary, fontSize: 12, fontWeight: '900' }}>{h.val}</Text>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            </View>

          </View>
        )}

        {/* SECTION 2: LIVE USERS TELEMETRY */}
        {activeTab === 'users' && (
          <GlassCard style={styles.supervisionCard} borderColor={borderCol}>
            <Text style={[styles.sectionHeading, { color: textPrimary, marginBottom: 12 }]}>Live User Telemetry Supervision</Text>
            
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader, { borderColor: borderCol }]}>
              <Text style={[styles.colHeader, { flex: 2 }]}>User / Contact</Text>
              <Text style={[styles.colHeader, { flex: 1 }]}>HR (BPM)</Text>
              <Text style={[styles.colHeader, { flex: 1 }]}>HRV (ms)</Text>
              <Text style={[styles.colHeader, { flex: 1.2 }]}>Hydration Score</Text>
              <Text style={[styles.colHeader, { flex: 2, textAlign: 'center' }]}>Advisory Actions</Text>
            </View>

            {/* Table Rows list */}
            {usersList.map((item) => (
              <View key={item.id} style={[styles.tableRow, { borderColor: borderCol }]}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.colName, { color: textPrimary }]}>{item.name}</Text>
                  <Text style={styles.colEmail}>{item.email}</Text>
                </View>
                <Text style={[styles.colText, { flex: 1, color: item.hr > 100 ? '#FF4D6D' : textPrimary }]}>
                  {item.hr}
                </Text>
                <Text style={[styles.colText, { flex: 1, color: textPrimary }]}>
                  {item.hrv}
                </Text>
                <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.riskDot, { backgroundColor: item.risk === 'High' ? '#FF4D6D' : item.risk === 'Medium' ? '#FFAD33' : '#00E5C3' }]} />
                  <Text style={[styles.colText, { color: textPrimary }]}>{item.hydration}%</Text>
                </View>
                <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.rowActionBtn, { backgroundColor: 'rgba(255, 173, 51, 0.1)' }]}
                    onPress={() => handleSimulateAlert(item.name, 'warning')}
                  >
                    <Text style={{ color: '#FFAD33', fontSize: 9, fontWeight: '800' }}>Warn</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rowActionBtn, { backgroundColor: 'rgba(255, 77, 109, 0.1)' }]}
                    onPress={() => handleSimulateAlert(item.name, 'critical')}
                  >
                    <Text style={{ color: '#FF4D6D', fontSize: 9, fontWeight: '800' }}>Critical</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* SECTION 3: SYSTEM CONSOLE CONTROLS */}
        {/* SECTION 4: USER FEEDBACKS */}
        {activeTab === 'feedback' && (
          <GlassCard style={styles.supervisionCard} borderColor={borderCol}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.sectionHeading, { color: textPrimary }]}>User Feedback Vault</Text>
              {feedbacks.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearFeedbacks} activeOpacity={0.8}>
                  <Trash size={12} color="#FF4D6D" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FF4D6D', fontSize: 10, fontWeight: '800' }}>Wipe Vault</Text>
                </TouchableOpacity>
              )}
            </View>

            {feedbacks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AlertTriangle size={32} color={textSecondary} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>Feedback Vault is Empty</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>No user reviews or bug reports registered in the local dossier.</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {feedbacks.map((f) => (
                  <View key={f.id} style={[styles.feedbackItem, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }]}>
                    <View style={styles.feedbackHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              color={star <= f.rating ? '#FFD700' : 'rgba(255,255,255,0.1)'}
                              fill={star <= f.rating ? '#FFD700' : 'transparent'}
                            />
                          ))}
                        </View>
                        <View style={[styles.feedbackTypeBadge, { backgroundColor: f.type === 'bug' ? 'rgba(255, 77, 109, 0.1)' : f.type === 'suggestion' ? 'rgba(0, 229, 195, 0.1)' : 'rgba(20, 184, 255, 0.1)' }]}>
                          <Text style={{ color: f.type === 'bug' ? '#FF4D6D' : f.type === 'suggestion' ? '#00E5C3' : '#14B8FF', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>
                            {f.type}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Text style={[styles.feedbackDate, { color: textSecondary }]}>
                          {new Date(f.timestamp).toLocaleDateString()} {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <TouchableOpacity onPress={() => handleDeleteFeedback(f.id)}>
                          <Trash size={12} color="#FF4D6D" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={[styles.feedbackTextBody, { color: textPrimary }]}>{f.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        )}

        {/* SECTION 5: SOFTWARE ERROR LOGS */}
        {activeTab === 'errors' && (
          <GlassCard style={styles.supervisionCard} borderColor={borderCol}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.sectionHeading, { color: textPrimary }]}>System Error Journal</Text>
              {errorLogs.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearErrors} activeOpacity={0.8}>
                  <Trash size={12} color="#FF4D6D" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FF4D6D', fontSize: 10, fontWeight: '800' }}>Clear Logs</Text>
                </TouchableOpacity>
              )}
            </View>

            {errorLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Cpu size={32} color="#00E5C3" style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: textPrimary }]}>Zero Software Exceptions</Text>
                <Text style={[styles.emptySubtitle, { color: textSecondary }]}>Operational kernel integrity is nominal. No system faults logged.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {errorLogs.map((log) => {
                  const isExpanded = expandedError === log.id;
                  return (
                    <View key={log.id} style={[styles.errorLogCard, { borderColor: 'rgba(255, 77, 109, 0.15)', backgroundColor: '#03070E' }]}>
                      <TouchableOpacity 
                        style={styles.errorLogHeader} 
                        onPress={() => setExpandedError(isExpanded ? null : log.id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1, marginRight: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <View style={styles.errorComponentBadge}>
                              <Terminal size={10} color="#FF4D6D" style={{ marginRight: 4 }} />
                              <Text style={styles.errorComponentText}>{log.component || 'Unknown'}</Text>
                            </View>
                            <Text style={styles.errorLogTime}>
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Text>
                          </View>
                          <Text style={styles.errorLogMsg} numberOfLines={isExpanded ? undefined : 2}>
                            {log.message}
                          </Text>
                        </View>
                        <ChevronRight size={14} color="#FF4D6D" style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
                      </TouchableOpacity>
                      
                      {isExpanded && (
                        <View style={styles.errorLogExpanded}>
                          <View style={styles.modalDivider} />
                          <Text style={[styles.expandedMetaText, { color: textSecondary }]}>
                            User Node: <Text style={{ color: '#00E5C3' }}>{log.userName} ({log.userEmail})</Text>
                          </Text>
                          <Text style={[styles.expandedMetaText, { color: textSecondary, marginTop: 4 }]}>
                            Logged ISO: <Text style={{ color: '#FFFFFF' }}>{log.timestamp}</Text>
                          </Text>
                          {log.stack && (
                            <ScrollView style={styles.stackTraceContainer} horizontal>
                              <Text style={styles.stackTraceText}>{log.stack}</Text>
                            </ScrollView>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>
        )}
        
        {activeTab === 'system' && (
          <View style={{ gap: 16 }}>
            <GlassCard style={styles.consoleCard} borderColor={borderCol}>
              <Text style={[styles.sectionHeading, { color: textPrimary }]}>System Emulator Controls</Text>
              
              <View style={styles.consoleSettingRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.consoleLabel, { color: textPrimary }]}>Hardware BLE Simulator Speed</Text>
                  <Text style={styles.consoleDesc}>Adjust stream refresh rates for testing local variables</Text>
                </View>
                <View style={styles.consoleActionWrapper}>
                  {['10s', '30s', '60s'].map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[styles.controlOptionBtn, speed === '30s' && styles.controlOptionActive, { borderColor: borderCol }]}
                      onPress={() => showToast(`Vitals stream interval set to ${speed}!`, 'info')}
                    >
                      <Text style={{ color: speed === '30s' ? '#050B18' : textSecondary, fontSize: 9, fontWeight: '800' }}>{speed}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.consoleSettingRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.consoleLabel, { color: textPrimary }]}>Dispatched System Warnings</Text>
                  <Text style={styles.consoleDesc}>Broadcast critical push notices to active users</Text>
                </View>
                <TouchableOpacity
                  style={styles.systemTriggerBtn}
                  onPress={() => showToast('Dispatched global hydration alert to all active cohort bands!', 'error')}
                >
                  <Text style={{ color: '#050B18', fontSize: 10, fontWeight: '900' }}>BROADCAST WARNING</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            <GlassCard style={[styles.consoleCard, { borderColor: 'rgba(255, 77, 109, 0.2)' }]} borderColor="rgba(255, 77, 109, 0.2)">
              <Text style={{ color: '#FF4D6D', fontSize: 13, fontWeight: '900', marginBottom: 6 }}>System Hard Reset</Text>
              <Text style={{ color: textSecondary, fontSize: 10, lineHeight: 14, marginBottom: 16 }}>
                Wipe all cached database mockups, localStorage profiles, and restart active telemetry simulators.
              </Text>
              <TouchableOpacity
                style={{
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#FF4D6D',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>WIPE DATABASE & REBOOT</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}

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
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5C3',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5C3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  exportText: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '900',
  },
  tabRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#00E5C3',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionContainer: {
    gap: 20,
  },
  kpiGridDesktop: {
    flexDirection: 'row',
    gap: 16,
  },
  kpiGridMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    gap: 6,
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kpiCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E9AA6',
    textTransform: 'uppercase',
  },
  kpiCardVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  kpiCardTrend: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00E5C3',
  },
  chartCard: {
    padding: 20,
    borderRadius: 24,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  healthCohortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
  },
  supervisionCard: {
    padding: 20,
    borderRadius: 24,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 6,
  },
  colHeader: {
    color: '#8E9AA6',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  colName: {
    fontSize: 11,
    fontWeight: '800',
  },
  colEmail: {
    fontSize: 9,
    color: '#8E9AA6',
    marginTop: 1,
  },
  colText: {
    fontSize: 10,
    fontWeight: '700',
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  rowActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  consoleCard: {
    padding: 20,
    borderRadius: 24,
  },
  consoleSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  consoleLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  consoleDesc: {
    fontSize: 9,
    color: '#8E9AA6',
    lineHeight: 12,
    marginTop: 2,
  },
  consoleActionWrapper: {
    flexDirection: 'row',
    gap: 6,
  },
  controlOptionBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  controlOptionActive: {
    backgroundColor: '#00E5C3',
    borderColor: '#00E5C3',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 12,
  },
  systemTriggerBtn: {
    backgroundColor: '#FFAD33',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  // Feedback & Error styles
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  feedbackItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  feedbackTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  feedbackDate: {
    fontSize: 9,
    fontWeight: '600',
  },
  feedbackTextBody: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  errorLogCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorComponentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  errorComponentText: {
    color: '#FF4D6D',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  errorLogTime: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E9AA6',
  },
  errorLogMsg: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF8A9E',
    lineHeight: 15,
  },
  errorLogExpanded: {
    marginTop: 8,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 10,
  },
  expandedMetaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stackTraceContainer: {
    marginTop: 10,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    maxHeight: 150,
  },
  stackTraceText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#8E9AA6',
    fontSize: 9,
    lineHeight: 13,
  },
});
