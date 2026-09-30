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
      const serviceUuidUpper = BLE_CONFIG.serviceUuid.toUpperCase();
      const charUuidLower = BLE_CONFIG.characteristicUuid.toLowerCase();
      const charUuidUpper = BLE_CONFIG.characteristicUuid.toUpperCase();

      // List of allowed services for Chrome Desktop Web Bluetooth security policy
      const allowedServices = [
        serviceUuidLower,
        serviceUuidUpper,
        '00007d8a-0000-1000-8000-00805f9b34fb',
        '0000180d-0000-1000-8000-00805f9b34fb', // Heart rate standard
        '0000181a-0000-1000-8000-00805f9b34fb', // Environmental sensing
        '0000180f-0000-1000-8000-00805f9b34fb', // Battery service
      ];

      let selectedDevice: any = null;

      // Strategy 1: Attempt exact name & service filter request
      try {
        selectedDevice = await navBt.requestDevice({
          filters: [
            { name: BLE_CONFIG.deviceName },
            { namePrefix: 'HydraX' },
            { namePrefix: 'ESP32' },
          ],
          optionalServices: allowedServices,
        });
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
          throw err;
        }

        console.log('[WebBleAdapter] Named filter returned no device, opening universal acceptAllDevices dialog...', err);

        // Strategy 2: Accept all devices (shows all Bluetooth peripherals in Chrome picker)
        selectedDevice = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: allowedServices,
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

      // 150ms delay for Windows/Mac Bluetooth GATT driver database sync
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Discover Primary Service safely from allowedServices list
      let service: any = null;
      for (const uuid of allowedServices) {
        try {
          service = await this.gattServer.getPrimaryService(uuid);
          if (service) break;
        } catch (_) {}
      }

      if (!service) {
        // Fallback service lookup
        try {
          const services = await this.gattServer.getPrimaryServices();
          if (services && services.length > 0) {
            service = services[0];
          }
        } catch (e) {
          console.warn('[WebBleAdapter] getPrimaryServices() fallback error:', e);
        }
      }

      if (!service) {
        throw new Error(`GATT Primary Service ${BLE_CONFIG.serviceUuid} not accessible on device.`);
      }

      // Discover Characteristic safely
      let targetChar: any = null;
      try {
        targetChar = await service.getCharacteristic(charUuidLower);
      } catch (e1) {
        try {
          targetChar = await service.getCharacteristic(charUuidUpper);
        } catch (e2) {
          try {
            const characteristics = await service.getCharacteristics();
            targetChar = characteristics.find((c: any) => c.properties.notify || c.properties.indicate) || characteristics[0];
          } catch (e3) {
            console.warn('[WebBleAdapter] Characteristic lookup error:', e3);
          }
        }
      }

      if (!targetChar) {
        throw new Error(`GATT Characteristic ${BLE_CONFIG.characteristicUuid} not found.`);
      }

      this.characteristic = targetChar;

      // Subscribe to notifications
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

      const detailedMsg = isUserCancel
        ? 'Bluetooth pair request canceled by user.'
        : `Connection Error: ${err.message || 'GATT pair failed'}`;

      telemetryStore.setConnectionState({
        connected: false,
        connecting: false,
        connectionError: detailedMsg,
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
