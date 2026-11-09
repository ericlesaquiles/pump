# Pump — handoff

Status as of 2026-11-08. Read this first; `README.md` covers commands and folder layout.

## What Pump is

An offline-first strength-training app. The user answers a 9-question questionnaire, a deterministic rule-based algorithm builds a weekly plan, and the user logs workouts, swaps exercises and tracks progress. An optional AI review sends the plan (as text) to the Claude API with the user's own key.

Design doc (goals, algorithm, injury rules, data and media licensing, evidence and references): https://claude.ai/artifact/55sm1taEHSkv2ffskVNCbn

## Current state

| Area | State |
|---|---|
| Plan algorithm (`src/lib/generator.ts`) | Done, 17 Vitest tests passing |
| Exercise swapping (`src/lib/swap.ts`) | Done, tested |
| Progression cues (`src/lib/progression.ts`) | Done, tested |
| React UI (5 screens, 37 components) | Written, type-checks and builds; **never clicked through in a browser** (Chrome extension wasn't connected) |
| Offline (vite-plugin-pwa) | Builds a service worker that precaches everything; not verified offline in a browser |
| AI review (`src/lib/review.ts`) | Written against SDK types; **never called against the real API** |
| Android | Not started; plan below |
| Git | Repo initialized with a `.gitignore` (ignores `node_modules/`, `dist/`, `.env*`, Android build output); **no commits yet** |

### Verified

- `npm run typecheck`, `npm test` (17/17) and `npm run build` all pass.
- Production build serves correctly with `npm run preview` (index, `sw.js`, manifest all return 200).
- The user shared a screenshot of the Plan screen's volume chart rendering correctly in dark mode, so at least the Plan screen works in a browser.

### Not verified (do this first)

1. Click through every screen: questionnaire → plan → swap dialog → workout log (save, hurt flag, "swap for today", rest timer) → history (open, delete, progress chart, export/import) → settings (save, erase).
2. Offline: load `npm run preview` once, go offline in DevTools, reload.
3. AI review with a real key: confirm `fallbacks: "default"` + `output_config.format` are accepted together on `claude-opus-5-5`, and that the browser call works (`dangerouslyAllowBrowser: true`).
4. Phone width (~400 px) and light mode.

## Stack

React 19.3.1 · TypeScript 7.0.2 (strict, `noUncheckedIndexedAccess`) · Vite 8.3.5 · Vitest 4.1.12 · vite-plugin-pwa 2.0.0 · @anthropic-ai/sdk 1.3.0. All pinned exactly; chosen to be at least two weeks old at install time. Node ≥ 22.12 (developed on 25.9). No router or state library: hash routing (`src/hooks/useRoute.ts`) and one React context (`src/hooks/useAppState.tsx`).

`npm audit` reports 6 low/moderate issues, all in workbox build-time dependencies of vite-plugin-pwa (glob/minimatch). Not shipped to users. The suggested fix downgrades the plugin; left as is.

## User's decisions and preferences

- React + TypeScript, components in `src/components/<Screen>/`, **CSS in separate `.module.css` files, no inline styles** (the user asked for this explicitly). Dynamic visuals use data attributes (`Plate`) or SVG attributes (`VolumeChart`, `Sparkline`) instead of `style`.
- Keep plan logic in `src/lib/` free of React so it can be reused (tests, a future native app).
- AI review must stay **optional** and the app must work fully **offline** without it.
- Base exercise data: free-exercise-db text (public domain). Do **not** use its photos in a shared app (ownership unclear).
- Do **not** use the Gym visual GIFs from hasaneyldrm/exercises-dataset, and don't trace or AI-generate from them. Their terms make the free versions "entirely copyrighted" and licenses non-transferable. Plan instead: own animations (film → MediaPipe pose → SVG stick figures, ~30–60 per movement pattern) plus YouTube links (kinetic-place/exercises-db has 906/908 linked; quality varies, hand-check).
- Preferred route to Android: **Capacitor** (reuse ~95% of the code). The user asked about difficulty but hasn't approved starting it.

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
- Main bundle is ~429 KB (includes the 140 KB exercise JSON); the SDK is a separate 352 KB chunk loaded only on review.

## Next steps (suggested order)

1. Make the first commit.
2. Browser pass over all screens (see "Not verified"), fix what breaks.
3. Real API test of the AI review.
4. If the user approves Android via Capacitor:
   - `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`; `npx cap init`, `npx cap add android` (needs Android Studio + SDK on the machine).
   - Move persistence off localStorage (Android can clear web view storage): replace `src/lib/storage.ts` internals with Capacitor Preferences or SQLite; keep its interface.
   - Backup export via Filesystem + Share plugins (the `<a download>` approach in `BackupPanel.tsx` won't work in a web view).
   - Rest timer: keep-awake while working out, haptics, optional local notification when rest ends.
   - Android back button closes the open dialog first.
   - Icons and splash from `public/icon.svg`.
   - Play Store: $25 developer account, privacy policy, Data safety form (injury answers are health data; the AI review sends data to Anthropic), ~2-week closed test for new personal accounts.
5. Professional review of joint-stress tags.
6. Own animations and curated video ids.

## Related artifacts

- Design doc: https://claude.ai/artifact/55sm1taEHSkv2ffskVNCbn
- Earlier personal tracker prototype (single HTML page, not part of this codebase): https://claude.ai/artifact/XfCKnM69Z5iboDn8SrzG3H
