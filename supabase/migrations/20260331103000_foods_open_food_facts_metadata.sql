alter table public.foods
  add column if not exists brand text,
  add column if not exists image_url text,
  add column if not exists ingredients_text text,
  add column if not exists quantity text,
  add column if not exists serving_size text;

create index if not exists foods_user_id_barcode_lookup_idx
  on public.foods (user_id, barcode)
  where barcode is not null;
