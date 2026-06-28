import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './useAuthStore';

export interface DiarrheaLog {
  id: string;
  timestamp: string; // ISO string
  stoolType: number;       // Bristol Stool Chart type (1-7), type 6-7 represent diarrhea
  frequency: number;       // Number of events today
  cramping: 'None' | 'Mild' | 'Moderate' | 'Severe';
  fever: boolean;
  nausea: boolean;
  bloodInStool: boolean;
  fluidLossEstimate: number; // in ml, estimated based on stoolType and frequency
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes?: string;
}

interface DiarrheaState {
  logs: DiarrheaLog[];
  recoveryScore: number; // 0 to 100
  logSymptoms: (log: Omit<DiarrheaLog, 'id' | 'timestamp' | 'fluidLossEstimate' | 'severity'>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  editLog: (id: string, updatedSymptoms: Partial<Omit<DiarrheaLog, 'id' | 'timestamp' | 'fluidLossEstimate' | 'severity'>>) => Promise<void>;
  loadJournalLogs: () => Promise<void>;
  calculateRecoveryScore: () => void;
}

const STORAGE_KEY = 'hydrax-diarrhea-storage';

const loadSavedState = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          logs: parsed.logs ?? [
            {
              id: 'dlog-1',
              timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
              stoolType: 7,
              frequency: 5,
              cramping: 'Moderate',
              fever: false,
              nausea: true,
              bloodInStool: false,
              fluidLossEstimate: 1200,
              severity: 'Moderate'
            },
            {
              id: 'dlog-2',
              timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
              stoolType: 6,
              frequency: 3,
              cramping: 'Mild',
              fever: false,
              nausea: false,
              bloodInStool: false,
              fluidLossEstimate: 600,
              severity: 'Mild'
            }
          ],
          recoveryScore: parsed.recoveryScore ?? 82
        };
      }
    } catch (e) {
      console.error('Failed to load diarrhea state', e);
    }
  }
  return {
    logs: [
      {
        id: 'dlog-1',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        stoolType: 7,
        frequency: 5,
        cramping: 'Moderate' as const,
        fever: false,
        nausea: true,
        bloodInStool: false,
        fluidLossEstimate: 1200,
        severity: 'Moderate' as const
      },
      {
        id: 'dlog-2',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        stoolType: 6,
        frequency: 3,
        cramping: 'Mild' as const,
        fever: false,
        nausea: false,
        bloodInStool: false,
        fluidLossEstimate: 600,
        severity: 'Mild' as const
      }
    ],
    recoveryScore: 82
  };
};

const saveState = (state: Partial<DiarrheaState>) => {
  if (typeof window !== 'undefined') {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, ...state }));
    } catch (e) {
      console.error('Failed to save diarrhea state', e);
    }
  }
};

const initialState = loadSavedState();

