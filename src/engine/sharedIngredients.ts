import { DayPlan, ThreadCategory } from '../types';
import { recipeById } from '../data/catalog';

// The money-saving view: which expensive, perishable ingredients get reused
// across the week. We only surface items where reuse actually saves money or
// avoids waste — proteins, seafood, fresh herbs, dairy, and a few specialties —
// never cheap staples like salt or oil (highlighting those would be noise).

interface KeyDef {
  key: string;
  label: string;
  category: ThreadCategory;
  save: number; // rough $ saved / waste avoided per extra reuse
  match: RegExp;
}

// Order matters — first match wins.
const KEY_DEFS: KeyDef[] = [
  { key: 'shrimp', label: 'Shrimp', category: 'seafood', save: 4, match: /shrimp|prawn|scallop|crab|lobster/i },
  { key: 'fish', label: 'Fish', category: 'seafood', save: 4, match: /salmon|tuna|cod|tilapia|halibut|trout|\bfish/i },
  { key: 'chicken', label: 'Chicken', category: 'protein', save: 3.5, match: /chicken|turkey|poultry/i },
  { key: 'beef', label: 'Beef', category: 'protein', save: 3.5, match: /beef|steak/i },
  { key: 'pork', label: 'Pork', category: 'protein', save: 3, match: /pork|bacon|sausage|chorizo|ham\b/i },
  { key: 'cilantro', label: 'Cilantro', category: 'herb', save: 1.5, match: /cilantro|coriander/i },
  { key: 'basil', label: 'Basil', category: 'herb', save: 1.5, match: /basil/i },
  { key: 'parsley', label: 'Parsley', category: 'herb', save: 1.2, match: /parsley/i },
  { key: 'ginger', label: 'Ginger', category: 'herb', save: 1.2, match: /ginger/i },
  { key: 'cheese', label: 'Cheese', category: 'dairy', save: 2, match: /cheese|parmesan|mozzarella|cheddar|feta|ricotta/i },
  { key: 'cream', label: 'Cream', category: 'dairy', save: 2, match: /heavy cream|\bcream\b/i },
  { key: 'coconut', label: 'Coconut milk', category: 'specialty', save: 1.5, match: /coconut milk/i },
];

export interface Thread {
  key: string;
  label: string;
  category: ThreadCategory;
  count: number; // how many nights it's used
}

export interface SharedResult {
  threads: Thread[]; // shown as chips, most-reused first
  savings: number; // estimated $ saved
  dayThreads: Record<string, Thread[]>; // per-date reuse tags
}

function classify(name: string): KeyDef | undefined {
  return KEY_DEFS.find((d) => d.match.test(name));
}

// Only actual cooking nights count (skipped days and leftover days cook nothing).
function cookingDays(days: DayPlan[]): DayPlan[] {
  return days.filter((d) => !d.skipped && !d.leftoverOf && d.mainId);
}

export function computeShared(days: DayPlan[]): SharedResult {
  const cooking = cookingDays(days);
  // key -> { def, dates }
  const hits = new Map<string, { def: KeyDef; dates: Set<string> }>();

  for (const day of cooking) {
    const seenThisDay = new Set<string>();
    for (const id of [day.mainId, ...day.sideIds]) {
      const recipe = recipeById(id);
      if (!recipe) continue;
      for (const ing of recipe.ingredients) {
        const def = classify(ing.name);
        if (!def || seenThisDay.has(def.key)) continue;
        seenThisDay.add(def.key);
        const entry = hits.get(def.key) ?? { def, dates: new Set<string>() };
        entry.dates.add(day.date);
        hits.set(def.key, entry);
      }
    }
  }

  const threads: Thread[] = [];
  let savings = 0;
  const dayThreads: Record<string, Thread[]> = {};

  for (const { def, dates } of hits.values()) {
    if (dates.size < 2) continue; // only reuse across ≥2 nights is worth showing
    const thread: Thread = { key: def.key, label: def.label, category: def.category, count: dates.size };
    threads.push(thread);
    savings += (dates.size - 1) * def.save;
    for (const date of dates) {
      (dayThreads[date] ??= []).push(thread);
    }
  }

  threads.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return { threads, savings: Math.round(savings), dayThreads };
}
