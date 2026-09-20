-- ============================================================
-- RIPPLE FINANCE — Admin Operations (run in Supabase SQL Editor)
-- 1. Per-user wallet balance adjustments (credit / debit / set)
-- 2. Assign a deposit address to a user directly
-- 3. User "Request address" flow -> pending -> admin assigns
--
-- HOW TO ADMIN:
--   Everything is done from Supabase Dashboard → SQL Editor using
--   the RPCs below. No in-app admin UI is required.
--
--   Examples (replace the email / values):
--     -- find a user id
--     select id, email from public.profiles where email = 'user@mail.com';
--
--     -- credit 0.5 BTC
--     select public.admin_credit_wallet('<USER_UUID>', 'BTC', 0.5, 'welcome bonus');
--
--     -- set USDT balance to exactly 1000
--     select public.admin_set_wallet_balance('<USER_UUID>', 'USDT', 1000);
--
--     -- assign a deposit address (creates the row)
--     select public.admin_assign_address('<USER_UUID>', 'USDT',
--            'TJ9x...yourAddress...', 'Ethereum (ERC-20)');
--
--     -- see pending address requests
--     select * from public.pending_address_requests;
-- ============================================================

-- ─── 0. ADMIN HELPER ────────────────────────────────────────
-- A user is an admin when profiles.role = 'admin'.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── 1. WALLET BALANCE OPS ──────────────────────────────────
-- Credit: adds to balance (and upserts the wallet row if missing).
create or replace function public.admin_credit_wallet(
  p_user_id uuid,
  p_asset   text,
  p_amount  numeric,
  p_note    text default null
)
returns numeric
language plpgsql security definer
set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  -- Tell wallet triggers to skip this ledger insert (prevents double-credit)
  perform set_config('app.from_admin_rpc', 'on', true);

  insert into public.wallets (user_id, asset, balance)
  values (p_user_id, upper(p_asset), p_amount)
  on conflict (user_id, asset)
  do update set balance = public.wallets.balance + excluded.balance,
                updated_at = now()
  returning balance into v_new_balance;

  -- Ledger entry so the movement shows in Transactions
  insert into public.transactions
    (user_id, type, asset, amount_crypto, amount_usd, status, reference)
  values
    (p_user_id, 'deposit', upper(p_asset), p_amount, 0, 'completed', p_note);

  return v_new_balance;
end;
$$;

-- Debit: subtracts, clamped at 0 (never negative).
create or replace function public.admin_debit_wallet(
  p_user_id uuid,
  p_asset   text,
  p_amount  numeric,
  p_note    text default null
)
returns numeric
language plpgsql security definer
set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  perform set_config('app.from_admin_rpc', 'on', true);

  insert into public.wallets (user_id, asset, balance)
  values (p_user_id, upper(p_asset), -p_amount)
  on conflict (user_id, asset)
  do update set balance = greatest(public.wallets.balance - p_amount, 0),
                updated_at = now()
  returning balance into v_new_balance;

  -- Ledger entry for the movement
  insert into public.transactions
    (user_id, type, asset, amount_crypto, amount_usd, status, reference)
  values
    (p_user_id, 'withdraw', upper(p_asset), p_amount, 0, 'completed', p_note);

  return v_new_balance;
end;
$$;

-- Set: force the balance to an exact value (creates the row if missing).
create or replace function public.admin_set_wallet_balance(
  p_user_id uuid,
  p_asset   text,
  p_balance numeric
)
returns numeric
language plpgsql security definer
set search_path = public
as $$
declare
  v_new_balance numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  if p_balance is null or p_balance < 0 then
    raise exception 'Balance must be zero or positive';
  end if;

  perform set_config('app.from_admin_rpc', 'on', true);

  insert into public.wallets (user_id, asset, balance)
  values (p_user_id, upper(p_asset), p_balance)
  on conflict (user_id, asset)
  do update set balance = excluded.balance, updated_at = now()
  returning balance into v_new_balance;

  return v_new_balance;
end;
$$;

-- Read a user's wallets as admin (RLS would normally block this)
create or replace function public.admin_get_wallets(p_user_id uuid)
returns table (asset text, balance numeric, updated_at timestamptz)
language sql security definer
set search_path = public
as $$
  select asset, balance, updated_at
  from public.wallets
  where user_id = p_user_id
  order by asset;
$$;

-- ─── 2. ADDRESS REQUESTS (user-initiated, admin-fulfilled) ──
create table if not exists public.address_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  asset       text not null,
  status      text not null default 'pending',  -- 'pending' | 'assigned' | 'rejected'
  assigned_address_id uuid references public.deposit_addresses(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, asset, status)  -- one pending request per user+asset
);

alter table public.address_requests enable row level security;

create policy "requests: select own"
  on public.address_requests for select using (auth.uid() = user_id);
create policy "requests: insert own"
  on public.address_requests for insert with check (auth.uid() = user_id);
-- users never update/delete their requests; admins do it via RPC/SQL.

-- User clicks "Request <ASSET> address" -> inserts a pending row.
-- If one already exists, it just returns it (idempotent, no error).
create or replace function public.request_deposit_address(p_asset text)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.address_requests (user_id, asset)
  values (auth.uid(), upper(p_asset))
  on conflict (user_id, asset, status) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.address_requests
    where user_id = auth.uid() and asset = upper(p_asset) and status = 'pending'
    limit 1;
  end if;

  return v_id;
end;
$$;

-- Admin convenience view: pending requests joined with user email
create or replace view public.pending_address_requests as
select r.id, r.user_id, p.email, p.full_name, r.asset, r.created_at
from public.address_requests r
join public.profiles p on p.id = r.user_id
where r.status = 'pending'
order by r.created_at asc;

-- Admin fulfills a pending request by assigning an address.
-- Marks the request 'assigned' and writes the deposit_addresses row.
create or replace function public.admin_assign_address(
  p_user_id   uuid,
  p_asset     text,
  p_address   text,
  p_network   text
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_addr_id uuid;
  v_req_id  uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  if p_address is null or length(trim(p_address)) < 10 then
    raise exception 'Address looks invalid';
  end if;

  -- Create or update the user's deposit address
  insert into public.deposit_addresses (user_id, asset, address, network)
  values (p_user_id, upper(p_asset), trim(p_address), p_network)
  on conflict (user_id, asset)
  do update set address = excluded.address, network = excluded.network
  returning id into v_addr_id;

  -- Mark the newest pending request (if any) as assigned
  update public.address_requests
     set status = 'assigned',
         assigned_address_id = v_addr_id,
         updated_at = now()
   where id = (
     select id from public.address_requests
     where user_id = p_user_id
       and asset = upper(p_asset)
       and status = 'pending'
     order by created_at asc
     limit 1
   )
   returning id into v_req_id;

  return v_addr_id;
end;
$$;

-- (optional) reject a pending request
create or replace function public.admin_reject_request(p_request_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  update public.address_requests
     set status = 'rejected', updated_at = now()
   where id = p_request_id;
end;
$$;

-- ============================================================
-- DONE — cheat sheet:
--   select * from public.pending_address_requests;
--   select public.admin_assign_address('<user>','USDT','<addr>','Ethereum (ERC-20)');
--   select public.admin_set_wallet_balance('<user>','USDT',1000);
--   select public.admin_credit_wallet('<user>','BTC',0.5,'bonus');
--   select public.admin_debit_wallet('<user>','ETH',1.2,'correction');
-- ============================================================
