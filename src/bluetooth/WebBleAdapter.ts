import { BLE_CONFIG } from './BleConfig';
import { telemetryStore } from '../telemetry/TelemetryStore';

export class WebBleAdapter {
  private device: any = null;
  private gattServer: any = null;
  private characteristic: any = null;

  public isWebBluetoothSupported(): boolean {
    return typeof window !== 'undefined' && typeof (navigator as any)?.bluetooth?.requestDevice === 'function';
  }

  public async connect(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) {
      telemetryStore.setConnectionState({
        connectionError: 'Web Bluetooth API is not supported in this browser. Please use Chrome/Edge.',
      });
      return false;
    }

    try {
      telemetryStore.setConnectionState({
        connecting: true,
        connectionError: null,
      });

      const navBt = (navigator as any).bluetooth;

      this.device = await navBt.requestDevice({
        filters: [{ name: BLE_CONFIG.deviceName }],
        optionalServices: [BLE_CONFIG.serviceUuid],
      });

      if (!this.device) {
        telemetryStore.setConnectionState({
          connecting: false,
          connectionError: 'No device selected.',
        });
        return false;
      }

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      this.gattServer = await this.device.gatt.connect();
      const service = await this.gattServer.getPrimaryService(BLE_CONFIG.serviceUuid);
      this.characteristic = await service.getCharacteristic(BLE_CONFIG.characteristicUuid);

      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this.onCharacteristicValueChanged.bind(this)
      );

      telemetryStore.setConnectionState({
        connected: true,
        connecting: false,
        deviceName: this.device.name || BLE_CONFIG.deviceName,
        connectionError: null,
      });

      return true;
    } catch (err: any) {
      console.error('[WebBleAdapter] Connection error:', err);
      telemetryStore.setConnectionState({
        connected: false,
        connecting: false,
        connectionError: err.message || 'Bluetooth pair attempt canceled or failed.',
      });
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.characteristic) {
        await this.characteristic.stopNotifications().catch(() => {});
      }
      if (this.gattServer && this.gattServer.connected) {
        this.gattServer.disconnect();
      }
    } catch (e) {
      console.warn('[WebBleAdapter] Disconnect error:', e);
    } finally {
      this.onDisconnected();
    }
  }

  private onCharacteristicValueChanged(event: any) {
    try {
      const valueBuffer = event.target.value;
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(valueBuffer);
      telemetryStore.updateTelemetryFromPayload(jsonString);
    } catch (err) {
      console.warn('[WebBleAdapter] Error decoding packet:', err);
    }
  }

  private onDisconnected() {
    this.device = null;
    this.gattServer = null;
    this.characteristic = null;

    telemetryStore.setConnectionState({
      connected: false,
      connecting: false,
      dataFreshness: 'disconnected',
    });
  }
}

export const webBleAdapter = new WebBleAdapter();
