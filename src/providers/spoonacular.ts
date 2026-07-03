import { Aisle, Allergen, DietTag, Ingredient, Protein, Recipe, SideType, Step } from '../types';
import { Preferences } from '../types';

// Spoonacular free-tier integration.
//
// Free tier = 150 points/day and ~1 request/second. To stay well inside that we
// make just TWO requests per refresh (one for mains, one for sides) using
// complexSearch with addRecipeInformation + fillIngredients, which returns full
// ingredients and instructions in the same call — no per-recipe follow-ups. The
// result pool is cached (see storage.ts) so planning, regenerating, and swapping
// never touch the network. Diet/allergen prefs are pushed to the API as `diet`
// and `intolerances` so results come back pre-filtered for safety.

const BASE = 'https://api.spoonacular.com/recipes/complexSearch';

export class SpoonacularError extends Error {
  constructor(
    message: string,
    public kind: 'auth' | 'quota' | 'network' | 'empty',
  ) {
    super(message);
  }
}

export interface RefreshResult {
  recipes: Recipe[];
  pointsNote: string;
}

// Map our preference enums to Spoonacular's parameter vocabulary.
const DIET_PARAM: Partial<Record<DietTag, string>> = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  'gluten-free': 'gluten free',
};
const INTOLERANCE_PARAM: Partial<Record<Allergen, string>> = {
  gluten: 'gluten',
  dairy: 'dairy',
  eggs: 'egg',
  peanuts: 'peanut',
  treenuts: 'tree nut',
  soy: 'soy',
  shellfish: 'shellfish',
  fish: 'seafood',
};

function buildQuery(apiKey: string, prefs: Preferences, type: string, number: number): string {
  const diets = prefs.diet.map((d) => DIET_PARAM[d]).filter(Boolean);
  const intolerances = [
    ...prefs.avoidAllergens.map((a) => INTOLERANCE_PARAM[a]).filter(Boolean),
    // dairy-free isn't a Spoonacular diet — express it as an intolerance
    ...(prefs.diet.includes('dairy-free') ? ['dairy'] : []),
  ];
  const params = new URLSearchParams({
    apiKey,
    type,
    number: String(number),
    addRecipeInformation: 'true',
    fillIngredients: 'true',
    instructionsRequired: 'true',
    sort: 'random',
  });
  if (diets.length) params.set('diet', diets.join(','));
  if (intolerances.length) params.set('intolerances', [...new Set(intolerances)].join(','));
  return `${BASE}?${params.toString()}`;
}

async function fetchType(
  apiKey: string,
  prefs: Preferences,
  type: string,
  role: 'main' | 'side',
  number: number,
): Promise<Recipe[]> {
  let res: Response;
  try {
    res = await fetch(buildQuery(apiKey, prefs, type, number));
  } catch {
    throw new SpoonacularError('Network error reaching Spoonacular.', 'network');
  }
  if (res.status === 401 || res.status === 403) {
    throw new SpoonacularError('Invalid Spoonacular API key.', 'auth');
  }
  if (res.status === 402 || res.status === 429) {
    throw new SpoonacularError('Daily Spoonacular quota reached — using saved recipes.', 'quota');
  }
  if (!res.ok) {
    throw new SpoonacularError(`Spoonacular error ${res.status}.`, 'network');
  }
  const json = (await res.json()) as { results?: SpoonResult[] };
  return (json.results ?? []).map((r) => normalize(r, role)).filter((r): r is Recipe => r !== null);
}

// Two sequential calls (spaces them out under the 1 req/sec limit) and merges.
export async function fetchRecipePool(
  apiKey: string,
  prefs: Preferences,
): Promise<RefreshResult> {
  const mains = await fetchType(apiKey, prefs, 'main course', 'main', 10);
  const sides = await fetchType(apiKey, prefs, 'side dish', 'side', 8);
  const recipes = [...mains, ...sides];
  if (recipes.length === 0) {
    throw new SpoonacularError('No recipes matched your filters.', 'empty');
  }
  return {
    recipes,
    pointsNote: `Fetched ${mains.length} mains + ${sides.length} sides in 2 requests.`,
  };
}

