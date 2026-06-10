import { create } from 'zustand';

export interface VitalsData {
  heartRate: number;
  hrv: number;       // in ms
  skinTemp: number;   // in °C
  motion: number;     // in m/s^2 (G-forces)
}

export interface PredictionResult {
  dehydrationPercent: number; // 0 - 100
  hydrationScore: number;     // 100 - dehydrationPercent
  riskLevel: 'Low' | 'Medium' | 'High';
  confidenceScore: number;    // 0 - 100
  recommendations: string[];
}

export interface DataPoint {
  time: string;
  value: number;
}

interface VitalsState {
  currentVitals: VitalsData;
  prediction: PredictionResult;
  ppgBuffer: DataPoint[];
  hrvBuffer: DataPoint[];
  dailyHistory: { time: string; hydrationScore: number; heartRate: number }[];
  addSensorData: (ppgValue: number, hrValue: number, hrvValue: number, tempValue: number, motionValue: number) => void;
  updatePrediction: (result: PredictionResult) => void;
  setVitals: (vitals: Partial<VitalsData>) => void;
  clearBuffers: () => void;
}

const STORAGE_KEY = 'hydrax-vitals-storage';

const loadSavedState = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          currentVitals: parsed.currentVitals ?? {
            heartRate: 72,
            hrv: 60,
            skinTemp: 36.6,
            motion: 0.1
          },
          prediction: parsed.prediction ?? {
            dehydrationPercent: 5,
            hydrationScore: 95,
            riskLevel: 'Low',
            confidenceScore: 94,
            recommendations: [
              'Your hydration is optimal. Keep it up!',
              'Drink 250ml water in the next 1 hour.',
              'Wearable connection is strong.'
            ]
          },
          ppgBuffer: parsed.ppgBuffer ?? Array.from({ length: 40 }, (_, i) => ({ time: `${i}`, value: 512 + Math.sin(i * 0.4) * 100 })),
          hrvBuffer: parsed.hrvBuffer ?? Array.from({ length: 20 }, (_, i) => ({ time: `${i}`, value: 55 + Math.random() * 10 })),
          dailyHistory: parsed.dailyHistory ?? [
            { time: '08:00', hydrationScore: 98, heartRate: 68 },
            { time: '10:00', hydrationScore: 95, heartRate: 72 },
            { time: '12:00', hydrationScore: 90, heartRate: 75 },
            { time: '14:00', hydrationScore: 84, heartRate: 80 },
            { time: '16:00', hydrationScore: 88, heartRate: 74 },
            { time: '18:00', hydrationScore: 92, heartRate: 71 },
            { time: '20:00', hydrationScore: 95, heartRate: 69 },
          ]
        };
      }
    } catch (e) {
      console.error('Failed to load vitals state', e);
    }
  }
  return {
    currentVitals: {
      heartRate: 72,
      hrv: 60,
      skinTemp: 36.6,
      motion: 0.1
    },
    prediction: {
      dehydrationPercent: 5,
      hydrationScore: 95,
      riskLevel: 'Low' as const,
      confidenceScore: 94,
      recommendations: [
        'Your hydration is optimal. Keep it up!',
        'Drink 250ml water in the next 1 hour.',
        'Wearable connection is strong.'
      ]
    },
    ppgBuffer: Array.from({ length: 40 }, (_, i) => ({ time: `${i}`, value: 512 + Math.sin(i * 0.4) * 100 })),
    hrvBuffer: Array.from({ length: 20 }, (_, i) => ({ time: `${i}`, value: 55 + Math.random() * 10 })),
    dailyHistory: [
      { time: '08:00', hydrationScore: 98, heartRate: 68 },
      { time: '10:00', hydrationScore: 95, heartRate: 72 },
      { time: '12:00', hydrationScore: 90, heartRate: 75 },
      { time: '14:00', hydrationScore: 84, heartRate: 80 },
      { time: '16:00', hydrationScore: 88, heartRate: 74 },
      { time: '18:00', hydrationScore: 92, heartRate: 71 },
      { time: '20:00', hydrationScore: 95, heartRate: 69 },
    ]
  };
};

const saveState = (state: Partial<VitalsState>) => {
  if (typeof window !== 'undefined') {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, ...state }));
    } catch (e) {
      console.error('Failed to save vitals state', e);
    }
  }
};

const initialState = loadSavedState();

export const useVitalsStore = create<VitalsState>((set, get) => ({
  currentVitals: initialState.currentVitals,
  prediction: initialState.prediction,
  ppgBuffer: initialState.ppgBuffer,
  hrvBuffer: initialState.hrvBuffer,
  dailyHistory: initialState.dailyHistory,

  addSensorData: (ppgValue, hrValue, hrvValue, tempValue, motionValue) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const newPpgBuffer = [...get().ppgBuffer, { time: now, value: ppgValue }].slice(-50);
    const newHrvBuffer = [...get().hrvBuffer, { time: now, value: hrvValue }].slice(-25);
    const newVitals: VitalsData = {
      heartRate: Math.round(hrValue),
      hrv: Math.round(hrvValue),
      skinTemp: Number(tempValue.toFixed(1)),
      motion: Number(motionValue.toFixed(2))
    };

    set({
      ppgBuffer: newPpgBuffer,
      hrvBuffer: newHrvBuffer,
      currentVitals: newVitals
    });

    saveState({
      ppgBuffer: newPpgBuffer,
      hrvBuffer: newHrvBuffer,
      currentVitals: newVitals
    });
  },

  updatePrediction: (result) => {
    set({ prediction: result });
    saveState({ prediction: result });
  },
  
  setVitals: (vitals) => {
    const updated = { ...get().currentVitals, ...vitals };
    set({ currentVitals: updated });
    saveState({ currentVitals: updated });
  },

  clearBuffers: () => {
    set({ ppgBuffer: [], hrvBuffer: [] });
    saveState({ ppgBuffer: [], hrvBuffer: [] });
  },
}));
