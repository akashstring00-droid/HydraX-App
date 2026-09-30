import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const SESSION_KEY = '@hydrax_session_user_v1';
const USERS_DB_KEY = '@hydrax_registered_users_db_v1';

type AuthListener = (user: AuthUser | null) => void;

class AuthStore {
  private currentUser: AuthUser | null = null;
  private registeredUsers: Map<string, UserRecord> = new Map();
  private listeners: Set<AuthListener> = new Set();
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Seed default user if DB is empty
      const dbJson = await AsyncStorage.getItem(USERS_DB_KEY);
      if (dbJson) {
        const list: UserRecord[] = JSON.parse(dbJson);
        list.forEach((u) => this.registeredUsers.set(u.email.toLowerCase(), u));
      } else {
        const defaultUser: UserRecord = {
          id: 'u_default_1',
          name: 'Akash',
          email: 'akash@hydrax.ai',
          passwordHash: 'password123',
          createdAt: new Date().toISOString(),
        };
        this.registeredUsers.set(defaultUser.email.toLowerCase(), defaultUser);
        await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify([defaultUser]));
      }

      // Restore session
      const sessionJson = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionJson) {
        const user: AuthUser = JSON.parse(sessionJson);
        this.currentUser = user;
      }
    } catch (e) {
      console.warn('[AuthStore] Initialization failed:', e);
    } finally {
      this.isLoaded = true;
      this.notify();
    }
  }

  public getAuthUser(): AuthUser | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public async register(name: string, email: string, password: string): Promise<{ success: boolean; message?: string; user?: AuthUser }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      return { success: false, message: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    if (this.registeredUsers.has(cleanEmail)) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }

    const newUser: UserRecord = {
      id: `u_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: password,
      createdAt: new Date().toISOString(),
    };

    this.registeredUsers.set(cleanEmail, newUser);

    try {
      const userList = Array.from(this.registeredUsers.values());
      await AsyncStorage.setItem(USERS_DB_KEY, JSON.stringify(userList));

      const authUser: AuthUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      };

      this.currentUser = authUser;
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
      this.notify();

      return { success: true, user: authUser };
    } catch (e) {
      return { success: false, message: 'Failed to save registration data.' };
    }
  }

  public async login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: AuthUser }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password.' };
    }

    const userRecord = this.registeredUsers.get(cleanEmail);
    if (!userRecord) {
      return { success: false, message: 'No account found with this email. Please register.' };
    }

    if (userRecord.passwordHash !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const authUser: AuthUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      createdAt: userRecord.createdAt,
    };

    this.currentUser = authUser;
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    } catch (e) {
      console.warn('[AuthStore] Session save error:', e);
    }

    this.notify();
    return { success: true, user: authUser };
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn('[AuthStore] Session remove error:', e);
    }
    this.notify();
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }
}

export const authStore = new AuthStore();
