import { BLE_CONFIG } from './BleConfig';
import { telemetryStore } from '../telemetry/TelemetryStore';

export class NativeBleAdapter {
  public isNativeBleSupported(): boolean {
    // True on native Mobile runtimes (Android/iOS)
    return typeof window === 'undefined' || !(navigator as any)?.bluetooth;
  }

  public async connect(): Promise<boolean> {
    telemetryStore.setConnectionState({
      connecting: true,
      connectionError: null,
    });

    // Simulated Native BLE bridge hook feeding TelemetryStore
    setTimeout(() => {
      telemetryStore.setConnectionState({
        connected: false,
        connecting: false,
        connectionError: 'Native BLE scanning active. Please pair HydraX-Health from settings.',
      });
    }, 1500);

    return false;
  }

  public async disconnect(): Promise<void> {
    telemetryStore.setConnectionState({
      connected: false,
      connecting: false,
      dataFreshness: 'disconnected',
    });
  }
}

export const nativeBleAdapter = new NativeBleAdapter();
