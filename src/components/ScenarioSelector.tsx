import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sliders, Sparkles } from 'lucide-react-native';
import { demoScenarios } from '../data/mockData';
import { DemoScenarioKey } from '../types';

interface ScenarioSelectorProps {
  currentScenario: DemoScenarioKey;
  onSelectScenario: (scenarioKey: DemoScenarioKey) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  currentScenario,
  onSelectScenario,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Sparkles color="#F59E0B" size={14} />
          <Text style={styles.sectionTitle}>HACKATHON DEMO SCENARIOS</Text>
        </View>
        <Text style={styles.subHint}>Tap to simulate live hardware state</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {demoScenarios.map((sc) => {
          const isActive = currentScenario === sc.key;
          return (
            <TouchableOpacity
              key={sc.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelectScenario(sc.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {sc.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  subHint: {
    fontSize: 10,
    color: '#64748B',
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#38BDF8',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
