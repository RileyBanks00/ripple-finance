-- ============================================================
-- RIPPLE FINANCE — Wallet Balance Automation Triggers
-- Run this script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Function to handle wallet balance updates when a transaction completes
create or replace function public.update_wallet_balance()
returns trigger as $$
declare
  amount_change numeric;
begin
  -- Only affect balance if the transaction is completed
  if new.status = 'completed' then
    
    -- Deposits and Yield add to the wallet
    if new.type = 'deposit' or new.type = 'yield' then
      amount_change := new.amount_crypto;
      
    -- Withdrawals and Investments subtract from the wallet
    elsif new.type = 'withdraw' or new.type = 'invest' then
      amount_change := -new.amount_crypto;
      
    else
      amount_change := 0;
    end if;

    -- Upsert the wallet row
    insert into public.wallets (user_id, asset, balance)
    values (new.user_id, new.asset, amount_change)
    on conflict (user_id, asset)
    do update set balance = public.wallets.balance + excluded.balance, updated_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for brand new transactions inserted directly as 'completed'
drop trigger if exists on_transaction_inserted on public.transactions;
create trigger on_transaction_inserted
  after insert on public.transactions
  for each row execute procedure public.update_wallet_balance();

-- Function to handle status updates (e.g. 'pending' -> 'completed')
create or replace function public.handle_transaction_update()
returns trigger as $$
declare
  amount_change numeric;
begin
  -- If status just changed to 'completed'
  if old.status != 'completed' and new.status = 'completed' then
    
    if new.type = 'deposit' or new.type = 'yield' then
      amount_change := new.amount_crypto;
    elsif new.type = 'withdraw' or new.type = 'invest' then
      amount_change := -new.amount_crypto;
    else
      amount_change := 0;
    end if;

    insert into public.wallets (user_id, asset, balance)
    values (new.user_id, new.asset, amount_change)
    on conflict (user_id, asset)
    do update set balance = public.wallets.balance + excluded.balance, updated_at = now();
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for when a transaction is updated
drop trigger if exists on_transaction_updated on public.transactions;
create trigger on_transaction_updated
  after update on public.transactions
  for each row execute procedure public.handle_transaction_update();