export const useDiarrheaStore = create<DiarrheaState>((set, get) => ({
  logs: initialState.logs,
  recoveryScore: initialState.recoveryScore,

  loadJournalLogs: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('journal_logs')
        .select('*')
        .eq('user_id', user.uid)
        .order('timestamp', { ascending: false });

      if (error) throw new Error(error.message);

      if (data) {
        const formattedLogs = data.map((d: any) => ({
          id: d.id,
          timestamp: d.timestamp,
          stoolType: d.stool_type,
          frequency: d.frequency,
          cramping: d.cramping,
          fever: d.fever,
          nausea: d.nausea,
          bloodInStool: d.blood_in_stool,
          fluidLossEstimate: d.fluid_loss_estimate,
          severity: d.severity,
          notes: d.notes
        }));
        set({ logs: formattedLogs });
        saveState({ logs: formattedLogs });
        get().calculateRecoveryScore();
      }
    } catch (e) {
      console.warn('Failed to load journal logs from Supabase:', e);
    }
  },

  logSymptoms: async (symptoms) => {
    const fluidLossEstimate = symptoms.frequency * (symptoms.stoolType >= 6 ? 250 : 100);
    
    let severity: 'Mild' | 'Moderate' | 'Severe' = 'Mild';
    if (symptoms.frequency > 5 || symptoms.cramping === 'Severe' || symptoms.bloodInStool || symptoms.fever) {
      severity = 'Severe';
    } else if (symptoms.frequency >= 3 || symptoms.cramping === 'Moderate' || symptoms.nausea) {
      severity = 'Moderate';
    }

    const newLog: DiarrheaLog = {
      id: 'dlog-' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      fluidLossEstimate,
      severity,
      ...symptoms
    };

    const user = useAuthStore.getState().user;
    if (user) {
      try {
        const { data, error } = await supabase.from('journal_logs').insert({
          user_id: user.uid,
          stool_type: symptoms.stoolType,
          frequency: symptoms.frequency,
          cramping: symptoms.cramping,
          fever: symptoms.fever,
          nausea: symptoms.nausea,
          blood_in_stool: symptoms.bloodInStool,
          fluid_loss_estimate: fluidLossEstimate,
          severity,
          notes: symptoms.notes ?? '',
          timestamp: newLog.timestamp
        }).select();

        if (error) throw new Error(error.message);
        if (data && data[0]) {
          newLog.id = data[0].id;
        }
      } catch (e) {
        console.warn('Supabase journal logs insert failed:', e);
      }
    }

    const updatedLogs = [newLog, ...get().logs];
    set({ logs: updatedLogs });
    saveState({ logs: updatedLogs });

    get().calculateRecoveryScore();
  },

  deleteLog: async (id) => {
    try {
      const { error } = await supabase.from('journal_logs').delete().eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase delete journal log failed:', e);
    }

    const updatedLogs = get().logs.filter((log) => log.id !== id);
    set({ logs: updatedLogs });
    saveState({ logs: updatedLogs });

    get().calculateRecoveryScore();
  },

  editLog: async (id, updatedSymptoms) => {
    const logs = get().logs;
    const logIndex = logs.findIndex((log) => log.id === id);
    if (logIndex === -1) return;

    const existingLog = logs[logIndex];
    const merged = { ...existingLog, ...updatedSymptoms };

    const fluidLossEstimate = merged.frequency * (merged.stoolType >= 6 ? 250 : 100);
    let severity: 'Mild' | 'Moderate' | 'Severe' = 'Mild';
    if (merged.frequency > 5 || merged.cramping === 'Severe' || merged.bloodInStool || merged.fever) {
      severity = 'Severe';
    } else if (merged.frequency >= 3 || merged.cramping === 'Moderate' || merged.nausea) {
      severity = 'Moderate';
    }

    try {
      const { error } = await supabase.from('journal_logs').update({
        stool_type: merged.stoolType,
        frequency: merged.frequency,
        cramping: merged.cramping,
        fever: merged.fever,
        nausea: merged.nausea,
        blood_in_stool: merged.bloodInStool,
        fluid_loss_estimate: fluidLossEstimate,
        severity,
        notes: merged.notes ?? ''
      }).eq('id', id);
      if (error) throw new Error(error.message);
    } catch (e) {
      console.warn('Supabase update journal log failed:', e);
    }

    const updatedLog: DiarrheaLog = {
      ...merged,
      fluidLossEstimate,
      severity
    };

    const updatedLogs = [...logs];
    updatedLogs[logIndex] = updatedLog;

    set({ logs: updatedLogs });
    saveState({ logs: updatedLogs });

    get().calculateRecoveryScore();
  },

  calculateRecoveryScore: () => {
    const logs = get().logs;
    if (logs.length === 0) {
      set({ recoveryScore: 100 });
      saveState({ recoveryScore: 100 });
      return;
    }

    const recentLogs = logs.slice(0, 3);
    let penaltyPoints = 0;
    
    recentLogs.forEach((log) => {
      penaltyPoints += log.frequency * 8;
      if (log.severity === 'Severe') penaltyPoints += 30;
      if (log.severity === 'Moderate') penaltyPoints += 15;
      if (log.fever) penaltyPoints += 15;
      if (log.bloodInStool) penaltyPoints += 40;
    });

    const score = Math.max(0, Math.min(100, 100 - penaltyPoints));
    set({ recoveryScore: score });
    saveState({ recoveryScore: score });
  }
}));
