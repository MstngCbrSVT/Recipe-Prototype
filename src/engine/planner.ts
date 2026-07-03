import { Recipe, Preferences, SideType } from '../types';
import { mains as catalogMains, sides as catalogSides, recipeById } from '../data/catalog';
import { HistFilter } from './history';

// Side types that satisfy the "every meal needs something fresh" rule.
const FRESH_SIDE_TYPES: SideType[] = ['vegetable', 'fruit', 'salad'];

function passesHardFilters(r: Recipe, prefs: Preferences): boolean {
  // Allergens are a safety filter — never suggest something the user must avoid.
  if (r.allergens.some((a) => prefs.avoidAllergens.includes(a))) return false;
  // Diet tags are AND — a "vegan + gluten-free" user only sees recipes with both.
  if (!prefs.diet.every((tag) => r.tags.includes(tag))) return false;
  return true;
}

// Loose mapping from the onboarding cuisine buttons to recipe.cuisine strings.
const CUISINE_ALIASES: Record<string, string[]> = {
  Asian: ['asian', 'chinese', 'japanese', 'thai', 'korean', 'vietnamese'],
  Comfort: ['american'],
  BBQ: ['american', 'bbq'],
  Mediterranean: ['mediterranean', 'greek'],
};

function cuisineMatches(recipeCuisine: string, preferred: string[]): boolean {
  const rc = recipeCuisine.toLowerCase();
  return preferred.some((p) => {
    const aliases = CUISINE_ALIASES[p] ?? [p.toLowerCase()];
    return aliases.includes(rc);
  });
}

function eligibleMains(prefs: Preferences, hist?: HistFilter): Recipe[] {
  let pool = catalogMains().filter(
    (m) =>
      passesHardFilters(m, prefs) &&
      !(m.protein && prefs.dislikedProteins.includes(m.protein)),
  );
  // Hold back recently-cooked meals (recency cooldown) — but never empty the pool.
  if (hist?.blocked.size) {
    const fresh = pool.filter((m) => !hist.blocked.has(m.id));
    if (fresh.length > 0) pool = fresh;
  }
  // Weeknight time cap — but never let it empty the pool.
  if (prefs.maxWeeknightMinutes && prefs.maxWeeknightMinutes < 999) {
    const quick = pool.filter((m) => m.totalMinutes <= prefs.maxWeeknightMinutes);
    if (quick.length > 0) pool = quick;
  }
  return pool;
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
  preferReuse = false,
  hist?: HistFilter,
): GeneratedMeal | null {
  let mains = eligibleMains(prefs, hist);
  if (mains.length === 0) return null;

  if (avoidMainId && mains.length > 1) {
    mains = mains.filter((m) => m.id !== avoidMainId);
  }

  let pool: Recipe[];
  if (preferReuse && recentProteins.length > 0) {
    // Money-saving: build the week around a shared "anchor" protein so an
    // expensive, perishable ingredient gets bought once and used up.
    pool = mains.filter((m) => recentProteins.includes(m.protein ?? ''));
    if (pool.length === 0) pool = mains;
  } else {
    // Variety: avoid repeating the last couple of nights' protein and cuisine.
    const recentP = recentProteins.slice(-2);
    const recentC = recentCuisines.slice(-2);
    pool = mains.filter((m) => !recentP.includes(m.protein ?? '') && !recentC.includes(m.cuisine));
    if (pool.length === 0) pool = mains.filter((m) => !recentP.includes(m.protein ?? ''));
    if (pool.length === 0) pool = mains;
  }

  // Soft preference toward liked cuisines (only if it doesn't empty the pool).
  if (prefs.cuisines?.length) {
    const liked = pool.filter((m) => cuisineMatches(m.cuisine, prefs.cuisines));
    if (liked.length > 0) pool = liked;
  }

  // Downrank meals similar to recently-disliked ones (same protein + cuisine).
  if (hist?.dislikedPairs.size) {
    const notSimilar = pool.filter((m) => !hist.dislikedPairs.has(`${m.protein}|${m.cuisine}`));
    if (notSimilar.length > 0) pool = notSimilar;
  }

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
