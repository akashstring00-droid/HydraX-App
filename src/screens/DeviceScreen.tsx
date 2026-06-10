import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing, Platform, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBLEStore, BLEDevice } from '../store/useBLEStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from '../components/GlassCard';
import { useTranslation } from '../store/i18n';
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
  Signal,
  Check,
  Server,
  Zap,
  Play,
  X
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
  const { t } = useTranslation();
  const styles = getStyles(darkMode);

  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Firmware update state
  const [firmwareVersion, setFirmwareVersion] = useState<string>('v1.0.3');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const [updateStatus, setUpdateStatus] = useState<string>('');

  // WiFi Settings mock state
  const [wifiConnected, setWifiConnected] = useState<boolean>(true);
  const [wifiSsid, setWifiSsid] = useState<string>('Hydrax-Mesh-5G');
  const [wifiIp, setWifiIp] = useState<string>('192.168.1.189');
  const [wifiSignal, setWifiSignal] = useState<number>(-55); // dBm
  const [isScanningWifi, setIsScanningWifi] = useState<boolean>(false);
  const [showWifiModal, setShowWifiModal] = useState<boolean>(false);
  const [selectedWifi, setSelectedWifi] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [isConnectingWifi, setIsConnectingWifi] = useState<boolean>(false);

  const mockWifiNetworks = [
    { ssid: 'Hydrax-Mesh-5G', signal: -45, secure: true },
    { ssid: 'Home-WiFi-Secure', signal: -62, secure: true },
    { ssid: 'Hospital-Clinic-Guest', signal: -78, secure: false },
    { ssid: 'Public-Internet-Core', signal: -85, secure: false }
  ];

  const handleScanWifi = () => {
    setIsScanningWifi(true);
    setTimeout(() => {
      setIsScanningWifi(false);
      setShowWifiModal(true);
    }, 1200);
  };

  const handleConnectWifi = () => {
    if (wifiPassword.length < 4) {
      Alert.alert('Invalid Password', 'WiFi security requires at least 4 characters.');
      return;
    }
    setIsConnectingWifi(true);
    setTimeout(() => {
      setIsConnectingWifi(false);
      setShowWifiModal(false);
      setWifiSsid(selectedWifi);
      setWifiConnected(true);
      setWifiIp(`192.168.1.${Math.floor(20 + Math.random() * 200)}`);
      setWifiSignal(-50 - Math.floor(Math.random() * 25));
      setWifiPassword('');
      Alert.alert('WiFi Connected', `Smart band connected to network: ${selectedWifi}`);
    }, 1800);
  };

  const handleDisconnectWifi = () => {
    setWifiConnected(false);
    setWifiSsid('');
    setWifiIp('');
    setWifiSignal(0);
  };

  const triggerFirmwareUpdate = () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setUpdateProgress(0);
    setUpdateLog([]);
    setUpdateStatus('Starting...');

    const logs = [
      { p: 5, t: 'Connecting to Cloud OTA Servers...' },
      { p: 15, t: 'Fetching Hydrax-OS v1.0.4 binary metadata...' },
      { p: 30, t: 'Downloading firmware payload [1.86 MB]...' },
      { p: 45, t: 'Verifying checksum signature (MD5 matches)...' },
      { p: 60, t: 'Initiating flashing protocol in sector 0x08000...' },
      { p: 75, t: 'Writing hardware registry (43% complete)...' },
      { p: 90, t: 'Validating flashed byte checksums...' },
      { p: 95, t: 'Rebooting Hydrax optical microcontroller...' },
      { p: 100, t: 'Firmware successfully updated! OS running v1.0.4.' }
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
    }, 900);
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

  const getSignalStrength = (rssi?: number) => {
    if (!rssi) return 'Unknown';
    if (rssi > -60) return 'Strong';
    if (rssi > -80) return 'Moderate';
    return 'Weak';
  };

  const isDesktop = Dimensions.get('window').width >= 768;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.bannerSubtitle}>{t('bandManager')}</Text>
          <Text style={styles.bannerTitle}>Hardware Diagnostics</Text>
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

            <Text style={[styles.connectedDeviceName, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>
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
            ) : null}

            {/* Simulated Demo Mode Toggler */}
            <View style={styles.demoModeContainer}>
              <Text style={[styles.demoModeLabel, { color: darkMode ? '#8E9AA6' : '#64748B' }]}>DEMO STREAM SIMULATOR</Text>
              <TouchableOpacity onPress={toggleDemoMode} activeOpacity={0.8}>
                {isDemoMode ? (
                  <ToggleRight size={38} color="#00E5C3" />
                ) : (
                  <ToggleLeft size={38} color={darkMode ? '#8E9AA6' : '#94A3B8'} />
                )}
              </TouchableOpacity>
            </View>

            {connectedDevice ? (
              <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect} activeOpacity={0.8}>
                <Link2Off size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.disconnectBtnText}>{t('disconnect')}</Text>
              </TouchableOpacity>
            ) : null}

          </View>
        </GlassCard>

        {/* Two-Column split details layout */}
        <View style={[styles.splitGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
          
          {/* COLUMN 1: BLE Scanner & WiFi Settings */}
          <View style={{ flex: isDesktop ? 6 : undefined, gap: 24 }}>
            
            {/* BLE scanner panel */}
            {!connectedDevice && (
              <GlassCard style={styles.subCard}>
                <View style={styles.subHeaderRow}>
                  <View>
                    <Text style={[styles.subTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('bleRadar')}</Text>
                    <Text style={styles.subDescription}>Scan nearby biometric peripherals</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.scanBtn, isScanning && { borderColor: '#00E5C3' }]} 
                    onPress={isScanning ? stopScan : handleStartScan}
                  >
                    {isScanning ? (
                      <ActivityIndicator size="small" color="#00E5C3" />
                    ) : (
                      <Search size={16} color={darkMode ? '#FFFFFF' : '#0F172A'} />
                    )}
                  </TouchableOpacity>
                </View>

                {isScanning && (
                  <View style={styles.radarContainer}>
                    <Animated.View 
                      style={[
                        styles.radarCircle, 
                        { 
                          borderColor: 'rgba(0, 229, 195, 0.4)',
                          transform: [{ scale: radarScale }],
                          opacity: radarOpacity
                        }
                      ]} 
                    />
                    <View style={styles.radarCenterDot}>
                      <Cpu size={16} color="#00E5C3" />
                    </View>
                    <Text style={styles.radarActiveText}>Scanning for Hydrax-Bands...</Text>
                  </View>
                )}

                {/* Scanned devices list */}
                <View style={{ marginTop: 12 }}>
                  {!isScanning && devices.length === 0 ? (
                    <View style={styles.emptyScannerContainer}>
                      <AlertCircle size={32} color={darkMode ? '#1E293B' : '#E2E8F0'} />
                      <Text style={styles.emptyScannerText}>Scan to pair your optical band</Text>
                    </View>
                  ) : (
                    devices.map((device) => (
                      <View key={device.id} style={styles.deviceListItem}>
                        <View style={styles.deviceItemLeft}>
                          <View style={styles.deviceIconBox}>
                            <Signal size={16} color="#00E5C3" />
                          </View>
                          <View>
                            <Text style={[styles.deviceItemName, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{device.name}</Text>
                            <Text style={styles.deviceItemRssi}>{getSignalStrength(device.rssi)} RSSI ({device.rssi || -70} dBm)</Text>
                          </View>
                        </View>

                        <TouchableOpacity 
                          style={styles.connectDeviceBtn}
                          onPress={() => handleConnect(device)}
                          disabled={connectingId !== null}
                        >
                          {connectingId === device.id ? (
                            <ActivityIndicator size="small" color="#00E5C3" />
                          ) : (
                            <Text style={styles.connectDeviceBtnText}>{t('connect')}</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </GlassCard>
            )}

            {/* WiFi Manager Panel */}
            <GlassCard style={styles.subCard}>
              <View style={styles.subHeaderRow}>
                <View>
                  <Text style={[styles.subTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('wifiManager')}</Text>
                  <Text style={styles.subDescription}>Configure band WiFi for cloud synchronization</Text>
                </View>
                <TouchableOpacity 
                  style={styles.scanBtn} 
                  onPress={handleScanWifi}
                  disabled={isScanningWifi}
                >
                  {isScanningWifi ? (
                    <ActivityIndicator size="small" color="#14B8FF" />
                  ) : (
                    <RefreshCw size={14} color={darkMode ? '#FFFFFF' : '#0F172A'} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Connected WiFi details */}
              {wifiConnected ? (
                <View style={styles.wifiDetailsContainer}>
                  <View style={styles.wifiDetailRow}>
                    <Wifi size={18} color="#14B8FF" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.wifiSsid, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{wifiSsid}</Text>
                      <Text style={styles.wifiMeta}>IP Address: {wifiIp} | Signal: {wifiSignal} dBm</Text>
                    </View>
                    <TouchableOpacity style={styles.wifiDisconnectBtn} onPress={handleDisconnectWifi}>
                      <Text style={styles.wifiDisconnectBtnText}>{t('disconnect')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.wifiDisconnectedContainer}>
                  <AlertCircle size={28} color="#FFAD33" style={{ marginBottom: 6 }} />
                  <Text style={styles.wifiDisconnectedText}>Band WiFi Offline</Text>
                  <Text style={styles.wifiDisconnectedDesc}>Configure WiFi network to sync parameters directly to your cloud dashboard</Text>
                  <TouchableOpacity style={styles.wifiConnectTriggerBtn} onPress={handleScanWifi}>
                    <Text style={styles.wifiConnectTriggerBtnText}>Scan Hotspots</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>

          </View>

          {/* COLUMN 2: OTA update & Diagnostic Checklist */}
          <View style={{ flex: isDesktop ? 6 : undefined, gap: 24 }}>
            
            {/* Device diagnostics checklist */}
            <GlassCard style={styles.subCard}>
              <Text style={[styles.subTitle, { color: darkMode ? '#FFFFFF' : '#0F172A', marginBottom: 12 }]}>{t('sensorStatus')}</Text>
              
              <View style={styles.diagItem}>
                <Text style={[styles.diagLabel, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>PPG Heart Rate Sensor</Text>
                <View style={styles.diagBadgeSuccess}>
                  <Check size={10} color="#050B18" strokeWidth={3} />
                  <Text style={styles.diagBadgeSuccessText}>OK</Text>
                </View>
              </View>

              <View style={styles.diagItem}>
                <Text style={[styles.diagLabel, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Skin Bio-Impedance Sensor</Text>
                <View style={styles.diagBadgeSuccess}>
                  <Check size={10} color="#050B18" strokeWidth={3} />
                  <Text style={styles.diagBadgeSuccessText}>OK</Text>
                </View>
              </View>

              <View style={styles.diagItem}>
                <Text style={[styles.diagLabel, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Skin Temperature Probe</Text>
                <View style={styles.diagBadgeSuccess}>
                  <Check size={10} color="#050B18" strokeWidth={3} />
                  <Text style={styles.diagBadgeSuccessText}>OK</Text>
                </View>
              </View>

              <View style={styles.diagItem}>
                <Text style={[styles.diagLabel, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>3-Axis Accelerometer</Text>
                <View style={styles.diagBadgeSuccess}>
                  <Check size={10} color="#050B18" strokeWidth={3} />
                  <Text style={styles.diagBadgeSuccessText}>OK</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Hardware specifications */}
              <View style={styles.diagSpecRow}>
                <Server size={14} color="#8E9AA6" style={{ marginRight: 6 }} />
                <Text style={styles.diagSpecText}>Uptime: 24d 18h 12m | Packet Sync: 99.98%</Text>
              </View>
            </GlassCard>

            {/* OTA Firmware Flashing Panel */}
            <GlassCard style={styles.subCard}>
              <View style={styles.subHeaderRow}>
                <View>
                  <Text style={[styles.subTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('otaTitle')}</Text>
                  <Text style={styles.subDescription}>Update Hydrax band processor firmware</Text>
                </View>
                <Text style={[styles.firmwareBadge, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{firmwareVersion}</Text>
              </View>

              {isUpdating ? (
                <View style={styles.updateProgressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.updateStatusText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{updateStatus}</Text>
                    <Text style={styles.progressPctText}>{updateProgress}%</Text>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={[styles.barFill, { width: `${updateProgress}%` }]} />
                  </View>
                </View>
              ) : (
                <View style={{ paddingVertical: 8 }}>
                  {firmwareVersion === 'v1.0.3' ? (
                    <View style={styles.otaUpdatePrompt}>
                      <AlertCircle size={18} color="#FFAD33" style={{ marginRight: 8 }} />
                      <Text style={styles.otaPromptText}>Firmware OS v1.0.4 is available</Text>
                      <TouchableOpacity style={styles.otaStartBtn} onPress={triggerFirmwareUpdate}>
                        <Play size={10} color="#050B18" strokeWidth={2.5} style={{ marginRight: 4 }} />
                        <Text style={styles.otaStartBtnText}>Install</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.otaUpdatePrompt}>
                      <ShieldCheck size={18} color="#00cc66" style={{ marginRight: 8 }} />
                      <Text style={[styles.otaPromptText, { color: '#00cc66' }]}>Firmware is fully up to date</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Update Simulator logs terminal feed */}
              {updateLog.length > 0 && (
                <View style={[styles.terminalLogsContainer, { backgroundColor: darkMode ? '#030712' : '#F1F5F9' }]}>
                  {updateLog.map((logLine, idx) => (
                    <Text key={idx} style={[styles.terminalLogText, { color: darkMode ? '#00FFB2' : '#0F172A' }]}>{logLine}</Text>
                  ))}
                </View>
              )}
            </GlassCard>

          </View>
        </View>

      </ScrollView>

      {/* WIFI SELECTOR MODAL */}
      {showWifiModal && (
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Wifi size={20} color="#14B8FF" />
              <Text style={[styles.modalTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Biometric WiFi Networks</Text>
              <TouchableOpacity onPress={() => setShowWifiModal(false)}>
                <X size={18} color={darkMode ? '#FFFFFF' : '#050B18'} />
              </TouchableOpacity>
            </View>

            {selectedWifi === '' ? (
              <ScrollView style={{ width: '100%', maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                {mockWifiNetworks.map((net) => (
                  <TouchableOpacity 
                    key={net.ssid} 
                    style={styles.wifiSelectorItem}
                    onPress={() => setSelectedWifi(net.ssid)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Wifi size={14} color={darkMode ? '#8E9AA6' : '#64748B'} style={{ marginRight: 8 }} />
                      <Text style={[styles.wifiSelectName, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{net.ssid}</Text>
                    </View>
                    <Text style={styles.wifiSelectSignal}>{net.signal} dBm</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={{ width: '100%' }}>
                <Text style={[styles.passwordPromptLabel, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>
                  Enter Password for {selectedWifi}
                </Text>
                <TextInput 
                  secureTextEntry
                  style={[styles.passwordInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                  placeholder="Network password"
                  placeholderTextColor="#64748B"
                  value={wifiPassword}
                  onChangeText={setWifiPassword}
                />
                
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedWifi('')}>
                    <Text style={[styles.cancelBtnText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.connectConfirmBtn} onPress={handleConnectWifi} disabled={isConnectingWifi}>
                    {isConnectingWifi ? (
                      <ActivityIndicator size="small" color="#050B18" />
                    ) : (
                      <Text style={styles.connectConfirmBtnText}>{t('connect')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </GlassCard>
        </View>
      )}

    </SafeAreaView>
  );
};

const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#050B18' : '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E5C3',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
    letterSpacing: -1,
  },
  statusCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusHeader: {
    alignItems: 'center',
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  avatarBackglow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 40,
    opacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: darkMode ? '#111A36' : '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  badgeCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00E5C3',
    padding: 4,
    borderRadius: 12,
  },
  connectedDeviceName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  connectedDeviceSub: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 16,
  },
  statusChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E5C3',
    marginLeft: 6,
  },
  dividerLine: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  demoModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 16,
  },
  demoModeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4D6D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  disconnectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  splitGrid: {
    gap: 24,
  },
  subCard: {
    padding: 20,
    borderRadius: 20,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subDescription: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  scanBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    position: 'relative',
  },
  radarCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  radarCenterDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 195, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarActiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E5C3',
    marginTop: 16,
  },
  emptyScannerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyScannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E9AA6',
    marginTop: 8,
  },
  deviceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  deviceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconBox: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 195, 0.05)',
    marginRight: 10,
  },
  deviceItemName: {
    fontSize: 12,
    fontWeight: '800',
  },
  deviceItemRssi: {
    fontSize: 10,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  connectDeviceBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  connectDeviceBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5C3',
  },
  wifiDetailsContainer: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 184, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 255, 0.15)',
  },
  wifiDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wifiSsid: {
    fontSize: 13,
    fontWeight: '800',
  },
  wifiMeta: {
    fontSize: 10,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  wifiDisconnectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
  },
  wifiDisconnectBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF4D6D',
  },
  wifiDisconnectedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  wifiDisconnectedText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFAD33',
    marginBottom: 4,
  },
  wifiDisconnectedDesc: {
    fontSize: 11,
    color: '#8E9AA6',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  wifiConnectTriggerBtn: {
    backgroundColor: '#14B8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  wifiConnectTriggerBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  diagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  diagLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00cc66',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diagBadgeSuccessText: {
    color: '#050B18',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },
  diagSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagSpecText: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  firmwareBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  updateProgressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  updateStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00E5C3',
  },
  barBg: {
    height: 6,
    borderRadius: 3,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#00E5C3',
    borderRadius: 3,
  },
  otaUpdatePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 173, 51, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 173, 51, 0.15)',
    padding: 10,
    borderRadius: 12,
  },
  otaPromptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFAD33',
    flex: 1,
  },
  otaStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFAD33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  otaStartBtnText: {
    color: '#050B18',
    fontSize: 10,
    fontWeight: '900',
  },
  terminalLogsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    height: 100,
  },
  terminalLogText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontWeight: '600',
    lineHeight: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
    marginLeft: 8,
  },
  wifiSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  wifiSelectName: {
    fontSize: 12,
    fontWeight: '700',
  },
  wifiSelectSignal: {
    fontSize: 10,
    color: '#8E9AA6',
    fontWeight: '600',
  },
  passwordPromptLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  passwordInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  connectConfirmBtn: {
    backgroundColor: '#00E5C3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectConfirmBtnText: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '900',
  },
});
