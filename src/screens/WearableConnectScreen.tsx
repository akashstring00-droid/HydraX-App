import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Bluetooth, RefreshCw, CheckCircle2, AlertCircle, Play, Square, Terminal } from 'lucide-react-native';
import { webBleAdapter } from '../bluetooth/WebBleAdapter';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { BLE_CONFIG } from '../bluetooth/BleConfig';
import { DeviceConnectionState, HydraXTelemetry } from '../telemetry/telemetryTypes';

interface WearableConnectScreenProps {
  onBack: () => void;
}

export const WearableConnectScreen: React.FC<WearableConnectScreenProps> = ({ onBack }) => {
  const [telemetry, setTelemetry] = useState<HydraXTelemetry | null>(null);
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [packetLogs, setPacketLogs] = useState<string[]>([]);
  const [simulatingBLESream, setSimulatingBLEStream] = useState<boolean>(false);

  const simTimerRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = telemetryStore.subscribe((t, s) => {
      setTelemetry(t);
      setConnState(s);
      if (t) {
        const log = `[${new Date().toLocaleTimeString()}] BLE RX: {"hr":${t.hr},"skinTemp":${t.skinTemp},"ambientTemp":${t.ambientTemp},"humidity":${t.humidity},"motion":"${t.motion}"}`;
        setPacketLogs((prev) => [log, ...prev.slice(0, 9)]);
      }
    });
    return () => {
      unsubscribe();
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  const handleConnectWebBle = async () => {
    setIsScanning(true);
    try {
      await webBleAdapter.connect();
    } catch (err: any) {
      console.warn('[BLE UI] Pairing error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const startSimulatedBLEStream = () => {
    setSimulatingBLEStream(true);
    let hr = 72;
    let skinTemp = 31.2;

    telemetryStore.setConnectionState({
      connected: true,
      deviceName: 'ESP32-HydraX-Sim',
      dataFreshness: 'live',
      sensorStatus: { max30102: true, tmp117: true, dht11: true, mpu6500: true },
    });

    if (simTimerRef.current) clearInterval(simTimerRef.current);

    simTimerRef.current = setInterval(() => {
      hr = Math.min(115, Math.max(60, hr + (Math.random() > 0.5 ? 1 : -1)));
      skinTemp = Math.min(36.0, Math.max(30.0, Math.round((skinTemp + (Math.random() > 0.5 ? 0.1 : -0.1)) * 10) / 10));

      const payload = {
        hr,
        skinTemp,
        ambientTemp: 31.5,
        humidity: 68,
        motion: Math.random() > 0.95 ? 'IMPACT' : 'NORMAL',
        riskScore: hr > 100 ? 58 : 14,
        hydrationRisk: 'LOW',
        heatRisk: 'MODERATE',
        overallRisk: hr > 100 ? 'HIGH' : 'LOW',
      };

      telemetryStore.updateTelemetryFromPayload(payload);
    }, 1000);
  };

  const stopSimulatedBLEStream = () => {
    setSimulatingBLEStream(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    telemetryStore.setConnectionState({
      connected: false,
      connecting: false,
      dataFreshness: 'disconnected',
    });
  };

  const handleDisconnect = async () => {
    if (simulatingBLESream) {
      stopSimulatedBLEStream();
    } else {
      await webBleAdapter.disconnect();
    }
  };

  const sensors = [
    { name: 'MAX30102 Heart Rate (Optical)', status: connState.sensorStatus.max30102, val: telemetry?.hr ? `${telemetry.hr} BPM` : '--' },
    { name: 'TMP117 Skin Temp (High Precision)', status: connState.sensorStatus.tmp117, val: telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : '--' },
    { name: 'DHT11 Ambient & Humidity', status: connState.sensorStatus.dht11, val: telemetry?.ambientTemp ? `${telemetry.ambientTemp}°C / ${telemetry.humidity}%` : '--' },
    { name: 'MPU6500 6-Axis Motion & Fall', status: connState.sensorStatus.mpu6500, val: telemetry?.motion ?? '--' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color="#0F172A" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>ESP32 BLE Hardware Bridge</Text>
          <Text style={styles.headerSub}>Chrome GATT Bluetooth Notifications</Text>
        </View>

        {connState.connected ? (
          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.scanButton} onPress={handleConnectWebBle} disabled={isScanning}>
            {isScanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCw color="#FFFFFF" size={16} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Hardware Status Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.iconCircle}>
              <Bluetooth color="#0D9488" size={24} />
            </View>
            <View style={styles.heroTitleCol}>
              <Text style={styles.deviceNameText}>
                {connState.deviceName || BLE_CONFIG.deviceName}
              </Text>
              <Text style={[styles.statusBadgeText, { color: connState.connected ? '#10B981' : '#94A3B8' }]}>
                {connState.connected ? `Connected • ${connState.dataFreshness.toUpperCase()} Telemetry` : 'Not Connected'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            HydraX connects directly to physical ESP32 microcontrollers over GATT Service UUID `{BLE_CONFIG.serviceUuid}`.
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {!connState.connected ? (
              <>
                <TouchableOpacity style={styles.primaryConnectBtn} onPress={handleConnectWebBle} disabled={isScanning}>
                  <Bluetooth color="#FFFFFF" size={16} />
                  <Text style={styles.primaryConnectBtnText}>
                    {isScanning ? 'Pairing Web BLE...' : 'Pair HydraX ESP32 Band'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.simStreamBtn} 
                  onPress={simulatingBLESream ? stopSimulatedBLEStream : startSimulatedBLEStream}
                >
                  <Play color="#0D9488" size={14} />
                  <Text style={styles.simStreamBtnText}>Simulate 1Hz Stream</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.disconnectBtnFull} onPress={handleDisconnect}>
                <Square color="#EF4444" size={14} />
                <Text style={styles.disconnectBtnFullText}>Disconnect BLE Session</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Connection Error Alert */}
        {connState.connectionError && (
          <View style={styles.errorCard}>
            <AlertCircle color="#EF4444" size={16} />
            <Text style={styles.errorText}>{connState.connectionError}</Text>
          </View>
        )}

        {/* Live Hardware Sensor Checklist */}
        <Text style={styles.sectionHeader}>HARDWARE SENSORS STATUS</Text>

        <View style={styles.checklistCard}>
          {sensors.map((s, idx) => (
            <React.Fragment key={idx}>
              <View style={styles.sensorRow}>
                <View style={styles.sensorLeft}>
                  {s.status ? (
                    <CheckCircle2 color="#10B981" size={18} />
                  ) : (
                    <AlertCircle color="#94A3B8" size={18} />
                  )}
                  <Text style={styles.sensorName}>{s.name}</Text>
                </View>
                <Text style={styles.sensorVal}>{s.val}</Text>
              </View>
              {idx < sensors.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Live Packet Monitor Terminal */}
        <Text style={styles.sectionHeader}>LIVE GATT PACKET INSPECTOR (1Hz)</Text>

        <View style={styles.terminalBox}>
          <View style={styles.terminalHeader}>
            <Terminal color="#34D399" size={14} />
            <Text style={styles.terminalTitle}>GATT Characteristic Stream ({BLE_CONFIG.characteristicUuid.substring(0, 8)}...)</Text>
          </View>

          <View style={styles.terminalBody}>
            {packetLogs.length > 0 ? (
              packetLogs.map((log, idx) => (
                <Text key={idx} style={styles.logLine}>{log}</Text>
              ))
            ) : (
              <Text style={styles.logPlaceholder}>Waiting for GATT BLE notifications stream...</Text>
            )}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
  },
  scanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  disconnectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitleCol: {
    flex: 1,
  },
  deviceNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  primaryConnectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 10,
  },
  primaryConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  simStreamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  simStreamBtnText: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '800',
  },
  disconnectBtnFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 10,
  },
  disconnectBtnFullText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sensorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sensorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sensorVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  terminalBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
  },
  terminalTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  terminalBody: {
    gap: 4,
  },
  logLine: {
    fontSize: 10,
    color: '#34D399',
    fontFamily: 'monospace',
  },
  logPlaceholder: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
