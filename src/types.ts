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
  image?: string; // photo URL when available (Spoonacular); local recipes use the icon

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
  // Shopping flow: true once the groceries for this meal have been bought, so it
  // drops off the shopping list. Reset to false when the meal changes.
  shopped: boolean;
}

// Categories of expensive + perishable ingredients worth highlighting when
// they're reused across the week (the money-saving "threads").
export type ThreadCategory = 'protein' | 'seafood' | 'herb' | 'dairy' | 'specialty';

export type Goal = 'save' | 'time' | 'healthy' | 'variety';
export type Cuisine =
  | 'Italian'
  | 'Mexican'
  | 'American'
  | 'Asian'
  | 'Mediterranean'
  | 'Indian'
  | 'Comfort'
  | 'BBQ';
export type LeftoversPref = 'yes' | 'some' | 'no';

export interface Preferences {
  servings: number;
  dinnersPerWeek: number;
  sidesPerMeal: number; // 1 or 2
  diet: DietTag[]; // hard filters
  avoidAllergens: Allergen[]; // hard filters (safety)
  avoidSideTypes: SideType[]; // e.g. exclude 'bread' for low-carb
  dislikedProteins: Protein[]; // learned from regenerate/skip behaviour
  spoonacularApiKey?: string; // advanced, optional — unlocks live recipes
  // Captured during onboarding, editable in Prefs:
  adults: number;
  kids: number;
  cuisines: Cuisine[]; // soft preference toward these
  maxWeeknightMinutes: number; // cap on a main's cook time (999 = no limit)
  goal?: Goal; // sets tone; 'save' will bias toward ingredient reuse
  leftoversPref: LeftoversPref;
  onboarded: boolean; // false until the intro flow is completed or skipped
}

// Household size → servings (kids eat smaller portions).
export function servingsFor(adults: number, kids: number): number {
  return Math.max(1, adults + Math.round(kids * 0.6));
}

// A meal you've actually cooked, with optional feedback. Drives recency-aware
// planning: recently-cooked meals are held back, and the rating tunes how long.
export type Rating = 'up' | 'down';
export interface HistoryEntry {
  date: string; // ISO date it was cooked
  mainId: string;
  sideIds: string[];
  title: string; // denormalized so history survives recipe-source changes
  rating?: Rating;
}

// A merged, coordinated cooking timeline so every dish finishes together.
export interface TimelineEntry {
  atMin: number; // minutes from "start cooking now"
  recipeTitle: string;
  emoji: string;
  text: string;
  active: boolean;
}
