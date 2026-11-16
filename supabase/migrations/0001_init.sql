-- Wishlist app schema. Run once in the Supabase SQL editor (or `supabase db push`).
-- All access goes through the server with the service-role key; RLS is enabled
-- with no policies so the public anon key can read nothing.

create extension if not exists pgcrypto;

create type category_status as enum ('available', 'on_it', 'bought');
create type category_priority as enum ('must', 'love', 'nice');

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  theme jsonb not null,
  is_archived boolean not null default false,
  sort_order int not null default 0,
  password_lookup text not null unique,
  password_encrypted text not null,
  password_version int not null default 1,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  name text not null,
  emoji text not null default '',
  status category_status not null default 'available',
  status_by text,
  status_at timestamptz,
  priority category_priority not null default 'love',
  price_min numeric(10, 2),
  price_max numeric(10, 2),
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index categories_wishlist_idx on categories (wishlist_id);

create table links (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  url text not null,
  title text not null default '',
  image_url text,
  favicon_url text,
  site_name text,
  price numeric(10, 2),
  currency text,
  note text not null default '',
  is_favourite boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index links_category_idx on links (category_id);
-- At most one favourite link per category.
create unique index links_one_favourite on links (category_id) where is_favourite;

create table comments (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  author_name text not null,
  author_role text not null check (author_role in ('admin', 'guest')),
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_category_idx on comments (category_id, created_at);

create table activity (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  actor_name text not null,
  actor_role text not null check (actor_role in ('admin', 'guest')),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_wishlist_idx on activity (wishlist_id, created_at desc);

-- Single-row "about me" card shown on every wishlist.
create table profile (
  id int primary key default 1 check (id = 1),
  owner_name text not null default '',
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
insert into profile (id) values (1);

-- Failed unlock attempts, for rate limiting.
create table unlock_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index unlock_attempts_ip_idx on unlock_attempts (ip_hash, created_at);

alter table wishlists enable row level security;
alter table categories enable row level security;
alter table links enable row level security;
alter table comments enable row level security;
alter table activity enable row level security;
alter table profile enable row level security;
alter table unlock_attempts enable row level security;
