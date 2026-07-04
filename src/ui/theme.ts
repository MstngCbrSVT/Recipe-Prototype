// One design identity — an Apple iOS × LinkedIn cross — that auto-adapts to
// light and dark. Colors are consumed via useTheme() (see ThemeContext), never
// imported directly, so light/dark re-themes every screen. Blue leads (actions),
// green means money/confirmation, neutral greys carry the surfaces.

import { ThreadCategory } from '../types';

export interface Palette {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDark: string;
  primaryWash: string; // faint blue tint — tinted buttons, squircle thumbnails
  onPrimary: string; // text/icon on a primary-colored surface
  accent: string; // green — confirmations, checks, "done"
  onAccent: string; // text/icon on an accent-colored surface
  locked: string;
  danger: string;
  chipBg: string;
  money: string; // savings figures (green reads as "money")
  moneyBg: string;
  // Categorical colors for reused-ingredient "threads".
  thread: Record<ThreadCategory, { fg: string; bg: string }>;
}

// Light — iOS system grey ground, white cards, LinkedIn blue for action.
export const light: Palette = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textMuted: '#8A8A8E',
  border: 'rgba(60,60,67,0.12)',
  primary: '#0A6CE0',
  primaryDark: '#085BBD',
  primaryWash: '#EAF2FD',
  onPrimary: '#FFFFFF',
  accent: '#248A3D',
  onAccent: '#FFFFFF',
  locked: '#9A7B1E',
  danger: '#D33A2C',
  chipBg: '#EFEFF4',
  money: '#248A3D',
  moneyBg: '#E7F5EC',
  thread: {
    protein: { fg: '#9A7B1E', bg: '#F3EFE0' },
    seafood: { fg: '#0A6CE0', bg: '#EAF2FD' },
    herb: { fg: '#3D7A2E', bg: '#E7F1E4' },
    dairy: { fg: '#5B54A8', bg: '#ECEBF6' },
    specialty: { fg: '#A0417E', bg: '#F6E9F1' },
  },
};

// Dark — true black ground (OLED), elevated grey cards, brightened blue/green.
export const dark: Palette = {
  bg: '#000000',
  card: '#1C1C1E',
  text: '#F2F2F7',
  textMuted: '#98989F',
  border: 'rgba(84,84,88,0.55)',
  primary: '#4AA0FF',
  primaryDark: '#2E86E6',
  primaryWash: 'rgba(74,160,255,0.14)',
  onPrimary: '#FFFFFF',
  accent: '#30D158',
  onAccent: '#04230F',
  locked: '#E0B65A',
  danger: '#FF6B5C',
  chipBg: '#2C2C2E',
  money: '#30D158',
  moneyBg: 'rgba(48,209,88,0.14)',
  thread: {
    protein: { fg: '#E0B65A', bg: 'rgba(224,182,90,0.16)' },
    seafood: { fg: '#4AA0FF', bg: 'rgba(74,160,255,0.16)' },
    herb: { fg: '#9FC46B', bg: 'rgba(159,196,107,0.16)' },
    dairy: { fg: '#A99BF0', bg: 'rgba(169,155,240,0.17)' },
    specialty: { fg: '#E08AB0', bg: 'rgba(224,138,176,0.16)' },
  },
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 10,
  md: 14, // buttons, inputs
  lg: 18, // cards — iOS squircle
};
