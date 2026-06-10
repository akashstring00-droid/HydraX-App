import { create } from 'zustand';

export interface WaterLog {
  id: string;
  amount: number; // in ml
  timestamp: string; // ISO string
}

interface WaterState {
  dailyWaterTarget: number; // in ml
  currentIntake: number;     // in ml
  logs: WaterLog[];
  remindersEnabled: boolean;
  reminderInterval: number;  // in minutes
  logWater: (amount: number) => void;
  removeLog: (id: string) => void;
  setDailyTarget: (target: number) => void;
  toggleReminders: () => void;
  setReminderInterval: (minutes: number) => void;
  resetDailyIntake: () => void;
}

const STORAGE_KEY = 'hydrax-water-storage';

const loadSavedState = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          dailyWaterTarget: parsed.dailyWaterTarget ?? 2500,
          currentIntake: parsed.currentIntake ?? 750,
          logs: parsed.logs ?? [
            { id: 'log-1', amount: 250, timestamp: new Date(new Date().setHours(8, 15, 0)).toISOString() },
            { id: 'log-2', amount: 500, timestamp: new Date(new Date().setHours(11, 30, 0)).toISOString() },
          ],
          remindersEnabled: parsed.remindersEnabled ?? true,
          reminderInterval: parsed.reminderInterval ?? 60
        };
      }
    } catch (e) {
      console.error('Failed to load water state', e);
    }
  }
  return {
    dailyWaterTarget: 2500,
    currentIntake: 750,
    logs: [
      { id: 'log-1', amount: 250, timestamp: new Date(new Date().setHours(8, 15, 0)).toISOString() },
      { id: 'log-2', amount: 500, timestamp: new Date(new Date().setHours(11, 30, 0)).toISOString() },
    ],
    remindersEnabled: true,
    reminderInterval: 60
  };
};

const saveState = (state: Partial<WaterState>) => {
  if (typeof window !== 'undefined') {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, ...state }));
    } catch (e) {
      console.error('Failed to save water state', e);
    }
  }
};

const initialState = loadSavedState();

export const useWaterStore = create<WaterState>((set, get) => ({
  dailyWaterTarget: initialState.dailyWaterTarget,
  currentIntake: initialState.currentIntake,
  logs: initialState.logs,
  remindersEnabled: initialState.remindersEnabled,
  reminderInterval: initialState.reminderInterval,

  logWater: (amount) => {
    const newLog: WaterLog = {
      id: 'water-' + Math.random().toString(36).substring(2, 11),
      amount,
      timestamp: new Date().toISOString()
    };
    const updatedLogs = [newLog, ...get().logs];
    const updatedIntake = get().currentIntake + amount;
    
    set({
      logs: updatedLogs,
      currentIntake: updatedIntake
    });
    
    saveState({
      logs: updatedLogs,
      currentIntake: updatedIntake
    });
  },

  removeLog: (id) => {
    const logToRemove = get().logs.find((log) => log.id === id);
    if (!logToRemove) return;

    const updatedLogs = get().logs.filter((log) => log.id !== id);
    const updatedIntake = Math.max(0, get().currentIntake - logToRemove.amount);

    set({
      logs: updatedLogs,
      currentIntake: updatedIntake
    });

    saveState({
      logs: updatedLogs,
      currentIntake: updatedIntake
    });
  },

  setDailyTarget: (target) => {
    set({ dailyWaterTarget: target });
    saveState({ dailyWaterTarget: target });
  },
  
  toggleReminders: () => {
    const nextVal = !get().remindersEnabled;
    set({ remindersEnabled: nextVal });
    saveState({ remindersEnabled: nextVal });
  },
  
  setReminderInterval: (minutes) => {
    set({ reminderInterval: minutes });
    saveState({ reminderInterval: minutes });
  },

  resetDailyIntake: () => {
    set({ currentIntake: 0, logs: [] });
    saveState({ currentIntake: 0, logs: [] });
  },
}));
