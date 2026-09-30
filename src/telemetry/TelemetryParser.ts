import { 
  HydraXRawPayload, 
  HydraXTelemetry, 
  MotionType, 
  HydrationRiskType, 
  HeatRiskType, 
  OverallRiskType 
} from './telemetryTypes';

export class TelemetryParser {
  public static parse(jsonOrObj: string | object): HydraXTelemetry | null {
    try {
      const raw: HydraXRawPayload = typeof jsonOrObj === 'string' 
        ? JSON.parse(jsonOrObj) 
        : (jsonOrObj as HydraXRawPayload);

      if (!raw || typeof raw !== 'object') return null;

      const motionStr = (raw.motion || '').toUpperCase();
      let motion: MotionType = 'NORMAL';
      if (motionStr.includes('IMPACT') || motionStr.includes('FALL')) motion = 'IMPACT';
      else if (motionStr.includes('ACTIVE') || motionStr.includes('HIGH')) motion = 'ACTIVE';
      else if (motionStr.includes('NORMAL')) motion = 'NORMAL';

      const hydraRiskStr = (raw.hydrationRisk || '').toUpperCase();
      let hydrationRisk: HydrationRiskType = 'LOW';
      if (hydraRiskStr.includes('HIGH')) hydrationRisk = 'HIGH';
      else if (hydraRiskStr.includes('MODERATE')) hydrationRisk = 'MODERATE';

      const heatRiskStr = (raw.heatRisk || '').toUpperCase();
      let heatRisk: HeatRiskType = 'LOW';
      if (heatRiskStr.includes('HIGH')) heatRisk = 'HIGH';
      else if (heatRiskStr.includes('MODERATE')) heatRisk = 'MODERATE';

      const overallRiskStr = (raw.overallRisk || '').toUpperCase();
      let overallRisk: OverallRiskType = 'LOW';
      if (overallRiskStr.includes('CRITICAL')) overallRisk = 'CRITICAL';
      else if (overallRiskStr.includes('HIGH')) overallRisk = 'HIGH';
      else if (overallRiskStr.includes('MODERATE')) overallRisk = 'MODERATE';

      return {
        hr: typeof raw.hr === 'number' && !isNaN(raw.hr) ? Math.round(raw.hr * 10) / 10 : 0,
        skinTemp: typeof raw.skinTemp === 'number' && !isNaN(raw.skinTemp) ? Math.round(raw.skinTemp * 10) / 10 : 0,
        ambientTemp: typeof raw.ambientTemp === 'number' && !isNaN(raw.ambientTemp) ? Math.round(raw.ambientTemp * 10) / 10 : 0,
        humidity: typeof raw.humidity === 'number' && !isNaN(raw.humidity) ? Math.round(raw.humidity * 10) / 10 : 0,
        motion,
        riskScore: typeof raw.riskScore === 'number' && !isNaN(raw.riskScore) ? Math.min(100, Math.max(0, raw.riskScore)) : 0,
        hydrationRisk,
        heatRisk,
        overallRisk,
        timestamp: Date.now(),
      };
    } catch (e) {
      console.warn('[TelemetryParser] Failed to parse BLE payload:', e);
      return null;
    }
  }
}
