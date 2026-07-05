import { Aisle, DayPlan, Ingredient } from '../types';
import { recipeById } from '../data/catalog';

export interface ShoppingItem {
  name: string;
  qty: number;
  unit: string;
  aisle: Aisle;
  checked: boolean;
}

const AISLE_ORDER: Aisle[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Frozen',
  'Pantry',
  'Spices',
];

// Roll every ingredient from the week's non-skipped meals into one list:
// scaled to the household's serving size, deduped by name+unit (3 recipes that
// each need onions become one line), and grouped by grocery aisle.
export function buildShoppingList(
  days: DayPlan[],
  servings: number,
  checkedKeys: Record<string, boolean> = {},
): Record<Aisle, ShoppingItem[]> {
  const merged = new Map<string, ShoppingItem>();

  // How many days each cooking day feeds: itself + any leftover days pointing at
  // it. Batch-cooked meals are bought once but scaled up for the extra days.
  const portionsByDate = new Map<string, number>();
  for (const day of days) {
    if (day.leftoverOf) {
      portionsByDate.set(day.leftoverOf, (portionsByDate.get(day.leftoverOf) ?? 1) + 1);
    }
  }

  for (const day of days) {
    // Leftover days do no cooking; the source day already covers them. Shopped
    // meals are already bought, so they drop off the list.
    if (day.skipped || day.leftoverOf || day.shopped) continue;
    const portions = portionsByDate.get(day.date) ?? 1;
    const recipeIds = [day.mainId, ...day.sideIds];
    for (const id of recipeIds) {
      const recipe = recipeById(id);
      if (!recipe) continue;
      const scale = (servings / recipe.baseServings) * portions;
      for (const ing of recipe.ingredients) {
        addIngredient(merged, ing, scale);
      }
    }
  }

  const grouped = {} as Record<Aisle, ShoppingItem[]>;
  for (const aisle of AISLE_ORDER) grouped[aisle] = [];
  for (const [key, item] of merged) {
    item.checked = !!checkedKeys[key];
    item.qty = normalizeQty(item.qty, item.unit);
    grouped[item.aisle].push(item);
  }
  for (const aisle of AISLE_ORDER) {
    grouped[aisle].sort((a, b) => a.name.localeCompare(b.name));
  }
  return grouped;
}

export function itemKey(item: { name: string; unit: string }): string {
  return `${item.name}|${item.unit}`;
}

// Units you buy as a whole item — you can't purchase 0.76 of a head of lettuce
// or 1.4 cans of beans. Bare-count ingredients (empty unit) count here too.
const WHOLE_UNITS = new Set([
  '', 'head', 'heads', 'clove', 'cloves', 'can', 'cans', 'jar', 'jars',
  'loaf', 'loaves', 'bunch', 'bunches', 'ear', 'ears', 'stalk', 'stalks',
  'package', 'packages', 'pkg', 'pkgs', 'bag', 'bags', 'box', 'boxes',
  'sprig', 'sprigs', 'fillet', 'fillets', 'breast', 'breasts', 'thigh', 'thighs',
  'egg', 'eggs', 'stick', 'sticks', 'slice', 'slices', 'piece', 'pieces',
  'packet', 'packets',
]);

function isWholeUnit(unit: string): boolean {
  return WHOLE_UNITS.has(unit.trim().toLowerCase());
}

// Turn a scaled, merged quantity into something you can actually put in a cart.
// Whole items round up to a count; measured amounts snap to a friendly ¼ step.
export function normalizeQty(qty: number, unit: string): number {
  if (qty <= 0) return 0;
  if (isWholeUnit(unit)) return Math.max(1, Math.ceil(qty - 1e-9));
  const quarters = Math.round(qty * 4) / 4;
  return quarters > 0 ? quarters : Math.round(qty * 100) / 100;
}

// Vulgar fractions for the common measured amounts, so a list reads like a
// human wrote it ("1½ cups") instead of "1.5 cups".
const FRACTIONS: Record<string, string> = {
  '0.25': '¼', '0.5': '½', '0.75': '¾', '0.33': '⅓', '0.67': '⅔',
};

export function formatQty(n: number): string {
  const whole = Math.floor(n);
  const frac = Math.round((n - whole) * 100) / 100;
  const glyph = FRACTIONS[String(frac)];
  if (glyph) return whole > 0 ? `${whole}${glyph}` : glyph;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function addIngredient(
  merged: Map<string, ShoppingItem>,
  ing: Ingredient,
  scale: number,
): void {
  const key = itemKey(ing);
  const scaledQty = round(ing.qty * scale);
  const existing = merged.get(key);
  if (existing) {
    existing.qty = round(existing.qty + scaledQty);
  } else {
    merged.set(key, {
      name: ing.name,
      qty: scaledQty,
      unit: ing.unit,
      aisle: ing.aisle,
      checked: false,
    });
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export { AISLE_ORDER };
