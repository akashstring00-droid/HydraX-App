import { create } from 'zustand';

export interface GoalBadge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  dateEarned: string;
  category: 'hydration' | 'recovery' | 'sleep' | 'activity';
  iconName: string; // We can map this to Lucide icons
}

interface GoalsState {
  // Goals Targets
  dailyHydrationTarget: number; // in ml
  weeklyRecoveryTarget: number; // percentage (average)
  dailySleepTarget: number;     // in hours
  dailyActivityTarget: number;  // in steps

  // Current Streak Counters
  currentStreak: number;
  bestStreak: number;
  monthlyStreak: number;

  // Badges Earned
  badges: GoalBadge[];

  // Actions
  setGoalTarget: (type: 'hydration' | 'recovery' | 'sleep' | 'activity', target: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  awardBadge: (name: string, description: string, tier: 'bronze' | 'silver' | 'gold' | 'platinum', category: 'hydration' | 'recovery' | 'sleep' | 'activity', iconName: string) => void;
  clearBadges: () => void;
}

const STORAGE_KEY = 'hydrax-goals-storage';

const loadSavedState = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          dailyHydrationTarget: parsed.dailyHydrationTarget ?? 2500,
          weeklyRecoveryTarget: parsed.weeklyRecoveryTarget ?? 80,
          dailySleepTarget: parsed.dailySleepTarget ?? 8.0,
          dailyActivityTarget: parsed.dailyActivityTarget ?? 10000,
          currentStreak: parsed.currentStreak ?? 5, // Default start streak to make app look active
          bestStreak: parsed.bestStreak ?? 12,
          monthlyStreak: parsed.monthlyStreak ?? 18,
          badges: parsed.badges ?? [
            {
              id: 'badge-1',
              name: 'Hydration Pioneer',
              description: 'Met daily water target 5 days in a row.',
              tier: 'bronze',
              dateEarned: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
              category: 'hydration',
              iconName: 'Flame'
            },
            {
              id: 'badge-2',
              name: 'Recovery Master',
              description: 'Exceeded 90% recovery score after deep sleep.',
              tier: 'silver',
              dateEarned: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
              category: 'recovery',
              iconName: 'Award'
            },
            {
              id: 'badge-3',
              name: 'Sleep Guru',
              description: 'Completed 8 hours of sleep target.',
              tier: 'bronze',
              dateEarned: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
              category: 'sleep',
              iconName: 'Moon'
            }
          ]
        };
      }
    } catch (e) {
      console.error('Failed to load goals state', e);
    }
  }
  return {
    dailyHydrationTarget: 2500,
    weeklyRecoveryTarget: 80,
    dailySleepTarget: 8.0,
    dailyActivityTarget: 10000,
    currentStreak: 5,
    bestStreak: 12,
    monthlyStreak: 18,
    badges: [
      {
        id: 'badge-1',
        name: 'Hydration Pioneer',
        description: 'Met daily water target 5 days in a row.',
        tier: 'bronze',
        dateEarned: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
        category: 'hydration',
        iconName: 'Flame'
      },
      {
        id: 'badge-2',
        name: 'Recovery Master',
        description: 'Exceeded 90% recovery score after deep sleep.',
        tier: 'silver',
        dateEarned: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        category: 'recovery',
        iconName: 'Award'
      },
      {
        id: 'badge-3',
        name: 'Sleep Guru',
        description: 'Completed 8 hours of sleep target.',
        tier: 'bronze',
        dateEarned: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        category: 'sleep',
        iconName: 'Moon'
      }
    ]
  };
};

const saveState = (state: Partial<GoalsState>) => {
  if (typeof window !== 'undefined') {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, ...state }));
    } catch (e) {
      console.error('Failed to save goals state', e);
    }
  }
};

const initialState = loadSavedState();

export const useGoalsStore = create<GoalsState>((set, get) => ({
  dailyHydrationTarget: initialState.dailyHydrationTarget,
  weeklyRecoveryTarget: initialState.weeklyRecoveryTarget,
  dailySleepTarget: initialState.dailySleepTarget,
  dailyActivityTarget: initialState.dailyActivityTarget,
  currentStreak: initialState.currentStreak,
  bestStreak: initialState.bestStreak,
  monthlyStreak: initialState.monthlyStreak,
  badges: initialState.badges,

  setGoalTarget: (type, target) => {
    let update: Partial<GoalsState> = {};
    if (type === 'hydration') update.dailyHydrationTarget = target;
    if (type === 'recovery') update.weeklyRecoveryTarget = target;
    if (type === 'sleep') update.dailySleepTarget = target;
    if (type === 'activity') update.dailyActivityTarget = target;

    set(update);
    saveState(update);
  },

  incrementStreak: () => {
    const newStreak = get().currentStreak + 1;
    const newBest = Math.max(newStreak, get().bestStreak);
    const newMonthly = get().monthlyStreak + 1;

    set({ currentStreak: newStreak, bestStreak: newBest, monthlyStreak: newMonthly });
    saveState({ currentStreak: newStreak, bestStreak: newBest, monthlyStreak: newMonthly });
  },

  resetStreak: () => {
    set({ currentStreak: 0 });
    saveState({ currentStreak: 0 });
  },

  awardBadge: (name, description, tier, category, iconName) => {
    // Prevent duplicate badges with the same name
    const alreadyEarned = get().badges.some((b) => b.name === name);
    if (alreadyEarned) return;

    const newBadge: GoalBadge = {
      id: 'badge-' + Math.random().toString(36).substring(2, 11),
      name,
      description,
      tier,
      dateEarned: new Date().toISOString(),
      category,
      iconName
    };

    const updated = [newBadge, ...get().badges];
    set({ badges: updated });
    saveState({ badges: updated });
  },

  clearBadges: () => {
    set({ badges: [] });
    saveState({ badges: [] });
  }
}));
