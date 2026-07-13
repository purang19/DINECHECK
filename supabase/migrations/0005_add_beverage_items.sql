-- Optional Beverage Quality section: drinks tasted, each with 1-5 ratings and a
-- photo, stored like tasted_items. Existing rows default to an empty list.
alter table public.surveys
  add column if not exists beverage_items jsonb not null default '[]'::jsonb;
