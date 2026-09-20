# Admin Portal + Withdrawal Flow — Design

Date: 2026-09-19

## Goal

An admin portal inside the Ripple Finance app where an admin can:
- Browse users in a paginated, searchable table
- Update user wallet balances (credit / debit / set)
- Assign or edit users' crypto deposit addresses, and fulfill/reject pending address requests
- View a user's recent transactions and mark pending withdrawals completed/failed
- Suspend / re-activate users
- Set a per-user gas fee (default $3.80)

Plus a user-facing Withdrawal page that shows a gas-fee notice in a confirm modal and creates a pending withdrawal via RPC.

## Decisions

- **Admin auth:** Supabase role (`profiles.role = 'admin'`). The admin logs in with normal Supabase auth (admin@ripplefinance.com). A SQL snippet sets the role. No hardcoded credentials in the frontend bundle.
- **Placement:** Inside the app at `/admin`, guarded by a new `AdminRoute`. Sidebar shows an "Admin" link only to admins.
- **Structure:** Users table + slide-over detail drawer with tabs (Balances, Address, Transactions, Settings).

## Database — `supabase/admin_portal.sql`

Run in Supabase SQL Editor. Adds:

1. **Columns on `profiles`**
   - `status text not null default 'active'` (`'active' | 'suspended'`)
   - `gas_fee numeric not null default 3.80`

2. **Admin RLS policies** — admins can SELECT any profile, wallet, transaction, deposit address, and address request. Non-admin policies remain unchanged.

3. **New RPCs**
   - `admin_set_user_status(p_user_id uuid, p_status text)` — validate status in ('active','suspended'), admin-only
   - `admin_set_gas_fee(p_user_id uuid, p_fee numeric)` — must be >= 0, no upper cap, admin-only
   - `admin_mark_txn_status(p_txn_id uuid, p_status text)` — validate ('completed','failed','pending'), admin-only (for manually processed deposits)
   - `user_request_withdrawal(...)` — **instant send**: if balance >= amount + gas fee, debit and log a `completed` withdraw transaction; otherwise raise an error and change nothing. Gas fee is read server-side from `profiles.gas_fee` (never spoofable).

## Frontend

### Routing & guards (`App.jsx`)
- `AdminRoute` component: while loading show null; non-admin → `<Navigate to="/dashboard" />`; admin renders children.
- `/admin` route inside `AppLayout` wrapped in `ProtectedRoute` + `AdminRoute`.
- `/withdraw` route inside `AppLayout` wrapped in `ProtectedRoute`.

### Sidebar (`Sidebar.jsx`)
- Append `{ to: '/withdraw', label: 'Withdraw' }` to navItems for everyone.
- Append `{ to: '/admin', label: 'Admin' }` when `profile?.role === 'admin'`.

### Hooks (`useSupabase.js`)
- `useAdminUsers(page, pageSize, search)` — paginated profiles with wallets; returns `{ users, count, loading }` using `count: 'exact'`
- `useAdminUserDetail(userId)` — wallets, transactions, deposit addresses, address requests for one user
- `useGasFee()` — returns the current user's `gas_fee` from profile
- Admin mutations call RPCs directly via `supabase.rpc(...)`

### Admin page (`pages/Admin.jsx` + `Admin.css`)
- Header, search input (debounced), paginated table (10/page): user (avatar+name), email, joined date, status badge, total balance
- Row click opens **slide-over drawer**:
  - **Balances tab** — per-asset rows (asset icon, balance, Credit / Debit / Set buttons opening a small inline amount input; calls `admin_credit_wallet` / `admin_debit_wallet` / `admin_set_wallet_balance`)
  - **Address tab** — per-asset assign form (address + network); pending requests list with Assign (fills the form) / Reject buttons (`admin_assign_address` / `admin_reject_request`)
  - **Transactions tab** — recent transactions; pending withdraw rows show Mark Completed / Mark Failed buttons (`admin_mark_txn_status`)
  - **Settings tab** — Suspend/Activate toggle (`admin_set_user_status`) and gas fee input with Save (`admin_set_gas_fee`)
- Drawer refetches after each successful mutation.

### Withdrawal page (`pages/Withdraw.jsx` + `Withdraw.css`)
- Form: asset select (BTC/ETH/USDT), amount, destination address
- **Confirm modal**: summary rows (amount, **gas fee notice** from profile `gas_fee` defaulting 3.80, total deducted, recipient) → Confirm calls `user_request_withdrawal`
- **Instant send model** (per user request): sufficient balance + gas fee → transaction completes immediately; otherwise the send fails with a clear error and nothing is deducted.
- Success banner shows the new balance; the completed withdrawal appears in Transactions.

### Suspension behavior (`ProtectedRoute`)
- If `profile.status === 'suspended'`, render a full-screen "Account suspended" notice instead of app pages (both admin and normal users; admins are not blocked by their own suspension of themselves — admin check bypasses).

## Error handling

- All mutations surface errors as inline messages in the drawer/modal.
- RPC failures (insufficient balance, not admin) show the returned message.

## Testing / verification

- `npm run build` must pass.
- Manual checklist: run SQL, set role for admin account, login as admin, paginate/search, credit wallet, assign address from pending request, withdraw as a normal user (verify fee deducted and pending txn), suspend user and verify block screen, reactivate.
