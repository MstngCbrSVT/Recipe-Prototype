// Core domain types for the meal-planning prototype.
// The schema is intentionally forward-looking: `source` carries influencer /
// video attribution (Sam the Cooking Guy, Josh Weissman, etc.) and `provider`
// tags where a recipe came from so a Spoonacular integration can slot in later
// without a migration.

export type SideType =
  | 'vegetable'
  | 'fruit'
  | 'bread'
  | 'starch'
  | 'salad'
  | 'dairy';

export type Protein =
  | 'chicken'
  | 'beef'
  | 'pork'
  | 'fish'
  | 'seafood'
  | 'vegetarian';

export type Allergen =
  | 'gluten'
  | 'dairy'
  | 'eggs'
  | 'peanuts'
  | 'treenuts'
  | 'soy'
  | 'shellfish'
  | 'fish';

export type DietTag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'high-protein'
  | 'low-carb';

export interface Ingredient {
  name: string;
  qty: number;
  unit: string; // '', 'cup', 'tbsp', 'clove', 'lb', ...
  aisle: Aisle;
}

export type Aisle =
  | 'Produce'
  | 'Meat & Seafood'
  | 'Dairy & Eggs'
  | 'Bakery'
  | 'Pantry'
  | 'Frozen'
  | 'Spices';

export interface Step {
  text: string;
  durationMin: number; // wall-clock time this step occupies
  active: boolean; // hands-on (true) vs. passive/waiting (false, e.g. simmering)
}

export interface RecipeSource {
  creator?: string; // e.g. "Josh Weissman"
  siteUrl?: string;
  videoUrl?: string;
}

export interface Recipe {
  id: string;
  title: string;
  emoji: string;
  role: 'main' | 'side';
  sideType?: SideType; // present when role === 'side'
  protein?: Protein; // present when role === 'main'
  cuisine: string;
  tags: DietTag[];
  allergens: Allergen[];
  activeMinutes: number; // hands-on time
  totalMinutes: number; // wall-clock time start to finish
  baseServings: number;
  leftoverFriendly: boolean; // reheats well → good for batch cooking
  ingredients: Ingredient[];
  steps: Step[];
  provider: 'local' | 'spoonacular';
  source?: RecipeSource;
}

// A single day's planned meal: one main + chosen sides, plus lock/skip state.
export interface DayPlan {
  date: string; // ISO date 'YYYY-MM-DD'
  mainId: string;
  sideIds: string[];
  locked: boolean; // locked meals survive "regenerate week" and persist
  skipped: boolean; // no cooking that day (eating out, leftovers)
  // Batch cooking: when set, this day eats leftovers cooked on the referenced
  // date. It does no cooking of its own and adds nothing new to the shopping
  // list (the source day is scaled up to cover it).
  leftoverOf?: string; // ISO date of the day the food was actually cooked
}

export interface Preferences {
  servings: number;
  dinnersPerWeek: number;
  sidesPerMeal: number; // 1 or 2
  diet: DietTag[]; // hard filters
  avoidAllergens: Allergen[]; // hard filters (safety)
  avoidSideTypes: SideType[]; // e.g. exclude 'bread' for low-carb
  dislikedProteins: Protein[]; // learned from regenerate/skip behaviour
  spoonacularApiKey?: string; // advanced, optional — unlocks live recipes
}

// A merged, coordinated cooking timeline so every dish finishes together.
export interface TimelineEntry {
  atMin: number; // minutes from "start cooking now"
  recipeTitle: string;
  emoji: string;
  text: string;
  active: boolean;
}
