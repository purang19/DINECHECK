-- Fire a Telegram notification on every new survey via the notify-telegram
-- Edge Function. Uses pg_net for an async, fire-and-forget HTTP POST so a slow
-- or failing Telegram call never blocks or fails the user's submission.
--
-- The x-webhook-secret shared secret is stored in Supabase Vault (out of git):
--   select vault.create_secret('<random>', 'app_webhook_secret');
-- and the same value is set as the WEBHOOK_SECRET secret on the Edge Function.

create extension if not exists pg_net;

create or replace function public.notify_telegram_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  secret text;
begin
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'app_webhook_secret';

  perform net.http_post(
    url := 'https://kjcqkgaevjkrdrwzplov.supabase.co/functions/v1/notify-telegram',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(secret, '')
    ),
    body := jsonb_build_object('record', to_jsonb(new)),
    timeout_milliseconds := 15000
  );
  return new;
end;
$$;

drop trigger if exists notify_telegram on public.surveys;
create trigger notify_telegram
  after insert on public.surveys
  for each row
  execute function public.notify_telegram_on_insert();
