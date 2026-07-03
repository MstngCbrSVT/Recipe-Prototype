import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DayPlan, Preferences } from '../types';
import { DEFAULT_SPOONACULAR_KEY } from '../config';
import { generateMeal } from '../engine/planner';
import { nextLeftoverTarget, sanitizeLeftovers } from '../engine/leftovers';
import { recipeById, setExternalRecipes } from '../data/catalog';
import { refreshFromSpoonacular } from '../providers/recipeProvider';
import {
  DEFAULT_PREFS,
  loadChecked,
  loadPlan,
  loadPrefs,
  loadRecipePool,
  saveChecked,
  savePlan,
  savePrefs,
  saveRecipePool,
} from '../storage';

export interface RecipeStatus {
  loading: boolean;
  message: string | null;
  externalCount: number;
}

interface PlanContextValue {
  ready: boolean;
  prefs: Preferences;
  plan: DayPlan[];
  checked: Record<string, boolean>;
  setPrefs: (p: Preferences) => void;
  generateWeek: () => void;
  regenerateDay: (date: string) => void;
  toggleLock: (date: string) => void;
  toggleSkip: (date: string) => void;
  swapDays: (dateA: string, dateB: string) => void;
  makeLeftovers: (date: string) => void;
  clearLeftovers: (date: string) => void;
  setShopped: (dates: string[], value: boolean) => void;
  setChecked: (checked: Record<string, boolean>) => void;
  recipeStatus: RecipeStatus;
  refreshRecipes: (overrideKey?: string) => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

// Build ISO dates for the next `count` days starting today.
function upcomingDates(count: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// Walk the days in order, tracking recent proteins/cuisines for variety.
function buildWeek(prefs: Preferences, existing: DayPlan[]): DayPlan[] {
  const dates = upcomingDates(prefs.dinnersPerWeek);
  const byDate = new Map(existing.map((d) => [d.date, d]));
  const recentProteins: string[] = [];
  const recentCuisines: string[] = [];
  const result: DayPlan[] = [];
  // Save-money: anchor ~60% of the week on one protein, then let the rest vary —
  // enough overlap to save real money without eating chicken seven nights running.
  let anchor: string | null = null;
  let anchorCount = 0;
  const anchorTarget = Math.ceil(prefs.dinnersPerWeek * 0.6);

  const noteProtein = (mainId: string) => {
    const p = recipeById(mainId)?.protein;
    if (!p) return;
    if (anchor === null) anchor = p;
    if (p === anchor) anchorCount++;
  };

  for (const date of dates) {
    const prior = byDate.get(date);
    // Locked days are preserved verbatim so the user's confirmed picks stick.
    if (prior && prior.locked) {
      result.push(prior);
      trackVariety(prior, recentProteins, recentCuisines);
      noteProtein(prior.mainId);
      continue;
    }
    const reuse = prefs.goal === 'save' && anchor !== null && anchorCount < anchorTarget;
    const recentArg = reuse && anchor ? [anchor] : recentProteins;
    const meal = generateMeal(prefs, recentArg, recentCuisines, undefined, reuse);
    if (!meal) {
      // No eligible recipe (over-constrained filters) — keep a skipped slot.
      result.push({ date, mainId: '', sideIds: [], locked: false, skipped: true, shopped: false });
      continue;
    }
    const day: DayPlan = {
      date,
      mainId: meal.mainId,
      sideIds: meal.sideIds,
      locked: false,
      skipped: prior?.skipped ?? false,
      shopped: false, // a freshly generated meal hasn't been shopped for
    };
    result.push(day);
    trackVariety(day, recentProteins, recentCuisines);
    noteProtein(day.mainId);
  }
  // A full reflow rebuilds every unlocked day from scratch, so leftover links
  // are dropped here; sanitize is a safety net for any left dangling.
  return sanitizeLeftovers(result, prefs);
}

function trackVariety(day: DayPlan, proteins: string[], cuisines: string[]): void {
  const main = recipeById(day.mainId);
  if (main?.protein) proteins.push(main.protein);
  if (main?.cuisine) cuisines.push(main.cuisine);
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [checked, setCheckedState] = useState<Record<string, boolean>>({});
  const [recipeStatus, setRecipeStatus] = useState<RecipeStatus>({
    loading: false,
    message: null,
    externalCount: 0,
  });
  const hydrated = useRef(false);

  // Hydrate persisted state on first mount.
  useEffect(() => {
    (async () => {
      const [p, pr, ch, pool] = await Promise.all([
        loadPlan(),
        loadPrefs(),
        loadChecked(),
        loadRecipePool(),
      ]);
      // Fall back to the key baked into .env.local (EXPO_PUBLIC_SPOONACULAR_KEY)
      // if the user hasn't entered one in Settings, so it "just works".
      const effectiveKey = (pr.spoonacularApiKey || DEFAULT_SPOONACULAR_KEY).trim();
      const prefsWithKey: Preferences = effectiveKey
        ? { ...pr, spoonacularApiKey: effectiveKey }
        : pr;

      // Restore a previously fetched Spoonacular pool without a new API call.
      if (pool.length > 0) {
        setExternalRecipes(pool);
        setRecipeStatus((s) => ({ ...s, externalCount: pool.length }));
      }
      setPrefsState(prefsWithKey);
      setCheckedState(ch);
      // First run with no saved plan → generate one immediately (zero setup).
      setPlan(p.length > 0 ? p : buildWeek(prefsWithKey, []));
      hydrated.current = true;
      setReady(true);

      // Auto-load live recipes once when a key exists but nothing is cached yet.
      // Bounded to a single fetch — later launches reuse the cached pool, so we
      // stay well within the free tier's daily quota.
      if (effectiveKey && pool.length === 0) {
        setRecipeStatus((s) => ({ ...s, loading: true, message: 'Fetching recipes…' }));
        const outcome = await refreshFromSpoonacular(effectiveKey, prefsWithKey);
        if (outcome.ok && outcome.recipes) {
          await saveRecipePool(outcome.recipes);
          setPlan((cur) => buildWeek(prefsWithKey, cur));
        }
        setRecipeStatus({
          loading: false,
          message: outcome.message,
          externalCount: outcome.count,
        });
      }
    })();
  }, []);

  // Persist whenever state changes (after hydration).
  useEffect(() => {
    if (hydrated.current) savePlan(plan);
  }, [plan]);
  useEffect(() => {
    if (hydrated.current) savePrefs(prefs);
  }, [prefs]);
  useEffect(() => {
    if (hydrated.current) saveChecked(checked);
  }, [checked]);

  const value: PlanContextValue = {
    ready,
    prefs,
    plan,
    checked,
    setPrefs: (p) => {
      setPrefsState(p);
      // Reflow the week to honor new filters, keeping locked days.
      setPlan((cur) => buildWeek(p, cur));
    },
    generateWeek: () => setPlan((cur) => buildWeek(prefs, cur)),
    regenerateDay: (date) =>
      setPlan((cur) =>
        sanitizeLeftovers(
          cur.map((d) => {
            if (d.date !== date || d.locked || d.leftoverOf) return d;
            const meal = generateMeal(prefs, [], [], d.mainId);
            if (!meal) return d;
            // New meal → needs shopping again.
            return { ...d, mainId: meal.mainId, sideIds: meal.sideIds, skipped: false, shopped: false };
          }),
          prefs,
        ),
      ),
    toggleLock: (date) =>
      setPlan((cur) =>
        sanitizeLeftovers(
          cur.map((d) => (d.date === date ? { ...d, locked: !d.locked } : d)),
          prefs,
        ),
      ),
    toggleSkip: (date) =>
      setPlan((cur) =>
        sanitizeLeftovers(
          cur.map((d) =>
            d.date === date ? { ...d, skipped: !d.skipped, leftoverOf: undefined } : d,
          ),
          prefs,
        ),
      ),
    swapDays: (dateA, dateB) =>
      setPlan((cur) => {
        const a = cur.find((d) => d.date === dateA);
        const b = cur.find((d) => d.date === dateB);
        if (!a || !b) return cur;
        const swapped = cur.map((d) => {
          if (d.date === dateA) return { ...b, date: dateA };
          if (d.date === dateB) return { ...a, date: dateB };
          return d;
        });
        return sanitizeLeftovers(swapped, prefs);
      }),
    makeLeftovers: (date) =>
      setPlan((cur) => {
        const target = nextLeftoverTarget(cur, date);
        if (!target) return cur;
        const next = cur.map((d) =>
          d.date === target.date
            ? { ...d, leftoverOf: date, mainId: '', sideIds: [], skipped: false, shopped: false }
            : d,
        );
        return sanitizeLeftovers(next, prefs);
      }),
    clearLeftovers: (date) =>
      setPlan((cur) =>
        sanitizeLeftovers(
          cur.map((d) => {
            if (d.date !== date || !d.leftoverOf) return d;
            const meal = generateMeal(prefs, [], []);
            return meal
              ? { ...d, leftoverOf: undefined, mainId: meal.mainId, sideIds: meal.sideIds, shopped: false }
              : { ...d, leftoverOf: undefined, skipped: true };
          }),
          prefs,
        ),
      ),
    setShopped: (dates, value) =>
      setPlan((cur) => cur.map((d) => (dates.includes(d.date) ? { ...d, shopped: value } : d))),
    setChecked: setCheckedState,
    recipeStatus,
    refreshRecipes: async (overrideKey?: string) => {
      // overrideKey lets the caller pass a just-typed key before prefs state
      // has committed (setState is async).
      const key = (overrideKey ?? prefs.spoonacularApiKey)?.trim();
      if (!key) {
        setRecipeStatus({
          loading: false,
          message: 'Add your Spoonacular API key first.',
          externalCount: 0,
        });
        return;
      }
      setRecipeStatus((s) => ({ ...s, loading: true, message: 'Fetching recipes…' }));
      const outcome = await refreshFromSpoonacular(key, prefs);
      if (outcome.ok && outcome.recipes) {
        await saveRecipePool(outcome.recipes);
        // Reflow unlocked days so the new recipes show up right away.
        setPlan((cur) => buildWeek(prefs, cur));
      }
      setRecipeStatus({
        loading: false,
        message: outcome.message,
        externalCount: outcome.count,
      });
    },
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
