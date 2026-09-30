import { telemetryStore } from '../telemetry/TelemetryStore';
import { demoScenarios } from '../data/mockData';
import { DemoScenarioKey, DisasterModeType } from '../types';

/**
 * SensorService (Refactored for Hardware Truth)
 * 
 * In Live Mode:
 * No fake random fluctuation loops are generated.
 * All live telemetry is piped directly from ESP32 BLE GATT notifications into TelemetryStore.
 * 
 * In Demo Mode:
 * Injecting predefined hackathon scenarios updates TelemetryStore with explicit DEMO MODE state.
 */
class SensorService {
  private isDemoActive: boolean = false;
  private currentScenarioKey: DemoScenarioKey | null = null;
  private currentDisasterMode: DisasterModeType = 'NORMAL';

  public enableDemoMode(scenarioKey: DemoScenarioKey) {
    const scenario = demoScenarios.find((s) => s.key === scenarioKey);
    if (!scenario) return;

    this.isDemoActive = true;
    this.currentScenarioKey = scenarioKey;
    if (scenario.activeDisaster) {
      this.currentDisasterMode = scenario.activeDisaster;
    }

    const demoPayload = {
      hr: scenario.health.heartRate || 75,
      skinTemp: scenario.health.bodyTemperature || 31.4,
      ambientTemp: scenario.environment.temperature || 31.0,
      humidity: scenario.environment.humidity || 70,
      motion: scenarioKey === 'FALL_DETECTION' ? 'IMPACT' : 'NORMAL',
      riskScore: scenarioKey === 'HEAT_WAVE' ? 78 : scenarioKey === 'DEHYDRATION' ? 62 : 12,
      hydrationRisk: scenarioKey === 'DEHYDRATION' ? 'HIGH' : 'LOW',
      heatRisk: scenarioKey === 'HEAT_WAVE' ? 'HIGH' : 'LOW',
      overallRisk: scenarioKey === 'HEAT_WAVE' ? 'HIGH' : scenarioKey === 'FALL_DETECTION' ? 'CRITICAL' : 'LOW',
    };

    telemetryStore.setDemoMode(true, demoPayload, scenarioKey);
  }

  public disableDemoMode() {
    this.isDemoActive = false;
    this.currentScenarioKey = null;
    telemetryStore.setDemoMode(false);
  }

  public setDisasterMode(disaster: DisasterModeType) {
    this.currentDisasterMode = disaster;
    if (this.isDemoActive && this.currentScenarioKey) {
      this.enableDemoMode(this.currentScenarioKey);
    }
  }

  public getDisasterMode(): DisasterModeType {
    return this.currentDisasterMode;
  }

  public isDemoModeActive(): boolean {
    return this.isDemoActive;
  }
}

export const sensorService = new SensorService();
