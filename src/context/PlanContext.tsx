import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DayPlan, Preferences } from '../types';
import { generateMeal } from '../engine/planner';
import { RECIPE_BY_ID } from '../data/recipes';
import {
  DEFAULT_PREFS,
  loadChecked,
  loadPlan,
  loadPrefs,
  saveChecked,
  savePlan,
  savePrefs,
} from '../storage';

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
  setChecked: (checked: Record<string, boolean>) => void;
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

  for (const date of dates) {
    const prior = byDate.get(date);
    // Locked days are preserved verbatim so the user's confirmed picks stick.
    if (prior && prior.locked) {
      result.push(prior);
      trackVariety(prior, recentProteins, recentCuisines);
      continue;
    }
    const meal = generateMeal(prefs, recentProteins.slice(-2), recentCuisines.slice(-2));
    if (!meal) {
      // No eligible recipe (over-constrained filters) — keep a skipped slot.
      result.push({ date, mainId: '', sideIds: [], locked: false, skipped: true });
      continue;
    }
    const day: DayPlan = {
      date,
      mainId: meal.mainId,
      sideIds: meal.sideIds,
      locked: false,
      skipped: prior?.skipped ?? false,
    };
    result.push(day);
    trackVariety(day, recentProteins, recentCuisines);
  }
  return result;
}

function trackVariety(day: DayPlan, proteins: string[], cuisines: string[]): void {
  const main = RECIPE_BY_ID[day.mainId];
  if (main?.protein) proteins.push(main.protein);
  if (main?.cuisine) cuisines.push(main.cuisine);
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefsState] = useState<Preferences>(DEFAULT_PREFS);
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [checked, setCheckedState] = useState<Record<string, boolean>>({});
  const hydrated = useRef(false);

  // Hydrate persisted state on first mount.
  useEffect(() => {
    (async () => {
      const [p, pr, ch] = await Promise.all([loadPlan(), loadPrefs(), loadChecked()]);
      setPrefsState(pr);
      setCheckedState(ch);
      // First run with no saved plan → generate one immediately (zero setup).
      setPlan(p.length > 0 ? p : buildWeek(pr, []));
      hydrated.current = true;
      setReady(true);
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
        cur.map((d) => {
          if (d.date !== date || d.locked) return d;
          const meal = generateMeal(prefs, [], [], d.mainId);
          if (!meal) return d;
          return { ...d, mainId: meal.mainId, sideIds: meal.sideIds, skipped: false };
        }),
      ),
    toggleLock: (date) =>
      setPlan((cur) => cur.map((d) => (d.date === date ? { ...d, locked: !d.locked } : d))),
    toggleSkip: (date) =>
      setPlan((cur) => cur.map((d) => (d.date === date ? { ...d, skipped: !d.skipped } : d))),
    swapDays: (dateA, dateB) =>
      setPlan((cur) => {
        const a = cur.find((d) => d.date === dateA);
        const b = cur.find((d) => d.date === dateB);
        if (!a || !b) return cur;
        return cur.map((d) => {
          if (d.date === dateA) return { ...b, date: dateA };
          if (d.date === dateB) return { ...a, date: dateB };
          return d;
        });
      }),
    setChecked: setCheckedState,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
