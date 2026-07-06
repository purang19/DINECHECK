create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  employee_id text not null,
  restaurant text not null,
  time_of_service text not null,
  type_of_service text not null,
  tasted_items jsonb not null default '[]'::jsonb,
  promptness_of_service smallint,
  attentiveness_and_care smallint,
  cleanliness smallint,
  value smallint,
  comments text,
  created_at timestamptz not null default now()
);

create index surveys_date_idx on public.surveys (date);

alter table public.surveys enable row level security;

-- Internal quality-check tool without end-user auth: evaluators submit and
-- managers read reports using the public anon key. Add authentication before
-- exposing this outside a trusted network.
create policy "Anyone can submit a survey"
  on public.surveys for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read surveys"
  on public.surveys for select
  to anon, authenticated
  using (true);
