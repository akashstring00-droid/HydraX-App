import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { themeStore } from '../theme/ThemeStore';

export type Timeframe = 'Today' | '7 Days' | '30 Days';

interface TrendChartProps {
  title: string;
  unit: string;
  color: string;
  dataToday: number[];
  data7Days: number[];
  data30Days: number[];
  labelsToday?: string[];
  labels7Days?: string[];
  labels30Days?: string[];
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
  labelsToday = ['00:00', '06:00', '12:00', '18:00', 'Now'],
  labels7Days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  labels30Days = ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  baselineMin,
  baselineMax,
}) => {
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    return themeStore.subscribe((m) => setThemeMode(m));
  }, []);

  const isDark = themeMode === 'dark';
  const [timeframe, setTimeframe] = useState<Timeframe>('Today');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const currentData = timeframe === 'Today' ? dataToday : timeframe === '7 Days' ? data7Days : data30Days;
  const labels = timeframe === 'Today' ? labelsToday : timeframe === '7 Days' ? labels7Days : labels30Days;

  const width = 340;
  const height = 150;
  const paddingX = 24;
  const paddingTop = 25;
  const paddingBottom = 30;

  const minValRaw = Math.min(...currentData, baselineMin ?? 9999);
  const maxValRaw = Math.max(...currentData, baselineMax ?? 0);
  const spread = maxValRaw - minValRaw || 1;
  const minVal = Math.floor(minValRaw - spread * 0.15);
  const maxVal = Math.ceil(maxValRaw + spread * 0.15);

  const avgVal = (currentData.reduce((a, b) => a + b, 0) / (currentData.length || 1)).toFixed(1);
  const minObserved = Math.min(...currentData).toFixed(1);
  const maxObserved = Math.max(...currentData).toFixed(1);

  const points = currentData.map((val, idx) => {
    const x = paddingX + (idx / (currentData.length - 1 || 1)) * (width - 2 * paddingX);
    const y = height - paddingBottom - ((val - minVal) / (maxVal - minVal || 1)) * (height - paddingTop - paddingBottom);
    return { x, y, val, label: labels[idx] || `Pt ${idx + 1}` };
  });

  // Smooth cubic Bezier path generator
  const getSmoothPath = (pts: typeof points) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cp1x = prev.x + (curr.x - prev.x) * 0.45;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) * 0.55;
      const cp2y = curr.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    return path;
  };

  const smoothLineD = getSmoothPath(points);
  const firstPt = points[0] || { x: paddingX, y: height - paddingBottom };
  const lastPt = points[points.length - 1] || { x: width - paddingX, y: height - paddingBottom };
  const smoothAreaD = `${smoothLineD} L ${lastPt.x} ${height - paddingBottom} L ${firstPt.x} ${height - paddingBottom} Z`;

  const activePoint = selectedIndex !== null && points[selectedIndex] ? points[selectedIndex] : lastPt;

  // Grid line Y coordinates (3 horizontal guides)
  const gridY1 = paddingTop + (height - paddingTop - paddingBottom) * 0.25;
  const gridY2 = paddingTop + (height - paddingTop - paddingBottom) * 0.5;
  const gridY3 = paddingTop + (height - paddingTop - paddingBottom) * 0.75;

  // Sanitize title to create a 100% valid CSS/SVG identifier (no parentheses or spaces)
  const gradId = `grad_${title.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const gridLineColor = isDark ? '#334155' : '#F1F5F9';

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={[styles.title, isDark && styles.titleDark]}>{title}</Text>
          <View style={styles.valBadgeRow}>
            <Text style={[styles.currentValue, isDark && styles.currentValueDark]}>{activePoint ? activePoint.val.toFixed(1).replace('.0', '') : '--'}</Text>
            <Text style={styles.unitText}>{unit}</Text>
            {selectedIndex !== null && (
              <View style={[styles.timeTooltip, isDark && styles.timeTooltipDark]}>
                <Text style={[styles.timeTooltipText, isDark && styles.timeTooltipTextDark]}>{activePoint.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Timeframe Chips */}
        <View style={[styles.timeframeContainer, isDark && styles.timeframeContainerDark]}>
          {(['Today', '7 Days', '30 Days'] as Timeframe[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.tfChip, timeframe === tf && { backgroundColor: color }]}
              onPress={() => {
                setTimeframe(tf);
                setSelectedIndex(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tfText, isDark && styles.tfTextDark, timeframe === tf && styles.tfTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Quick Bar */}
      <View style={[styles.statsBar, isDark && styles.statsBarDark]}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>AVG</Text>
          <Text style={[styles.statVal, isDark && styles.statValDark]}>{avgVal} {unit}</Text>
        </View>
        <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MIN</Text>
          <Text style={[styles.statVal, isDark && styles.statValDark]}>{minObserved} {unit}</Text>
        </View>
        <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MAX</Text>
          <Text style={[styles.statVal, isDark && styles.statValDark]}>{maxObserved} {unit}</Text>
        </View>
      </View>

      {/* SVG Smooth Curve Chart */}
      <View style={styles.chartContainer}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={isDark ? "0.35" : "0.25"} />
              <Stop offset="70%" stopColor={color} stopOpacity="0.05" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Background Grid Lines */}
          <Line x1={paddingX} y1={gridY1} x2={width - paddingX} y2={gridY1} stroke={gridLineColor} strokeWidth="1" strokeDasharray="4 4" />
          <Line x1={paddingX} y1={gridY2} x2={width - paddingX} y2={gridY2} stroke={gridLineColor} strokeWidth="1" strokeDasharray="4 4" />
          <Line x1={paddingX} y1={gridY3} x2={width - paddingX} y2={gridY3} stroke={gridLineColor} strokeWidth="1" strokeDasharray="4 4" />

          {/* Baseline Indicator Line if specified */}
          {baselineMax && baselineMin && (
            <Line
              x1={paddingX}
              y1={height - paddingBottom - ((baselineMax - minVal) / (maxVal - minVal || 1)) * (height - paddingTop - paddingBottom)}
              x2={width - paddingX}
              y2={height - paddingBottom - ((baselineMax - minVal) / (maxVal - minVal || 1)) * (height - paddingTop - paddingBottom)}
              stroke={isDark ? "#475569" : "#CBD5E1"}
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
          )}

          {/* Light Soft Gradient Fill */}
          <Path d={smoothAreaD} fill={`url(#${gradId})`} />

          {/* Smooth Curved Trend Line */}
          <Path d={smoothLineD} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Node Circles & Touch Targets */}
          {points.map((pt, idx) => {
            const isSelected = selectedIndex === idx || (selectedIndex === null && idx === points.length - 1);
            return (
              <React.Fragment key={idx}>
                {isSelected && (
                  <>
                    <Line x1={pt.x} y1={paddingTop} x2={pt.x} y2={height - paddingBottom} stroke={color} strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
                    <Circle cx={pt.x} cy={pt.y} r={7} fill={color} opacity={0.25} />
                  </>
                )}
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 4.5 : 2.5}
                  fill={isSelected ? (isDark ? '#0F172A' : '#FFFFFF') : color}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 0}
                />
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* X-Axis Labels with Touch Selection */}
      <View style={styles.labelsRow}>
        {points.map((pt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setSelectedIndex(idx)}
            style={styles.labelTouch}
            activeOpacity={0.6}
          >
            <Text style={[styles.labelX, isDark && styles.labelXDark, (selectedIndex === idx || (selectedIndex === null && idx === points.length - 1)) && { color, fontWeight: '800' }]}>
              {pt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    shadowColor: '#000000',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  titleDark: {
    color: '#94A3B8',
  },
  valBadgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  currentValueDark: {
    color: '#F8FAFC',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  timeTooltip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  timeTooltipDark: {
    backgroundColor: '#0F172A',
  },
  timeTooltipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  timeTooltipTextDark: {
    color: '#CBD5E1',
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  timeframeContainerDark: {
    backgroundColor: '#0F172A',
  },
  tfChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  tfText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tfTextDark: {
    color: '#94A3B8',
  },
  tfTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statsBarDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  statVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginTop: 1,
  },
  statValDark: {
    color: '#F8FAFC',
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  statDividerDark: {
    backgroundColor: '#334155',
  },
  chartContainer: {
    marginTop: 2,
    alignItems: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
  },
  labelTouch: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  labelX: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  labelXDark: {
    color: '#64748B',
  },
});


