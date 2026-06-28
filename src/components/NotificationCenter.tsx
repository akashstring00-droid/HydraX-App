import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, useWindowDimensions, Platform } from 'react-native';
import { X, CheckCheck, AlertCircle, Info, ShieldAlert, Check, Bell, BellOff, Clock } from 'lucide-react-native';
import { useSettingsStore, NotificationItem } from '../store/useSettingsStore';
import { GlassCard } from './GlassCard';
import { useTranslation } from '../store/i18n';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ visible, onClose }) => {
  const { notifications, markNotificationRead, clearNotifications, muteNotifications, toggleMuteNotifications, snoozeNotification } = useSettingsStore();
  const darkMode = useSettingsStore((state) => state.darkMode);
  const { t } = useTranslation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const slideAnim = React.useRef(new Animated.Value(360)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 360,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible && (slideAnim as any)._value === 360) {
    return null;
  }

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert size={18} color="#FF4D6D" />;
      case 'warning':
        return <AlertCircle size={18} color="#FFAD33" />;
      case 'success':
        return <Check size={18} color="#00FFB2" />;
      default:
        return <Info size={18} color="#14B8FF" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isDesktop = windowWidth >= 768;
  const drawerWidth = isDesktop ? 360 : windowWidth;

  // Filter out notifications that are currently snoozed
  const now = new Date();
  const activeNotifications = notifications.filter((item) => {
    if (item.snoozedUntil) {
      const snoozedDate = new Date(item.snoozedUntil);
      if (snoozedDate > now) {
        return false;
      }
    }
    return true;
  });

  return (
    <View style={[styles.overlay, { width: windowWidth, height: windowHeight }]} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Background Dimmer Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose} 
      />

      {/* Slide Drawer Panel */}
      <Animated.View 
        style={[
          styles.drawer, 
          { 
            width: drawerWidth, 
            height: windowHeight,
            backgroundColor: darkMode ? '#070D1E' : '#FFFFFF',
            borderLeftColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View style={[styles.header, { borderBottomColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0' }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Alert Center</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={darkMode ? '#8E9AA6' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionLink} onPress={handleMarkAllRead}>
              <CheckCheck size={14} color="#00E5C3" style={{ marginRight: 4 }} />
              <Text style={styles.actionText}>Read All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionLink} onPress={clearNotifications}>
              <Text style={[styles.actionText, { color: '#FF4D6D' }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Mute Notifications Toggle */}
          <View style={[styles.muteRow, { borderTopColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0', borderTopWidth: 1, paddingTop: 10, marginTop: 10 }]}>
            <View style={styles.muteRowLeft}>
              {muteNotifications ? (
                <BellOff size={16} color="#FF4D6D" style={{ marginRight: 8 }} />
              ) : (
                <Bell size={16} color="#00E5C3" style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.muteText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Mute Alerts</Text>
            </View>
            <TouchableOpacity 
              onPress={toggleMuteNotifications} 
              style={[
                styles.muteSwitch, 
                { backgroundColor: muteNotifications ? '#FF4D6D' : (darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0') }
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.muteSwitchKnob, { alignSelf: muteNotifications ? 'flex-end' : 'flex-start' }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll Notifications List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {activeNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertCircle size={40} color={darkMode ? '#1E293B' : '#E2E8F0'} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>No active notifications</Text>
            </View>
          ) : (
            activeNotifications.map((item) => (
              <GlassCard 
                key={item.id} 
                style={[
                  styles.card, 
                  { 
                    backgroundColor: item.read 
                      ? (darkMode ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)')
                      : (darkMode ? 'rgba(0, 229, 195, 0.02)' : 'rgba(0, 229, 195, 0.03)'),
                    borderColor: !item.read 
                      ? 'rgba(0, 229, 195, 0.15)'
                      : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#E2E8F0')
                  }
                ]}
              >
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => markNotificationRead(item.id)}
                  style={styles.cardPressable}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F1F5F9' }]}>
                        {getIcon(item.type)}
                      </View>
                      <Text style={[
                        styles.cardTitle, 
                        { 
                          color: darkMode ? '#FFFFFF' : '#0F172A',
                          fontWeight: item.read ? '600' : '800'
                        }
                      ]}>
                        {item.title}
                      </Text>
                    </View>
                    <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
                  </View>
                  <Text style={[styles.cardMessage, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>
                    {item.message}
                  </Text>

                  {/* Snooze action buttons for warning and critical messages */}
                  {(item.type === 'warning' || item.type === 'critical') && !item.read && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity 
                        style={[styles.snoozeBtn, { borderColor: darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} 
                        onPress={() => snoozeNotification(item.id, 30)}
                      >
                        <Clock size={12} color="#00E5C3" style={{ marginRight: 4 }} />
                        <Text style={styles.snoozeText}>Snooze 30m</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.snoozeBtn, { borderColor: darkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} 
                        onPress={() => snoozeNotification(item.id, 60)}
                      >
                        <Clock size={12} color="#00E5C3" style={{ marginRight: 4 }} />
                        <Text style={styles.snoozeText}>Snooze 1h</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!item.read && (
                    <View style={styles.unreadDot} />
                  )}
                </TouchableOpacity>
              </GlassCard>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawer: {
    borderLeftWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    justifyContent: 'flex-start',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E5C3',
  },
  muteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  muteRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muteText: {
    fontSize: 13,
    fontWeight: '700',
  },
  muteSwitch: {
    width: 38,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  muteSwitchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPressable: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 13,
    letterSpacing: -0.2,
    flex: 1,
  },
  cardTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E9AA6',
    marginLeft: 8,
  },
  cardMessage: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  snoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  snoozeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00E5C3',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5C3',
  },
});
