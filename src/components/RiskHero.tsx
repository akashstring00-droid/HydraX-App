import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EvaluatedRiskResult } from '../ai/RiskEngine';

interface RiskHeroProps {
  assessment: EvaluatedRiskResult;
  lastUpdatedMs: number | null;
  isConnected: boolean;
  isDemoMode: boolean;
}

export const RiskHero: React.FC<RiskHeroProps> = ({
  assessment,
  lastUpdatedMs,
  isConnected,
  isDemoMode,
}) => {
  let badgeColor = '#059669'; // Green
  let badgeBg = 'rgba(5, 150, 105, 0.1)';

  if (assessment.overallRisk === 'MODERATE') {
    badgeColor = '#D97706';
    badgeBg = 'rgba(217, 119, 6, 0.1)';
  } else if (assessment.overallRisk === 'HIGH' || assessment.overallRisk === 'CRITICAL') {
    badgeColor = '#DC2626';
    badgeBg = 'rgba(220, 38, 38, 0.1)';
  } else if (!isConnected && !isDemoMode) {
    badgeColor = '#64748B';
    badgeBg = '#F1F5F9';
  }

  const updatedSecAgo = lastUpdatedMs
    ? Math.max(0, Math.floor((Date.now() - lastUpdatedMs) / 1000))
    : null;

  return (
    <View style={[styles.card, { borderColor: badgeColor }]}>
      <View style={styles.topRow}>
        <Text style={styles.cardHeaderTitle}>CURRENT RISK</Text>
        {isDemoMode && (
          <View style={styles.demoTag}>
            <Text style={styles.demoTagText}>DEMO MODE</Text>
          </View>
        )}
      </View>

      <View style={styles.heroMainRow}>
        <View style={styles.riskLevelCol}>
          <Text style={[styles.riskLevelText, { color: badgeColor }]}>
            {isConnected || isDemoMode ? assessment.overallRisk : 'DISCONNECTED'}
          </Text>
          <Text style={styles.statementText}>{assessment.recommendation}</Text>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: badgeBg }]}>
          <Text style={[styles.scoreNum, { color: badgeColor }]}>
            {isConnected || isDemoMode ? assessment.riskScore : '--'}
          </Text>
          <Text style={styles.scoreDenom}>/ 100</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.updatedText}>
          {isConnected || isDemoMode
            ? `Updated ${updatedSecAgo !== null ? `${updatedSecAgo} sec ago` : 'just now'}`
            : 'Device not connected — Connect HydraX to begin live tracking'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  demoTag: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  demoTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  riskLevelCol: {
    flex: 1,
  },
  riskLevelText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statementText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
  },
  scoreBox: {
    width: 68,
    height: 68,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  scoreDenom: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  footerRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  updatedText: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
