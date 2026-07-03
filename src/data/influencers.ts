import { Recipe } from '../types';

// Curated food-creator directory. We don't have a live influencer API, so
// "find a similar recipe by a pro" is implemented as a smart deep-link: we rank
// creators by how well their specialties match the dish, then open a YouTube
// search scoped to that creator + dish. Search URLs (rather than hard-coded
// video IDs) always resolve, so links never rot. Swapping in a real influencer
// API later means only replacing `findVideos`.

export interface Creator {
  name: string;
  handle: string; // used to scope the YouTube search
  channelUrl: string;
  specialties: string[]; // cuisines / proteins / styles this creator is known for
}

export const CREATORS: Creator[] = [
  {
    name: 'Sam the Cooking Guy',
    handle: 'Sam the Cooking Guy',
    channelUrl: 'https://www.youtube.com/@SamTheCookingGuy',
    specialties: ['american', 'mexican', 'beef', 'chicken', 'burger', 'taco', 'comfort', 'quick'],
  },
  {
    name: 'Josh Weissman',
    handle: 'Joshua Weissman',
    channelUrl: 'https://www.youtube.com/@JoshuaWeissman',
    specialties: ['japanese', 'chinese', 'italian', 'fish', 'pork', 'pasta', 'technique'],
  },
  {
    name: 'Not Another Cooking Show',
    handle: 'Not Another Cooking Show',
    channelUrl: 'https://www.youtube.com/@NOTANOTHERCOOKINGSHOW',
    specialties: ['italian', 'pasta', 'seafood', 'shrimp', 'technique'],
  },
  {
    name: 'J. Kenji López-Alt',
    handle: 'J. Kenji Lopez-Alt',
    channelUrl: 'https://www.youtube.com/@JKenjiLopezAlt',
    specialties: ['chinese', 'japanese', 'stir-fry', 'vegetarian', 'science', 'quick'],
  },
  {
    name: 'Ethan Chlebowski',
    handle: 'Ethan Chlebowski',
    channelUrl: 'https://www.youtube.com/@EthanChlebowski',
    specialties: ['indian', 'curry', 'mexican', 'taco', 'vegetarian', 'budget', 'technique'],
  },
  {
    name: 'Maangchi',
    handle: 'Maangchi',
    channelUrl: 'https://www.youtube.com/@Maangchi',
    specialties: ['korean', 'asian', 'vegetable', 'seafood'],
  },
];

export interface VideoSuggestion {
  creator: string;
  query: string; // human-readable dish being searched
  searchUrl: string;
  channelUrl: string;
}

const STOPWORDS = new Set([
  'sheet-pan', 'weeknight', 'simple', 'easy', 'quick', 'creamy', 'fluffy', 'warm', 'fresh',
  'house', 'smoky', 'garlic', 'butter', 'roasted', 'honey', 'glazed', 'the', 'with', 'and', 'a',
]);

// Terms that describe this recipe, for matching against creator specialties.
function recipeTerms(recipe: Recipe): string[] {
  const words = recipe.title.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  return [
    recipe.cuisine.toLowerCase(),
    recipe.protein ?? '',
    recipe.sideType ?? '',
    ...recipe.tags,
    ...words,
  ].filter(Boolean);
}

// Simplified dish phrase for the search query — drops filler adjectives so the
// search is broad enough to return each creator's take on the dish.
function dishPhrase(recipe: Recipe): string {
  const kept = recipe.title
    .split(/\s+/)
    .filter((w) => !STOPWORDS.has(w.toLowerCase().replace(/[^a-z-]/gi, '')));
  const phrase = kept.join(' ').trim();
  return phrase.length >= 3 ? phrase : recipe.title;
}

// Rank creators by specialty overlap with the dish; always return `count`
// suggestions so the section is useful even for a low-overlap recipe.
export function findVideos(recipe: Recipe, count = 3): VideoSuggestion[] {
  const terms = recipeTerms(recipe);
  const scored = CREATORS.map((creator, i) => {
    const score = creator.specialties.reduce(
      (n, sp) => n + (terms.some((t) => t.includes(sp) || sp.includes(t)) ? 1 : 0),
      0,
    );
    return { creator, score, i };
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);

  const phrase = dishPhrase(recipe);
  return scored.slice(0, count).map(({ creator }) => ({
    creator: creator.name,
    query: phrase,
    searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${creator.handle} ${phrase}`,
    )}`,
    channelUrl: creator.channelUrl,
  }));
}
