// Two palettes — "Garden" (light) and "Midnight" (dark) — exposed through a
// shared Palette shape so components can be styled once and themed at runtime.
// Colors are consumed via useTheme() (see ThemeContext), never imported directly,
// so switching light/dark re-themes every screen.

import { ThreadCategory } from '../types';

export interface Palette {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDark: string;
  onPrimary: string; // text/icon on a primary-colored surface
  accent: string;
  onAccent: string; // text/icon on an accent-colored surface
  locked: string;
  danger: string;
  chipBg: string;
  money: string; // savings figures (gold reads as "money")
  moneyBg: string;
  // Categorical colors for reused-ingredient "threads".
  thread: Record<ThreadCategory, { fg: string; bg: string }>;
}

// Garden — fresh, produce-forward. Green leads; a bronze accent keeps secondary
// actions distinct from the brand green.
export const light: Palette = {
  bg: '#F4F6F1',
  card: '#FFFFFF',
  text: '#1F2A23',
  textMuted: '#6E7A70',
  border: '#E3E9DE',
  primary: '#2E7D5B',
  primaryDark: '#226145',
  onPrimary: '#FFFFFF',
  accent: '#A8741F',
  onAccent: '#FFFFFF',
  locked: '#C9962F',
  danger: '#BC4030',
  chipBg: '#E9F0E5',
  money: '#A8741F',
  moneyBg: '#F3EAD6',
  thread: {
    protein: { fg: '#B4771C', bg: '#F6EDD9' },
    seafood: { fg: '#2E6FA8', bg: '#E3EDF6' },
    herb: { fg: '#5E8A2E', bg: '#EBF1E1' },
    dairy: { fg: '#6A5EB6', bg: '#EBE9F6' },
    specialty: { fg: '#B0567F', bg: '#F6E8EF' },
  },
};

// Midnight — cool teal on deep slate. Food and color pop off the dark ground;
// primary buttons use dark ink for contrast on the teal.
export const dark: Palette = {
  bg: '#121822',
  card: '#1B2430',
  text: '#E9EFF6',
  textMuted: '#93A1B3',
  border: '#2A3542',
  primary: '#3EA891',
  primaryDark: '#348D79',
  onPrimary: '#04231C',
  accent: '#E0A24A',
  onAccent: '#241606',
  locked: '#E0A24A',
  danger: '#E06A57',
  chipBg: '#24303D',
  money: '#E8C25C',
  moneyBg: 'rgba(232,194,92,0.15)',
  thread: {
    protein: { fg: '#E0B65A', bg: 'rgba(224,182,90,0.16)' },
    seafood: { fg: '#6FA8E0', bg: 'rgba(111,168,224,0.16)' },
    herb: { fg: '#9FC46B', bg: 'rgba(159,196,107,0.16)' },
    dairy: { fg: '#A99BF0', bg: 'rgba(169,155,240,0.17)' },
    specialty: { fg: '#E08AB0', bg: 'rgba(224,138,176,0.16)' },
  },
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
};
