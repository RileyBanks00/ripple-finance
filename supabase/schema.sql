-- ============================================================
-- RIPPLE FINANCE — Full Database Schema
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ─── 1. PROFILES ────────────────────────────────────────────
-- Extends auth.users. Auto-created on signup via trigger.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  role        text not null default 'investor',   -- 'investor' | 'admin'
  kyc_status  text not null default 'pending',    -- 'pending' | 'approved' | 'rejected'
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── 2. INVESTMENT PRODUCTS ──────────────────────────────────
-- The catalog of products (Fixed, HYSA, Crypto Growth, Altcoin).
-- Managed by admin. Read-only for investors.

create table if not exists public.investment_products (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null,          -- 'fixed' | 'hysa' | 'crypto'
  apy           numeric(5,2) not null,  -- e.g. 12.50
  min_deposit   numeric not null,       -- USD
  duration_days int,                    -- null = flexible
  risk_level    text not null,          -- 'low' | 'medium' | 'high'
  features      text[],                 -- ['Capital protected', 'Fixed returns', ...]
  icon          text,                   -- emoji icon
  color         text,                   -- hex accent color
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Seed the 6 products
insert into public.investment_products
  (name, type, apy, min_deposit, duration_days, risk_level, features, icon, color)
values
  ('Fixed Savings — 30 Day',  'fixed',  8.50,  100,  30,   'low',    array['Capital protected','Fixed returns','Auto-renew option'],      '🔒', '#10d9a8'),
  ('Fixed Savings — 90 Day',  'fixed',  12.50, 500,  90,   'low',    array['Capital protected','Higher yield','Early exit available'],    '🔒', '#10d9a8'),
  ('Fixed Savings — 180 Day', 'fixed',  16.00, 1000, 180,  'low',    array['Max fixed yield','Priority support','Compound interest'],    '🔒', '#10d9a8'),
  ('High-Yield Savings',      'hysa',   8.20,  100,  null, 'low',    array['Withdraw anytime','Daily compounding','No lock-up period'],  '💰', '#f59e0b'),
  ('Crypto Growth Portfolio', 'crypto', 24.80, 200,  null, 'medium', array['Auto-rebalancing','DeFi yields','Real-time tracking'],       '📈', '#8b5cf6'),
  ('Altcoin Growth',          'crypto', 38.50, 500,  null, 'high',   array['High growth potential','Active management','Weekly rebalancing'], '🚀', '#6366f1');


-- ─── 3. WALLETS ──────────────────────────────────────────────
-- One row per asset per user. Tracks their crypto balance.

create table if not exists public.wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  asset      text not null,           -- 'BTC' | 'ETH' | 'USDT' | 'SOL' | 'BNB'
  balance    numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, asset)
);


-- ─── 4. INVESTMENTS ──────────────────────────────────────────
-- Each active or completed investment a user holds.

create table if not exists public.investments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  product_id     uuid not null references public.investment_products(id),
  amount_usd     numeric not null,
  amount_crypto  numeric not null,
  asset          text not null,
  start_date     timestamptz not null default now(),
  end_date       timestamptz,                        -- null = flexible/open-ended
  status         text not null default 'active',    -- 'active' | 'completed' | 'withdrawn'
  current_value  numeric,                            -- updated periodically
  yield_earned   numeric not null default 0,
  created_at     timestamptz not null default now()
);


-- ─── 5. TRANSACTIONS ─────────────────────────────────────────
-- Immutable ledger of every money movement. Never delete rows.

create table if not exists public.transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           text not null,   -- 'deposit' | 'withdraw' | 'invest' | 'yield'
  asset          text not null,
  amount_crypto  numeric not null,
  amount_usd     numeric not null,
  status         text not null default 'pending', -- 'pending' | 'completed' | 'failed'
  tx_hash        text,            -- on-chain hash for deposits/withdrawals
  reference      text,            -- internal ref for invest/yield rows
  created_at     timestamptz not null default now()
);


-- ─── 6. PORTFOLIO SNAPSHOTS ──────────────────────────────────
-- Daily total portfolio value — powers the 12-month chart.

create table if not exists public.portfolio_snapshots (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date       date not null,
  total_usd  numeric not null,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);


-- ─── 7. DEPOSIT ADDRESSES ────────────────────────────────────
-- Stores the deposit address for each user + asset combo.

create table if not exists public.deposit_addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  asset      text not null,
  address    text not null,
  network    text not null,   -- e.g. 'Bitcoin', 'ERC-20', 'TRC-20'
  created_at timestamptz not null default now(),
  unique(user_id, asset)
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.investment_products enable row level security;
alter table public.wallets             enable row level security;
alter table public.investments         enable row level security;
alter table public.transactions        enable row level security;
alter table public.portfolio_snapshots enable row level security;
alter table public.deposit_addresses   enable row level security;

-- profiles: users see and edit only their own row
create policy "profiles: select own"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own"
  on public.profiles for update using (auth.uid() = id);

-- investment_products: everyone can read (public catalog)
create policy "products: public read"
  on public.investment_products for select using (true);

-- wallets
create policy "wallets: select own"
  on public.wallets for select using (auth.uid() = user_id);
create policy "wallets: insert own"
  on public.wallets for insert with check (auth.uid() = user_id);
create policy "wallets: update own"
  on public.wallets for update using (auth.uid() = user_id);

-- investments
create policy "investments: select own"
  on public.investments for select using (auth.uid() = user_id);
create policy "investments: insert own"
  on public.investments for insert with check (auth.uid() = user_id);

-- transactions
create policy "transactions: select own"
  on public.transactions for select using (auth.uid() = user_id);
create policy "transactions: insert own"
  on public.transactions for insert with check (auth.uid() = user_id);

-- portfolio_snapshots
create policy "snapshots: select own"
  on public.portfolio_snapshots for select using (auth.uid() = user_id);
create policy "snapshots: insert own"
  on public.portfolio_snapshots for insert with check (auth.uid() = user_id);

-- deposit_addresses
create policy "addresses: select own"
  on public.deposit_addresses for select using (auth.uid() = user_id);
create policy "addresses: insert own"
  on public.deposit_addresses for insert with check (auth.uid() = user_id);


-- ============================================================
-- DONE
-- ============================================================
