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

      // Chrome W3C Web Bluetooth requirement: ALL UUIDs must be lowercased strings
      const targetServiceUuid = BLE_CONFIG.serviceUuid.toLowerCase().trim();
      const targetCharUuid = BLE_CONFIG.characteristicUuid.toLowerCase().trim();

      const allowedServices = [
        targetServiceUuid,
        '00007d8a-0000-1000-8000-00805f9b34fb',
        '0000180d-0000-1000-8000-00805f9b34fb', // Standard Heart Rate
        '0000181a-0000-1000-8000-00805f9b34fb', // Standard Environmental
      ];

      const isDesktop = typeof navigator !== 'undefined' && !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      let selectedDevice: any = null;

      if (isDesktop) {
        // Desktop Chrome (Windows / Mac) optimal configuration
        try {
          selectedDevice = await navBt.requestDevice({
            acceptAllDevices: true,
            optionalServices: allowedServices,
          });
        } catch (err: any) {
          if (err.name === 'NotFoundError' || err.message?.includes('User cancelled') || err.message?.includes('cancel')) {
            throw err;
          }
          console.log('[WebBleAdapter] Desktop acceptAllDevices failed, trying named filter...', err);
          selectedDevice = await navBt.requestDevice({
            filters: [{ name: BLE_CONFIG.deviceName }],
            optionalServices: allowedServices,
          });
        }
      } else {
        // Mobile Chrome (Android) optimal configuration (user confirmed working smoothly)
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
          if (err.name === 'NotFoundError' || err.message?.includes('User cancelled') || err.message?.includes('cancel')) {
            throw err;
          }
          selectedDevice = await navBt.requestDevice({
            acceptAllDevices: true,
            optionalServices: allowedServices,
          });
        }
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

      // Connect to GATT Server with retry loop for Windows Bluetooth Stack
      let connectedGattServer: any = null;
      let lastGattErr: any = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (this.device.gatt && this.device.gatt.connected) {
            connectedGattServer = this.device.gatt;
            break;
          }
          connectedGattServer = await this.device.gatt.connect();
          if (connectedGattServer && connectedGattServer.connected) {
            break;
          }
        } catch (e: any) {
          lastGattErr = e;
          console.warn(`[WebBleAdapter] GATT connect attempt ${attempt} failed, retrying in 300ms...`, e);
          await new Promise((res) => setTimeout(res, 300));
        }
      }

      if (!connectedGattServer || !connectedGattServer.connected) {
        throw lastGattErr || new Error('GATT server connection attempt failed. Ensure device is powered ON and not paired to another app.');
      }

      this.gattServer = connectedGattServer;

      // 200ms buffer for Windows/Mac GATT driver database sync
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Primary Service Discovery
      let service: any = null;
      for (const uuid of allowedServices) {
        try {
          service = await this.gattServer.getPrimaryService(uuid);
          if (service) break;
        } catch (_) {}
      }

      if (!service) {
        throw new Error(`GATT Primary Service ${targetServiceUuid} not found or inaccessible.`);
      }

      // Characteristic Discovery
      let targetChar: any = null;
      try {
        targetChar = await service.getCharacteristic(targetCharUuid);
      } catch (e1) {
        try {
          const characteristics = await service.getCharacteristics();
          targetChar = characteristics.find((c: any) => c.properties.notify || c.properties.indicate) || characteristics[0];
        } catch (e2) {
          console.warn('[WebBleAdapter] Characteristic discovery error:', e2);
        }
      }

      if (!targetChar) {
        throw new Error(`GATT Characteristic ${targetCharUuid} not found.`);
      }

      this.characteristic = targetChar;

      // Subscribe to 1Hz notifications
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
