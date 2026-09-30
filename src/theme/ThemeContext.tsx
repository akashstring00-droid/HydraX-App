import React, { createContext, useContext, useState, useEffect } from 'react';
import { colors, ThemeMode } from './colors';
import { themeStore } from './ThemeStore';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  theme: typeof colors.light;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  isDark: false,
  theme: colors.light,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(themeStore.getMode());

  useEffect(() => {
    const unsub = themeStore.subscribe((newMode) => {
      setMode(newMode);
    });
    return unsub;
  }, []);

  const isDark = mode === 'dark';
  const currentTheme = colors[mode];

  const toggleTheme = () => {
    themeStore.toggleTheme();
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, theme: currentTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
