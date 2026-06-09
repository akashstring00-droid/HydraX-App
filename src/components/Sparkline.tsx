import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  width = 65,
  height = 25,
  strokeWidth = 2,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  // Compute points
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    // Invert y because SVG 0 is at the top
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  // Build path
  let pathStr = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    // We can make it smooth by using quadratic bezier curves, but linear line works great for mini-sparklines
    pathStr += ` L ${points[i].x} ${points[i].y}`;
  }

  const gradId = `sparkline-grad-${color.replace('#', '')}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="50%" stopColor={color} stopOpacity={1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.6} />
        </LinearGradient>
      </Defs>
      <Path
        d={pathStr}
        fill="transparent"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
