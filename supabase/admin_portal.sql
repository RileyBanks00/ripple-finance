-- ============================================================
-- RIPPLE FINANCE — Admin Portal & Withdrawals
-- Run this in Supabase SQL Editor (after admin_ops.sql)
--
-- 1. profiles.status ('active' | 'suspended') + profiles.gas_fee (USD)
-- 2. RLS: admins can read all profiles / wallets / transactions /
--    deposit_addresses / address_requests
-- 3. RPCs: set user status, set gas fee, mark txn status,
--    instant user withdrawal (balance + gas fee or it fails)
--
-- MAKE YOURSELF ADMIN (once):
--   update public.profiles set role = 'admin'
--    where email = 'admin@ripplefinance.com';
-- ============================================================

-- ─── 1. NEW COLUMNS ─────────────────────────────────────────
alter table public.profiles
  add column if not exists status text not null default 'active';
alter table public.profiles
  add column if not exists gas_fee numeric not null default 3.80;

-- ─── 2. ADMIN READ POLICIES ─────────────────────────────────
-- is_admin() is SECURITY DEFINER (defined in admin_ops.sql), so
-- calling it inside policies does not recurse.

drop policy if exists "admins can view all profiles" on public.profiles;
create policy "admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "admins can view all wallets" on public.wallets;
create policy "admins can view all wallets"
  on public.wallets for select
  using (public.is_admin());

drop policy if exists "admins can view all transactions" on public.transactions;
create policy "admins can view all transactions"
  on public.transactions for select
  using (public.is_admin());

drop policy if exists "admins can view all deposit addresses" on public.deposit_addresses;
create policy "admins can view all deposit addresses"
  on public.deposit_addresses for select
  using (public.is_admin());

drop policy if exists "admins can view all address requests" on public.address_requests;
create policy "admins can view all address requests"
  on public.address_requests for select
  using (public.is_admin());

-- ─── 3. ADMIN RPCs ──────────────────────────────────────────

