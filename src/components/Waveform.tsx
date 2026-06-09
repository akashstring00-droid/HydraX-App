import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useVitalsStore, DataPoint } from '../store/useVitalsStore';

interface WaveformProps {
  width?: number;
  height?: number;
  color?: string;
}

export const Waveform: React.FC<WaveformProps> = ({
  width = 160,
  height = 40,
  color = '#FF4D6D', // Pulse pink-red by default
}) => {
  const ppgBuffer = useVitalsStore((state) => state.ppgBuffer);

  if (!ppgBuffer || ppgBuffer.length < 2) {
    return <View style={{ width, height }} />;
  }

  // Take the last 30 data points for a clean scrolling window
  const activeData = ppgBuffer.slice(-30);

  const min = Math.min(...activeData.map((d) => d.value));
  const max = Math.max(...activeData.map((d) => d.value));
  const range = max - min === 0 ? 1 : max - min;

  // Map buffer data to SVG coordinate space
  const points = activeData.map((val, index) => {
    const x = (index / (activeData.length - 1)) * width;
    // Map value with 5px padding top/bottom and invert Y
    const y = height - ((val.value - min) / range) * (height - 10) - 5;
    return { x, y };
  });

  // Generate a smooth path using bezier interpolation
  let pathStr = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    // Curved smooth connections
    pathStr += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const gradId = `ppg-glow-${color.replace('#', '')}`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.4} />
          </LinearGradient>
        </Defs>

        {/* Glow Shadow Line */}
        <Path
          d={pathStr}
          fill="transparent"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
        />

        {/* Main Neon Line */}
        <Path
          d={pathStr}
          fill="transparent"
          stroke={`url(#${gradId})`}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
