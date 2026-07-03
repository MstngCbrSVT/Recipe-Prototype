# 🍳 MealMate — Meal Planning Prototype

A React Native (Expo) prototype that plans a week of dinners, coordinates the
cooking so every dish finishes together, and builds your shopping list
automatically. Built to run in **Expo Go** with zero backend and zero API keys.

## Run it in Expo Go

1. Install the **Expo Go** app on your phone (iOS App Store / Google Play).
2. In this folder:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code in the terminal with your phone
   (iOS: Camera app · Android: the Expo Go app's scanner).

The app loads with a full week already generated — no sign-up, no setup.

## The core loop (v1 / MVP)

- **Generate a week** of dinners on first launch, instantly, from sensible
  defaults. Re-roll the whole week or any single day (`🎲 New`).
- **Lock** 🔒 the meals you want to keep. Locked days survive re-rolls and
  persist between sessions (saved locally via AsyncStorage).
- **Swap** ↔️ two days, or **Skip** 🚫 a night (eating out / leftovers).
- **Coordinated cook plan** — tap any day to see one interleaved timeline that
  starts each dish at the right time so the main and sides finish together,
  plus the whole-meal total time and hands-on time.
- **Shopping list** — auto-aggregated from the week, scaled to your serving
  size, deduped by ingredient, and grouped by grocery aisle. Check items off.
- **Leftovers / batch cooking** — on a reheat-friendly meal, tap **🍲 Make
  extra** to cook once and cover the next day. The leftover day does no cooking
  and adds nothing to the shopping list; the source day scales up to buy the
  right amount once. **🍳 Cook fresh instead** undoes it.
- **Watch a pro make it** — each recipe suggests similar videos from food
  creators (Sam the Cooking Guy, Josh Weissman, Not Another Cooking Show, and
  more), ranked by how well their specialties match the dish, and deep-links to
  YouTube.
- **Preferences** — dinners/week, servings, sides per meal, allergies (hard
  safety filter), and, under *Advanced*, diet style, side types to avoid, and
  proteins to skip.

### Meal generation rules

- Every meal is guaranteed a **fresh side** (vegetable / fruit / salad) when one
  is available.
- **Allergens** are never suggested; **diet tags** are AND-filters (a
  "vegan + gluten-free" user only sees recipes matching both).
- **Variety**: the planner avoids repeating the same protein/cuisine on
  consecutive nights.
- **Whole-meal time** = the slowest dish (dishes cook in parallel), not the sum.

## How the "easy entry, advanced later" goal is met

- **Zero-setup first run**: a complete plan appears immediately; preferences are
  optional and default to something good.
- **Progressive disclosure**: the Preferences screen shows only the essentials
  (dinners, servings, sides, allergies) up front; diet/side/protein filters and
  the Spoonacular key live behind an *Advanced options* toggle.
- **No account required** to save state — the locked week persists locally.

## Architecture

```
App.tsx                     Tab shell + recipe-detail modal
src/
  types.ts                  Domain model (forward-looking: source/videoUrl, provider)
  data/recipes.ts           Bundled local recipe library (mains + sides by type)
  engine/
    planner.ts              Meal generation: filters, variety, fresh-side rule
    timeline.ts             Coordinated "cook it all together" schedule
    shopping.ts             Aggregate + scale + dedupe + aisle grouping
  providers/recipeProvider.ts  Source abstraction (local now, Spoonacular later)
  context/PlanContext.tsx   App state + persistence (generate/lock/swap/skip)
  storage.ts                AsyncStorage load/save
  screens/                  Plan · RecipeDetail · Shopping · Settings
  ui/                       Theme + shared components
```

## Spoonacular (free tier) — now wired up

Add your key in **Prefs → Advanced options → Spoonacular** and tap
**Save key & load recipes**. Live recipes are normalized into the app's `Recipe`
shape and **merged with** the built-in library (so the fresh-side guarantee and
offline fallback still hold).

Designed around the free tier's limits (150 points/day, ~1 req/sec):

- **Two requests per refresh** — one for mains, one for sides — using
  `complexSearch` with `addRecipeInformation` + `fillIngredients`, so full
  ingredients and instructions come back in the same call (no per-recipe
  follow-ups).
- **Cached** to local storage — planning, regenerating, and swapping never hit
  the network again. A restart reuses the saved pool without spending quota.
- **Safety filters pushed server-side** — your diet and allergy prefs become
  `diet` / `intolerances` params so results come back pre-filtered.
- **Graceful failure** — quota-reached / bad-key / offline all fall back to the
  local library with a clear status message; nothing crashes.

Normalization maps Spoonacular's `dishTypes`, diet booleans, `extendedIngredients`
(with aisle), and `analyzedInstructions` into our schema, inferring protein,
side type, allergens (heuristic), and active-vs-passive steps. See
`src/providers/spoonacular.ts`.

## Planned next (v2+)

- Pantry staples, nutrition summary, hands-free cook mode with timers,
  household sharing, and grocery-delivery export.
- Swap the curated creator directory in `src/data/influencers.ts` for a real
  influencer/video API — only `findVideos` changes.

> This is a prototype: recipes are a small local seed set, and cook times are
> illustrative.
