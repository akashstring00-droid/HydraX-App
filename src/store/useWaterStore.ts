import { create } from 'zustand';
import { requestPermissions, scheduleReminders } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

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
  logWater: (amount: number) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  updateLog: (id: string, amount: number) => Promise<void>;
  loadWaterLogs: () => Promise<void>;
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

  loadWaterLogs: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.uid)
        .gte('timestamp', startOfDay.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw new Error(error.message);

      if (data) {
        const formattedLogs = data.map((d: any) => ({
          id: d.id,
          amount: d.amount,
          timestamp: d.timestamp
        }));
        const totalIntake = formattedLogs.reduce((sum: number, log: any) => sum + log.amount, 0);
        set({ logs: formattedLogs, currentIntake: totalIntake });
        saveState({ logs: formattedLogs, currentIntake: totalIntake });
      }
    } catch (e) {
      console.warn('Supabase load water logs failed:', e);
    }
  },

  logWater: async (amount) => {
    const newLog: WaterLog = {
      id: 'water-' + Math.random().toString(36).substring(2, 11),
      amount,
      timestamp: new Date().toISOString()
    };
    
    const user = useAuthStore.getState().user;
    if (user) {
      try {
        const { data, error } = await supabase.from('water_logs').insert({
          user_id: user.uid,
          amount,
          timestamp: newLog.timestamp
        }).select();
        
        if (error) throw new Error(error.message);
        if (data && data[0]) {
          newLog.id = data[0].id;
        }
      } catch (e) {
        console.warn('Supabase log water insert failed:', e);
      }
    }

    const updatedLogs = [newLog, ...get().logs];
    const updatedIntake = get().currentIntake + amount;

    if (get().currentIntake < get().dailyWaterTarget && updatedIntake >= get().dailyWaterTarget) {
      try {
        const { triggerGoalAchievement } = require('../lib/notifications');
        triggerGoalAchievement(7);
      } catch (e) {}
    }
    
    set({
      logs: updatedLogs,
      currentIntake: updatedIntake
    });
    
    saveState({
      logs: updatedLogs,
      currentIntake: updatedIntake
    });
  },

  removeLog: async (id) => {
    const logToRemove = get().logs.find((log) => log.id === id);
    if (!logToRemove) return;

    try {
      const { error } = await supabase.from('water_logs').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase delete water log failed:', e);
    }

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

  updateLog: async (id, amount) => {
    const logs = get().logs;
    const logIndex = logs.findIndex((log) => log.id === id);
    if (logIndex === -1) return;

    try {
      const { error } = await supabase.from('water_logs').update({ amount }).eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase update water log failed:', e);
    }

    const oldAmount = logs[logIndex].amount;
    const updatedLogs = [...logs];
    updatedLogs[logIndex] = {
      ...updatedLogs[logIndex],
      amount
    };

    const updatedIntake = Math.max(0, get().currentIntake - oldAmount + amount);

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
    if (nextVal) {
      requestPermissions().then((granted) => {
        scheduleReminders(granted, get().reminderInterval);
      });
    } else {
      scheduleReminders(false, get().reminderInterval);
    }
  },
  
  setReminderInterval: (minutes) => {
    set({ reminderInterval: minutes });
    saveState({ reminderInterval: minutes });
    scheduleReminders(get().remindersEnabled, minutes);
  },

  resetDailyIntake: () => {
    set({ currentIntake: 0, logs: [] });
    saveState({ currentIntake: 0, logs: [] });
  },
}));
