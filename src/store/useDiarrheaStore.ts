import { create } from 'zustand';

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
}

interface DiarrheaState {
  logs: DiarrheaLog[];
  recoveryScore: number; // 0 to 100
  logSymptoms: (log: Omit<DiarrheaLog, 'id' | 'timestamp' | 'fluidLossEstimate' | 'severity'>) => void;
  deleteLog: (id: string) => void;
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

  logSymptoms: (symptoms) => {
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

    const updatedLogs = [newLog, ...get().logs];
    set({ logs: updatedLogs });
    saveState({ logs: updatedLogs });

    get().calculateRecoveryScore();
  },

  deleteLog: (id) => {
    const updatedLogs = get().logs.filter((log) => log.id !== id);
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
