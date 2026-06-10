import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Droplet, Calendar, Cpu, Brain, Sparkles, Trash2 } from 'lucide-react-native';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from './GlassCard';

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO string
  type: 'water' | 'symptom' | 'sync' | 'ai';
  title: string;
  description: string;
  meta?: string;
}

export const Timeline: React.FC = () => {
  const { logs: waterLogs } = useWaterStore();
  const { logs: symptomLogs } = useDiarrheaStore();
  const darkMode = useSettingsStore((state) => state.darkMode);

  // Collate logs and static simulated events into a single sorted timeline
  const getEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // 1. Water logs
    waterLogs.forEach((log) => {
      events.push({
        id: log.id,
        timestamp: log.timestamp,
        type: 'water',
        title: `Fluid Logged`,
        description: `Logged +${log.amount} ml of hydration`,
        meta: 'Manual Input'
      });
    });

    // 2. Bowel symptom logs
    symptomLogs.forEach((log) => {
      let typeDesc = 'Normal Stool';
      if (log.stoolType >= 6) typeDesc = 'Diarrhea Symptoms';
      else if (log.stoolType <= 2) typeDesc = 'Constipation symptoms';

      events.push({
        id: log.id,
        timestamp: log.timestamp,
        type: 'symptom',
        title: `Digestive Symptom Logged`,
        description: `${typeDesc} (Bristol Type ${log.stoolType}), Frequency: ${log.frequency}x/day, Cramping: ${log.cramping}`,
        meta: `Severity: ${log.severity}`
      });
    });

    // 3. Simulated BLE sync events
    const todayStr = new Date().toISOString().split('T')[0];
    events.push({
      id: 'sync-1',
      timestamp: new Date(`${todayStr}T08:00:00`).toISOString(),
      type: 'sync',
      title: 'Wearable Sync Established',
      description: 'Connected and synchronized heart rate, HRV, and skin temp buffers',
      meta: 'OTA Connection'
    });

    events.push({
      id: 'ai-1',
      timestamp: new Date(`${todayStr}T08:05:00`).toISOString(),
      type: 'ai',
      title: 'AI Coaching Summary Compiled',
      description: 'Analyzed physiological trend logs and updated dehydration risks',
      meta: 'AI Coach Engine'
    });

    // Sort newest first
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const timelineData = getEvents();

  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'water':
        return <Droplet size={14} color="#00E5C3" />;
      case 'symptom':
        return <Calendar size={14} color="#FF4D6D" />;
      case 'sync':
        return <Cpu size={14} color="#14B8FF" />;
      case 'ai':
        return <Brain size={14} color="#7C3AED" />;
    }
  };

  const getThemeColors = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'water':
        return { bg: 'rgba(0, 229, 195, 0.12)', border: '#00E5C3' };
      case 'symptom':
        return { bg: 'rgba(255, 77, 109, 0.12)', border: '#FF4D6D' };
      case 'sync':
        return { bg: 'rgba(20, 184, 255, 0.12)', border: '#14B8FF' };
      case 'ai':
        return { bg: 'rgba(124, 58, 237, 0.12)', border: '#7C3AED' };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      {timelineData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>No timeline events found</Text>
        </View>
      ) : (
        timelineData.map((item, index) => {
          const colors = getThemeColors(item.type);
          const isLast = index === timelineData.length - 1;

          return (
            <View key={item.id} style={styles.timelineRow}>
              {/* Timeline Indicator Column */}
              <View style={styles.indicatorCol}>
                <View style={[styles.iconCircle, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  {getIcon(item.type)}
                </View>
                {!isLast && (
                  <View style={[styles.line, { backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]} />
                )}
              </View>

              {/* Event Content Column */}
              <View style={styles.contentCol}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.eventTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{item.title}</Text>
                  <Text style={styles.eventTime}>{formatTime(item.timestamp)}</Text>
                </View>
                <Text style={[styles.eventDesc, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>{item.description}</Text>
                {item.meta && (
                  <View style={[styles.metaBadge, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F1F5F9' }]}>
                    <Text style={[styles.metaText, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>{item.meta}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  indicatorCol: {
    alignItems: 'center',
    marginRight: 16,
    width: 28,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  line: {
    position: 'absolute',
    top: 28,
    bottom: -16,
    width: 2,
    zIndex: 1,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E9AA6',
  },
  eventDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  metaBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
