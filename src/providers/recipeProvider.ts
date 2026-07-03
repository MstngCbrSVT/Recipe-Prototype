import { Recipe } from '../types';
import { ALL_RECIPES } from '../data/recipes';

// Recipe source abstraction. The prototype runs entirely on the bundled local
// dataset (zero setup, works offline in Expo Go). A Spoonacular provider can be
// dropped in behind the same interface once the user supplies an API key —
// nothing in the planner, timeline, or shopping engine needs to change.

export interface RecipeProvider {
  readonly id: 'local' | 'spoonacular';
  getAll(): Promise<Recipe[]>;
}

export const localProvider: RecipeProvider = {
  id: 'local',
  async getAll() {
    return ALL_RECIPES;
  },
};

// Placeholder for the live integration. Wiring this up is a v2 task: map
// Spoonacular's /recipes/complexSearch + /recipes/{id}/information responses
// into our Recipe shape (role/sideType/allergens/steps), then merge with — or
// replace — the local set. Kept here so the seam is obvious and un-surprising.
export function createSpoonacularProvider(apiKey: string): RecipeProvider {
  return {
    id: 'spoonacular',
    async getAll() {
      // TODO(v2): fetch from https://api.spoonacular.com with `apiKey` and
      // normalize into Recipe[]. Falls back to local data until implemented.
      void apiKey;
      return ALL_RECIPES;
    },
  };
}
