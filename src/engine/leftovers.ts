import { DayPlan, Preferences } from '../types';
import { recipeById } from '../data/catalog';
import { generateMeal } from './planner';

// Batch-cooking helpers. A "leftover day" carries `leftoverOf` = the ISO date it
// was actually cooked; it does no cooking and adds nothing to the shopping list.

export function dependentsOf(plan: DayPlan[], date: string): DayPlan[] {
  return plan.filter((d) => d.leftoverOf === date);
}

// The day a "Make extra" action on `date` would convert into leftovers: the next
// day after it that isn't locked and isn't already leftovers of this same day.
export function nextLeftoverTarget(plan: DayPlan[], date: string): DayPlan | null {
  const idx = plan.findIndex((d) => d.date === date);
  if (idx === -1) return null;
  for (let i = idx + 1; i < plan.length; i++) {
    const d = plan[i];
    if (d.locked) continue;
    if (d.leftoverOf === date) continue; // already covered by this source
    return d;
  }
  return null;
}

export function canMakeLeftovers(plan: DayPlan[], date: string): boolean {
  const day = plan.find((d) => d.date === date);
  if (!day || day.skipped || day.leftoverOf || !day.mainId) return false;
  const main = recipeById(day.mainId);
  if (!main?.leftoverFriendly) return false;
  return nextLeftoverTarget(plan, date) !== null;
}

// Validate every leftover reference and repair broken ones. A leftover day is
// valid only if its source still exists, is cooking (not skipped, has a main),
// isn't itself a leftover, and its main still reheats well. Orphaned days get a
// fresh generated meal so the week is never left in a broken state.
export function sanitizeLeftovers(days: DayPlan[], prefs: Preferences): DayPlan[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  return days.map((d) => {
    if (!d.leftoverOf) return d;
    const src = byDate.get(d.leftoverOf);
    const srcMain = src ? recipeById(src.mainId) : undefined;
    const valid =
      !!src &&
      src.date !== d.date &&
      !src.skipped &&
      !src.leftoverOf &&
      !!src.mainId &&
      !!srcMain?.leftoverFriendly;
    if (valid) return d;
    // Repair: turn this back into a freshly cooked meal (needs shopping again).
    const meal = generateMeal(prefs, [], []);
    if (!meal) return { ...d, leftoverOf: undefined, skipped: true };
    return { ...d, leftoverOf: undefined, mainId: meal.mainId, sideIds: meal.sideIds, skipped: false, shopped: false };
  });
}
