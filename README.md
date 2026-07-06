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
- Supabase (Postgres)
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

Supabase config is read from `VITE_*` environment variables (see `.env.example`).
Copy it to `.env.local` and fill in your own project URL and publishable/anon key
to point the app at your own database. If you don't, the app falls back to the
shared DINECHECK project defined in `src/supabase.ts`.

Submissions are stored in the `public.surveys` table. The schema and row-level
security policies live in `supabase/migrations/0001_create_surveys.sql`. RLS
currently allows anonymous insert and select (an internal tool with no end-user
auth) — add authentication before exposing it outside a trusted network.

## Project structure

```
index.html            # Vite entry HTML
src/
  main.tsx            # React root
  App.tsx             # App shell
  SurveyApp.tsx       # The full survey / dashboard / reports UI
  supabase.ts         # Supabase client + submit/query helpers
  types.ts            # Survey data types
  index.css           # Tailwind entry
supabase/
  migrations/         # SQL schema + RLS policies
```
