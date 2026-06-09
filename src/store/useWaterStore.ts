import { create } from 'zustand';

export interface WaterLog {
  id: string;
  amount: number; // in ml
  timestamp: Date;
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

export const useWaterStore = create<WaterState>((set, get) => ({
  dailyWaterTarget: 2500,
  currentIntake: 750,
  logs: [
    { id: 'log-1', amount: 250, timestamp: new Date(new Date().setHours(8, 15, 0)) },
    { id: 'log-2', amount: 500, timestamp: new Date(new Date().setHours(11, 30, 0)) },
  ],
  remindersEnabled: true,
  reminderInterval: 60,

  logWater: (amount) => {
    const newLog: WaterLog = {
      id: 'water-' + Math.random().toString(36).substr(2, 9),
      amount,
      timestamp: new Date()
    };
    
    set((state) => ({
      logs: [newLog, ...state.logs],
      currentIntake: state.currentIntake + amount
    }));
  },

  removeLog: (id) => {
    const logToRemove = get().logs.find((log) => log.id === id);
    if (!logToRemove) return;

    set((state) => ({
      logs: state.logs.filter((log) => log.id !== id),
      currentIntake: Math.max(0, state.currentIntake - logToRemove.amount)
    }));
  },

  setDailyTarget: (target) => set({ dailyWaterTarget: target }),
  
  toggleReminders: () => set((state) => ({ remindersEnabled: !state.remindersEnabled })),
  
  setReminderInterval: (minutes) => set({ reminderInterval: minutes }),

  resetDailyIntake: () => set({ currentIntake: 0, logs: [] }),
}));
