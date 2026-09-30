import { HydraXTelemetry, HydrationRiskType, HeatRiskType, OverallRiskType } from '../telemetry/telemetryTypes';
import { DisasterModeType } from '../types';

export interface EvaluatedRiskResult {
  riskScore: number; // 0 - 100
  overallRisk: OverallRiskType;
  heatRisk: HeatRiskType;
  hydrationRisk: HydrationRiskType;
  cardiovascularStrain: 'LOW' | 'MODERATE' | 'HIGH';
  environmentalStress: 'LOW' | 'MODERATE' | 'HIGH';
  mainContributors: { factor: string; points: number }[];
  recommendation: string;
  disclaimerText: string;
}

export function evaluateRiskEngine(
  telemetry: HydraXTelemetry | null,
  disasterMode: DisasterModeType = 'NORMAL'
): EvaluatedRiskResult {
  const disclaimerText = 'HydraX Risk Indicator: Non-medical prototype indicator based on current sensor signals.';

  if (!telemetry) {
    return {
      riskScore: 0,
      overallRisk: 'WAITING',
      heatRisk: 'WAITING',
      hydrationRisk: 'WAITING',
      cardiovascularStrain: 'LOW',
      environmentalStress: 'LOW',
      mainContributors: [],
      recommendation: 'Device not connected. Connect HydraX wearable to begin live risk evaluation.',
      disclaimerText,
    };
  }

  let totalRisk = 0;
  const contributors: { factor: string; points: number }[] = [];

  // 1. Environmental Heat Assessment (DHT11)
  if (telemetry.ambientTemp >= 40) {
    totalRisk += 30;
    contributors.push({ factor: 'Extreme Ambient Temperature', points: 30 });
  } else if (telemetry.ambientTemp >= 35) {
    totalRisk += 20;
    contributors.push({ factor: 'High Ambient Heat', points: 20 });
  } else if (telemetry.ambientTemp >= 31) {
    totalRisk += 10;
    contributors.push({ factor: 'Warm Environment', points: 10 });
  }

  if (telemetry.humidity >= 75) {
    totalRisk += 18;
    contributors.push({ factor: 'High Relative Humidity', points: 18 });
  } else if (telemetry.humidity >= 60) {
    totalRisk += 10;
    contributors.push({ factor: 'Elevated Humidity', points: 10 });
  }

  // 2. Cardiac Exertion (MAX30102)
  if (telemetry.hr >= 110) {
    totalRisk += 25;
    contributors.push({ factor: 'High Heart Rate Strain', points: 25 });
  } else if (telemetry.hr >= 90) {
    totalRisk += 14;
    contributors.push({ factor: 'Elevated Pulse', points: 14 });
  }

  // 3. Skin Temperature Deviation (TMP117)
  if (telemetry.skinTemp >= 35.0) {
    totalRisk += 20;
    contributors.push({ factor: 'Elevated Skin Temperature', points: 20 });
  } else if (telemetry.skinTemp >= 33.5) {
    totalRisk += 10;
    contributors.push({ factor: 'Warm Skin Thermal Contact', points: 10 });
  }

  // 4. Motion / Impact Hazard (MPU6500)
  if (telemetry.motion === 'IMPACT') {
    totalRisk += 40;
    contributors.push({ factor: 'Motion Impact Event Detected', points: 40 });
  }

  // 5. Disaster Mode Priority
  if (disasterMode === 'HEAT_WAVE') {
    totalRisk += 15;
    contributors.push({ factor: 'Active Disaster: Heat Wave Alert', points: 15 });
  } else if (disasterMode === 'AIR_POLLUTION') {
    totalRisk += 15;
    contributors.push({ factor: 'Active Disaster: Air Pollution Smog', points: 15 });
  }

  const riskScore = Math.min(100, Math.max(0, totalRisk));

  let overallRisk: OverallRiskType = 'LOW';
  if (riskScore >= 75 || telemetry.motion === 'IMPACT') {
    overallRisk = 'CRITICAL';
  } else if (riskScore >= 50) {
    overallRisk = 'HIGH';
  } else if (riskScore >= 25) {
    overallRisk = 'MODERATE';
  }

  let heatRisk: HeatRiskType = telemetry.ambientTemp > 35 || telemetry.humidity > 70 ? 'HIGH' : telemetry.ambientTemp > 31 ? 'MODERATE' : 'LOW';
  let hydrationRisk: HydrationRiskType = telemetry.ambientTemp > 35 && telemetry.hr > 85 ? 'HIGH' : telemetry.ambientTemp > 30 ? 'MODERATE' : 'LOW';

  const recommendation = overallRisk === 'CRITICAL' || overallRisk === 'HIGH'
    ? 'Significant environmental and cardiac strain detected. Rest in a cool shaded area and sip water continuously.'
    : overallRisk === 'MODERATE'
    ? 'Moderate environmental heat. Hydrate with 250–300 ml water and avoid heavy exertion.'
    : 'Your physiological and environmental indicators are stable.';

  return {
    riskScore,
    overallRisk,
    heatRisk,
    hydrationRisk,
    cardiovascularStrain: telemetry.hr > 100 ? 'HIGH' : telemetry.hr > 80 ? 'MODERATE' : 'LOW',
    environmentalStress: telemetry.ambientTemp > 34 ? 'HIGH' : telemetry.ambientTemp > 29 ? 'MODERATE' : 'LOW',
    mainContributors: contributors.sort((a, b) => b.points - a.points),
    recommendation,
    disclaimerText,
  };
}
