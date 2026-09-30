import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Sparkles, Sliders, CheckCircle2, AlertTriangle, Shield, Cpu, RefreshCw } from 'lucide-react-native';
import { demoScenarios } from '../data/mockData';
import { DemoScenarioKey } from '../types';

interface DemoCenterModalProps {
  visible: boolean;
  onClose: () => void;
  currentScenario: DemoScenarioKey;
  onSelectScenario: (key: DemoScenarioKey) => void;
}

export const DemoCenterModal: React.FC<DemoCenterModalProps> = ({
  visible,
  onClose,
  currentScenario,
  onSelectScenario,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <View style={styles.iconBox}>
                <Sparkles color="#F59E0B" size={18} />
              </View>
              <View>
                <Text style={styles.title}>HACKATHON DEMO CENTER</Text>
                <Text style={styles.subtitle}>Simulate hardware sensor streams & disaster states</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionNotice}>
              Select a scenario to instantly inject real-time physiological and environmental sensor data into the HydraX Edge AI Engine.
            </Text>

            {demoScenarios.map((sc) => {
              const isActive = currentScenario === sc.key;
              return (
                <TouchableOpacity
                  key={sc.key}
                  style={[styles.scenarioCard, isActive && styles.scenarioCardActive]}
                  onPress={() => {
                    onSelectScenario(sc.key);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.scenarioName}>{sc.name}</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <CheckCircle2 color="#34D399" size={12} />
                        <Text style={styles.activeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.scenarioDesc}>{sc.description}</Text>

                  {/* Vitals Summary Pill */}
                  <View style={styles.vitalsRow}>
                    {sc.health.heartRate && (
                      <Text style={styles.vitalPill}>❤️ {sc.health.heartRate} BPM</Text>
                    )}
                    {sc.health.spO2 && (
                      <Text style={styles.vitalPill}>🫁 {sc.health.spO2}% SpO₂</Text>
                    )}
                    {sc.environment.temperature && (
                      <Text style={styles.vitalPill}>🌡 {sc.environment.temperature}°C</Text>
                    )}
                    {sc.environment.aqi && (
                      <Text style={styles.vitalPill}>🌫 AQI {sc.environment.aqi}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 13, 26, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#11192C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1E2942',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2942',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    marginTop: 14,
  },
  sectionNotice: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 14,
    lineHeight: 16,
  },
  scenarioCard: {
    backgroundColor: '#0A101D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E2942',
  },
  scenarioCardActive: {
    borderColor: '#0EA5E9',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scenarioName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  scenarioDesc: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 15,
  },
  vitalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  vitalPill: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    backgroundColor: '#11192C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
