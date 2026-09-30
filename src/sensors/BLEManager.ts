import { DeviceStatus } from '../types';
import { defaultDevices } from '../data/mockData';

/**
 * HydraX BLE Hardware Abstraction Layer
 * 
 * Future Integration Guide for ESP32 / Wearable Sensors:
 * To bind real physical BLE hardware (e.g. react-native-ble-plx or WebBLE),
 * replace the simulated scanner below with a GATT characteristic listener:
 * 
 * - Service UUID: 0x180D (Heart Rate Service) -> MAX30102 / MAX30105
 * - Service UUID: 0x1809 (Health Thermometer) -> TMP117
 * - Service UUID: Custom ESP32 HydraX Service (0x4A59) -> BMI160 Motion / AQI Sensor
 */

class BLEManager {
  private devices: DeviceStatus[] = [...defaultDevices];
  private isScanning: boolean = false;

  public getDevices(): DeviceStatus[] {
    return this.devices;
  }

  public toggleDeviceConnection(deviceName: string): DeviceStatus[] {
    this.devices = this.devices.map((dev) => {
      if (dev.name === deviceName) {
        return { ...dev, connected: !dev.connected };
      }
      return dev;
    });
    return [...this.devices];
  }

  public simulateScan(onScanComplete: (devices: DeviceStatus[]) => void) {
    this.isScanning = true;
    setTimeout(() => {
      this.isScanning = false;
      onScanComplete(this.devices);
    }, 1500);
  }

  public isScanActive(): boolean {
    return this.isScanning;
  }
}

export const bleManager = new BLEManager();
