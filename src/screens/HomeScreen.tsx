import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { DeviceStatus } from '../components/DeviceStatus';
import { RiskHero } from '../components/RiskHero';
import { LiveVitalsGrid } from '../components/LiveVitalsGrid';
import { HydrationCard } from '../components/HydrationCard';
import { EnvironmentCard } from '../components/EnvironmentCard';
import { AIInsightCard } from '../components/AIInsightCard';
import { EmergencyButton } from '../components/EmergencyButton';
import { DemoCenterModal } from '../components/DemoCenterModal';
import { DisasterModeModal } from '../components/DisasterModeModal';
import { FallDetectionModal } from '../components/FallDetectionModal';
import { ExplainableAIModal } from '../components/ExplainableAIModal';
import { EdgeAISheetModal } from '../components/EdgeAISheetModal';
import { sensorService } from '../sensors/SensorService';
import { evaluateRiskEngine } from '../ai/RiskEngine';
import { getExplainableRiskAnalysis } from '../ai/ExplainabilityEngine';
import { defaultUserProfile } from '../data/mockData';
import { telemetryStore } from '../telemetry/TelemetryStore';
import { HydraXTelemetry, DeviceConnectionState } from '../telemetry/telemetryTypes';
import { DisasterModeType, DemoScenarioKey, ExplainableRiskResult, HealthMetrics, EnvironmentalMetrics } from '../types';
import { Cpu, ShieldCheck, Bluetooth } from 'lucide-react-native';

