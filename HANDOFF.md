# Pump — handoff

Status as of 2026-11-20. Read this first; `README.md` covers commands and folder layout, `docs/GUIA.md` is the user guide (Portuguese).

## What Pump is

An offline-first strength-training app, used by its owner on their own Android phone (a Xiaomi, sideloaded debug APK). The user answers a 9-question questionnaire, a deterministic rule-based algorithm builds a plan of workouts A, B, C… done in rotation on any days, and the user logs workouts, swaps exercises and tracks progress. Brazilian Portuguese and English. Optional AI features: a plan review via the Claude API (user's own key), and "Ask Claude", which shares context to the Claude app.

Design doc (goals, algorithm, injury rules, data and media licensing, evidence and references): https://claude.ai/artifact/55sm1taEHSkv2ffskVNCbn

## Current state

| Area | State |
|---|---|
| Plan algorithm (`src/lib/generator.ts`) | Done. 34 Vitest tests pass (generator, rotation, i18n, workout logging, Ask Claude text) |
| Exercise swapping (`src/lib/swap.ts`) | Done, tested. Options can be previewed with full details before choosing |
| Progression cues (`src/lib/progression.ts`) | Done, tested |
| Workout rotation | Done. Workouts are A, B, C… in order on any day; no weekdays |
| Portuguese (pt-BR) | Done. UI, plan messages, exercise names and all 126 instruction sets |
| Workout logging | Pre-fill from last time, Skip/Done per exercise, rest timer on the button, details inside each card |
| Exercise GIFs | 117 of 126 exercises, local builds only (see "User's decisions") |
| Ask Claude | Done: shares context to the Claude app via the share sheet |
| Swipe between tabs | Done; checked with real touch events in headless Chrome |
| React UI | Screenshots at 400 px, pt/en, light/dark, no console errors (headless Chrome, last 2026-11-20). The user has installed and used the APK on their phone |
| Offline (vite-plugin-pwa) | Precaches the app; GIFs are cached at runtime. Not verified offline in a browser |
| AI review (`src/lib/review.ts`) | Written against SDK types; **never called against the real API** |
| Android (Capacitor 8.5.3) | Debug APK builds and installs on the user's phone. Native storage, back button, share-sheet backup and Ask Claude, keep-awake, haptics, rest-end notification |
| Git | Everything on `master`, pushed to `github.com/ericlesaquiles/pump`. **GitHub's default branch is still `android-app`** (no `gh` CLI here to change it); once the user switches it to `master` in GitHub settings, delete the remote `android-app` branch. Local feature branches are deleted |

### Not verified (do these when possible)

1. On the phone: data survives app restarts; back button with a dialog open; backup share and import; keep-awake; rest-end notification with the phone locked; whether the Claude app appears in the share sheet; swipe vs. Android's edge back gesture; status-bar overlap with the top bar.
2. Offline in a browser: load `npm run preview` once, go offline in DevTools, reload.
3. AI review with a real key: confirm `fallbacks: "default"` + `output_config.format` are accepted together on `claude-opus-5-5`, and the browser call works (`dangerouslyAllowBrowser: true`).
4. A Portuguese-speaking coach should skim the translated exercise instructions, and a physiotherapist or coach should review the joint-stress tags.

## Stack

React 19.3.1 · TypeScript 7.0.2 (strict, `noUncheckedIndexedAccess`) · Vite 8.3.5 · Vitest 4.1.12 · vite-plugin-pwa 2.0.0 · @anthropic-ai/sdk 1.3.0 · Capacitor 8. All pinned exactly; chosen to be at least two weeks old at install time. Node ≥ 22.12 (developed on 25.9). No router or state library: hash routing (`src/hooks/useRoute.ts`) and one React context (`src/hooks/useAppState.tsx`).

`npm audit` reports 6 low/moderate issues, all in workbox build-time dependencies of vite-plugin-pwa. Not shipped to users; left as is.

## User's decisions and preferences

- React + TypeScript, components in `src/components/<Screen>/`, **CSS in separate `.module.css` files, no inline styles** (the user asked for this explicitly). Dynamic visuals use data attributes (`Plate`, the rest-timer bar's `data-p`) or SVG attributes (`VolumeChart`, `Sparkline`) instead of `style`.
- Keep plan logic in `src/lib/` free of React so it can be reused and tested.
- AI features stay **optional**; the app works fully **offline** without them.
- **Language:** Brazilian Portuguese and English, switchable in Settings (defaults to the phone's language). All text goes through `src/i18n/`; never hard-code UI text in components.
- **No fixed weekdays:** workouts rotate (A, B, C…) on whichever days suit the user.
- Base exercise data: free-exercise-db text (public domain). Do **not** use its photos in a shared app (ownership unclear).
- **Exercise GIFs (Gym visual), personal use only (user's decision, 2026-11-15).** The GIFs from hasaneyldrm/exercises-dataset are © Gym visual and not covered by that repo's MIT license ("Cloning this repository does not grant you any license to the media"); Gym visual's own terms couldn't be read (their site returned 403). The user chose to use them on their own phone only. So: the mapping (`data/gif-map.json`, ids and names only) is in git; `npm run fetch:gifs` downloads the GIFs into the **git-ignored** `public/media/gymvisual/`; the app shows a GIF only if that folder exists, always with "© Gym visual — gymvisual.com". **Any build that will be shared or published must use `PUMP_NO_GIFS=1`** unless a license is bought. Don't trace or AI-generate from the GIFs. Long-term plan for a public app: own animations (film → MediaPipe pose → SVG stick figures) plus YouTube links.
- Commits go on `master` and are pushed when the user asks.

## How the algorithm works (short)

`generatePlan(answers, exercises)` in `src/lib/generator.ts`:

1. Split from workouts per week (`SPLITS` in `constants.ts`): 2–3 full body, 4 upper/lower, 5 U/L/Push/Pull/Legs, 6 PPL×2.
2. Weekly set targets per muscle: base 9/13/16 by experience (points picked inside the design doc's ranges 8–10 / 10–16 / 12–20), ×1.4 for priorities (doc: +30–50%), 60% for abs/calves, 40% for front delts, ×0.85 from age 50. Minimums ("floors"): 6 (4 for abs/calves, 0 front delts). The evidence cited for the ranges is Schoenfeld, Ogborn & Krieger 2017; the exact points, the age factor and the floors are judgment calls.
3. Each workout template has slots (movement pattern, required or optional), filled by scoring candidates after hard filters (equipment, injuries, painful movements, dislikes, skill).
4. Base sets are fitted into the session time; then a greedy allocator adds sets where muscles are furthest below target (below-floor deficits weighted ×3), within time and a 10-sets-per-muscle-per-session cap.
5. Repair pass (max 5): push/pull balance, muscles under their floor.
6. Reps and rest by goal (`PRESCRIPTION`): for muscle gain, the first compound of a workout 5–8, other compounds 6–10, isolation 10–15; rest 2:30 compound / 1:15 isolation. Exercises loading a joint with a mild limitation get +3 reps and a "lighter load" flag.
7. `refreshPlan` recomputes minutes, weekly sets and warnings after any change.

Time model, caps and weights live in `LIMITS` at the top of `generator.ts`.

## Screens and behaviour worth knowing

- **Rotation** (`src/lib/rotation.ts`): next workout = the one after the most recent session (by date, then `savedAt`) under the current plan; empty workouts skipped. The Workout screen opens on today's logged workout if any, else the next one. Plan screen: this Monday-to-Sunday week, "X of N workouts", "Up next". History: month calendar (tap a day to open that workout).
- **Plan screen**: each workout card's exercise list starts collapsed ("Show the 6 exercises").
- **Weekly chart** (`VolumeChart`): pale bar = planned weekly sets; green bar and number = sets in *saved* sessions this week (`src/lib/volume.ts`, counted like the plan: main muscle 1, secondary ½). Label reads "done · planned/target". Unsaved drafts don't count.
- **Workout logging** (`src/lib/workout.ts`, tested in `test/workout.test.ts`):
  - New workouts are pre-filled with the values logged last time for each exercise (set by set; weight only in the same unit; empty if never done), flagged `untouched` until edited.
  - Each exercise has **Skip** and **Done** (`DraftEntry.state`); a closed card shows only the name, yellow or green; tap to reopen. Saved as `Session.skipped` and `SessionEntry.done`.
  - **Save records** exercises marked Done or edited; never skipped ones or untouched pre-filled ones (otherwise last time's numbers would be logged for exercises not done).
  - **Details** button (or tapping the name) opens `ExerciseDetails` inside the card: GIF, muscles, equipment, joint stress, how to do it, top-set chart, links.
  - **Rest timer** (`useRestTimer.tsx`, `RestButton.tsx`): the rest button counts down in place with a progress bar and stops on a second tap; a floating pill (+30 s / Done) stays visible when scrolling. Actions and the ticking state are separate contexts so only timer displays re-render every 250 ms.
- **Swap dialog**: options grouped by tier; "See details" shows an option's full details with "Back to the list" / "Choose this one".
- **Swipe between tabs** (`useSwipeTabs.ts`): quick (< 0.7 s), ≥ 70 px, clearly sideways; ignored in dialogs, form fields and within 24 px of the screen edges (Android back gesture). `overscroll-behavior-x: none` in `base.css` stops browsers using the same gesture for back/forward. Disabled on the questionnaire.

## Languages (i18n)

- `src/i18n/en.ts` is the source; `pt.ts` is typed `Dict = typeof en`, so a missing or mistyped key fails the build. Components use `useI18n()` (`t`, `exName`, `ex`, `date`, `num`, `text`).
- The plan logic never writes sentences. Reasons, notices and warnings are `Msg` objects (`src/lib/types.ts`), swap reasons are `SwapReason`, cues are `Cue`; the dictionaries phrase them, so a saved plan follows a language switch.
- Plans saved before 2026-11-15 (no `v: 2`) are migrated on load by `migratePlan`. Their old reasons and notices stay as English strings (`Text = string | Msg`) until the plan is rebuilt.
- Exercise translations: `src/data/exercises.pt.json` (`{ id: { name, note?, instructions } }`), falls back to English. Not generated by `build:data`; keep it in sync by hand (a test checks every exercise has a name and the same number of steps).
- Translation choices: inches/feet converted to cm; the original's "knees must not pass the toes" rule is attributed to the original text rather than stated as fact; references to a "foot positioning section" that doesn't exist in the app were dropped.

## AI features

- **Ask Claude** (`src/lib/ask.ts`, `AskClaudeButton.tsx`): a Claude subscription can't be connected to a third-party app, so Pump builds a short text (profile, plan, plus the focused exercise's recent sets, pain marks and cue, or the current workout including unsaved sets, skips and notes) and hands it to the Claude app through the share sheet (`shareText` in `native.ts`; browser: `navigator.share`, else clipboard). Buttons: exercise details, Workout screen, a panel on the Plan screen. Pump sends nothing itself. Not built (offered): an in-app chat using an API key.
- **AI review** (`src/lib/review.ts`): sends the plan as text to the Claude API with the user's key, in the user's language, after showing exactly what will be sent. Untested against the real API.

## Data pipeline

`data/overlay.ts` (126 hand-tagged exercises: pattern, muscle weights, equipment with `a|b` alternatives, skill, joint stress 1–3, painful-movement tags, staple flag) + `data/vendor/free-exercise-db.json` → `npm run build:data` (`scripts/build-data.ts`, run directly by Node's type stripping) → `src/data/exercises.json`. The script fails on unknown ids or tags.

**The joint-stress tags are first-pass estimates by the assistant.** They must be reviewed by a physiotherapist or strength coach before the app is shared; the Settings screen says so.

## Known issues and ideas

- Very constrained setups (bodyweight only, or strength goal in 45 min) produce thin plans with several muscles below their floor; the app warns. Bodyweight-only has no pulling exercises (Pull workouts come out empty, with a notice).
- 9 exercises have no GIF (no faithful match in the dataset): band skull crusher, band lateral raise, bodyweight squat, Smith RDL, band good morning, cable glute kickback, standing leg curl, band leg curl, plank.
- Volume chart in dark mode: target tick (white) and minimum tick (grey) look similar.
- No "starting weight" estimate for swapped exercises; no curated YouTube ids (the details link to a YouTube search).
- Main bundle ~565 KB (exercise data plus Portuguese text; Vite warns about 500 KB). Could lazy-load the unused language. The SDK is a separate chunk loaded only for the AI review.

## Next steps (suggested)

1. User: switch GitHub's default branch to `master`, then delete the remote `android-app` branch.
2. The phone checks under "Not verified".
3. Real API test of the AI review.
4. Professional review of joint-stress tags and the Portuguese instructions.
5. Own animations and curated video ids, if the app is ever shared.

## Android app

Capacitor wraps the same React build. App id `app.pump.planner` (in `capacitor.config.ts`; **can't change after publishing on Google Play**). minSdk 24, targetSdk 36. Requires a full **JDK 21** (`openjdk-21-jdk-headless`; Android Studio's bundled JDK 25 doesn't satisfy the plugins' Java 21 toolchain) and the Android SDK at `~/Android/Sdk` (`android/local.properties`, git-ignored). Build with `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`.

Commands (run `npm run fetch:gifs` first for GIFs; `PUMP_NO_GIFS=1` for anything shared): `npm run android:sync` (build + copy into `android/`), `npm run android:open` (Android Studio), `npm run android:apk` (debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`, ~16 MB with GIFs).

Installing on the user's Xiaomi: copy the APK to the phone and open it with the file manager; HyperOS/MIUI may need "Install unknown apps" for that app and an "Install anyway" past its security scan. USB debugging needs "OS version" tapped 7 times, then USB debugging and "Install via USB" in Developer options.

The local emulator (`Medium_Phone_API_37.0`) doesn't start: it needs 12 GB free for its data partition.

Native code lives in `src/lib/native.ts` (no-ops in the browser) and `src/lib/platform.ts` (`isNative`):

- **Storage**: on Android, `src/lib/storage.ts` uses Capacitor Preferences. All `pump:*` keys load into memory in `initStorage()` before the first render; writes go to memory, then to Preferences asynchronously.
- **Service worker**: browser only (`main.tsx`, `injectRegister: null`).
- **Back button**: closes an open dialog, else goes back, else exits from the Plan screen.
- **Share sheet**: backup export (Filesystem + Share) and Ask Claude (`shareText`).
- **Workout screen**: keeps the screen awake.
- **Rest timer**: haptics at the end, plus a local notification (asks permission the first time; `allowWhileIdle`, may be a few seconds late).
- **Icons**: adaptive launcher icon from vector drawables, notification icon `ic_stat_pump`.

### Publishing later

$25 Google Play developer account; privacy policy; Data safety form (injury answers are health data; the AI features send data to Anthropic); release signing key; ~2-week closed test for new personal developer accounts; `PUMP_NO_GIFS=1`.

## Testing tips

- `npm run typecheck`, `npm test`, `npm run build`.
- Screens were checked by driving headless Chrome (`google-chrome` is installed) over the DevTools protocol from a small Node script: seed `localStorage`, reload, click through, `Page.captureScreenshot` at 400 px; `Input.dispatchTouchEvent` for swipes. The script isn't in the repo; navigating between `#hash` routes doesn't reload the page, so reload after seeding.

## Related artifacts

- Design doc: https://claude.ai/artifact/55sm1taEHSkv2ffskVNCbn
- Earlier personal tracker prototype (not part of this codebase): https://claude.ai/artifact/XfCKnM69Z5iboDn8SrzG3H
