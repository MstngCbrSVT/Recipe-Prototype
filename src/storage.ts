import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayPlan, Preferences } from './types';

// Local persistence so a locked week "sticks" when the user returns — no account
// required at entry (accounts / cloud sync are a later, opt-in feature).

const KEYS = {
  plan: 'mealapp.plan.v1',
  prefs: 'mealapp.prefs.v1',
  checked: 'mealapp.shopping.checked.v1',
};

export const DEFAULT_PREFS: Preferences = {
  servings: 4,
  dinnersPerWeek: 5,
  sidesPerMeal: 2,
  diet: [],
  avoidAllergens: [],
  avoidSideTypes: [],
  dislikedProteins: [],
};

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function save(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort; a failed write shouldn't crash the UI
  }
}

export const loadPlan = () => load<DayPlan[]>(KEYS.plan, []);
export const savePlan = (plan: DayPlan[]) => save(KEYS.plan, plan);

export const loadPrefs = () => load<Preferences>(KEYS.prefs, DEFAULT_PREFS);
export const savePrefs = (prefs: Preferences) => save(KEYS.prefs, prefs);

export const loadChecked = () => load<Record<string, boolean>>(KEYS.checked, {});
export const saveChecked = (checked: Record<string, boolean>) => save(KEYS.checked, checked);
