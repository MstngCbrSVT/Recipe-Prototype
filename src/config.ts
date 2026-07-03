// App configuration sourced from environment variables.
//
// Expo inlines any `EXPO_PUBLIC_*` variable from a local `.env` file into the
// bundle at build time. Put your key in `.env.local` (which is gitignored) so it
// is NEVER committed to the repository:
//
//   EXPO_PUBLIC_SPOONACULAR_KEY=your_key_here
//
// Note: because this is a client-side app, any key shipped in the bundle is
// visible to anyone who has the app. That's inherent to calling Spoonacular
// directly from the device. For a personal prototype on the free tier that's
// fine; a production app would proxy requests through a small backend that holds
// the key server-side. Either way, never hardcode the key in source/git.
export const DEFAULT_SPOONACULAR_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_KEY ?? '';
