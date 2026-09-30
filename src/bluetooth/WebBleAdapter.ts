import { BLE_CONFIG } from './BleConfig';
import { telemetryStore } from '../telemetry/TelemetryStore';

export class WebBleAdapter {
  private device: any = null;
  private gattServer: any = null;
  private characteristic: any = null;

  public isWebBluetoothSupported(): boolean {
    return typeof window !== 'undefined' && typeof (navigator as any)?.bluetooth?.requestDevice === 'function';
  }

  public isSecureContext(): boolean {
    if (typeof window === 'undefined') return false;
    return window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  public async connect(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) {
      telemetryStore.setConnectionState({
        connecting: false,
        connected: false,
        connectionError: 'Web Bluetooth is not supported in this browser. Please use Chrome on Android, Windows, or Mac.',
      });
      return false;
    }

    if (!this.isSecureContext()) {
      telemetryStore.setConnectionState({
        connecting: false,
        connected: false,
        connectionError: 'Web Bluetooth requires HTTPS or localhost. Please open the app over HTTPS.',
      });
      return false;
    }

    try {
      telemetryStore.setConnectionState({
        connecting: true,
        connectionError: null,
      });

      const navBt = (navigator as any).bluetooth;
      const serviceUuidLower = BLE_CONFIG.serviceUuid.toLowerCase();
      const charUuidLower = BLE_CONFIG.characteristicUuid.toLowerCase();

      // W3C Web Bluetooth Standard Request Device Options for Mobile & Desktop Chrome
      let selectedDevice: any = null;

      try {
        // Attempt 1: Filter by Name or Prefix
        selectedDevice = await navBt.requestDevice({
          filters: [
            { name: BLE_CONFIG.deviceName },
            { namePrefix: 'HydraX' },
            { namePrefix: 'ESP32' },
          ],
          optionalServices: [serviceUuidLower],
        });
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
          throw err;
        }

        console.log('[WebBleAdapter] Named filter returned no device, requesting acceptAllDevices popup...', err);

        // Attempt 2: Universal Accept All Devices Popup (Supported on both Mobile & Desktop Chrome)
        selectedDevice = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: [serviceUuidLower],
        });
      }

      if (!selectedDevice) {
        telemetryStore.setConnectionState({
          connecting: false,
          connectionError: 'No Bluetooth device selected.',
        });
        return false;
      }

      this.device = selectedDevice;
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      // Connect to GATT Server
      this.gattServer = await this.device.gatt.connect();

      // Service & Characteristic Discovery
      let targetChar: any = null;

      try {
        const service = await this.gattServer.getPrimaryService(serviceUuidLower);
        targetChar = await service.getCharacteristic(charUuidLower);
      } catch (e) {
        console.log('[WebBleAdapter] Explicit UUID lookup fallback, scanning GATT services...', e);

        // Dynamic fallback: scan all primary services for notification characteristic
        const services = await this.gattServer.getPrimaryServices();
        for (const s of services) {
          try {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
              if (c.properties.notify || c.properties.indicate) {
                targetChar = c;
                break;
              }
            }
          } catch (_) {}
          if (targetChar) break;
        }
      }

      if (!targetChar) {
        throw new Error('Connected to BLE device, but no notification GATT characteristic was found.');
      }

      this.characteristic = targetChar;

      // Subscribe to 1Hz telemetry notifications
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
        dataFreshness: 'live',
        sensorStatus: {
          max30102: true,
          tmp117: true,
          dht11: true,
          mpu6500: true,
        },
      });

      return true;
    } catch (err: any) {
      console.error('[WebBleAdapter] Bluetooth connection error:', err);
      const isUserCancel = err.name === 'NotFoundError' || err.message?.includes('User cancelled') || err.message?.includes('cancel');

      telemetryStore.setConnectionState({
        connected: false,
        connecting: false,
        connectionError: isUserCancel
          ? 'Bluetooth pairing canceled by user.'
          : (err.message || 'Bluetooth connection failed. Ensure Bluetooth is ON on your device.'),
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
      const rawText = decoder.decode(valueBuffer);
      telemetryStore.updateTelemetryFromPayload(rawText);
    } catch (err) {
      console.warn('[WebBleAdapter] Error parsing GATT notification:', err);
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
