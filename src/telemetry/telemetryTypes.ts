export type MotionType = 
  | "RESTING" 
  | "WALKING" 
  | "RUNNING" 
  | "CYCLING" 
  | "IMPACT" 
  | "NORMAL" 
  | "ACTIVE" 
  | "UNKNOWN";

export type HydrationRiskType = "LOW" | "MODERATE" | "HIGH" | "WAITING";
export type HeatRiskType = "LOW" | "MODERATE" | "HIGH" | "WAITING";
export type OverallRiskType = "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "WAITING";
export type DataFreshnessType = "live" | "delayed" | "stale" | "disconnected";

export interface HydraXRawPayload {
  hr?: number;
  skinTemp?: number;
  ambientTemp?: number;
  humidity?: number;
  motion?: string;
  activity?: string;
  steps?: number;
  cadence?: number;
  speedKmh?: number;
  riskScore?: number;
  hydrationRisk?: string;
  heatRisk?: string;
  overallRisk?: string;
}

export interface HydraXTelemetry {
  hr: number; // MAX30102 Heart Rate
  skinTemp: number; // TMP117 Contact/Skin Temperature
  ambientTemp: number; // DHT11 Ambient Temperature
  humidity: number; // DHT11 Relative Humidity
  motion: MotionType; // MPU6500 Motion & Activity Status
  steps: number; // Live step counter
  cadence: number; // Steps/min or RPM
  speedKmh: number; // Estimated speed in km/h
  activeCalories: number; // Calculated active kcal
  riskScore: number; // 0 - 100
  hydrationRisk: HydrationRiskType;
  heatRisk: HeatRiskType;
  overallRisk: OverallRiskType;
  timestamp: number; // Date.now()
}

export interface DeviceConnectionState {
  connected: boolean;
  connecting: boolean;
  deviceName: string | null;
  lastPacketAt: number | null;
  connectionError: string | null;
  dataFreshness: DataFreshnessType;
  sensorStatus: {
    max30102: boolean;
    tmp117: boolean;
    dht11: boolean;
    mpu6500: boolean;
  };
  isDemoMode: boolean;
  activeDemoScenarioKey: string | null;
}
