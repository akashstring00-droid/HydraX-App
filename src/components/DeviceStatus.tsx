import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DeviceConnectionState } from '../telemetry/telemetryTypes';
import { themeStore } from '../theme/ThemeStore';

interface DeviceStatusProps {
  state: DeviceConnectionState;
  onPress: () => void;
}

export const DeviceStatus: React.FC<DeviceStatusProps> = ({ state, onPress }) => {
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    const unsub = themeStore.subscribe((m) => setThemeMode(m));
    return unsub;
  }, []);

  const isDark = themeMode === 'dark';

  let statusColor = '#94A3B8'; // gray
  let statusText = 'Disconnected';

  if (state.isDemoMode) {
    statusColor = '#F59E0B'; // amber demo
    statusText = 'DEMO MODE';
  } else if (state.connected) {
    if (state.dataFreshness === 'live') {
      statusColor = '#10B981'; // green
      statusText = 'Connected • Live';
    } else if (state.dataFreshness === 'delayed') {
      statusColor = '#F59E0B'; // amber
      statusText = 'Connected • Delayed';
    } else {
      statusColor = '#EF4444'; // red
      statusText = 'Stale / Reconnecting';
    }
  } else if (state.connecting) {
    statusColor = '#F59E0B';
    statusText = 'Connecting...';
  }

  const timeAgoText = state.lastPacketAt
    ? `${Math.max(0, Math.floor((Date.now() - state.lastPacketAt) / 1000))}s ago`
    : 'No packets';

  return (
    <TouchableOpacity style={[styles.container, isDark && styles.containerDark]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <View style={styles.textCol}>
        <Text style={[styles.deviceName, isDark && styles.deviceNameDark]}>
          {state.isDemoMode ? 'HydraX-Demo-Sim' : state.deviceName || 'HydraX-Health'}
        </Text>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText} {state.connected && !state.isDemoMode ? `(${timeAgoText})` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  containerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textCol: {
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  deviceNameDark: {
    color: '#F8FAFC',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