// ---- Response shape (only the fields we use) ----
interface SpoonResult {
  id: number;
  title: string;
  readyInMinutes?: number;
  servings?: number;
  dishTypes?: string[];
  cuisines?: string[];
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  extendedIngredients?: SpoonIngredient[];
  analyzedInstructions?: { steps?: SpoonStep[] }[];
}
interface SpoonIngredient {
  aisle?: string | null;
  nameClean?: string | null;
  name?: string;
  measures?: { us?: { amount?: number; unitShort?: string } };
  amount?: number;
  unit?: string;
}
interface SpoonStep {
  step: string;
  length?: { number?: number };
}

function normalize(r: SpoonResult, role: 'main' | 'side'): Recipe | null {
  if (!r.title) return null;
  const ingredients = (r.extendedIngredients ?? []).map(normalizeIngredient);
  const ingredientNames = ingredients.map((i) => i.name.toLowerCase()).join(' ');
  const tags = dietTags(r);
  const total = r.readyInMinutes && r.readyInMinutes > 0 ? r.readyInMinutes : 30;
  const steps = normalizeSteps(r.analyzedInstructions, total);
  const sideType = role === 'side' ? inferSideType(r, ingredientNames) : undefined;
  const protein = role === 'main' ? inferProtein(ingredientNames, tags) : undefined;

  return {
    id: `sp-${r.id}`,
    title: r.title,
    emoji: pickEmoji(role, protein, sideType),
    role,
    sideType,
    protein,
    cuisine: r.cuisines?.[0] ?? 'Various',
    tags,
    allergens: inferAllergens(ingredientNames, r),
    activeMinutes: steps.filter((s) => s.active).reduce((n, s) => n + s.durationMin, 0) || Math.round(total / 2),
    totalMinutes: total,
    baseServings: r.servings && r.servings > 0 ? r.servings : 4,
    leftoverFriendly: role === 'main' && isLeftoverFriendly(r),
    ingredients,
    steps: steps.length ? steps : [{ text: 'See full recipe.', durationMin: total, active: true }],
    provider: 'spoonacular',
    source: {
      siteUrl: `https://spoonacular.com/recipes/${slug(r.title)}-${r.id}`,
    },
  };
}

function normalizeIngredient(ing: SpoonIngredient): Ingredient {
  const amount = ing.measures?.us?.amount ?? ing.amount ?? 0;
  const unit = ing.measures?.us?.unitShort ?? ing.unit ?? '';
  return {
    name: ing.nameClean || ing.name || 'ingredient',
    qty: Math.round(amount * 100) / 100,
    unit,
    aisle: mapAisle(ing.aisle),
  };
}

const PASSIVE = /bake|roast|simmer|boil|rest|chill|refrigerat|marinat|cool|oven|preheat|let sit|let stand|cover and cook/i;

function normalizeSteps(instr: { steps?: SpoonStep[] }[] | undefined, total: number): Step[] {
  const raw = instr?.[0]?.steps ?? [];
  if (raw.length === 0) return [];
  const per = Math.max(2, Math.round(total / raw.length));
  return raw.map((s) => ({
    text: s.step,
    durationMin: s.length?.number && s.length.number > 0 ? s.length.number : per,
    active: !PASSIVE.test(s.step),
  }));
}

function mapAisle(aisle?: string | null): Aisle {
  const a = (aisle ?? '').toLowerCase();
  if (a.includes('produce')) return 'Produce';
  if (a.includes('meat') || a.includes('seafood')) return 'Meat & Seafood';
  if (a.includes('cheese') || a.includes('milk') || a.includes('egg') || a.includes('dairy'))
    return 'Dairy & Eggs';
  if (a.includes('bakery') || a.includes('bread')) return 'Bakery';
  if (a.includes('frozen')) return 'Frozen';
  if (a.includes('spice') || a.includes('seasoning')) return 'Spices';
  return 'Pantry';
}

function dietTags(r: SpoonResult): DietTag[] {
  const tags: DietTag[] = [];
  if (r.vegetarian) tags.push('vegetarian');
  if (r.vegan) tags.push('vegan');
  if (r.glutenFree) tags.push('gluten-free');
  if (r.dairyFree) tags.push('dairy-free');
  return tags;
}

