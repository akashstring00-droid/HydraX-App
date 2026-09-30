import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface HealthScoreCardProps {
  score: number;
  riskLevel: 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'CRITICAL RISK';
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, riskLevel }) => {
  let badgeColor = '#0D9488'; // Teal
  if (riskLevel === 'MODERATE RISK') badgeColor = '#D97706';
  if (riskLevel === 'HIGH RISK' || riskLevel === 'CRITICAL RISK') badgeColor = '#DC2626';

  // SVG progress circle dimensions
  const radius = 54;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>TODAY'S HEALTH</Text>

      {/* Hero Circular Progress Score */}
      <View style={styles.gaugeWrapper}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          {/* Track Circle */}
          <Circle
            cx={70}
            cy={70}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active Circle */}
          <Circle
            cx={70}
            cy={70}
            r={radius}
            stroke={badgeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform="rotate(-90 70 70)"
          />
        </Svg>

        <View style={styles.scoreTextOverlay}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreSublabel}>HEALTH SCORE</Text>
        </View>
      </View>

      {/* Risk Badge & Subtext */}
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: badgeColor }]} />
        <Text style={[styles.riskText, { color: badgeColor }]}>{riskLevel}</Text>
      </View>

      <Text style={styles.statementText}>
        "Your current indicators are within your personal baseline."
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  gaugeWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 50,
  },
  scoreSublabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: -2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statementText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
});
