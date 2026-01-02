-- Fix: chat_threads.created_by default must work for service role inserts.
-- When inserting via service role (seed), auth.uid() is null. Coalesce to 'system'.

begin;

alter table public.chat_threads
  alter column created_by set default coalesce(auth.uid()::text, 'system');

commit;

notify pgrst, 'reload schema';

