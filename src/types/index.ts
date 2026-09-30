export type RiskCategoryKey = 
  | 'HEAT_STRESS' 
  | 'DEHYDRATION' 
  | 'RESPIRATORY_STRESS' 
  | 'CARDIOVASCULAR_STRESS' 
  | 'FATIGUE' 
  | 'FALL_DISTRESS';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface PersonalBaseline {
  heartRateMin: number;
  heartRateMax: number;
  tempMin: number;
  tempMax: number;
  spO2Min: number;
  spO2Max: number;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: 'Sedentary' | 'Moderate' | 'Active' | 'Very Active';
  emergencyContacts: EmergencyContact[];
  healthBaseline: PersonalBaseline;
}

export interface HealthMetrics {
  heartRate: number;
  restingHeartRate: number;
  minHeartRate: number;
  maxHeartRate: number;
  spO2: number;
  dailyAvgSpO2: number;
  bodyTemperature: number;
  steps: number;
  activeMinutes: number;
  calories: number;
  fatigueScore: number; // 0 to 100
  sleepHours: number;
  sleepScore: number;
  recoveryStatus: 'Optimal' | 'Moderate' | 'Fatigued';
  hydrationLiters: number;
  hydrationTarget: number;
  hydrationRisk: 'Low' | 'Moderate' | 'High';
}

export interface EnvironmentalMetrics {
  temperature: number; // in Celsius
  humidity: number; // %
  aqi: number; // Air Quality Index
  pm25: number; // ug/m3
  heatRiskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  conditionText: string;
}

export interface RiskDetail {
  key: RiskCategoryKey;
  title: string;
  level: RiskLevel;
  score: number; // 0 to 100
  confidence: number; // %
  detectedFactors: string[];
  recommendation: string;
}

export type RiskAssessmentMap = Record<RiskCategoryKey, RiskDetail>;

export interface OverallRiskAssessment {
  overallHealthScore: number; // 0 to 100 (e.g., 86/100)
  overallRiskLevel: 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'CRITICAL RISK';
  risks: RiskAssessmentMap;
}

export interface ExplainableFactorContribution {
  factorName: string;
  percentage: number;
  impact: 'increases_risk' | 'decreases_risk' | 'neutral';
}

export interface ExplainableRiskResult {
  categoryTitle: string;
  riskLevel: RiskLevel;
  contributions: ExplainableFactorContribution[];
  explanationSummary: string;
}

export type DisasterModeType = 
  | 'NORMAL'
  | 'HEAT_WAVE'
  | 'AIR_POLLUTION'
  | 'FLOOD'
  | 'CYCLONE'
  | 'EXTREME_WEATHER'
  | 'DISEASE_OUTBREAK';

export interface DisasterProfile {
  type: DisasterModeType;
  title: string;
  iconName: string;
  primaryRiskPriority: RiskCategoryKey;
  environmentalNotice: string;
  immediateSafetyActions: string[];
  offlineGuidance: string[];
}

export type DemoScenarioKey = 
  | 'NORMAL_DAY'
  | 'HEAT_WAVE'
  | 'HIGH_POLLUTION'
  | 'DEHYDRATION'
  | 'ABNORMAL_HR'
  | 'FALL_DETECTION'
  | 'OFFLINE_DISASTER';

export interface DemoScenario {
  key: DemoScenarioKey;
  name: string;
  description: string;
  health: Partial<HealthMetrics>;
  environment: Partial<EnvironmentalMetrics>;
  activeDisaster?: DisasterModeType;
  isOfflineMode?: boolean;
}

export interface HealthAlert {
  id: string;
  type: 'heat' | 'cardio' | 'respiratory' | 'recovery' | 'disaster' | 'emergency';
  severity: 'info' | 'moderate' | 'warning' | 'critical';
  title: string;
  message: string;
  action: string;
  timestamp: string;
}

export interface DeviceStatus {
  name: string;
  type: 'ESP32' | 'Smartwatch' | 'Fitness Band' | 'BLE Sensor';
  connected: boolean;
  batteryLevel: number;
  sensorsActive: {
    hr: boolean;
    spO2: boolean;
    temp: boolean;
    motion: boolean;
  };
}

export interface PrivacySettings {
  localProcessingOnly: boolean;
  shareHealthData: boolean;
  shareLocation: boolean;
  emergencyContactAccess: boolean;
  cloudBackup: boolean;
}

export interface AICoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
  riskInsightRef?: string;
}
