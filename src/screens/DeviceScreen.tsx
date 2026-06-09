import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBLEStore, BLEDevice } from '../store/useBLEStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from '../components/GlassCard';
import { 
  Cpu, 
  Wifi, 
  Battery as BatteryIcon, 
  Search, 
  Link2, 
  Link2Off, 
  RefreshCw, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Signal
} from 'lucide-react-native';
import Svg, { Circle, G } from 'react-native-svg';

export const DeviceScreen: React.FC = () => {
  const { 
    devices, 
    connectedDevice, 
    isScanning, 
    isDemoMode,
    batteryLevel, 
    startScan, 
    stopScan, 
    connectDevice, 
    disconnectDevice, 
    toggleDemoMode 
  } = useBLEStore();

  const darkMode = useSettingsStore((state) => state.darkMode);
  const styles = getStyles(darkMode);

  const [connectingId, setConnectingId] = React.useState<string | null>(null);

  // Firmware update state
  const [firmwareVersion, setFirmwareVersion] = React.useState<string>('v1.0.3');
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = React.useState<number>(0);
  const [updateLog, setUpdateLog] = React.useState<string[]>([]);
  const [updateStatus, setUpdateStatus] = React.useState<string>('');

  const triggerFirmwareUpdate = () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateLog([]);
    setUpdateStatus('Starting...');

    const logs = [
      { p: 5, t: 'Fetching Hydrax-OS binary from server...' },
      { p: 15, t: 'Downloading hydrax-os-1.0.4.bin [1.8 MB]...' },
      { p: 30, t: 'Connecting to band via Secure BLE channel...' },
      { p: 45, t: 'Verifying cryptographic binary signature...' },
      { p: 55, t: 'Flashing sectors 0x08000000 to 0x08100000...' },
      { p: 70, t: 'Validating payload checksum (MD5 matches)...' },
      { p: 85, t: 'Finalizing hardware installation...' },
      { p: 95, t: 'Rebooting Hydrax wearable band...' },
      { p: 100, t: 'Reconnected! Device running Hydrax-OS v1.0.4.' }
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      const currentLog = logs[currentLogIndex];
      if (currentLog) {
        setUpdateProgress(currentLog.p);
        setUpdateStatus(currentLog.t);
        setUpdateLog(prev => [...prev, `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] ${currentLog.t}`]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setFirmwareVersion('v1.0.4');
        setIsUpdating(false);
      }
    }, 1000);
  };

  // Radar animation controller
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isScanning) {
      pulseAnim.setValue(0);
      animation = Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      pulseAnim.setValue(0);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isScanning]);

  const handleStartScan = () => {
    startScan();
    // Auto stop scan after 5 seconds
    setTimeout(() => {
      stopScan();
    }, 5000);
  };

  const handleConnect = async (device: BLEDevice) => {
    setConnectingId(device.id);
    try {
      await connectDevice(device);
    } catch (err) {
      console.log('Connect error', err);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectDevice();
    } catch (err) {
      console.log('Disconnect error', err);
    }
  };

  const radarScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1.3]
  });

  const radarOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.8, 0.3, 0]
  });

  // Signal Strength categorizer
  const getSignalStrength = (rssi?: number) => {
    if (!rssi) return 'Unknown';
    if (rssi > -60) return 'Strong';
    if (rssi > -80) return 'Moderate';
    return 'Weak';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.bannerSubtitle}>Connectivity Hub</Text>
          <Text style={styles.bannerTitle}>Hydrax Band Manager</Text>
        </View>

        {/* Device Status Board */}
        <GlassCard style={styles.statusCard} borderColor={darkMode ? 'rgba(0, 229, 195, 0.1)' : 'rgba(0, 229, 195, 0.15)'}>
          <View style={styles.statusHeader}>
            
            {/* Connection Avatar */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarBackglow, { backgroundColor: connectedDevice ? 'rgba(0, 229, 195, 0.1)' : 'rgba(255, 77, 109, 0.1)' }]} />
              <View style={styles.avatarInner}>
                <Cpu size={36} color={connectedDevice ? '#00E5C3' : (darkMode ? '#8E9AA6' : '#64748B')} />
              </View>
              {connectedDevice && (
                <View style={styles.badgeCheck}>
                  <ShieldCheck size={14} color="#050B18" strokeWidth={3} />
                </View>
              )}
            </View>

            <Text style={styles.connectedDeviceName}>
              {connectedDevice ? connectedDevice.name : 'Hardware Disconnected'}
            </Text>
            
            <Text style={styles.connectedDeviceSub}>
              {connectedDevice ? `Device ID: ${connectedDevice.id}` : 'Syncing requires Bluetooth Low Energy connection'}
            </Text>

            {connectedDevice ? (
              <View style={styles.statusChipsRow}>
                <View style={styles.statChip}>
                  <BatteryIcon size={16} color="#00E5C3" />
                  <Text style={styles.statChipText}>{batteryLevel}%</Text>
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.statChip}>
                  <Signal size={16} color="#00FFB2" />
                  <Text style={styles.statChipText}>Strong Signal</Text>
                </View>
              </View>
            ) : (
              <View style={styles.warningAlertBox}>
                <AlertCircle size={14} color="#FFAD33" />
                <Text style={styles.warningAlertText}>
                  Pending Band Connection
                </Text>
              </View>
            )}
          </View>

          {/* Connect Actions */}
          {connectedDevice && (
            <TouchableOpacity
              onPress={handleDisconnect}
              style={styles.disconnectBtn}
            >
              <Link2Off size={16} color="#FF4D6D" />
              <Text style={styles.disconnectBtnText}>
                Disconnect Band
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Demo Simulation Switch Card */}
        <GlassCard style={styles.cardSection} borderColor={darkMode ? 'rgba(0, 229, 195, 0.1)' : 'rgba(0, 229, 195, 0.15)'}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.cardHeaderTitle}>Hardware Simulator (Demo Mode)</Text>
              <Text style={styles.cardHeaderDesc}>
                Enables instant mock vitals streaming for demonstrating UI graphs and features.
              </Text>
            </View>
            <TouchableOpacity onPress={toggleDemoMode}>
              {isDemoMode ? (
                <ToggleRight size={44} color="#00E5C3" fill="#00E5C3" />
              ) : (
                <ToggleLeft size={44} color={darkMode ? '#3A506B' : '#CBD5E1'} />
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Firmware Update Card */}
        <GlassCard style={styles.cardSection} borderColor={darkMode ? 'rgba(0, 229, 195, 0.1)' : 'rgba(0, 229, 195, 0.15)'}>
          <View style={styles.firmwareHeader}>
            <View>
              <Text style={styles.cardHeaderTitle}>Device Firmware</Text>
              <Text style={styles.firmwareSub}>
                Current: {firmwareVersion}
              </Text>
            </View>
            {connectedDevice ? (
              <TouchableOpacity
                onPress={triggerFirmwareUpdate}
                disabled={isUpdating}
                style={[styles.updateBtn, { backgroundColor: isUpdating ? 'rgba(0, 229, 195, 0.1)' : '#00E5C3' }]}
              >
                <RefreshCw size={12} color={isUpdating ? '#00E5C3' : '#050B18'} />
                <Text style={[styles.updateBtnText, { color: isUpdating ? '#00E5C3' : '#050B18' }]}>
                  {isUpdating ? 'Updating...' : firmwareVersion === 'v1.0.4' ? 'Re-install' : 'Update OS'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.disabledBadge}>
                <Text style={styles.disabledBadgeText}>No Device</Text>
              </View>
            )}
          </View>

          {isUpdating && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressStatusText} numberOfLines={1}>{updateStatus}</Text>
                <Text style={styles.progressPercent}>{updateProgress}%</Text>
              </View>
              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View 
                  style={[styles.progressBarFill, { width: `${updateProgress}%` }]} 
                />
              </View>

              {/* Console log */}
              <View style={styles.consoleLog}>
                <ScrollView 
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {updateLog.map((logLine, idx) => (
                    <Text key={idx} style={styles.consoleLine}>
                      {logLine}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {!isUpdating && firmwareVersion === 'v1.0.3' && (
            <View style={styles.statusTipBanner}>
              <AlertCircle size={14} color="#00E5C3" />
              <Text style={styles.statusTipText}>
                Hydrax-OS v1.0.4 is available. Includes enhanced motion-noise rejection filter.
              </Text>
            </View>
          )}

          {!isUpdating && firmwareVersion === 'v1.0.4' && (
            <View style={[styles.statusTipBanner, { backgroundColor: 'rgba(0, 255, 178, 0.08)', borderColor: 'rgba(0, 255, 178, 0.15)' }]}>
              <ShieldCheck size={14} color="#00FFB2" />
              <Text style={[styles.statusTipText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>
                Your Hydrax wearable is running the latest OS build. Vitals analysis calibration active.
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Bluetooth Device Scanner Board */}
        <GlassCard style={{ padding: 20, marginBottom: 40 }}>
          <View style={styles.scannerHeader}>
            <View>
              <Text style={styles.cardHeaderTitle}>Local BLE Scanner</Text>
              <Text style={styles.scannerSub}>
                Scan for active Hydrax bands
              </Text>
            </View>
            <TouchableOpacity
              onPress={isScanning ? stopScan : handleStartScan}
              style={[styles.scanToggleBtn, { backgroundColor: isScanning ? '#00E5C3' : (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)') }]}
            >
              {isScanning ? (
                <RefreshCw size={16} color="#050B18" />
              ) : (
                <Search size={16} color={darkMode ? '#FFFFFF' : '#0F172A'} />
              )}
            </TouchableOpacity>
          </View>

          {/* Radar animation */}
          {isScanning && (
            <View style={styles.radarContainer}>
              <Animated.View
                style={[
                  styles.radarCircle,
                  {
                    transform: [{ scale: radarScale }],
                    opacity: radarOpacity,
                    borderColor: '#00E5C3',
                  }
                ]}
              />
              <View style={styles.radarCenterDot}>
                <Wifi size={20} color="#00E5C3" />
              </View>
              <Text style={styles.radarActiveText}>Scanning for signals...</Text>
            </View>
          )}

          {/* Devices List */}
          {!isScanning && devices.length === 0 && (
            <View style={styles.emptyScannerContainer}>
              <Link2 size={24} color={darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} />
              <Text style={styles.emptyScannerText}>
                No active bands found in vicinity.{'\n'}Tap search above to scan BLE peripherals.
              </Text>
            </View>
          )}

          {devices.map((device) => {
            const isDeviceConnecting = connectingId === device.id;
            const isDeviceConnected = connectedDevice?.id === device.id;

            return (
              <View 
                key={device.id} 
                style={styles.deviceListItem}
              >
                <View style={styles.deviceItemLeft}>
                  <View style={styles.deviceIconBox}>
                    <Cpu size={14} color={darkMode ? '#FFFFFF' : '#0F172A'} />
                  </View>
                  <View>
                    <Text style={styles.deviceItemName}>{device.name}</Text>
                    <Text style={styles.deviceItemRssi}>
                      RSSI: {device.rssi ?? 'N/A'} dBm ({getSignalStrength(device.rssi)})
                    </Text>
                  </View>
                </View>

                {isDeviceConnected ? (
                  <View style={styles.connectedLabelBadge}>
                    <Text style={styles.connectedLabelBadgeText}>Connected</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleConnect(device)}
                    disabled={isDeviceConnecting}
                    style={styles.connectDeviceBtn}
                  >
                    {isDeviceConnecting ? (
                      <ActivityIndicator size="small" color="#00E5C3" />
                    ) : (
                      <Text style={styles.connectDeviceBtnText}>Connect</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </GlassCard>

      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#050B18' : '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  bannerTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  bannerSubtitle: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Status board card
  statusCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
  statusHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBackglow: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: -8,
    bottom: -8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00FFB2',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: darkMode ? '#050B18' : '#FFFFFF',
  },
  connectedDeviceName: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  connectedDeviceSub: {
    color: darkMode ? '#8E9AA6' : '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  statusChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChipText: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
  },
  dividerLine: {
    width: 1,
    height: 16,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 20,
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255, 173, 51, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 173, 51, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  warningAlertText: {
    color: '#FFAD33',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  disconnectBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.18)',
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectBtnText: {
    color: '#FF4D6D',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 8,
  },

  // Sections
  cardSection: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  cardHeaderDesc: {
    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : '#475569',
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '600',
  },
  firmwareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  firmwareSub: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  updateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  disabledBadge: {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  disabledBadgeText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  progressStatusText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#334155',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  progressPercent: {
    color: '#00E5C3',
    fontSize: 12,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: borderTheme(darkMode),
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E5C3',
    borderRadius: 4,
  },
  consoleLog: {
    backgroundColor: darkMode ? 'rgba(5, 11, 24, 0.5)' : '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#334155',
    height: 110,
  },
  consoleLine: {
    color: '#00FFB2',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  statusTipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 195, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginTop: 12,
  },
  statusTipText: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 10,
    flex: 1,
    lineHeight: 14,
  },

  // Scanner board styling
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    paddingBottom: 10,
    marginBottom: 16,
  },
  scannerSub: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  scanToggleBtn: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  radarCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2.5,
  },
  radarCenterDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 195, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarActiveText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#334155',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 16,
  },
  emptyScannerContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyScannerText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    fontWeight: '600',
  },

  // Device list
  deviceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  deviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconBox: {
    padding: 8,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
    borderWidth: 1,
    borderColor: borderTheme(darkMode),
    borderRadius: 10,
    marginRight: 12,
  },
  deviceItemName: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  deviceItemRssi: {
    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : '#64748B',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  connectedLabelBadge: {
    backgroundColor: 'rgba(0, 255, 178, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 178, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  connectedLabelBadgeText: {
    color: '#00FFB2',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  connectDeviceBtn: {
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  connectDeviceBtnText: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});

const borderTheme = (darkMode: boolean) => darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
