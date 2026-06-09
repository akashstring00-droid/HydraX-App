import { create } from 'zustand';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

interface SettingsState {
  darkMode: boolean;
  units: 'metric' | 'imperial';
  emergencyContacts: EmergencyContact[];
  activeTab: 'dashboard' | 'history' | 'device' | 'insights' | 'profile';
  setDarkMode: (enabled: boolean) => void;
  setUnits: (units: 'metric' | 'imperial') => void;
  setActiveTab: (tab: 'dashboard' | 'history' | 'device' | 'insights' | 'profile') => void;
  addEmergencyContact: (name: string, phone: string) => void;
  removeEmergencyContact: (id: string) => void;
  updateEmergencyContact: (id: string, name: string, phone: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  darkMode: true, // Default to Dark Mode for premium aesthetics
  units: 'metric',
  activeTab: 'dashboard',
  emergencyContacts: [
    { id: 'contact-1', name: 'Dr. Jane Smith (Primary Clinic)', phone: '+15550199' },
    { id: 'contact-2', name: 'Family Emergency Backup', phone: '+15559876' }
  ],

  setDarkMode: (enabled) => set({ darkMode: enabled }),
  
  setUnits: (units) => set({ units }),

  addEmergencyContact: (name, phone) => {
    const newContact: EmergencyContact = {
      id: 'contact-' + Math.random().toString(36).substr(2, 9),
      name,
      phone
    };
    set((state) => ({ emergencyContacts: [...state.emergencyContacts, newContact] }));
  },

  removeEmergencyContact: (id) => set((state) => ({
    emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id)
  })),

  updateEmergencyContact: (id, name, phone) => set((state) => ({
    emergencyContacts: state.emergencyContacts.map((c) => 
      c.id === id ? { ...c, name, phone } : c
    )
  })),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
