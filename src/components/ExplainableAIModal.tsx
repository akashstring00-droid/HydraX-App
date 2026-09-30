import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Cpu, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { ExplainableRiskResult } from '../types';

interface ExplainableAIModalProps {
  visible: boolean;
  onClose: () => void;
  result: ExplainableRiskResult;
}

export const ExplainableAIModal: React.FC<ExplainableAIModalProps> = ({
  visible,
  onClose,
  result,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.cpuIconBox}>
                <Cpu color="#0EA5E9" size={20} />
              </View>
              <View>
                <Text style={styles.modalTitle}>WHY DID HYDRAX ALERT ME?</Text>
                <Text style={styles.modalSubtitle}>On-Device Edge AI Explainability Engine</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Category & Status Banner */}
            <View style={styles.statusBanner}>
              <Text style={styles.categoryTitle}>{result.categoryTitle}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{result.riskLevel} Level</Text>
              </View>
            </View>

            <Text style={styles.summaryText}>{result.explanationSummary}</Text>

            <Text style={styles.factorHeader}>FACTOR CONTRIBUTION WEIGHTS</Text>

            {/* Factor Bar Chart / Contribution Rows */}
            {result.contributions.map((c, index) => (
              <View key={index} style={styles.factorRow}>
                <View style={styles.factorLabelRow}>
                  <Text style={styles.factorName}>{c.factorName}</Text>
                  <Text style={styles.factorPct}>+{c.percentage}%</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.barTrack}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${Math.min(100, c.percentage * 1.5)}%`,
                        backgroundColor: c.percentage > 35 ? '#EF4444' : c.percentage > 20 ? '#F59E0B' : '#0EA5E9',
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}

            <View style={styles.privacyNote}>
              <ShieldCheck color="#10B981" size={16} />
              <Text style={styles.privacyNoteText}>
                Calculated locally using edge weight matrices. Zero personal telemetry uploaded.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.actionDoneButton} onPress={onClose}>
            <Text style={styles.actionDoneText}>Understood</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#131C35',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#233055',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cpuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  closeButton: {
    padding: 4,
  },
  scrollBody: {
    marginTop: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  levelBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
  },
  summaryText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginTop: 12,
  },
  factorHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 10,
  },
  factorRow: {
    marginBottom: 12,
  },
  factorLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  factorName: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  factorPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#0F172A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#34D399',
  },
  actionDoneButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  actionDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
