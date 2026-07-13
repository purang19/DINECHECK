-- Add the hotel dimension (multi-property). Existing outlets all belong to
-- The Sands Khao Lak, so backfill existing rows accordingly.
alter table public.surveys add column if not exists hotel text;

update public.surveys set hotel = 'The Sands Khao Lak' where hotel is null;
