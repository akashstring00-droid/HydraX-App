import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Cpu, Radio, Database, ShieldCheck, Zap, AlertTriangle, ChevronDown } from 'lucide-react-native';

interface ArchitectureScreenProps {
  onBack: () => void;
}

export const ArchitectureScreen: React.FC<ArchitectureScreenProps> = ({ onBack }) => {
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color="#0F172A" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>HOW HYDRAX WORKS</Text>
          <Text style={styles.headerSub}>Technical Architecture & On-Device Data Pipeline</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Hackathon Core Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <Cpu color="#0D9488" size={22} />
            <Text style={styles.bannerTitle}>DISASTER-RESILIENT ARCHITECTURE</Text>
          </View>
          <Text style={styles.bannerDesc}>
            "Designed specifically for continuous health monitoring and early risk detection during severe network outages and environmental disasters in India."
          </Text>
        </View>

        {/* Technical Pipeline Visualization */}
        <Text style={styles.sectionHeader}>6-STAGE DATA PIPELINE</Text>

        {/* Step 1 */}
        <View style={styles.pipelineCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
            <Text style={styles.stepTitle}>Sensors & Hardware Layer</Text>
          </View>
          <Text style={styles.stepDesc}>
            Continuous sampling from MAX30102 (Optical HR/SpO2), TMP117 (Medical Temp), BMI160 (6-axis motion), and ambient climate sensors via local BLE GATT services.
          </Text>
        </View>

        <View style={styles.arrowRow}><ChevronDown color="#0EA5E9" size={20} /></View>

        {/* Step 2 */}
        <View style={styles.pipelineCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
            <Text style={styles.stepTitle}>Local Data Processing</Text>
          </View>
          <Text style={styles.stepDesc}>
            On-device noise filtering, outlier removal, and time-series aggregation stored in zero-cloud local SQLite / AsyncStorage cache.
          </Text>
        </View>

        <View style={styles.arrowRow}><ChevronDown color="#0EA5E9" size={20} /></View>

        {/* Step 3 */}
        <View style={styles.pipelineCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
            <Text style={styles.stepTitle}>Personal Baseline Learning</Text>
          </View>
          <Text style={styles.stepDesc}>
            Dynamic local baseline model calculates user-specific rolling normal ranges (HR min/max, Temp min/max, SpO2 baseline) rather than static population averages.
          </Text>
        </View>

        <View style={styles.arrowRow}><ChevronDown color="#0EA5E9" size={20} /></View>

        {/* Step 4 */}
        <View style={styles.pipelineCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>4</Text></View>
            <Text style={styles.stepTitle}>Edge AI Risk Engine</Text>
          </View>
          <Text style={styles.stepDesc}>
            Modular feature vector evaluation (Heat Stress, Respiratory Strain, Cardio Burden, Dehydration, Motion Distress) running on-device without API latency.
          </Text>
        </View>

        <View style={styles.arrowRow}><ChevronDown color="#0EA5E9" size={20} /></View>

        {/* Step 5 */}
        <View style={styles.pipelineCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>5</Text></View>
            <Text style={styles.stepTitle}>Personalized Alert Engine</Text>
          </View>
          <Text style={styles.stepDesc}>
            Actionable health recommendations with transparent factor attribution ("Why did HydraX alert me?") and disaster-specific priority switching.
          </Text>
        </View>

        <View style={styles.arrowRow}><ChevronDown color="#0EA5E9" size={20} /></View>

        {/* Step 6 */}
        <View style={styles.pipelineCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>6</Text></View>
            <Text style={styles.stepTitle}>Emergency Assistance</Text>
          </View>
          <Text style={styles.stepDesc}>
            Automatic fall countdown dispatch, offline emergency safety protocols, and encrypted SOS location broadcasting.
          </Text>
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  bannerCard: {
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.25)',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#334155',
    marginTop: 6,
    lineHeight: 17,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0EA5E9',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 16,
  },
  arrowRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
