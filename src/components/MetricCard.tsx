import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';
import { Sparkline } from './Sparkline';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react-native';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  trendText: string;
  isPositiveTrend: boolean;
  sparklineData: number[];
  sparklineColor: string;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  unit = '',
  trendText,
  isPositiveTrend,
  sparklineData,
  sparklineColor,
  style,
}) => {
  const trendColor = isPositiveTrend ? '#00FFB2' : '#FF4D6D';

  return (
    <GlassCard style={StyleSheet.flatten([styles.card, style])} intensity={10}>
      <View className="flex-row items-center justify-between">
        
        {/* Left: Icon & Title & Value */}
        <View className="flex-row items-center flex-1 pr-2">
          <View className="p-2.5 rounded-xl bg-white/5 mr-3">
            {icon}
          </View>
          
          <View className="flex-1">
            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider" numberOfLines={1}>
              {title}
            </Text>
            <View className="flex-row items-baseline mt-0.5">
              <Text className="text-white text-base font-black tracking-tight">
                {value}
              </Text>
              {unit ? (
                <Text className="text-white/40 text-[9px] ml-1 font-semibold">
                  {unit}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Center: Sparkline */}
        <View style={styles.sparklineContainer}>
          <Sparkline data={sparklineData} color={sparklineColor} />
        </View>

        {/* Right: Trend badge */}
        <View className="items-end ml-1">
          <View 
            className="flex-row items-center px-1.5 py-0.5 rounded-lg bg-white/5"
            style={{ borderColor: trendColor + '1A', borderWidth: 1 }}
          >
            {isPositiveTrend ? (
              <ArrowUpRight size={10} color={trendColor} />
            ) : (
              <ArrowDownRight size={10} color={trendColor} />
            )}
            <Text 
              className="text-[9px] font-bold ml-0.5" 
              style={{ color: trendColor }}
            >
              {trendText}
            </Text>
          </View>
        </View>
        
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sparklineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
