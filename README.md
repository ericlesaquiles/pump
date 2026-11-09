# Pump

Offline-first strength-training planner. Answer a short questionnaire, get a weekly plan built by a rule-based algorithm, log workouts, swap exercises, and optionally ask Claude to review the plan.

## Run it

```bash
npm install
npm run dev        # development server with hot reload
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (offline support works here)
npm test           # algorithm, swap and progression tests
```

Requires Node 22.12 or newer.

## Layout

```
src/
  main.tsx, App.tsx          entry point and screen routing (#plan, #log, …)
  components/
    common/                  Button, Dialog, Callout, Chip, Panel, OptionGroup, Sparkline, …
    Layout/                  TopBar
    Setup/                   questionnaire
    Plan/                    week view, day cards, volume chart, AI review
    Exercise/                exercise info and swap dialogs
    Workout/                 workout logger, set rows, rest timer
    History/                 past workouts, progress chart, backup
    Settings/                units, AI review key, credits, erase
  hooks/                     app state, routing, toast, rest timer, online status
  lib/                       plan logic with no React: generator, swap, progression, review, storage, types
  styles/                    design tokens (colors, fonts, dark mode) and base element styles
data/
  overlay.ts                 hand-curated exercise tags (pattern, muscles, equipment, joint stress)
  vendor/                    free-exercise-db (public domain)
scripts/build-data.ts        merges the two into src/data/exercises.json (npm run build:data)
test/                        Vitest tests for lib/
```

Each component has its own `.module.css` file; there are no inline styles.

## Data and privacy

Everything is stored in the browser (localStorage). History → Backup exports a JSON file. The optional AI review sends the plan as text to the Claude API using your own key (Settings), after showing you exactly what will be sent.

## Caveats

- Joint-stress tags in `data/overlay.ts` are first-pass estimates and should be reviewed by a physiotherapist or strength coach before the app is shared.
- Pump gives general training guidance, not medical advice.
