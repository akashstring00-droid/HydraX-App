import { create } from 'zustand';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  age?: number;
  weight?: number; // In kg
  gender?: string;
  activityLevel?: 'low' | 'medium' | 'high';
  isProfileSetup: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Extended fields for premium healthtech app
  dob?: string;
  height?: number; // In cm
  bloodGroup?: string;
  medicalNotes?: string;
  avatar?: string; // base64 avatar
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEY = 'hydrax-auth-storage';

const loadSavedState = () => {
  if (typeof window !== 'undefined') {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          user: parsed.user ?? null,
          isAuthenticated: parsed.isAuthenticated ?? false
        };
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    }
  }
  return {
    user: {
      uid: 'mock-uid-123',
      email: 'akash@hydrax.io',
      displayName: 'Akash Sharma',
      isProfileSetup: true,
      age: 28,
      weight: 74,
      height: 178,
      gender: 'Male',
      activityLevel: 'high',
      dob: '1998-05-15',
      bloodGroup: 'O+',
      emergencyContactName: 'Dr. Jane Smith',
      emergencyContactPhone: '+15550199',
      medicalNotes: 'No major allergies. Prior dehydration episode during marathon.',
      avatar: '',
    },
    isAuthenticated: true
  };
};

const saveState = (user: UserProfile | null, isAuthenticated: boolean) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, isAuthenticated }));
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  }
};

const initialState = loadSavedState();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialState.user,
  isAuthenticated: initialState.isAuthenticated,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (email === "error@hydrax.com") {
        throw new Error("Invalid credentials");
      }

      const mockUser: UserProfile = {
        uid: 'mock-uid-123',
        email,
        displayName: email.split('@')[0],
        isProfileSetup: true,
        age: 28,
        weight: 74,
        height: 178,
        gender: 'Male',
        activityLevel: 'high',
        dob: '1998-05-15',
        bloodGroup: 'O+',
        emergencyContactName: 'Dr. Jane Smith',
        emergencyContactPhone: '+15550199',
        medicalNotes: 'No allergies.',
        avatar: '',
      };

      set({ user: mockUser, isAuthenticated: true, isLoading: false });
      saveState(mockUser, true);
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  signup: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockUser: UserProfile = {
        uid: 'mock-uid-' + Math.random().toString(36).substring(2, 11),
        email,
        displayName: email.split('@')[0],
        isProfileSetup: false,
        age: 25,
        weight: 70,
        height: 175,
        gender: 'Other',
        activityLevel: 'medium',
        dob: '2001-01-01',
        bloodGroup: 'B+',
        emergencyContactName: '',
        emergencyContactPhone: '',
        medicalNotes: '',
        avatar: '',
      };

      set({ user: mockUser, isAuthenticated: true, isLoading: false });
      saveState(mockUser, true);
    } catch (err: any) {
      set({ error: err.message || 'Signup failed', isLoading: false });
    }
  },

  googleLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const mockUser: UserProfile = {
        uid: 'google-uid-777',
        email: 'athlete.john@gmail.com',
        displayName: 'John Doe',
        isProfileSetup: true,
        age: 32,
        weight: 80,
        height: 182,
        gender: 'Male',
        activityLevel: 'high',
        dob: '1994-08-20',
        bloodGroup: 'A+',
        emergencyContactName: 'Sarah Doe',
        emergencyContactPhone: '+15559876',
        medicalNotes: 'Gluten sensitive.',
        avatar: '',
      };
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
      saveState(mockUser, true);
    } catch (err: any) {
      set({ error: 'Google login failed', isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ user: null, isAuthenticated: false, isLoading: false });
    saveState(null, false);
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error("No user authenticated");

      const updatedUser: UserProfile = {
        ...currentUser,
        ...updates,
        isProfileSetup: true,
      };

      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ user: updatedUser, isLoading: false });
      saveState(updatedUser, get().isAuthenticated);
    } catch (err: any) {
      set({ error: err.message || 'Failed to update profile', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
