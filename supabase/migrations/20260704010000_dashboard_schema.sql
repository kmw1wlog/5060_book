create extension if not exists pgcrypto;

create table if not exists public.institutions (
  id text primary key,
  name text not null,
  category text,
  sub_category text,
  target_group text not null,
  sido text,
  sigungu text,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  source_dataset text,
  source_url text,
  source_license_type text,
  source_collected_at timestamptz,
  data_confidence text,
  coordinate_source text,
  review_status text,
  notes text,
  program_fit text,
  age_fit_score integer,
  classics_fit_score integer,
  purchase_potential_score integer,
  priority_score integer,
  lead_stage text,
  owner text,
  last_contacted_at timestamptz,
  next_followup_at timestamptz,
  followup_reason text,
  interest_level text,
  decision_maker_known boolean default false,
  last_action text,
  expected_order_type text,
  expected_quantity integer,
  expected_revenue integer,
  budget_cycle text,
  proposal_status text,
  sample_sent_at timestamptz,
  quote_sent_at timestamptz,
  order_status text,
  order_amount integer,
  books_interested jsonb default '[]'::jsonb,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id text primary key,
  institution_id text references public.institutions(id) on delete cascade,
  institution_name text,
  email text,
  email_type text,
  source_url text,
  is_role_account boolean default false,
  is_personal_email_suspected boolean default false,
  validation_status text,
  review_status text,
  opt_out boolean default false,
  bounced boolean default false,
  suppression_reason text,
  phone text,
  website text,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  institution_id text references public.institutions(id) on delete set null,
  contact_id text references public.contacts(id) on delete set null,
  event_type text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.email_suppressions (
  email text primary key,
  reason text not null,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists institutions_target_group_idx on public.institutions(target_group);
create index if not exists institutions_region_idx on public.institutions(sido, sigungu);
create index if not exists institutions_priority_idx on public.institutions(priority_score desc);
create index if not exists institutions_coordinate_source_idx on public.institutions(coordinate_source);
create index if not exists contacts_institution_id_idx on public.contacts(institution_id);
create index if not exists contacts_review_status_idx on public.contacts(review_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists institutions_set_updated_at on public.institutions;
create trigger institutions_set_updated_at
before update on public.institutions
for each row execute function public.set_updated_at();

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

alter table public.institutions enable row level security;
alter table public.contacts enable row level security;
alter table public.campaign_events enable row level security;
alter table public.email_suppressions enable row level security;

drop policy if exists "public read institutions" on public.institutions;
create policy "public read institutions"
on public.institutions for select
to anon, authenticated
using (true);

drop policy if exists "public read contacts" on public.contacts;
create policy "public read contacts"
on public.contacts for select
to anon, authenticated
using (true);

drop policy if exists "public read campaign events" on public.campaign_events;
create policy "public read campaign events"
on public.campaign_events for select
to authenticated
using (true);

drop policy if exists "public read suppressions" on public.email_suppressions;
create policy "public read suppressions"
on public.email_suppressions for select
to authenticated
using (true);

create or replace view public.dashboard_summary as
select
  (select count(*) from public.institutions) as total_institutions,
  (select count(*) from public.contacts) as total_contacts,
  (select count(*) from public.institutions where target_group = 'senior') as senior_institutions,
  (select count(*) from public.institutions where target_group = 'church') as church_institutions,
  (select count(*) from public.institutions where target_group = 'library') as library_institutions,
  (select count(*) from public.institutions where coordinate_source in ('kakao-rest', 'kakao-cache', 'vworld-point')) as real_coordinate_institutions,
  (select count(*) from public.contacts where review_status = '승인') as approved_contacts;
