import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ThemeMode } from './colors';

const THEME_STORAGE_KEY = '@hydrax_app_theme_mode_v1';

type Listener = (mode: ThemeMode) => void;

class ThemeStore {
  private mode: ThemeMode = 'light';
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        this.mode = saved;
        this.notify();
      }
    } catch (e) {
      console.warn('[ThemeStore] Failed to load theme:', e);
    }
  }

  public getMode(): ThemeMode {
    return this.mode;
  }

  public isDark(): boolean {
    return this.mode === 'dark';
  }

  public getColors() {
    return colors[this.mode];
  }

  public async toggleTheme() {
    this.mode = this.mode === 'light' ? 'dark' : 'light';
    this.notify();
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, this.mode);
    } catch (e) {
      console.warn('[ThemeStore] Failed to save theme:', e);
    }
  }

  public async setMode(mode: ThemeMode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.notify();
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, this.mode);
    } catch (e) {
      console.warn('[ThemeStore] Failed to save theme:', e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.mode);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.mode));
  }
}

export const themeStore = new ThemeStore();
