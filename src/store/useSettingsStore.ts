import { create } from 'zustand';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  read: boolean;
  snoozedUntil?: string | null;
}

interface SettingsState {
  darkMode: boolean;
  units: 'metric' | 'imperial';
  language: 'en' | 'es' | 'ja';
  emergencyContacts: EmergencyContact[];
  notifications: NotificationItem[];
  muteNotifications: boolean;
  activeTab: 'dashboard' | 'history' | 'device' | 'insights' | 'profile' | 'aiCoach' | 'recoveryPlanner' | 'hydrationPlanner' | 'weeklyReports' | 'settings' | 'timeline' | 'exportCenter' | 'emergencyMode' | 'adminConsole';
  setDarkMode: (enabled: boolean) => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  setLanguage: (language: 'en' | 'es' | 'ja') => void;
  setActiveTab: (tab: 'dashboard' | 'history' | 'device' | 'insights' | 'profile' | 'aiCoach' | 'recoveryPlanner' | 'hydrationPlanner' | 'weeklyReports' | 'settings' | 'timeline' | 'exportCenter' | 'emergencyMode' | 'adminConsole') => void;
  addEmergencyContact: (name: string, phone: string) => void;
  removeEmergencyContact: (id: string) => void;
  updateEmergencyContact: (id: string, name: string, phone: string) => void;
  addNotification: (title: string, message: string, type: NotificationItem['type']) => void;
  markNotificationRead: (id: string) => void;
  snoozeNotification: (id: string, mins: number) => void;
  toggleMuteNotifications: () => void;
  clearNotifications: () => void;
}

const STORAGE_KEY = 'hydrax-settings-storage';

const loadSavedState = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          darkMode: parsed.darkMode ?? true,
          units: parsed.units ?? 'metric',
          language: parsed.language ?? 'en',
          activeTab: parsed.activeTab ?? 'dashboard',
          muteNotifications: parsed.muteNotifications ?? false,
          emergencyContacts: parsed.emergencyContacts ?? [
            { id: 'contact-1', name: 'Dr. Jane Smith (Primary Clinic)', phone: '+15550199' },
            { id: 'contact-2', name: 'Family Emergency Backup', phone: '+15559876' }
          ],
          notifications: parsed.notifications ?? [
            {
              id: 'notif-1',
              timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
              title: 'Hydration Target Alert',
              message: 'Fluid intake is trailing behind daily burn rate. Drink 350ml.',
              type: 'warning',
              read: false,
              snoozedUntil: null
            },
            {
              id: 'notif-2',
              timestamp: new Date(new Date().setHours(new Date().getHours() - 4)).toISOString(),
              title: 'BLE Connection Established',
              message: 'Hydrax wearable band is streaming bio-metrics in real-time.',
              type: 'success',
              read: true,
              snoozedUntil: null
            },
            {
              id: 'notif-3',
              timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
              title: 'Digestive Recovery Analysis',
              message: 'Gut lining is recovering. Sleep efficiency increased by 14%.',
              type: 'info',
              read: true,
              snoozedUntil: null
            }
          ]
        };
      }
    } catch (e) {
      console.error('Failed to load settings state', e);
    }
  }
  return {
    darkMode: true,
    units: 'metric' as const,
    language: 'en' as const,
    activeTab: 'dashboard' as const,
    muteNotifications: false,
    emergencyContacts: [
      { id: 'contact-1', name: 'Dr. Jane Smith (Primary Clinic)', phone: '+15550199' },
      { id: 'contact-2', name: 'Family Emergency Backup', phone: '+15559876' }
    ],
    notifications: [
      {
        id: 'notif-1',
        timestamp: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(),
        title: 'Hydration Target Alert',
        message: 'Fluid intake is trailing behind daily burn rate. Drink 350ml.',
        type: 'warning' as const,
        read: false,
        snoozedUntil: null
      },
      {
        id: 'notif-2',
        timestamp: new Date(new Date().setHours(new Date().getHours() - 4)).toISOString(),
        title: 'BLE Connection Established',
        message: 'Hydrax wearable band is streaming bio-metrics in real-time.',
        type: 'success' as const,
        read: true,
        snoozedUntil: null
      },
      {
        id: 'notif-3',
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        title: 'Digestive Recovery Analysis',
        message: 'Gut lining is recovering. Sleep efficiency increased by 14%.',
        type: 'info' as const,
        read: true,
        snoozedUntil: null
      }
    ]
  };
};

const saveState = (state: Partial<SettingsState>) => {
  if (typeof window !== 'undefined') {
    try {
      const existing = window.localStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, ...state }));
    } catch (e) {
      console.error('Failed to save settings state', e);
    }
  }
};

const initialState = loadSavedState();

export const useSettingsStore = create<SettingsState>((set, get) => ({
  darkMode: initialState.darkMode,
  units: initialState.units,
  language: initialState.language,
  activeTab: initialState.activeTab,
  muteNotifications: initialState.muteNotifications,
  emergencyContacts: initialState.emergencyContacts,
  notifications: initialState.notifications,

  setDarkMode: (enabled) => {
    set({ darkMode: enabled });
    saveState({ darkMode: enabled });
  },
  
  setUnits: (units) => {
    set({ units });
    saveState({ units });
  },

  setLanguage: (language) => {
    set({ language });
    saveState({ language });
  },

  addEmergencyContact: (name, phone) => {
    const newContact: EmergencyContact = {
      id: 'contact-' + Math.random().toString(36).substring(2, 11),
      name,
      phone
    };
    const updated = [...get().emergencyContacts, newContact];
    set({ emergencyContacts: updated });
    saveState({ emergencyContacts: updated });
  },

  removeEmergencyContact: (id) => {
    const updated = get().emergencyContacts.filter((c) => c.id !== id);
    set({ emergencyContacts: updated });
    saveState({ emergencyContacts: updated });
  },

  updateEmergencyContact: (id, name, phone) => {
    const updated = get().emergencyContacts.map((c) => 
      c.id === id ? { ...c, name, phone } : c
    );
    set({ emergencyContacts: updated });
    saveState({ emergencyContacts: updated });
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    saveState({ activeTab: tab });
  },

  addNotification: (title, message, type) => {
    // If notifications are muted, we can still add them to history but perhaps don't trigger anything else.
    // In our case we just add them.
    const newNotif: NotificationItem = {
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false,
      snoozedUntil: null
    };
    const updated = [newNotif, ...get().notifications];
    set({ notifications: updated });
    saveState({ notifications: updated });
  },

  markNotificationRead: (id) => {
    const updated = get().notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    set({ notifications: updated });
    saveState({ notifications: updated });
  },

  snoozeNotification: (id, mins) => {
    const snoozeTime = new Date(new Date().getTime() + mins * 60 * 1000).toISOString();
    const updated = get().notifications.map((n) => n.id === id ? { ...n, snoozedUntil: snoozeTime } : n);
    set({ notifications: updated });
    saveState({ notifications: updated });
  },

  toggleMuteNotifications: () => {
    const nextVal = !get().muteNotifications;
    set({ muteNotifications: nextVal });
    saveState({ muteNotifications: nextVal });
  },

  clearNotifications: () => {
    set({ notifications: [] });
    saveState({ notifications: [] });
  }
}));
