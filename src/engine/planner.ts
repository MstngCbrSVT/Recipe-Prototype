import { Recipe, Preferences, SideType } from '../types';
import { mains as catalogMains, sides as catalogSides, recipeById } from '../data/catalog';

// Side types that satisfy the "every meal needs something fresh" rule.
const FRESH_SIDE_TYPES: SideType[] = ['vegetable', 'fruit', 'salad'];

function passesHardFilters(r: Recipe, prefs: Preferences): boolean {
  // Allergens are a safety filter — never suggest something the user must avoid.
  if (r.allergens.some((a) => prefs.avoidAllergens.includes(a))) return false;
  // Diet tags are AND — a "vegan + gluten-free" user only sees recipes with both.
  if (!prefs.diet.every((tag) => r.tags.includes(tag))) return false;
  return true;
}

function eligibleMains(prefs: Preferences): Recipe[] {
  return catalogMains().filter(
    (m) =>
      passesHardFilters(m, prefs) &&
      !(m.protein && prefs.dislikedProteins.includes(m.protein)),
  );
}

function eligibleSides(prefs: Preferences): Recipe[] {
  return catalogSides().filter(
    (s) =>
      passesHardFilters(s, prefs) &&
      !(s.sideType && prefs.avoidSideTypes.includes(s.sideType)),
  );
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface GeneratedMeal {
  mainId: string;
  sideIds: string[];
}

// Generate one day's meal. `recentProteins`/`recentCuisines` drive variety so
// the week doesn't become chicken five nights running; `avoidMainId` powers the
// "give me a different one" regenerate action.
export function generateMeal(
  prefs: Preferences,
  recentProteins: string[] = [],
  recentCuisines: string[] = [],
  avoidMainId?: string,
): GeneratedMeal | null {
  let mains = eligibleMains(prefs);
  if (mains.length === 0) return null;

  if (avoidMainId && mains.length > 1) {
    mains = mains.filter((m) => m.id !== avoidMainId);
  }

  // Prefer mains whose protein AND cuisine are both fresh to the week.
  let pool = mains.filter(
    (m) =>
      !recentProteins.includes(m.protein ?? '') &&
      !recentCuisines.includes(m.cuisine),
  );
  // Relax progressively so we always return a meal.
  if (pool.length === 0) pool = mains.filter((m) => !recentProteins.includes(m.protein ?? ''));
  if (pool.length === 0) pool = mains;

  const main = pick(pool);

  const sides = eligibleSides(prefs);
  const chosen: Recipe[] = [];
  const target = Math.max(1, prefs.sidesPerMeal);

  // Guarantee at least one fresh side (vegetable / fruit / salad) if any exist.
  const fresh = sides.filter((s) => s.sideType && FRESH_SIDE_TYPES.includes(s.sideType));
  if (fresh.length > 0) chosen.push(pick(fresh));

  // Fill the rest, avoiding duplicate side types for balance.
  while (chosen.length < target) {
    const usedTypes = chosen.map((c) => c.sideType);
    const remaining = sides.filter(
      (s) => !chosen.some((c) => c.id === s.id) && !usedTypes.includes(s.sideType),
    );
    const fallback = sides.filter((s) => !chosen.some((c) => c.id === s.id));
    const source = remaining.length > 0 ? remaining : fallback;
    if (source.length === 0) break;
    chosen.push(pick(source));
  }

  return { mainId: main.id, sideIds: chosen.map((s) => s.id) };
}

// Wall-clock time to cook a whole meal. Dishes cook in parallel, so the meal is
// as long as its slowest dish — not the sum. This is the "how long will this
// take" number surfaced on each day.
export function mealTotalMinutes(mainId: string, sideIds: string[]): number {
  const recipes = [mainId, ...sideIds]
    .map((id) => recipeById(id))
    .filter((r): r is Recipe => !!r);
  if (recipes.length === 0) return 0;
  return Math.max(...recipes.map((r) => r.totalMinutes));
}

export function mealActiveMinutes(mainId: string, sideIds: string[]): number {
  const recipes = [mainId, ...sideIds]
    .map((id) => recipeById(id))
    .filter((r): r is Recipe => !!r);
  return recipes.reduce((sum, r) => sum + r.activeMinutes, 0);
}
