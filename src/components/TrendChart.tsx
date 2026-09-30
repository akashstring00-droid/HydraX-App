import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

export type Timeframe = 'Today' | '7 Days' | '30 Days';

interface TrendChartProps {
  title: string;
  unit: string;
  color: string;
  dataToday: number[];
  data7Days: number[];
  data30Days: number[];
  baselineMin?: number;
  baselineMax?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  unit,
  color,
  dataToday,
  data7Days,
  data30Days,
  baselineMin,
  baselineMax,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Today');

  const currentData = timeframe === 'Today' ? dataToday : timeframe === '7 Days' ? data7Days : data30Days;
  const labels = timeframe === 'Today' 
    ? ['00:00', '06:00', '12:00', '18:00', 'Now']
    : timeframe === '7 Days'
    ? ['Mon', 'Wed', 'Fri', 'Sun']
    : ['W1', 'W2', 'W3', 'W4'];

  const width = 320;
  const height = 120;
  const padding = 20;

  const minVal = Math.min(...currentData, baselineMin ?? 9999) - 2;
  const maxVal = Math.max(...currentData, baselineMax ?? 0) + 2;

  const points = currentData.map((val, idx) => {
    const x = padding + (idx / (currentData.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  const lastPoint = points[points.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.currentValue}>
            {lastPoint ? lastPoint.val : '--'} <Text style={styles.unitText}>{unit}</Text>
          </Text>
        </View>

        {/* Timeframe selector */}
        <View style={styles.timeframeContainer}>
          {(['Today', '7 Days', '30 Days'] as Timeframe[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.tfChip, timeframe === tf && { backgroundColor: color }]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[styles.tfText, timeframe === tf && styles.tfTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SVG Line Chart */}
      <View style={styles.chartContainer}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          <Path d={areaD} fill={`url(#grad-${title})`} />

          {baselineMin && (
            <Line
              x1={padding}
              y1={height - padding - ((baselineMin - minVal) / (maxVal - minVal)) * (height - 2 * padding)}
              x2={width - padding}
              y2={height - padding - ((baselineMin - minVal) / (maxVal - minVal)) * (height - 2 * padding)}
              stroke="#CBD5E1"
              strokeDasharray="4 4"
            />
          )}

          <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" />

          {points.map((pt, idx) => (
            <Circle key={idx} cx={pt.x} cy={pt.y} r={idx === points.length - 1 ? 4 : 2.5} fill={color} />
          ))}
        </Svg>
      </View>

      <View style={styles.labelsRow}>
        {labels.map((lbl, idx) => (
          <Text key={idx} style={styles.labelX}>{lbl}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  tfChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tfText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tfTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  chartContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: 8,
  },
  labelX: {
    fontSize: 9,
    color: '#94A3B8',
  },
});
