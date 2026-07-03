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

## Planned next (v2+)

- **Spoonacular integration** — a key field already exists in Preferences and a
  provider seam in `providers/recipeProvider.ts`; v2 maps Spoonacular responses
  into the `Recipe` shape behind the same interface, no engine changes needed.
- **Influencer recipes** — the `Recipe.source` field already carries
  `creator` / `videoUrl` (see the salmon recipe), and the detail screen links
  out. v2 surfaces "find a similar recipe by Josh Weissman / Sam the Cooking
  Guy" and deep-links to their video.
- Pantry staples, leftovers/batch-cooking, nutrition summary, hands-free cook
  mode with timers, household sharing, and grocery-delivery export.

> This is a prototype: recipes are a small local seed set, and cook times are
> illustrative.
