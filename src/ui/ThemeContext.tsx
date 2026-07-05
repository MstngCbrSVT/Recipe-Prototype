import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light, Palette } from './theme';
import { loadThemeMode, saveThemeMode, ThemeMode } from '../storage';

interface ThemeValue {
  colors: Palette;
  isDark: boolean;
  mode: ThemeMode; // user's choice: auto | light | dark
  setMode: (mode: ThemeMode) => void;
}

const ThemeCtx = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme(); // 'light' | 'dark' | null, from the OS
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => setModeState(await loadThemeMode()))();
  }, []);

  const isDark = mode === 'auto' ? system === 'dark' : mode === 'dark';
  const colors = isDark ? dark : light;

  const value: ThemeValue = {
    colors,
    isDark,
    mode,
    setMode: (m) => {
      setModeState(m);
      saveThemeMode(m);
    },
  };

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
