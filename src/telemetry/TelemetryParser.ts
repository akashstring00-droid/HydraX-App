import { 
  HydraXRawPayload, 
  HydraXTelemetry, 
  MotionType, 
  HydrationRiskType, 
  HeatRiskType, 
  OverallRiskType 
} from './telemetryTypes';

export class TelemetryParser {
  private static accumulatedSteps: number = 2450;
  private static lastTimestamp: number = Date.now();

  public static parse(jsonOrObj: string | object): HydraXTelemetry | null {
    try {
      const raw: HydraXRawPayload = typeof jsonOrObj === 'string' 
        ? JSON.parse(jsonOrObj) 
        : (jsonOrObj as HydraXRawPayload);

      if (!raw || typeof raw !== 'object') return null;

      // Extract Motion & Activity string from ESP32 payload
      const rawMotionStr = String(
        raw.activity || 
        raw.motion || 
        (raw as any).mpu || 
        (raw as any).accel || 
        (raw as any).status || 
        ''
      ).toUpperCase();

      let motion: MotionType = 'RESTING';
      let cadence = typeof raw.cadence === 'number' ? raw.cadence : 0;
      let speedKmh = typeof raw.speedKmh === 'number' ? raw.speedKmh : 0;

      // Activity Recognition Classification Logic
      if (
        rawMotionStr.includes('IMPACT') || 
        rawMotionStr.includes('FALL') || 
        rawMotionStr.includes('CRASH') ||
        (raw as any).fallDetected === true
      ) {
        motion = 'IMPACT';
        speedKmh = 0;
      } else if (rawMotionStr.includes('CYCLE') || rawMotionStr.includes('CYCLING') || rawMotionStr.includes('BIKE')) {
        motion = 'CYCLING';
        cadence = cadence || 78;
        speedKmh = speedKmh || 18.5;
      } else if (rawMotionStr.includes('RUN') || rawMotionStr.includes('JOG') || rawMotionStr.includes('SPRINT')) {
        motion = 'RUNNING';
        cadence = cadence || 165;
        speedKmh = speedKmh || 10.2;
      } else if (rawMotionStr.includes('WALK') || rawMotionStr.includes('STEP')) {
        motion = 'WALKING';
        cadence = cadence || 112;
        speedKmh = speedKmh || 4.8;
      } else if (rawMotionStr.includes('ACTIVE') || rawMotionStr.includes('HIGH')) {
        motion = 'ACTIVE';
        cadence = cadence || 120;
        speedKmh = speedKmh || 6.5;
      } else if (rawMotionStr.includes('REST') || rawMotionStr.includes('STATIONARY') || rawMotionStr.includes('SIT')) {
        motion = 'RESTING';
        cadence = 0;
        speedKmh = 0;
      } else {
        // Infer activity from cadence/hr if string is general "NORMAL"
        const hr = raw.hr || 0;
        if (hr > 120) {
          motion = 'RUNNING';
          cadence = 155;
          speedKmh = 9.5;
        } else if (hr > 90) {
          motion = 'WALKING';
          cadence = 108;
          speedKmh = 4.5;
        } else {
          motion = 'RESTING';
          cadence = 0;
          speedKmh = 0;
        }
      }

      // Step counter accumulation
      if (typeof raw.steps === 'number' && raw.steps > 0) {
        this.accumulatedSteps = raw.steps;
      } else if (motion === 'WALKING' || motion === 'RUNNING') {
        const now = Date.now();
        const elapsedSec = (now - this.lastTimestamp) / 1000;
        if (elapsedSec >= 1 && elapsedSec < 5) {
          const addedSteps = motion === 'RUNNING' ? Math.round(elapsedSec * 2.7) : Math.round(elapsedSec * 1.8);
          this.accumulatedSteps += addedSteps;
        }
        this.lastTimestamp = now;
      }

      const activeCalories = Math.round(
        (this.accumulatedSteps * 0.04) + (motion === 'RUNNING' ? 120 : motion === 'CYCLING' ? 95 : motion === 'WALKING' ? 45 : 10)
      );

      const hydraRiskStr = String(raw.hydrationRisk || '').toUpperCase();
      let hydrationRisk: HydrationRiskType = 'LOW';
      if (hydraRiskStr.includes('HIGH')) hydrationRisk = 'HIGH';
      else if (hydraRiskStr.includes('MODERATE')) hydrationRisk = 'MODERATE';

      const heatRiskStr = String(raw.heatRisk || '').toUpperCase();
      let heatRisk: HeatRiskType = 'LOW';
      if (heatRiskStr.includes('HIGH')) heatRisk = 'HIGH';
      else if (heatRiskStr.includes('MODERATE')) heatRisk = 'MODERATE';

      const overallRiskStr = String(raw.overallRisk || '').toUpperCase();
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
        steps: this.accumulatedSteps,
        cadence,
        speedKmh,
        activeCalories,
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
