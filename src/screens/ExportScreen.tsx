import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Download, 
  Share2, 
  History, 
  FileText, 
  FileCheck,
  Check, 
  Link,
  Lock,
  ChevronRight,
  TrendingUp,
  Droplet,
  Moon,
  Database
} from 'lucide-react-native';

import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useAuthStore } from '../store/useAuthStore';
import { ReportsCompiler } from '../lib/weeklyReports';
import { GlassCard } from '../components/GlassCard';

interface ExportRecord {
  id: string;
  reportName: string;
  format: 'PDF' | 'CSV' | 'JSON';
  timestamp: string;
  status: 'Completed' | 'Pending';
  size: string;
}

export const ExportScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const darkMode = useSettingsStore((state) => state.darkMode);
  const showToast = useToastStore((state) => state.showToast);

  const waterLogs = useWaterStore((state) => state.logs);
  const symptomLogs = useDiarrheaStore((state) => state.logs);
  const recoveryScore = useDiarrheaStore((state) => state.recoveryScore);
  const vitalsPrediction = useVitalsStore((state) => state.prediction);
  const currentVitals = useVitalsStore((state) => state.currentVitals);

  // States
  const [selectedReport, setSelectedReport] = useState<'dashboard' | 'recovery' | 'hydration' | 'sleep' | 'weekly'>('dashboard');
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'CSV' | 'JSON'>('PDF');
  const [isCompiling, setIsCompiling] = useState(false);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

  // Local storage/mocked history for reports
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([
    { id: 'exp-1', reportName: 'Monthly Bio-Summary (May)', format: 'PDF', timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), status: 'Completed', size: '2.4 MB' },
    { id: 'exp-2', reportName: 'Weekly Hydration Audit Q1', format: 'CSV', timestamp: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), status: 'Completed', size: '142 KB' },
    { id: 'exp-3', reportName: 'Deep Recovery Logs (Bristol Match)', format: 'JSON', timestamp: new Date(new Date().setDate(new Date().getDate() - 9)).toISOString(), status: 'Completed', size: '89 KB' }
  ]);

  const reportOptions = [
    { id: 'dashboard', title: 'Dashboard Vitals', desc: 'Unified dashboard snapshot (Vitals, BLE telemetry, prediction risks)', icon: Database, color: '#14B8FF' },
    { id: 'recovery', title: 'Recovery Statistics', desc: 'HRV baseline drift, gut health coefficients, and recovery planner audits', icon: TrendingUp, color: '#FFAD33' },
    { id: 'hydration', title: 'Hydration Logbook', desc: 'Water intakes history logs, temperature adjustments, and sweat ratios', icon: Droplet, color: '#00E5C3' },
    { id: 'sleep', title: 'Sleep Efficiencies', desc: 'PPG resting waveforms matching sleep quality metrics', icon: Moon, color: '#7C3AED' },
    { id: 'weekly', title: 'Weekly Diagnostic Reports', desc: 'Aggregated clinical weekly reports and dehydration predictions', icon: FileText, color: '#FF4D6D' }
  ] as const;

  const handleCompile = async () => {
    setIsCompiling(true);
    showToast(`Compiling ${selectedReport.toUpperCase()} report into ${selectedFormat}...`, 'info');

    // Retrieve auth profile details
    const user = useAuthStore.getState().user;

    const startDate = new Date();
    if (selectedReport === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (selectedReport === 'recovery' || selectedReport === 'hydration') {
      startDate.setDate(startDate.getDate() - 14);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    try {
      if (selectedFormat === 'PDF') {
        await ReportsCompiler.compileAndShare({
          profile: user,
          waterLogs,
          symptomLogs,
          avgHeartRate: currentVitals.heartRate,
          avgHrv: currentVitals.hrv,
          avgSkinTemp: currentVitals.skinTemp,
          recoveryScore,
          startDate: startDate.toLocaleDateString(),
          endDate: new Date().toLocaleDateString(),
          reportType: selectedReport === 'weekly' ? 'Weekly' : selectedReport === 'hydration' ? 'Daily' : 'Monthly'
        });
      } else {
        // Trigger Web download for other formats
        if (Platform.OS === 'web') {
          let content = '';
          let mimeType = 'text/plain';
          let filename = `hydrax_${selectedReport}_export.${selectedFormat.toLowerCase()}`;

          if (selectedFormat === 'JSON') {
            mimeType = 'application/json';
            content = JSON.stringify({
              generatedAt: new Date().toISOString(),
              reportType: selectedReport,
              clientVitals: currentVitals,
              hydrationTelemetry: {
                target: 2500,
                logs: waterLogs
              },
              gutTelemetry: {
                symptomLogs
              },
              predictions: vitalsPrediction
            }, null, 2);
          } else if (selectedFormat === 'CSV') {
            mimeType = 'text/csv';
            content = `Metric,Value,Unit,Timestamp\nHeart Rate,${currentVitals.heartRate},bpm,${new Date().toISOString()}\nHRV,${currentVitals.hrv},ms,${new Date().toISOString()}\nDehydration Risk,${vitalsPrediction.riskLevel},level,${new Date().toISOString()}`;
          }

          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      }

      // Add record to history
      const newRecord: ExportRecord = {
        id: 'exp-' + Math.random().toString(36).substring(2, 9),
        reportName: `${reportOptions.find(r => r.id === selectedReport)?.title} Report`,
        format: selectedFormat,
        timestamp: new Date().toISOString(),
        status: 'Completed',
        size: selectedFormat === 'PDF' ? '1.8 MB' : selectedFormat === 'CSV' ? '45 KB' : '18 KB'
      };
      setExportHistory(prev => [newRecord, ...prev]);
      showToast(`Report compiled successfully!`, 'success');
    } catch (err: any) {
      showToast(`Compilation failed: ${err.message || err}`, 'error');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleShareLink = (reportTitle: string, index: number) => {
    const shareUrl = `https://hydra-x-app.vercel.app/shared/snapshot/${Math.random().toString(36).substring(2, 10)}`;
    
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(shareUrl);
    }
    
    setCopiedLinkIndex(index);
    showToast('Snapshot share link copied to clipboard!', 'success');

    setTimeout(() => {
      setCopiedLinkIndex(null);
    }, 3000);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Export Center</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>Compile and share premium bio-telemetry reports in industry standard formats</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.layoutGrid}>
          {/* Left panel: Config and Compilation */}
          <View style={[styles.mainColumn, { flex: isDesktop ? 3 : 1 }]}>
            {/* 1. Report Selector */}
            <GlassCard style={styles.sectionCard} borderColor={borderCol}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>1. Select Report Component</Text>
              
              <View style={styles.reportList}>
                {reportOptions.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedReport === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.reportOption,
                        { 
                          backgroundColor: isSelected ? 'rgba(0, 229, 195, 0.05)' : 'transparent',
                          borderColor: isSelected ? '#00E5C3' : borderCol
                        }
                      ]}
                      onPress={() => setSelectedReport(r.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optionIconContainer, { backgroundColor: r.color + '15' }]}>
                        <Icon size={16} color={r.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, { color: textPrimary }]}>{r.title}</Text>
                        <Text style={[styles.optionDesc, { color: textSecondary }]}>{r.desc}</Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Check size={14} color="#00E5C3" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCard>

            {/* 2. Format Selector */}
            <GlassCard style={styles.sectionCard} borderColor={borderCol}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>2. Select Export Format</Text>
              
              <View style={styles.formatSelectorRow}>
                {(['PDF', 'CSV', 'JSON'] as const).map((format) => {
                  const active = selectedFormat === format;
                  return (
                    <TouchableOpacity
                      key={format}
                      style={[
                        styles.formatBtn,
                        { 
                          backgroundColor: active ? 'rgba(0, 229, 195, 0.1)' : 'transparent',
                          borderColor: active ? '#00E5C3' : borderCol 
                        }
                      ]}
                      onPress={() => setSelectedFormat(format)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.formatBtnText, { color: active ? '#00E5C3' : textSecondary }]}>
                        {format}
                      </Text>
                      <Text style={styles.formatDesc}>
                        {format === 'PDF' ? 'Printable Document' : format === 'CSV' ? 'Spreadsheet Data' : 'Structured Logs'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Compilation CTA */}
              <TouchableOpacity
                style={[
                  styles.compileBtn,
                  { backgroundColor: isCompiling ? 'rgba(0,229,195,0.3)' : '#00E5C3' }
                ]}
                disabled={isCompiling}
                onPress={handleCompile}
                activeOpacity={0.8}
              >
                <Download size={18} color="#050B18" style={{ marginRight: 8 }} />
                <Text style={styles.compileBtnText}>
                  {isCompiling ? 'Compiling Datasets...' : 'Compile & Download Report'}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

          {/* Right panel: History and Security */}
          <View style={[styles.sideColumn, { flex: isDesktop ? 2 : 1 }]}>
            {/* Security / Privacy Warning */}
            <GlassCard style={styles.privacyCard} borderColor={borderCol}>
              <View style={styles.privacyHeader}>
                <Lock size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={[styles.privacyTitle, { color: textPrimary }]}>HIPAA Encrypted Secure Data</Text>
              </View>
              <Text style={[styles.privacyDesc, { color: textSecondary }]}>
                Hydrax reports are Private by Default. Exported datasets are encrypted in transit and compiled locally within your browser sandbox. No biometrics are stored in plain text on cloud databases.
              </Text>
            </GlassCard>

            {/* History of compiled downloads */}
            <GlassCard style={styles.historyCard} borderColor={borderCol}>
              <View style={styles.historyHeader}>
                <History size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={[styles.historyTitle, { color: textPrimary }]}>Export History</Text>
              </View>

              <View style={styles.historyList}>
                {exportHistory.map((item, index) => (
                  <View key={item.id} style={[styles.historyItem, { borderColor: borderCol }]}>
                    <View style={styles.historyLeft}>
                      <FileCheck size={16} color="#00FFB2" style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyName, { color: textPrimary }]} numberOfLines={1}>
                          {item.reportName}
                        </Text>
                        <Text style={styles.historyTime}>{formatDate(item.timestamp)}</Text>
                      </View>
                    </View>

                    <View style={styles.historyRight}>
                      <View style={[styles.formatBadge, { backgroundColor: darkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
                        <Text style={[styles.formatBadgeText, { color: textSecondary }]}>{item.format}</Text>
                      </View>

                      {/* Copy shareable snapshot link */}
                      <TouchableOpacity 
                        style={styles.shareIconBtn} 
                        onPress={() => handleShareLink(item.reportName, index)}
                      >
                        {copiedLinkIndex === index ? (
                          <Check size={14} color="#00FFB2" />
                        ) : (
                          <Link size={14} color="#00E5C3" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  layoutGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
  },
  mainColumn: {
    gap: 20,
  },
  sideColumn: {
    gap: 20,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  reportList: {
    gap: 10,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedIndicator: {
    marginLeft: 10,
  },
  formatSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  formatBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  formatBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  formatDesc: {
    fontSize: 9,
    color: '#8E9AA6',
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  compileBtn: {
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  compileBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050B18',
  },
  privacyCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 195, 0.02)',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  privacyDesc: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  historyCard: {
    padding: 16,
    borderRadius: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  historyName: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyTime: {
    fontSize: 9,
    color: '#8E9AA6',
    fontWeight: '600',
    marginTop: 2,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  shareIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
});
