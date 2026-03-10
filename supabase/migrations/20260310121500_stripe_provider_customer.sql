alter table public.subscriptions
add column if not exists provider_customer_id text;

create index if not exists subscriptions_provider_customer_id_idx
on public.subscriptions (provider_customer_id)
where provider_customer_id is not null;

create index if not exists subscriptions_provider_subscription_id_idx
on public.subscriptions (provider_subscription_id)
where provider_subscription_id is not null;

create index if not exists subscription_events_provider_event_id_idx
on public.subscription_events (provider_event_id)
where provider_event_id is not null;
