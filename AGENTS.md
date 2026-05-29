# AGENTS.md — sitas-mobile

## Project type
Expo React Native app with file-based routing (Expo Router v6).

## Key commands
- `npm start` / `npx expo start` — start Metro bundler
- `npm run android` / `ios` / `web` — start for specific platform
- `npm run lint` — ESLint via `eslint-config-expo` (flat config)
- There is **no test runner** configured. There is **no `typecheck` script**; run `npx tsc --noEmit` manually if needed.

## Architecture
- **Entry**: `expo-router/entry` (package.json `main`). Do not create a root `index.js`.
- **Routing**: `app/` is the router. Group folders:
  - `(auth)` — login/unauthenticated screens
  - `(tabs)` — authenticated main screens (Inicio, Registros, Progreso, Más)
  - `app/routine/[id].tsx` — dynamic routine detail
  - `app/timer.tsx` — modal timer outside tabs
- **Auth guard**: `app/_layout.tsx` redirects between `(auth)` and `(tabs)` based on `AuthContext` session. It reads `useAuth()` and uses `useSegments()` / `useRouter()`.
- **Path alias**: `@/*` maps to `./*` (tsconfig).

## Styling — NativeWind v2 (not v4)
- Uses `nativewind` v2 with TailwindCSS v3.
- `babel.config.js` includes `nativewind/babel`.
- `app.d.ts` references `nativewind/types` for `className` autocomplete.
- Tailwind content paths: `app/`, `components/`, `src/`.
- Some legacy screens still use `StyleSheet.create` (e.g. `modal.tsx`). Prefer `className` for new screens.

## Backend & Auth
- **Supabase** (`@supabase/supabase-js` v2).
- Auth session is persisted via a custom `ExpoSecureStoreAdapter` in `src/lib/supabase.ts`.
- `AuthContext` fetches the user's `role` from the `profiles` table after session init.
- Many screens fetch directly from Supabase tables: `gym_classes`, `reservations`, `routines`, `routine_user_assignments`, `workout_logs`, `workout_log_entries`, `profiles`.

## Environment variables
- Required public vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Expo only embeds vars prefixed with `EXPO_PUBLIC_`.
- **CRITICAL**: `.env` in the repo root contains hardcoded secrets (service role key, DB password, JWT secret). `.gitignore` only ignores `.env*.local`, **not `.env`**. Be extremely careful not to commit or expose these values in code. If you need to add env vars, prefer `.env.local` and add it to `.gitignore`.

## Toolchain quirks
- **Bundle ID**: iOS `bundleIdentifier` and Android `package` are both set to `com.sitas.fitness` in `app.json`. This is permanent and cannot be changed without creating a new store listing.
- `app.json`: `newArchEnabled: true`, `typedRoutes: true`, `reactCompiler: true`.
- `expo-env.d.ts` is gitignored but present; Expo may regenerate it.

## One-off scripts (not part of build)
- `check.ps1`, `check-*.ps1` — PowerShell helpers that hit Supabase REST to inspect schemas.
- `test-schema.js` — Node script that queries Supabase tables to verify connectivity.

## VS Code settings
- `settings.json` enables `source.fixAll`, `source.organizeImports`, and `source.sortMembers` on save.
