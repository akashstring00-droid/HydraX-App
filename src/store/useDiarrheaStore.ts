import { create } from 'zustand';

export interface DiarrheaLog {
  id: string;
  timestamp: Date;
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

export const useDiarrheaStore = create<DiarrheaState>((set, get) => ({
  logs: [
    {
      id: 'dlog-1',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
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
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
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
  recoveryScore: 82,

  logSymptoms: (symptoms) => {
    // Basic fluid loss heuristic: 200ml per high-type bowel movement
    const fluidLossEstimate = symptoms.frequency * (symptoms.stoolType >= 6 ? 250 : 100);
    
    // Severity assessment:
    let severity: 'Mild' | 'Moderate' | 'Severe' = 'Mild';
    if (symptoms.frequency > 5 || symptoms.cramping === 'Severe' || symptoms.bloodInStool || symptoms.fever) {
      severity = 'Severe';
    } else if (symptoms.frequency >= 3 || symptoms.cramping === 'Moderate' || symptoms.nausea) {
      severity = 'Moderate';
    }

    const newLog: DiarrheaLog = {
      id: 'dlog-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      fluidLossEstimate,
      severity,
      ...symptoms
    };

    set((state) => ({
      logs: [newLog, ...state.logs]
    }));

    get().calculateRecoveryScore();
  },

  deleteLog: (id) => {
    set((state) => ({
      logs: state.logs.filter((log) => log.id !== id)
    }));
    get().calculateRecoveryScore();
  },

  calculateRecoveryScore: () => {
    const logs = get().logs;
    if (logs.length === 0) {
      set({ recoveryScore: 100 });
      return;
    }

    // A higher recovery score represents fewer symptoms over the last 2 days
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
  }
}));
