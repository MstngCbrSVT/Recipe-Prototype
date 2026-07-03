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

  for (const day of days) {
    if (day.skipped) continue;
    const recipeIds = [day.mainId, ...day.sideIds];
    for (const id of recipeIds) {
      const recipe = recipeById(id);
      if (!recipe) continue;
      const scale = servings / recipe.baseServings;
      for (const ing of recipe.ingredients) {
        addIngredient(merged, ing, scale);
      }
    }
  }

  const grouped = {} as Record<Aisle, ShoppingItem[]>;
  for (const aisle of AISLE_ORDER) grouped[aisle] = [];
  for (const [key, item] of merged) {
    item.checked = !!checkedKeys[key];
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
