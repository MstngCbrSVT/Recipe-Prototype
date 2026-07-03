import { TimelineEntry } from '../types';
import { RECIPE_BY_ID } from '../data/recipes';

// Build a single coordinated cooking plan so every dish finishes at the same
// moment. Each dish is scheduled to *end* at T = the longest dish's total time;
// a dish that takes less time simply starts later. Steps are then merged and
// sorted, giving the user one interleaved "do this now" list instead of three
// separate recipes to juggle.
export function buildTimeline(mainId: string, sideIds: string[]): {
  entries: TimelineEntry[];
  totalMinutes: number;
} {
  const recipes = [mainId, ...sideIds].map((id) => RECIPE_BY_ID[id]).filter(Boolean);
  if (recipes.length === 0) return { entries: [], totalMinutes: 0 };

  const finishAt = Math.max(...recipes.map((r) => r.totalMinutes));
  const entries: TimelineEntry[] = [];

  for (const recipe of recipes) {
    let cursor = finishAt - recipe.totalMinutes; // when this dish begins
    for (const step of recipe.steps) {
      entries.push({
        atMin: Math.round(cursor),
        recipeTitle: recipe.title,
        emoji: recipe.emoji,
        text: step.text,
        active: step.active,
      });
      cursor += step.durationMin;
    }
  }

  entries.sort((a, b) => a.atMin - b.atMin);
  return { entries, totalMinutes: finishAt };
}
