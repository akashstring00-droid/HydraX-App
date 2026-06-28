import { create } from 'zustand';

export interface BLEDevice {
  id: string;
  name: string;
  rssi?: number;
}

interface BLEState {
  devices: BLEDevice[];
  connectedDevice: BLEDevice | null;
  isScanning: boolean;
  isStreaming: boolean;
  isDemoMode: boolean;
  batteryLevel: number;
  startScan: () => void;
  stopScan: () => void;
  connectDevice: (device: BLEDevice) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  toggleDemoMode: () => void;
  setStreaming: (streaming: boolean) => void;
  setBatteryLevel: (level: number) => void;
}

export const useBLEStore = create<BLEState>((set, get) => ({
  devices: [],
  connectedDevice: { id: 'SIMULATED-DEV-001', name: 'Hydrax Wearable (Simulated)' },
  isScanning: false,
  isStreaming: true,
  isDemoMode: true, // Defaults to Demo Mode so the app works out of the box
  batteryLevel: 94,

  startScan: () => {
    set({ isScanning: true, devices: [] });
    // In production BLEManager: startScan()
    // Simulated scan discovery:
    setTimeout(() => {
      if (get().isScanning) {
        set((state) => ({
          devices: [
            { id: 'ESP32-HYDRAX-01', name: 'Hydrax Wearable v1.0', rssi: -65 },
            { id: 'TI-AFE4900-DEV', name: 'Hydrax BioSensor Dev', rssi: -72 },
            ...state.devices
          ]
        }));
      }
    }, 1500);
  },

  stopScan: () => {
    set({ isScanning: false });
  },

  connectDevice: async (device) => {
    set({ isScanning: false });
    // In production BLEManager: connect()
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ connectedDevice: device });
  },

  disconnectDevice: async () => {
    // In production BLEManager: disconnect()
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ connectedDevice: null, isStreaming: false });
  },

  toggleDemoMode: () => {
    const nextMode = !get().isDemoMode;
    if (nextMode) {
      // If turning on demo mode, we simulate connecting to a dev device
      set({
        isDemoMode: true,
        connectedDevice: { id: 'SIMULATED-DEV-001', name: 'Hydrax Wearable (Simulated)' },
        batteryLevel: 94
      });
    } else {
      set({
        isDemoMode: false,
        connectedDevice: null,
        isStreaming: false,
        batteryLevel: 0
      });
    }
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setBatteryLevel: (level) => set({ batteryLevel: level }),
}));
