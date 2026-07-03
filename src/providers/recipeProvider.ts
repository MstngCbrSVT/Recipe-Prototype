import { Preferences, Recipe } from '../types';
import { setExternalRecipes, clearExternalRecipes, externalCount } from '../data/catalog';
import { fetchRecipePool, SpoonacularError } from './spoonacular';

// Facade over recipe sourcing. The planner/timeline/shopping engines read from
// the runtime catalog (src/data/catalog.ts) and never care where a recipe came
// from. This module is the one place that knows how to populate that catalog
// from an external provider.

export interface RefreshOutcome {
  ok: boolean;
  count: number; // number of external recipes now loaded
  message: string;
  recipes?: Recipe[]; // present on success, for caching
}

export async function refreshFromSpoonacular(
  apiKey: string,
  prefs: Preferences,
): Promise<RefreshOutcome> {
  try {
    const { recipes, pointsNote } = await fetchRecipePool(apiKey, prefs);
    setExternalRecipes(recipes);
    return { ok: true, count: recipes.length, message: pointsNote, recipes };
  } catch (err) {
    const message =
      err instanceof SpoonacularError ? err.message : 'Could not load Spoonacular recipes.';
    // Keep whatever pool we already had; the local library still works.
    return { ok: false, count: externalCount(), message };
  }
}

export { setExternalRecipes, clearExternalRecipes, externalCount };
