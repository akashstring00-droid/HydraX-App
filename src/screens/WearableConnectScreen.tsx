import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Cpu, Bluetooth, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { webBleAdapter } from '../bluetooth/WebBleAdapter';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { DeviceConnectionState, HydraXTelemetry } from '../telemetry/telemetryTypes';

interface WearableConnectScreenProps {
  onBack: () => void;
}

export const WearableConnectScreen: React.FC<WearableConnectScreenProps> = ({ onBack }) => {
  const [telemetry, setTelemetry] = useState<HydraXTelemetry | null>(null);
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = telemetryStore.subscribe((t, s) => {
      setTelemetry(t);
      setConnState(s);
    });
    return unsubscribe;
  }, []);

  const handleConnectWebBle = async () => {
    setIsScanning(true);
    try {
      await webBleAdapter.connect();
    } catch (err: any) {
      console.warn('Web BLE connection error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = async () => {
    await webBleAdapter.disconnect();
  };

  const sensors = [
    { name: 'MAX30102 Heart Rate', status: connState.sensorStatus.max30102, val: telemetry?.hr ? `${telemetry.hr} BPM` : '--' },
    { name: 'TMP117 Skin Temp', status: connState.sensorStatus.tmp117, val: telemetry?.skinTemp ? `${telemetry.skinTemp.toFixed(1)}°C` : '--' },
    { name: 'DHT11 Ambient & Humidity', status: connState.sensorStatus.dht11, val: telemetry?.ambientTemp ? `${telemetry.ambientTemp}°C / ${telemetry.humidity}%` : '--' },
    { name: 'MPU6500 Motion & Fall', status: connState.sensorStatus.mpu6500, val: telemetry?.motion ?? '--' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color="#0F172A" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>HydraX-Health BLE Device</Text>
          <Text style={styles.headerSub}>ESP32 GATT Web Bluetooth Integration</Text>
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
                {connState.isDemoMode ? 'HydraX-Demo-Sim' : connState.deviceName || 'HydraX-Health'}
              </Text>
              <Text style={styles.statusBadgeText}>
                {connState.connected ? `Connected • ${connState.dataFreshness.toUpperCase()}` : 'Not Connected'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            HydraX connects to ESP32 hardware band over BLE Service UUID `7d8a1000-6f2b-4a91-9c31-8f5e2d7a1001` transmitting raw JSON packets at 1Hz.
          </Text>

          {!connState.connected && !connState.isDemoMode && (
            <TouchableOpacity style={styles.primaryConnectBtn} onPress={handleConnectWebBle} disabled={isScanning}>
              <Text style={styles.primaryConnectBtnText}>
                {isScanning ? 'Pairing with Chrome Web BLE...' : 'Pair HydraX-Health Band'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Hardware Sensor Checklist */}
        <Text style={styles.sectionHeader}>LIVE HARDWARE SENSOR CHECKLIST</Text>

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

        {/* GATT Service Specifications */}
        <Text style={styles.sectionHeader}>GATT BLE SPECIFICATIONS</Text>

        <View style={styles.specCard}>
          <Text style={styles.specRow}><Text style={styles.specKey}>Service UUID: </Text>7d8a1000-6f2b-4a91-9c31-8f5e2d7a1001</Text>
          <Text style={styles.specRow}><Text style={styles.specKey}>Char UUID: </Text>7d8a1001-6f2b-4a91-9c31-8f5e2d7a1001</Text>
          <Text style={styles.specRow}><Text style={styles.specKey}>Device Name: </Text>HydraX-Health</Text>
          <Text style={styles.specRow}><Text style={styles.specKey}>Baud Rate: </Text>115200 (Serial to BLE Bridge)</Text>
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
    marginBottom: 14,
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
    color: '#0D9488',
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 16,
  },
  primaryConnectBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    marginBottom: 14,
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
  specCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  specRow: {
    fontSize: 11,
    color: '#475569',
  },
  specKey: {
    fontWeight: '800',
    color: '#0F172A',
  },
});
