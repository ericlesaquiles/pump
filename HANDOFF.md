# Pump — handoff

Status as of 2026-11-15 (rotation and Portuguese added). Read this first; `README.md` covers commands and folder layout.

## What Pump is

An offline-first strength-training app. The user answers a 9-question questionnaire, a deterministic rule-based algorithm builds a weekly plan, and the user logs workouts, swaps exercises and tracks progress. An optional AI review sends the plan (as text) to the Claude API with the user's own key.

Design doc (goals, algorithm, injury rules, data and media licensing, evidence and references): https://claude.ai/artifact/55sm1taEHSkv2ffskVNCbn

## Current state

| Area | State |
|---|---|
| Plan algorithm (`src/lib/generator.ts`) | Done; 27 Vitest tests passing (generator, rotation, i18n) |
| Exercise swapping (`src/lib/swap.ts`) | Done, tested |
| Progression cues (`src/lib/progression.ts`) | Done, tested |
| React UI (5 screens) | Renders at 400 px in Portuguese and English, light and dark (headless-Chrome screenshots, 2026-11-15, no console errors). Interactions not exercised beyond opening dialogs |
| Workout rotation | Done (2026-11-15). Workouts are A, B, C… done in order on any day; no weekdays |
| Portuguese (pt-BR) | Done (2026-11-15). UI, plan messages, exercise names and all 126 instruction sets |
| Offline (vite-plugin-pwa) | Builds a service worker that precaches everything; not verified offline in a browser |
| AI review (`src/lib/review.ts`) | Written against SDK types; **never called against the real API** |
| Android (Capacitor 8.5.3) | Project generated in `android/` and synced; native storage, back button, share-sheet backup, keep-awake, haptics and rest-end notification wired in. Debug APK builds (2026-11-15). **Never run** on a device or emulator (the emulator wouldn't start: not enough free disk for its 12 GB data partition) |
| Git | `e87b35f` web app on `master`; Android work on branch `android-app` (not merged) |

### Verified

- `npm run typecheck`, `npm test` (17/17) and `npm run build` all pass.
- Production build serves correctly with `npm run preview` (index, `sw.js`, manifest all return 200).
- The user shared a screenshot of the Plan screen's volume chart rendering correctly in dark mode, so at least the Plan screen works in a browser.

### Not verified (do this first)

1. Click through every screen: questionnaire → plan → swap dialog → workout log (save, hurt flag, "swap for today", rest timer) → history (open, delete, progress chart, export/import) → settings (save, erase).
2. Offline: load `npm run preview` once, go offline in DevTools, reload.
3. AI review with a real key: confirm `fallbacks: "default"` + `output_config.format` are accepted together on `claude-opus-5-5`, and that the browser call works (`dangerouslyAllowBrowser: true`).
4. ~~Phone width and light mode~~ checked by screenshot on 2026-11-15; the Workout screen used to scroll sideways (fixed).
5. The Portuguese exercise instructions were translated by the assistant: have a Portuguese-speaking coach skim them.

## Stack

React 19.3.1 · TypeScript 7.0.2 (strict, `noUncheckedIndexedAccess`) · Vite 8.3.5 · Vitest 4.1.12 · vite-plugin-pwa 2.0.0 · @anthropic-ai/sdk 1.3.0. All pinned exactly; chosen to be at least two weeks old at install time. Node ≥ 22.12 (developed on 25.9). No router or state library: hash routing (`src/hooks/useRoute.ts`) and one React context (`src/hooks/useAppState.tsx`).

`npm audit` reports 6 low/moderate issues, all in workbox build-time dependencies of vite-plugin-pwa (glob/minimatch). Not shipped to users. The suggested fix downgrades the plugin; left as is.

## User's decisions and preferences

- React + TypeScript, components in `src/components/<Screen>/`, **CSS in separate `.module.css` files, no inline styles** (the user asked for this explicitly). Dynamic visuals use data attributes (`Plate`) or SVG attributes (`VolumeChart`, `Sparkline`) instead of `style`.
- Keep plan logic in `src/lib/` free of React so it can be reused (tests, a future native app).
- AI review must stay **optional** and the app must work fully **offline** without it.
- Base exercise data: free-exercise-db text (public domain). Do **not** use its photos in a shared app (ownership unclear).
- Do **not** use the Gym visual GIFs from hasaneyldrm/exercises-dataset, and don't trace or AI-generate from them. Their terms make the free versions "entirely copyrighted" and licenses non-transferable. Plan instead: own animations (film → MediaPipe pose → SVG stick figures, ~30–60 per movement pattern) plus YouTube links (kinetic-place/exercises-db has 906/908 linked; quality varies, hand-check).
- **Language:** Brazilian Portuguese and English, switchable in Settings (defaults to the phone's language). All text goes through `src/i18n/`; never hard-code UI text in components.
- **No fixed weekdays:** workouts rotate (A, B, C…) and are done on whichever days suit the user; the app suggests the next one and tracks training days on a calendar.
- Preferred route to Android: **Capacitor** (reuse ~95% of the code). Approved and built.

## How the algorithm works (short)

`generatePlan(answers, exercises)` in `src/lib/generator.ts`:

1. Split from days per week (`SPLITS` in `constants.ts`): 2–3 full body, 4 upper/lower, 5 U/L/Push/Pull/Legs, 6 PPL×2.
2. Weekly set targets per muscle: base 9/13/16 by experience, ×1.4 for priorities, lower for abs/calves/front delts, ×0.85 from age 50. Floors: 6 (4 for abs/calves).
3. Each day template has slots (movement pattern, required or optional). Slots are filled by scoring candidates after hard filters (equipment, injuries, painful movements, dislikes, skill).
4. Base sets are fitted into the session time budget; then a greedy allocator adds sets where muscles are furthest below target (below-floor deficits weighted ×3), within time and a 10-sets-per-muscle-per-session cap.
5. Repair pass (max 5): push/pull balance, muscles under their floor.
6. Reps/rest by goal; mild-injury exercises get +3 reps and a "lighter load" flag.
7. `refreshPlan` recomputes minutes, weekly sets and warnings after any change (generation or swap).

Time model, caps and weights live in `LIMITS` at the top of `generator.ts`.

## Workout rotation

`src/lib/rotation.ts`: the next workout is the one after the most recent session (by date, then `savedAt`) logged under the current plan; empty workouts are skipped. The Workout screen opens on today's logged workout if there is one, otherwise the next one. The Plan screen shows this Monday-to-Sunday week (trained days, "X of N workouts", "Up next"); History has a month calendar (tap a day to open that workout).

## Languages (i18n)

- `src/i18n/en.ts` is the source; `pt.ts` is typed `Dict = typeof en`, so a missing or mistyped key fails the build. Components use `useI18n()` (`t`, `exName`, `date`, `num`, `text`).
- The plan logic never writes sentences. Reasons, notices and warnings are `Msg` objects (`src/lib/types.ts`), swap reasons are `SwapReason`, cues are `Cue`; the dictionaries phrase them. So a saved plan follows a language switch.
- Plans saved before this (no `v: 2`) are migrated on load by `migratePlan`: weekdays and English day names dropped, warnings recomputed. Their old reasons and notices stay as English strings (`Text = string | Msg`) until the plan is rebuilt.
- Exercise translations: `src/data/exercises.pt.json` (`{ id: { name, note?, instructions } }`), falls back to English. Not generated by `build:data`; keep it in sync by hand when the overlay changes (a test checks every exercise has a name and the same number of steps).
- Translation choices: inches/feet converted to cm; the original's "knees must not pass the toes" rule is attributed to the original text instead of stated as fact (current evidence doesn't support it as a universal rule); references to a "foot positioning section" that doesn't exist in the app were dropped.
- The AI review sends labels and exercise names in the user's language and asks for a reply in it (`t.review.replyIn`).

## Data pipeline

`data/overlay.ts` (126 hand-tagged exercises: pattern, muscle weights, equipment with `a|b` alternatives, skill, joint stress 1–3, painful-movement tags, staple flag) + `data/vendor/free-exercise-db.json` → `npm run build:data` (`scripts/build-data.ts`, run directly by Node's type stripping) → `src/data/exercises.json`. The script fails on unknown ids or tags.

**The joint-stress tags are first-pass estimates by the assistant.** They must be reviewed by a physiotherapist or strength coach before the app is shared; the Settings screen says so.

## Known issues and ideas

- Very constrained setups (bodyweight only, or strength goal in 45 min) produce plans with several muscles below their floor. The app warns honestly, but the plans are thin. Bodyweight-only has no pulling exercises at all (Pull days come out empty, with a notice).
- An unloaded exercise can still fill an optional slot for people with weights (e.g. bodyweight squat as a 3rd leg movement when a knee is limited).
- Volume chart: in dark mode the target tick (white) and minimum tick (grey) look similar; the user was offered a dashed minimum line or a note when muscles fall short because of time. No answer yet.
- AI review findings can only be marked done/ignored; suggestions are not applied automatically (by design — use Swap).
- No "starting weight" estimate for swapped exercises yet (design doc mentions it as a labelled guess).
- No curated YouTube ids yet; the exercise dialog links to a YouTube search.
- Main bundle is ~565 KB (includes the 140 KB exercise JSON and ~110 KB of Portuguese exercise text; Vite warns about the 500 KB limit). Could lazy-load the language not in use if it matters; the app is precached for offline anyway. The SDK is a separate 352 KB chunk loaded only on review.

## Next steps (suggested order)

1. Merge `rotation-and-pt` (which contains `android-app`) once it has run on a phone.
2. Browser pass over all screens (see "Not verified"), fix what breaks.
3. Real API test of the AI review.
4. Android (see "Android app" below): install the APK on a phone (or free disk / shrink the AVD's storage and use the emulator), and check everything in "Android: not verified".
5. Professional review of joint-stress tags.
6. Own animations and curated video ids.

## Android app

Capacitor wraps the same React build. App id `app.pump.planner` (in `capacitor.config.ts`; **can't change after publishing on Google Play** — pick the final id before the first upload). minSdk 24, targetSdk 36. Requires a full **JDK 21** (`openjdk-21-jdk-headless`, installed; the plugins ask for a Java 21 toolchain, so Android Studio's bundled JDK 25 doesn't work) and the Android SDK at `~/Android/Sdk` (`android/local.properties`, git-ignored). Gradle downloads platform 36 and build-tools 35 itself. All Capacitor packages are on v8 (`@capacitor/preferences` was moved from 7.0.4 to 8.0.1).

Commands: `npm run android:sync` (build web app + copy into `android/`), `npm run android:open` (open in Android Studio), `npm run android:apk` (debug APK via Gradle, at `android/app/build/outputs/apk/debug/`).

Native code lives in `src/lib/native.ts` (everything there is a no-op in the browser) and `src/lib/platform.ts` (`isNative`):

- **Storage**: on Android, `src/lib/storage.ts` uses Capacitor Preferences instead of localStorage. All `pump:*` keys are loaded into memory by `initStorage()` before the first render (`main.tsx`); writes go to memory, then to Preferences asynchronously. The `store` API is unchanged and synchronous.
- **Service worker**: only registered in the browser (`main.tsx`, `injectRegister: null` in `vite.config.ts`).
- **Back button**: closes an open dialog (dispatches `cancel`), else goes back, else exits from the Plan screen.
- **Backup export**: writes to the app cache and opens the share sheet (Filesystem + Share). Import still uses the file input.
- **Workout screen**: keeps the screen awake.
- **Rest timer**: haptics at the end, plus a local notification when rest ends (asks for notification permission the first time; scheduled with `allowWhileIdle`, so it may be a few seconds late without the exact-alarm permission).
- **Icons**: adaptive launcher icon from vector drawables (`res/drawable/ic_pump_foreground.xml`, background `#1F2A36`), notification icon `ic_stat_pump`. Android 7.x (API 24–25) still shows Capacitor's default PNG icon and the default splash image.

### Android: not verified

Nothing has run on a device or emulator. Check: storage survives app restarts; back button with a dialog open; backup share sheet and import; keep-awake; rest-end notification with the phone locked; status-bar overlap with the sticky top bar (safe-area insets); external links (YouTube, console.anthropic.com) open in the browser; AI review request from the app.

### Publishing later

$25 Google Play developer account; privacy policy; Data safety form (injury answers are health data; the AI review sends data to Anthropic); release signing key; ~2-week closed test with testers for new personal developer accounts.

## Related artifacts

- Design doc: https://claude.ai/artifact/55sm1taEHSkv2ffskVNCbn
- Earlier personal tracker prototype (single HTML page, not part of this codebase): https://claude.ai/artifact/XfCKnM69Z5iboDn8SrzG3H
