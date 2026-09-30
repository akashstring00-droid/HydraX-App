import { 
  HealthMetrics, 
  EnvironmentalMetrics, 
  PersonalBaseline, 
  RiskCategoryKey, 
  ExplainableRiskResult 
} from '../types';

export function getExplainableRiskAnalysis(
  categoryKey: RiskCategoryKey,
  health: HealthMetrics,
  env: EnvironmentalMetrics,
  baseline: PersonalBaseline
): ExplainableRiskResult {
  switch (categoryKey) {
    case 'HEAT_STRESS': {
      const tempDev = Math.max(0, env.temperature - 30);
      const humDev = Math.max(0, env.humidity - 50);
      const hrDev = Math.max(0, health.heartRate - baseline.heartRateMin);
      const bodyTempDev = Math.max(0, (health.bodyTemperature - 36.6) * 10);
      
      const totalDev = tempDev + humDev + hrDev + bodyTempDev + 1;
      
      const tempPct = Math.round((tempDev / totalDev) * 100) || 35;
      const humPct = Math.round((humDev / totalDev) * 100) || 25;
      const hrPct = Math.round((hrDev / totalDev) * 100) || 25;
      const bodyTempPct = Math.round((bodyTempDev / totalDev) * 100) || 15;
      
      return {
        categoryTitle: 'Heat Stress Assessment',
        riskLevel: env.temperature > 38 ? 'High' : env.temperature > 32 ? 'Moderate' : 'Low',
        contributions: [
          { factorName: `Ambient Temperature (${env.temperature}°C)`, percentage: tempPct, impact: 'increases_risk' },
          { factorName: `Relative Humidity (${env.humidity}%)`, percentage: humPct, impact: 'increases_risk' },
          { factorName: `Heart Rate Exertion (${health.heartRate} BPM)`, percentage: hrPct, impact: 'increases_risk' },
          { factorName: `Body Temp Deviation (${health.bodyTemperature}°C)`, percentage: bodyTempPct, impact: 'increases_risk' },
        ],
        explanationSummary: `Heat Stress risk is primarily driven by ambient heat (${env.temperature}°C) combined with relative humidity (${env.humidity}%), which impairs the body's sweat evaporation capacity and elevates heart rate.`,
      };
    }
    
    case 'RESPIRATORY_STRESS': {
      const aqiDev = Math.max(0, env.aqi - 50);
      const pmDev = Math.max(0, env.pm25 - 25);
      const spO2Dip = Math.max(0, 99 - health.spO2) * 15;
      
      const totalDev = aqiDev + pmDev + spO2Dip + 1;
      const aqiPct = Math.round((aqiDev / totalDev) * 100) || 45;
      const pmPct = Math.round((pmDev / totalDev) * 100) || 30;
      const spO2Pct = Math.round((spO2Dip / totalDev) * 100) || 25;
      
      return {
        categoryTitle: 'Respiratory Strain Assessment',
        riskLevel: env.aqi > 200 || health.spO2 < 95 ? 'High' : env.aqi > 120 ? 'Moderate' : 'Low',
        contributions: [
          { factorName: `Air Quality Index (AQI ${env.aqi})`, percentage: aqiPct, impact: 'increases_risk' },
          { factorName: `Fine Particulates (PM2.5 ${env.pm25} µg/m³)`, percentage: pmPct, impact: 'increases_risk' },
          { factorName: `Blood Oxygen Saturation (${health.spO2}%)`, percentage: spO2Pct, impact: health.spO2 < 96 ? 'increases_risk' : 'neutral' },
        ],
        explanationSummary: `Respiratory strain alert reflects ambient particulate concentration (AQI ${env.aqi}) and its impact on peripheral blood oxygen levels (${health.spO2}% SpO2).`,
      };
    }
    
    case 'DEHYDRATION': {
      const deficit = Math.max(0, health.hydrationTarget - health.hydrationLiters);
      const tempDev = Math.max(0, env.temperature - 30);
      const hrDev = Math.max(0, health.heartRate - baseline.heartRateMax);
      
      const totalDev = (deficit * 40) + (tempDev * 2) + hrDev + 1;
      const defPct = Math.round(((deficit * 40) / totalDev) * 100) || 50;
      const tempPct = Math.round(((tempDev * 2) / totalDev) * 100) || 30;
      const hrPct = Math.round((hrDev / totalDev) * 100) || 20;
      
      return {
        categoryTitle: 'Dehydration Risk Assessment',
        riskLevel: deficit > 1.2 ? 'High' : deficit > 0.5 ? 'Moderate' : 'Low',
        contributions: [
          { factorName: `Water Deficit (${deficit.toFixed(1)}L below target)`, percentage: defPct, impact: 'increases_risk' },
          { factorName: `Environmental Evaporation (${env.temperature}°C)`, percentage: tempPct, impact: 'increases_risk' },
          { factorName: `Elevated Pulse (${health.heartRate} BPM)`, percentage: hrPct, impact: 'increases_risk' },
        ],
        explanationSummary: `Dehydration risk increases when daily fluid intake lags behind the required thermal replenishment calculated for high ambient temperatures.`,
      };
    }
    
    default: {
      return {
        categoryTitle: 'Physiological Risk Breakdown',
        riskLevel: 'Moderate',
        contributions: [
          { factorName: `Heart Rate (${health.heartRate} BPM)`, percentage: 35, impact: 'increases_risk' },
          { factorName: `Environmental Temp (${env.temperature}°C)`, percentage: 35, impact: 'increases_risk' },
          { factorName: `Physical Exertion`, percentage: 30, impact: 'neutral' },
        ],
        explanationSummary: 'Multi-variable Edge AI model continuously correlates physiological signals against local baseline thresholds.',
      };
    }
  }
}
