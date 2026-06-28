import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Filter, 
  Download, 
  Droplet, 
  Activity, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  X,
  Award,
  ChevronRight,
  Info
} from 'lucide-react-native';

import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { useToastStore } from '../store/useToastStore';
import { GlassCard } from '../components/GlassCard';

interface TimelineEvent {
  id: string;
  timestamp: string; // ISO String
  title: string;
  description: string;
  category: 'water' | 'symptom' | 'device' | 'alert' | 'badge';
  type: 'info' | 'success' | 'warning' | 'critical';
  meta?: any;
}

export const TimelineScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const darkMode = useSettingsStore((state) => state.darkMode);
  const showToast = useToastStore((state) => state.showToast);

  const waterLogs = useWaterStore((state) => state.logs);
  const symptomLogs = useDiarrheaStore((state) => state.logs);
  const notifications = useSettingsStore((state) => state.notifications);
  const badges = useGoalsStore((state) => state.badges);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days' | 'custom'>('today');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'water' | 'symptom' | 'device' | 'alert' | 'badge'>('all');
  
  // Custom Date range states
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [showCustomRangeInput, setShowCustomRangeInput] = useState(false);

  // Compile all store metrics into a single chronological feed
  const timelineEvents = useMemo(() => {
    const list: TimelineEvent[] = [];

    // 1. Hydration events
    waterLogs.forEach((w) => {
      list.push({
        id: w.id,
        timestamp: w.timestamp,
        title: `Logged Water`,
        description: `Logged +${w.amount}ml of water intake.`,
        category: 'water',
        type: 'success',
        meta: { amount: w.amount }
      });
    });

    // 2. Symptom events
    symptomLogs.forEach((s) => {
      list.push({
        id: s.id,
        timestamp: s.timestamp,
        title: `Digestive Incident (${s.severity} Severity)`,
        description: `Bristol Stool Type ${s.stoolType}, frequency: ${s.frequency} events. Estimated loss: ${s.fluidLossEstimate}ml.`,
        category: 'symptom',
        type: s.severity === 'Severe' ? 'critical' : s.severity === 'Moderate' ? 'warning' : 'info',
        meta: { stoolType: s.stoolType, Cramping: s.cramping }
      });
    });

    // 3. System Alerts & Notifications (filtered out currently snoozed ones for timeline consistency)
    notifications.forEach((n) => {
      const now = new Date();
      if (n.snoozedUntil && new Date(n.snoozedUntil) > now) {
        return;
      }
      list.push({
        id: n.id,
        timestamp: n.timestamp,
        title: n.title,
        description: n.message,
        category: 'alert',
        type: n.type,
      });
    });

    // 4. Badges / Streaks Achievements
    badges.forEach((b) => {
      list.push({
        id: b.id,
        timestamp: b.dateEarned,
        title: `Badge Earned: ${b.name}`,
        description: b.description,
        category: 'badge',
        type: b.tier === 'platinum' || b.tier === 'gold' ? 'success' : 'info',
        meta: { tier: b.tier }
      });
    });

    // 5. Inject mock BLE sync logs to simulate real device streaming audit
    const baseDate = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(baseDate);
      d.setHours(baseDate.getHours() - i * 6 - 2);
      list.push({
        id: `device-sync-${i}`,
        timestamp: d.toISOString(),
        title: `Device Synced`,
        description: `Simulated bio-metrics streams verified and cached. Diagnostic channels optimal.`,
        category: 'device',
        type: 'info'
      });
    }

    // Sort descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [waterLogs, symptomLogs, notifications, badges]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    const now = new Date();
    
    return timelineEvents.filter((event) => {
      // 1. Search filter
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        event.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && event.category !== selectedCategory) {
        return false;
      }

      // 3. Timeframe filter
      const eventDate = new Date(event.timestamp);
      if (timeframe === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return eventDate >= startOfToday;
      } else if (timeframe === '7days') {
        const startOf7d = new Date();
        startOf7d.setDate(now.getDate() - 7);
        return eventDate >= startOf7d;
      } else if (timeframe === '30days') {
        const startOf30d = new Date();
        startOf30d.setDate(now.getDate() - 30);
        return eventDate >= startOf30d;
      } else if (timeframe === 'custom') {
        const startDate = new Date(customStartDate + 'T00:00:00');
        const endDate = new Date(customEndDate + 'T23:59:59');
        return eventDate >= startDate && eventDate <= endDate;
      }

      return true;
    });
  }, [timelineEvents, searchQuery, timeframe, selectedCategory, customStartDate, customEndDate]);

  const handleExport = (format: 'csv' | 'json') => {
    try {
      if (format === 'json') {
        const dataStr = JSON.stringify(filteredEvents, null, 2);
        if (Platform.OS === 'web') {
          const blob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hydrax_timeline_${timeframe}.json`;
          link.click();
          URL.revokeObjectURL(url);
        }
        showToast('Timeline JSON exported successfully!', 'success');
      } else {
        // CSV
        const headers = ['ID', 'Timestamp', 'Title', 'Description', 'Category', 'AlertLevel'];
        const rows = filteredEvents.map(e => [
          e.id,
          e.timestamp,
          `"${e.title.replace(/"/g, '""')}"`,
          `"${e.description.replace(/"/g, '""')}"`,
          e.category,
          e.type
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        if (Platform.OS === 'web') {
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hydrax_timeline_${timeframe}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }
        showToast('Timeline CSV exported successfully!', 'success');
      }
    } catch (err) {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const getEventIcon = (category: TimelineEvent['category']) => {
    switch (category) {
      case 'water':
        return <Droplet size={16} color="#00E5C3" fill="#00E5C3" />;
      case 'symptom':
        return <AlertTriangle size={16} color="#FFAD33" />;
      case 'device':
        return <Cpu size={16} color="#14B8FF" />;
      case 'badge':
        return <Award size={16} color="#FFD700" />;
      default:
        return <Info size={16} color="#8E9AA6" />;
    }
  };

  const getEventBorderColor = (type: TimelineEvent['type']) => {
    if (darkMode) {
      switch (type) {
        case 'critical': return 'rgba(255, 77, 109, 0.4)';
        case 'warning': return 'rgba(255, 173, 51, 0.4)';
        case 'success': return 'rgba(0, 255, 178, 0.4)';
        default: return 'rgba(255, 255, 255, 0.05)';
      }
    } else {
      switch (type) {
        case 'critical': return '#FECDD3';
        case 'warning': return '#FEF08A';
        case 'success': return '#86EFAC';
        default: return '#E2E8F0';
      }
    }
  };

  const formatDateLabel = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Theme variable colors
  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const bgCard = darkMode ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textPrimary }]}>Health Timeline</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>Chronological stream of bio-metrics, water logs, and diagnostic events</Text>
        </View>
        
        {/* Export buttons */}
        <View style={styles.exportRow}>
          <TouchableOpacity 
            style={[styles.exportBtn, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF' }]} 
            onPress={() => handleExport('csv')}
          >
            <Download size={14} color="#00E5C3" style={{ marginRight: 6 }} />
            <Text style={[styles.exportBtnText, { color: textPrimary }]}>CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.exportBtn, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF' }]} 
            onPress={() => handleExport('json')}
          >
            <Download size={14} color="#00E5C3" style={{ marginRight: 6 }} />
            <Text style={[styles.exportBtnText, { color: textPrimary }]}>JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search & Timeframes row */}
        <GlassCard style={styles.filterCard} borderColor={borderCol}>
          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F1F5F9', borderColor: borderCol }]}>
            <Search size={16} color={textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Search timeline events..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Timeframe selector */}
          <View style={styles.filterTabsRow}>
            {(['today', '7days', '30days', 'custom'] as const).map((t) => {
              const active = timeframe === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tabBtn,
                    active && { backgroundColor: '#00E5C3' }
                  ]}
                  onPress={() => {
                    setTimeframe(t);
                    if (t === 'custom') {
                      setShowCustomRangeInput(true);
                    } else {
                      setShowCustomRangeInput(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.tabBtnText,
                    { color: active ? '#050B18' : textSecondary }
                  ]}>
                    {t === 'today' ? 'Today' : t === '7days' ? '7 Days' : t === '30days' ? '30 Days' : 'Custom'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Date Picker inputs (Mocked style inputs for web/mobile compatibility) */}
          {showCustomRangeInput && (
            <View style={styles.customDateContainer}>
              <View style={styles.customDateCol}>
                <Text style={styles.customDateLabel}>Start Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.customDateInput, { color: textPrimary, borderColor: borderCol, backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#FFFFFF' }]}
                  value={customStartDate}
                  onChangeText={setCustomStartDate}
                />
              </View>
              <View style={styles.customDateCol}>
                <Text style={styles.customDateLabel}>End Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.customDateInput, { color: textPrimary, borderColor: borderCol, backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : '#FFFFFF' }]}
                  value={customEndDate}
                  onChangeText={setCustomEndDate}
                />
              </View>
            </View>
          )}

          {/* Event Category pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPills}>
            {(['all', 'water', 'symptom', 'device', 'alert', 'badge'] as const).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    { 
                      backgroundColor: active ? 'rgba(0, 229, 195, 0.15)' : (darkMode ? 'rgba(255,255,255,0.02)' : '#F1F5F9'),
                      borderColor: active ? '#00E5C3' : borderCol
                    }
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.categoryPillText,
                    { color: active ? '#00E5C3' : textSecondary }
                  ]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </GlassCard>

        {/* Timeline Events render */}
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={darkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0'} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>No matching events found for this timeframe.</Text>
          </View>
        ) : (
          <View style={styles.timelineList}>
            {/* Draw a vertical centerline connector */}
            <View style={[styles.timelineLine, { backgroundColor: borderCol }]} />

            {filteredEvents.map((event, index) => (
              <View key={event.id} style={styles.timelineItem}>
                {/* Node icon */}
                <View style={[
                  styles.timelineNode, 
                  { 
                    backgroundColor: darkMode ? '#050B18' : '#F8FAFC',
                    borderColor: getEventBorderColor(event.type)
                  }
                ]}>
                  <View style={[styles.nodeIconBg, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F1F5F9' }]}>
                    {getEventIcon(event.category)}
                  </View>
                </View>

                {/* Event Card content */}
                <View style={styles.timelineContentWrapper}>
                  <GlassCard 
                    style={styles.eventCard} 
                    borderColor={getEventBorderColor(event.type)}
                  >
                    <View style={styles.eventHeader}>
                      <Text style={[styles.eventTitle, { color: textPrimary }]}>{event.title}</Text>
                      <Text style={styles.eventTime}>{formatDateLabel(event.timestamp)}</Text>
                    </View>
                    <Text style={[styles.eventDesc, { color: textSecondary }]}>{event.description}</Text>
                    
                    {/* Category pill indicator */}
                    <View style={styles.cardFooter}>
                      <View style={[styles.categoryBadge, { backgroundColor: darkMode ? 'rgba(255,255,255,0.04)' : '#F1F5F9' }]}>
                        <Text style={[styles.categoryBadgeText, { color: textSecondary }]}>{event.category.toUpperCase()}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  filterCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  customDateCol: {
    flex: 1,
  },
  customDateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E9AA6',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  customDateInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPills: {
    flexDirection: 'row',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  timelineList: {
    position: 'relative',
    paddingLeft: 40,
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 10,
    bottom: 10,
    width: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineNode: {
    position: 'absolute',
    left: -40,
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContentWrapper: {
    flex: 1,
  },
  eventCard: {
    borderRadius: 16,
    padding: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  eventTime: {
    fontSize: 10,
    color: '#8E9AA6',
    fontWeight: '600',
    marginLeft: 8,
  },
  eventDesc: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
});
