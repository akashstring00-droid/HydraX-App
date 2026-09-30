import { 
  HydraXTelemetry, 
  DeviceConnectionState, 
  DataFreshnessType 
} from './telemetryTypes';
import { TelemetryParser } from './TelemetryParser';

type TelemetryListener = (
  telemetry: HydraXTelemetry | null,
  state: DeviceConnectionState
) => void;

class TelemetryStore {
  private telemetry: HydraXTelemetry | null = null;
  private state: DeviceConnectionState = {
    connected: false,
    connecting: false,
    deviceName: null,
    lastPacketAt: null,
    connectionError: null,
    dataFreshness: 'disconnected',
    sensorStatus: {
      max30102: false,
      tmp117: false,
      dht11: false,
      mpu6500: false,
    },
    isDemoMode: false,
    activeDemoScenarioKey: null,
  };

  private listeners: Set<TelemetryListener> = new Set();
  private freshnessCheckTimer: any = null;

  constructor() {
    this.startFreshnessMonitor();
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.telemetry, { ...this.state });
    return () => this.listeners.delete(listener);
  }

  public updateTelemetryFromPayload(raw: string | object) {
    const parsed = TelemetryParser.parse(raw);
    if (!parsed) return;

    this.telemetry = parsed;
    this.state.connected = true;
    this.state.connecting = false;
    this.state.lastPacketAt = parsed.timestamp;
    this.state.connectionError = null;
    this.state.dataFreshness = 'live';

    this.state.sensorStatus = {
      max30102: parsed.hr > 0,
      tmp117: parsed.skinTemp > 0,
      dht11: parsed.ambientTemp > 0 || parsed.humidity > 0,
      mpu6500: parsed.motion !== 'UNKNOWN',
    };

    this.notify();
  }

  public setConnectionState(patch: Partial<DeviceConnectionState>) {
    this.state = { ...this.state, ...patch };
    if (!this.state.connected && !this.state.isDemoMode) {
      this.telemetry = null;
      this.state.dataFreshness = 'disconnected';
    }
    this.notify();
  }

  public setDemoMode(enabled: boolean, scenarioPayload?: object, scenarioKey?: string) {
    this.state.isDemoMode = enabled;
    this.state.activeDemoScenarioKey = scenarioKey || null;

    if (enabled && scenarioPayload) {
      this.updateTelemetryFromPayload(scenarioPayload);
      this.state.deviceName = 'HydraX-Demo-Sim';
      this.state.connected = true;
      this.state.dataFreshness = 'live';
    } else if (!enabled) {
      this.state.activeDemoScenarioKey = null;
      if (!this.state.connected) {
        this.telemetry = null;
        this.state.dataFreshness = 'disconnected';
      }
    }
    this.notify();
  }

  public getSnapshot() {
    return {
      telemetry: this.telemetry,
      state: { ...this.state },
    };
  }

  private startFreshnessMonitor() {
    if (this.freshnessCheckTimer) clearInterval(this.freshnessCheckTimer);

    this.freshnessCheckTimer = setInterval(() => {
      if (!this.state.connected || !this.state.lastPacketAt) {
        if (this.state.dataFreshness !== 'disconnected') {
          this.state.dataFreshness = 'disconnected';
          this.notify();
        }
        return;
      }

      const now = Date.now();
      const elapsedSec = (now - this.state.lastPacketAt) / 1000;
      let newFreshness: DataFreshnessType = 'live';

      if (elapsedSec > 30) {
        newFreshness = 'disconnected';
        this.state.connected = false;
        if (!this.state.isDemoMode) {
          this.telemetry = null;
        }
      } else if (elapsedSec > 10) {
        newFreshness = 'stale';
      } else if (elapsedSec > 3) {
        newFreshness = 'delayed';
      }

      if (newFreshness !== this.state.dataFreshness) {
        this.state.dataFreshness = newFreshness;
        this.notify();
      }
    }, 1000);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      listener(this.telemetry, { ...this.state });
    });
  }
}

export const telemetryStore = new TelemetryStore();
