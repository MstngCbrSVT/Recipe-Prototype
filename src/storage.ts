import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayPlan, HistoryEntry, Preferences, Recipe } from './types';

// Local persistence so a locked week "sticks" when the user returns — no account
// required at entry (accounts / cloud sync are a later, opt-in feature).

const KEYS = {
  plan: 'mealapp.plan.v1',
  prefs: 'mealapp.prefs.v1',
  checked: 'mealapp.shopping.checked.v1',
  pool: 'mealapp.recipepool.v1',
  theme: 'mealapp.thememode.v1',
  history: 'mealapp.history.v1',
  photos: 'mealapp.userphotos.v1',
};

export const DEFAULT_PREFS: Preferences = {
  servings: 2,
  dinnersPerWeek: 5,
  sidesPerMeal: 2,
  diet: [],
  avoidAllergens: [],
  avoidSideTypes: [],
  dislikedProteins: [],
  adults: 2,
  kids: 0,
  cuisines: [],
  maxWeeknightMinutes: 999,
  leftoversPref: 'some',
  onboarded: false,
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

// Merge over defaults so prefs saved by an older app version get any new fields
// backfilled (e.g. cuisines, maxWeeknightMinutes, onboarded).
export const loadPrefs = async (): Promise<Preferences> => ({
  ...DEFAULT_PREFS,
  ...(await load<Partial<Preferences>>(KEYS.prefs, {})),
});
export const savePrefs = (prefs: Preferences) => save(KEYS.prefs, prefs);

export const loadChecked = () => load<Record<string, boolean>>(KEYS.checked, {});
export const saveChecked = (checked: Record<string, boolean>) => save(KEYS.checked, checked);

// Cached Spoonacular recipe pool so a fetched set survives app restarts without
// spending more of the daily free-tier quota.
export const loadRecipePool = () => load<Recipe[]>(KEYS.pool, []);
export const saveRecipePool = (pool: Recipe[]) => save(KEYS.pool, pool);

// User-supplied recipe photos, keyed by recipe id → compact JPEG data URI. These
// override the provider photo (or icon) wherever the recipe appears.
export const loadPhotos = () => load<Record<string, string>>(KEYS.photos, {});
export const savePhotos = (photos: Record<string, string>) => save(KEYS.photos, photos);

// Theme preference: 'auto' follows the phone's light/dark setting. Defaults to
// 'light' so first launch is always the light identity until the user opts in.
export type ThemeMode = 'auto' | 'light' | 'dark';
export const loadThemeMode = () => load<ThemeMode>(KEYS.theme, 'light');
export const saveThemeMode = (mode: ThemeMode) => save(KEYS.theme, mode);

// Cook history (meals made + ratings), persisted across weeks.
export const loadHistory = () => load<HistoryEntry[]>(KEYS.history, []);
export const saveHistory = (h: HistoryEntry[]) => save(KEYS.history, h);
