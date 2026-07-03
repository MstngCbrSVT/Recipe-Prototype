import { Recipe } from '../types';
import { MAINS as LOCAL_MAINS, SIDES as LOCAL_SIDES } from './recipes';

// Runtime recipe registry. The bundled local library is always present; recipes
// fetched from an external provider (Spoonacular) are layered on top. Merging —
// rather than replacing — means the planner's fresh-side guarantee and offline
// fallback keep working even if a fetch fails or the daily quota is exhausted.

let external: Recipe[] = [];
let index = new Map<string, Recipe>();

function rebuild(): void {
  const all = [...LOCAL_MAINS, ...LOCAL_SIDES, ...external];
  index = new Map(all.map((r) => [r.id, r]));
}
rebuild();

export function setExternalRecipes(recipes: Recipe[]): void {
  external = recipes;
  rebuild();
}

export function clearExternalRecipes(): void {
  external = [];
  rebuild();
}

export function externalCount(): number {
  return external.length;
}

export function allRecipes(): Recipe[] {
  return [...index.values()];
}

export function mains(): Recipe[] {
  return allRecipes().filter((r) => r.role === 'main');
}

export function sides(): Recipe[] {
  return allRecipes().filter((r) => r.role === 'side');
}

export function recipeById(id: string): Recipe | undefined {
  return index.get(id);
}