// Heuristic allergen inference from ingredient names. The pool is already
// server-filtered by the user's intolerances at fetch time; this is a
// best-effort second layer so later client-side filtering has something to work
// with. Prototype-grade — not a substitute for reading the label.
const ALLERGEN_KEYWORDS: Record<Allergen, RegExp> = {
  gluten: /flour|wheat|bread|pasta|noodle|couscous|barley|breadcrumb|tortilla|soy sauce/i,
  dairy: /milk|cheese|butter|cream|yogurt|parmesan|mozzarella/i,
  eggs: /\begg/i,
  peanuts: /peanut/i,
  treenuts: /almond|walnut|pecan|cashew|pistachio|hazelnut/i,
  soy: /soy|tofu|edamame|miso/i,
  shellfish: /shrimp|prawn|crab|lobster|scallop|clam|mussel|oyster/i,
  fish: /salmon|tuna|cod|tilapia|anchovy|halibut|trout|\bfish/i,
};

function inferAllergens(names: string, r: SpoonResult): Allergen[] {
  const found: Allergen[] = [];
  for (const key of Object.keys(ALLERGEN_KEYWORDS) as Allergen[]) {
    if (ALLERGEN_KEYWORDS[key].test(names)) found.push(key);
  }
  // Trust the API's explicit flags to remove false positives.
  return found.filter((a) => {
    if (a === 'gluten' && r.glutenFree) return false;
    if (a === 'dairy' && r.dairyFree) return false;
    return true;
  });
}

function inferProtein(names: string, tags: DietTag[]): Protein {
  if (/shrimp|prawn|crab|lobster|scallop|clam|mussel/i.test(names)) return 'seafood';
  if (/salmon|tuna|cod|tilapia|halibut|trout|\bfish/i.test(names)) return 'fish';
  if (/beef|steak|brisket/i.test(names)) return 'beef';
  if (/pork|bacon|ham|sausage|chorizo/i.test(names)) return 'pork';
  if (/chicken|turkey|poultry/i.test(names)) return 'chicken';
  if (tags.includes('vegan') || tags.includes('vegetarian')) return 'vegetarian';
  return 'chicken';
}

function inferSideType(r: SpoonResult, names: string): SideType {
  const dt = (r.dishTypes ?? []).join(' ').toLowerCase();
  const title = r.title.toLowerCase();
  if (dt.includes('salad') || title.includes('salad')) return 'salad';
  if (dt.includes('bread') || /bread|roll|biscuit|baguette/i.test(title)) return 'bread';
  if (/apple|berry|melon|orange|grape|fruit|peach|mango/i.test(title)) return 'fruit';
  if (/broccoli|carrot|green bean|asparagus|brussels|spinach|kale|zucchini|cauliflower|pepper|vegetable/i.test(title + ' ' + names))
    return 'vegetable';
  if (/rice|potato|pasta|couscous|quinoa|noodle|grain|orzo|polenta/i.test(title + ' ' + names))
    return 'starch';
  return 'vegetable';
}

function pickEmoji(role: 'main' | 'side', protein?: Protein, sideType?: SideType): string {
  if (role === 'main') {
    return { chicken: '🍗', beef: '🥩', pork: '🥓', fish: '🐟', seafood: '🦐', vegetarian: '🥘' }[
      protein ?? 'vegetarian'
    ];
  }
  return { vegetable: '🥦', fruit: '🍓', bread: '🍞', starch: '🍚', salad: '🥗', dairy: '🧀' }[
    sideType ?? 'vegetable'
  ];
}

// Dishes that reheat well are good candidates for batch cooking.
const LEFTOVER_WORDS = /soup|stew|chili|curry|casserole|roast|braise|bake|chowder|sauce|bolognese|lasagna|meatball|pulled|slow.?cook|stir.?fry|fried rice|enchilada/i;

function isLeftoverFriendly(r: SpoonResult): boolean {
  const hay = `${r.title} ${(r.dishTypes ?? []).join(' ')}`;
  return LEFTOVER_WORDS.test(hay);
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