interface HomeScreenProps {
  onOpenArchitecture: () => void;
  onOpenPrivacy: () => void;
  onOpenBLE: () => void;
  onTriggerSOS: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenArchitecture,
  onOpenPrivacy,
  onOpenBLE,
  onTriggerSOS,
}) => {
  const [telemetry, setTelemetry] = useState<HydraXTelemetry | null>(null);
  const [connState, setConnState] = useState<DeviceConnectionState>(telemetryStore.getSnapshot().state);
  const [waterConsumed, setWaterConsumed] = useState<number>(1.75);

  const [disasterMode, setDisasterMode] = useState<DisasterModeType>(sensorService.getDisasterMode());
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Modals
  const [showDemoCenter, setShowDemoCenter] = useState<boolean>(false);
  const [showDisasterModal, setShowDisasterModal] = useState<boolean>(false);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [showFallModal, setShowFallModal] = useState<boolean>(false);
  const [showEdgeAISheet, setShowEdgeAISheet] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = telemetryStore.subscribe((t, s) => {
      setTelemetry(t);
      setConnState(s);
      if (t?.motion === 'IMPACT' && !showFallModal) {
        setShowFallModal(true);
      }
    });
    return unsubscribe;
  }, [showFallModal]);

  const riskAssessment = evaluateRiskEngine(telemetry, disasterMode);

  const healthForExplain: HealthMetrics = {
    heartRate: telemetry?.hr ?? 75,
    restingHeartRate: 64,
    minHeartRate: 58,
    maxHeartRate: 110,
    spO2: 98,
    dailyAvgSpO2: 98,
    bodyTemperature: telemetry?.skinTemp ?? 31.4,
    steps: 6420,
    activeMinutes: 45,
    calories: 450,
    fatigueScore: 25,
    sleepHours: 7.5,
    sleepScore: 85,
    recoveryStatus: 'Optimal',
    hydrationLiters: waterConsumed,
    hydrationTarget: 2.5,
    hydrationRisk: telemetry?.hydrationRisk === 'HIGH' ? 'High' : 'Low',
  };

  const envForExplain: EnvironmentalMetrics = {
    temperature: telemetry?.ambientTemp ?? 28,
    humidity: telemetry?.humidity ?? 65,
    aqi: disasterMode === 'AIR_POLLUTION' ? 185 : 35,
    pm25: 12,
    heatRiskLevel: telemetry?.heatRisk === 'HIGH' ? 'High' : 'Low',
    conditionText: disasterMode === 'HEAT_WAVE' ? 'Extreme Thermal Exposure' : 'Normal',
  };

  const explainResult: ExplainableRiskResult = getExplainableRiskAnalysis(
    disasterMode === 'AIR_POLLUTION' ? 'RESPIRATORY_STRESS' : 'HEAT_STRESS',
    healthForExplain,
    envForExplain,
    defaultUserProfile.healthBaseline
  );

  const handleSelectScenario = (key: DemoScenarioKey) => {
    sensorService.enableDemoMode(key);
    if (key === 'FALL_DETECTION') {
      setShowFallModal(true);
    }
  };

  const handleSelectDisaster = (type: DisasterModeType) => {
    setDisasterMode(type);
    sensorService.setDisasterMode(type);
  };

  const handleAddWater = () => {
    setWaterConsumed((prev) => Math.min(3.5, prev + 0.25));
  };

  return (
    <View style={styles.container}>
      <Header
        userName={defaultUserProfile.name}
        isOffline={isOffline}
        activeDisaster={disasterMode}
        onOpenDisasterModal={() => setShowDisasterModal(true)}
        onOpenDemoCenter={() => setShowDemoCenter(true)}
        onOpenArchitecture={onOpenArchitecture}
        onOpenSettings={() => setShowEdgeAISheet(true)}
      />

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* Hardware Connection Bar */}
          <DeviceStatus state={connState} onPress={onOpenBLE} />

          {/* 1. Live Risk Hero Card */}
          <RiskHero
            assessment={riskAssessment}
            lastUpdatedMs={connState.lastPacketAt}
            isConnected={connState.connected}
            isDemoMode={connState.isDemoMode}
          />

          {/* 2. Strict Sensor Vitals Grid (2x2) */}
          <LiveVitalsGrid
            telemetry={telemetry}
            isConnected={connState.connected}
            isDemoMode={connState.isDemoMode}
          />

          {/* 3. Hydration Estimate Card */}
          <HydrationCard
            hydrationRisk={telemetry?.hydrationRisk ?? 'LOW'}
            consumedLiters={waterConsumed}
            targetLiters={2.5}
            onAddWater={handleAddWater}
          />

          {/* 4. Ambient Environment Card */}
          <EnvironmentCard
            telemetry={telemetry}
            isConnected={connState.connected}
            isDemoMode={connState.isDemoMode}
          />

          {/* 5. HydraX AI Insight */}
          <AIInsightCard
            health={healthForExplain}
            env={envForExplain}
            onViewAnalysis={() => setShowExplainModal(true)}
          />

          {/* Quick Action Shortcuts */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionChip} onPress={onOpenBLE} activeOpacity={0.75}>
              <Bluetooth color="#0D9488" size={14} />
              <Text style={styles.actionChipText}>ESP32 Device</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionChip} onPress={onOpenArchitecture} activeOpacity={0.75}>
              <Cpu color="#0D9488" size={14} />
              <Text style={styles.actionChipText}>Pipeline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionChip} onPress={onOpenPrivacy} activeOpacity={0.75}>
              <ShieldCheck color="#0D9488" size={14} />
              <Text style={styles.actionChipText}>Privacy</Text>
            </TouchableOpacity>
          </View>

          {/* 6. Emergency Overlay Button */}
          <EmergencyButton onPress={onTriggerSOS} />
        </View>

        <View style={{ height: 25 }} />
      </ScrollView>

      {/* Modals & Sheets */}
      <DemoCenterModal
        visible={showDemoCenter}
        onClose={() => setShowDemoCenter(false)}
        currentScenario={connState.activeDemoScenarioKey as DemoScenarioKey}
        onSelectScenario={handleSelectScenario}
      />

      <DisasterModeModal
        visible={showDisasterModal}
        onClose={() => setShowDisasterModal(false)}
        activeDisaster={disasterMode}
        onSelectDisaster={handleSelectDisaster}
      />

      <ExplainableAIModal
        visible={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        result={explainResult}
      />

      <EdgeAISheetModal
        visible={showEdgeAISheet}
        onClose={() => setShowEdgeAISheet(false)}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
      />

      <FallDetectionModal
        visible={showFallModal}
        onCancel={() => setShowFallModal(false)}
        onConfirmHelp={() => {
          setShowFallModal(false);
          onTriggerSOS();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollBody: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
});