-- Suspend / re-activate a user
create or replace function public.admin_set_user_status(
  p_user_id uuid,
  p_status  text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'Status must be active or suspended';
  end if;

  update public.profiles
     set status = p_status
   where id = p_user_id;
end;
$$;

-- Per-user withdrawal gas fee (USD), clamped 0..100
create or replace function public.admin_set_gas_fee(
  p_user_id uuid,
  p_fee     numeric
)
returns numeric
language plpgsql security definer
set search_path = public
as $$
declare
  v_fee numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  if p_fee is null or p_fee < 0 or p_fee > 100 then
    raise exception 'Gas fee must be between 0 and 100';
  end if;

  v_fee := round(p_fee, 2);
  update public.profiles
     set gas_fee = v_fee
   where id = p_user_id;

  return v_fee;
end;
$$;

-- Mark a pending transaction completed / failed (e.g. deposits admin
-- processes manually; withdrawals are already instant).
create or replace function public.admin_mark_txn_status(
  p_txn_id uuid,
  p_status text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized: admin only';
  end if;
  if p_status not in ('completed', 'failed', 'pending') then
    raise exception 'Status must be completed, failed or pending';
  end if;

  update public.transactions
     set status = p_status
   where id = p_txn_id;
end;
$$;

-- ─── 4. USER WITHDRAWAL (INSTANT SEND, GAS PAID IN ETH) ─────
-- Sending to another wallet works immediately:
--   ETH balance >= gas fee AND asset balance >= amount
--     -> asset wallet debited by amount, ETH wallet debited by fee,
--        'completed' withdraw txn for the asset + separate 'gas' txn
--   otherwise -> error raised, nothing changes
-- The gas fee is set by the admin in USD (profiles.gas_fee) and charged
-- in ETH at the current ETH/USD price.
--
-- p_price_usd    : current price of p_asset in USD (client-provided)
-- p_eth_price_usd: current price of ETH in USD (client-provided)
-- p_amount_usd   : USD value of the withdrawal (for ledger display)
create or replace function public.user_request_withdrawal(
  p_asset         text,
  p_amount        numeric,
  p_address       text,
  p_network       text,
  p_price_usd     numeric,
  p_eth_price_usd numeric,
  p_amount_usd    numeric default null
)
returns numeric
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_balance    numeric;
  v_eth_bal    numeric;
  v_gas_usd    numeric;
  v_fee_eth    numeric;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Suspended users cannot withdraw
  if exists (select 1 from public.profiles where id = v_uid and status = 'suspended') then
    raise exception 'Account suspended: withdrawals are disabled';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_address is null or length(trim(p_address)) < 10 then
    raise exception 'Destination address looks invalid';
  end if;
  if p_price_usd is null or p_price_usd <= 0 then
    raise exception 'Could not determine asset price. Try again.';
  end if;
  if p_eth_price_usd is null or p_eth_price_usd <= 0 then
    raise exception 'Could not determine ETH price. Try again.';
  end if;

  -- The RPC updates wallets itself; stop the transaction trigger from
  -- applying the ledger rows a second time.
  perform set_config('app.from_admin_rpc', 'on', true);

  -- Gas fee always comes from the user's profile (server-side, not spoofable)
  select gas_fee into v_gas_usd from public.profiles where id = v_uid;
  v_gas_usd := coalesce(v_gas_usd, 3.80);
  v_fee_eth := v_gas_usd / p_eth_price_usd;

  -- Lock both wallet rows (asset being sent + ETH for gas)
  select balance into v_balance
    from public.wallets
   where user_id = v_uid and asset = upper(p_asset)
   for update;

  select balance into v_eth_bal
    from public.wallets
   where user_id = v_uid and asset = 'ETH'
   for update;

  if upper(p_asset) = 'ETH' then
    -- Sending ETH: amount + fee both come out of the same wallet
    if v_balance is null then
      raise exception 'You have no ETH balance to withdraw';
    end if;
    if v_balance < p_amount + v_fee_eth then
      raise exception 'Insufficient ETH: need % (amount + gas), have %',
        round(p_amount + v_fee_eth, 8), round(v_balance, 8);
    end if;
    update public.wallets
       set balance = balance - (p_amount + v_fee_eth), updated_at = now()
     where user_id = v_uid and asset = 'ETH'
     returning balance into v_balance;
  else
    -- Sending BTC/USDT/...: need the amount, plus a separate ETH balance for gas
    if v_balance is null or v_balance < p_amount then
      raise exception 'Insufficient % balance', upper(p_asset);
    end if;
    if v_eth_bal is null or v_eth_bal < v_fee_eth then
      raise exception 'Not enough ETH for gas: need % ETH ($% fee), have %',
        round(v_fee_eth, 8), round(v_gas_usd, 2), coalesce(round(v_eth_bal, 8), 0);
    end if;

    update public.wallets
       set balance = balance - p_amount, updated_at = now()
     where user_id = v_uid and asset = upper(p_asset)
     returning balance into v_balance;

    update public.wallets
       set balance = balance - v_fee_eth, updated_at = now()
     where user_id = v_uid and asset = 'ETH';
  end if;

  -- Completed ledger entries; destination kept in reference
  insert into public.transactions
    (user_id, type, asset, amount_crypto, amount_usd, status, reference)
  values
    (v_uid, 'withdraw', upper(p_asset), p_amount,
     coalesce(p_amount_usd, p_amount * p_price_usd), 'completed',
     trim(p_address) || ' • network: ' || p_network);

  insert into public.transactions
    (user_id, type, asset, amount_crypto, amount_usd, status, reference)
  values
    (v_uid, 'fee', 'ETH', v_fee_eth, v_gas_usd, 'completed',
     'Network gas fee for ' || upper(p_asset) || ' withdrawal');

  return v_balance;
end;
$$;

-- ============================================================
-- DONE
-- ============================================================
