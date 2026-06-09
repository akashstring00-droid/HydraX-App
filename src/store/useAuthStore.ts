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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    uid: 'mock-uid-123',
    email: 'akash@hydrax.io',
    displayName: 'Akash',
    isProfileSetup: true,
    age: 28,
    weight: 74,
    gender: 'Male',
    activityLevel: 'high',
    emergencyContactName: 'Dr. Jane Smith',
    emergencyContactPhone: '+1-555-0199'
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // In a production setup, Firebase Auth goes here:
      // const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Simulation delay:
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
        gender: 'Male',
        activityLevel: 'high',
        emergencyContactName: 'Dr. Jane Smith',
        emergencyContactPhone: '+1-555-0199'
      };

      set({ user: mockUser, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  signup: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // In production: createUserWithEmailAndPassword(auth, email, password);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser: UserProfile = {
        uid: 'mock-uid-' + Math.random().toString(36).substr(2, 9),
        email,
        displayName: email.split('@')[0],
        isProfileSetup: false,
      };

      set({ user: mockUser, isAuthenticated: true, isLoading: false });
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
        gender: 'Male',
        activityLevel: 'high',
        emergencyContactName: 'Sarah Doe',
        emergencyContactPhone: '+1-555-9876'
      };
      set({ user: mockUser, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: 'Google login failed', isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const currentUser = get().user;
      if (!currentUser) throw new Error("No user authenticated");

      const updatedUser: UserProfile = {
        ...currentUser,
        ...updates,
        isProfileSetup: true, // Mark complete once updated
      };

      // In production: updateDoc(doc(db, "users", currentUser.uid), updatedUser);
      await new Promise((resolve) => setTimeout(resolve, 800));
      set({ user: updatedUser, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update profile', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
