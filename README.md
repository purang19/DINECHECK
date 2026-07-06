# Dine Check

**Internal Quality Check** — a lightweight survey tool for hospitality teams to
evaluate food quality and service across their restaurant outlets. Evaluators log
the dishes they tasted, rate each on a 1–5 scale, score staff service, and submit.
Submissions are stored in Firebase Firestore and can be exported as CSV for review.

## Features

- **Evaluation** — multi-item survey: evaluator details, per-dish ratings (taste,
  ingredients, freshness, temperature, presentation), staff-service ratings, and
  free-text comments. Add/remove as many tasted items as needed.
- **Dashboard** — placeholder for aggregated insights (in development).
- **Reports** — pick a date range and download all evaluations as a CSV, one row
  per tasted dish.
- Responsive layout with a desktop sidebar and a mobile header.

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Firebase Firestore
- lucide-react icons

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev      # starts Vite on http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run lint     # type-check with tsc --noEmit
```

## Configuration

Firebase config is read from `VITE_*` environment variables (see `.env.example`).
Copy it to `.env.local` and fill in your own Firebase project to point the app at
your own Firestore. If you don't, the app falls back to the shared demo project
defined in `src/firebase.ts`.

Survey documents are written to the `surveys` collection. See `firestore.rules`
for the security model (create-only from the client).

## Project structure

```
index.html            # Vite entry HTML
src/
  main.tsx            # React root
  App.tsx             # App shell
  SurveyApp.tsx       # The full survey / dashboard / reports UI
  firebase.ts         # Firestore init + submit/query helpers
  types.ts            # Survey data types
  index.css           # Tailwind entry
firestore.rules       # Firestore security rules
```
