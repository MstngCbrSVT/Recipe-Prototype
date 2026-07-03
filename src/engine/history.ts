import { DayPlan, HistoryEntry, Rating } from '../types';
import { recipeById } from '../data/catalog';

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to + 'T00:00:00') - Date.parse(from + 'T00:00:00')) / 86400000);
}

// How long a meal is held back after cooking, tuned by feedback:
// - disliked → gone for a long while
// - unrated → a few weeks (default "don't repeat week over week")
// - loved → comes back around in a week or two
export function cooldownDays(rating?: Rating): number {
  if (rating === 'down') return 56;
  if (rating === 'up') return 12;
  return 21;
}

export interface HistFilter {
  blocked: Set<string>; // recipe ids currently in cooldown
  dislikedPairs: Set<string>; // `${protein}|${cuisine}` disliked recently → downrank similar
}

export function buildHistFilter(history: HistoryEntry[], today: string): HistFilter {
  // Most recent entry per recipe drives its cooldown.
  const latest = new Map<string, HistoryEntry>();
  for (const e of history) {
    const cur = latest.get(e.mainId);
    if (!cur || e.date > cur.date) latest.set(e.mainId, e);
  }
  const blocked = new Set<string>();
  const dislikedPairs = new Set<string>();
  for (const [id, e] of latest) {
    const age = daysBetween(e.date, today);
    if (age < cooldownDays(e.rating)) blocked.add(id);
    if (e.rating === 'down' && age < 56) {
      const r = recipeById(id);
      if (r?.protein) dislikedPairs.add(`${r.protein}|${r.cuisine}`);
    }
  }
  return { blocked, dislikedPairs };
}

// As days pass, cooked days (before today) move out of the active plan and into
// history so the plan stays "today forward" and the planner learns from them.
export function rollPastDays(
  plan: DayPlan[],
  today: string,
  history: HistoryEntry[],
): { plan: DayPlan[]; history: HistoryEntry[]; changed: boolean } {
  const haveDates = new Set(history.map((h) => h.date));
  const nextHistory = [...history];
  const future: DayPlan[] = [];
  let changed = false;
  for (const d of plan) {
    if (d.date < today) {
      changed = true;
      if (!d.skipped && !d.leftoverOf && d.mainId && !haveDates.has(d.date)) {
        nextHistory.push({
          date: d.date,
          mainId: d.mainId,
          sideIds: d.sideIds,
          title: recipeById(d.mainId)?.title ?? 'Meal',
        });
      }
    } else {
      future.push(d);
    }
  }
  return { plan: future, history: nextHistory, changed };
}

// Add today's/any plan day to history on demand ("Made it"), deduped by date.
export function logMade(day: DayPlan, history: HistoryEntry[]): HistoryEntry[] {
  if (history.some((h) => h.date === day.date) || !day.mainId) return history;
  return [
    ...history,
    {
      date: day.date,
      mainId: day.mainId,
      sideIds: day.sideIds,
      title: recipeById(day.mainId)?.title ?? 'Meal',
    },
  ];
}
