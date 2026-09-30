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
        connectionError: 'Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Brave.',
      });
      return false;
    }

    if (!this.isSecureContext()) {
      telemetryStore.setConnectionState({
        connecting: false,
        connected: false,
        connectionError: 'Web Bluetooth requires an HTTPS secure connection or localhost. Please deploy to HTTPS (Vercel) or run locally.',
      });
      return false;
    }

    try {
      telemetryStore.setConnectionState({
        connecting: true,
        connectionError: null,
      });

      const navBt = (navigator as any).bluetooth;
      const uuidLower = BLE_CONFIG.serviceUuid.toLowerCase();
      const uuidUpper = BLE_CONFIG.serviceUuid.toUpperCase();
      const charUuidLower = BLE_CONFIG.characteristicUuid.toLowerCase();

      let selectedDevice: any = null;

      // Strategy 1: Multi-Filter (Exact name, prefix, or Service UUID)
      try {
        selectedDevice = await navBt.requestDevice({
          filters: [
            { name: BLE_CONFIG.deviceName },
            { namePrefix: 'HydraX' },
            { namePrefix: 'ESP32' },
            { services: [uuidLower] },
          ],
          optionalServices: [uuidLower, uuidUpper],
        });
      } catch (filterErr: any) {
        if (filterErr.name === 'NotFoundError' || filterErr.message?.includes('User cancelled')) {
          throw filterErr;
        }

        console.log('[WebBleAdapter] Filter strategy returned no match, trying acceptAllDevices fallback for Desktop Chrome...', filterErr);

        // Strategy 2: Fallback acceptAllDevices for Desktop Web browsers
        selectedDevice = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: [uuidLower, uuidUpper],
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

      // Find Primary Service
      let service: any = null;
      try {
        service = await this.gattServer.getPrimaryService(uuidLower);
      } catch (e) {
        try {
          service = await this.gattServer.getPrimaryService(uuidUpper);
        } catch (e2) {
          const services = await this.gattServer.getPrimaryServices();
          if (services && services.length > 0) {
            service = services[0];
          } else {
            throw new Error(`GATT Primary Service ${BLE_CONFIG.serviceUuid} not found on device.`);
          }
        }
      }

      // Find Characteristic
      try {
        this.characteristic = await service.getCharacteristic(charUuidLower);
      } catch (e) {
        const characteristics = await service.getCharacteristics();
        if (characteristics && characteristics.length > 0) {
          this.characteristic = characteristics[0];
        } else {
          throw new Error(`GATT Characteristic ${BLE_CONFIG.characteristicUuid} not found.`);
        }
      }

      // Subscribe to Notifications
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
      console.error('[WebBleAdapter] Desktop Web BLE error:', err);
      const isUserCancel = err.name === 'NotFoundError' || err.message?.includes('User cancelled') || err.message?.includes('cancel');

      telemetryStore.setConnectionState({
        connected: false,
        connecting: false,
        connectionError: isUserCancel
          ? 'Bluetooth pair request canceled by user.'
          : (err.message || 'Desktop Bluetooth pairing failed. Ensure Bluetooth is turned ON in Windows/Mac settings.'),
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
      console.warn('[WebBleAdapter] Error parsing GATT notification packet:', err);
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
