begin;

drop policy if exists foods_owner_select on public.foods;
drop policy if exists foods_owner_shared_select on public.foods;

create policy foods_access_select
on public.foods
for select
using (((select auth.uid()) = user_id) or user_id is null);

commit;
