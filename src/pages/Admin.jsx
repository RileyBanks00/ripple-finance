import { useEffect, useState } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  WalletIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import DataIcon from '../components/DataIcon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useAdminUsers, useAdminUserDetail } from '../hooks/useSupabase';
import { coinMeta } from '../utils/icons';
import './Admin.css';

const PAGE_SIZE = 10;

const TABS = [
  { key: 'balances',      label: 'Balances',      icon: WalletIcon },
  { key: 'address',       label: 'Address',       icon: MapPinIcon },
  { key: 'transactions',  label: 'Transactions',  icon: ClipboardDocumentListIcon },
  { key: 'settings',      label: 'Settings',      icon: AdjustmentsHorizontalIcon },
];

const fmtUsd = (n) =>
  Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Admin() {
  const { profile: me } = useAuth();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { users, count, totalPages, loading } = useAdminUsers(page, PAGE_SIZE, search);

  return (
    <div className="admin-page">
      <div className="deposit-header">
        <div>
          <h1 className="page-title">Admin Portal</h1>
          <p className="page-sub">Manage users, balances, addresses and fees</p>
        </div>
        <span className="badge badge-purple">Admin: {me?.full_name || 'You'}</span>
      </div>

      <div className="glass-card admin-table-card">
        <div className="admin-toolbar">
          <div className="admin-search">
            <MagnifyingGlassIcon className="admin-search-icon" />
            <input
              className="admin-search-input"
              placeholder="Search name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <span className="admin-count">{count} user{count === 1 ? '' : 's'}</span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="admin-empty">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="admin-empty">No users match “{search}”</td></tr>
              ) : (
                users.map((u) => {
                  const total = u.wallets.reduce((s, w) => s + w.balance, 0);
                  return (
                    <tr key={u.id} className="admin-row" onClick={() => setSelectedId(u.id)}>
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-avatar">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                          </span>
                          <span className="admin-user-name">
                            {u.full_name || 'Unnamed'}
                            {u.role === 'admin' && <span className="badge badge-gold">admin</span>}
                          </span>
                        </div>
                      </td>
                      <td className="admin-email">{u.email}</td>
                      <td className="admin-dim">{fmtDate(u.created_at)}</td>
                      <td>
                        <span className={`badge ${u.status === 'suspended' ? 'badge-red' : 'badge-green'}`}>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="num admin-balance">{fmtUsd(total)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <button
            className="admin-page-btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeftIcon className="admin-page-icon" /> Prev
          </button>
          <span className="admin-page-info">Page {page} of {totalPages}</span>
          <button
            className="admin-page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRightIcon className="admin-page-icon" />
          </button>
        </div>
      </div>

      {selectedId && (
        <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Slide-over drawer: everything about one user                */
/* ─────────────────────────────────────────────────────────── */

function UserDrawer({ userId, onClose }) {
  const [tab, setTab] = useState('balances');
  const { user, wallets, transactions, addresses, addressRequests, loading, refetch } =
    useAdminUserDetail(userId);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer-header">
          <div className="drawer-id">
            <span className="admin-avatar lg">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
            </span>
            <div>
              <h3 className="drawer-name">{user?.full_name || 'Unnamed'}</h3>
              <p className="drawer-email">{user?.email}</p>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close panel">
            <XMarkIcon className="drawer-close-icon" />
          </button>
        </header>

        <nav className="drawer-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`drawer-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <t.icon className="drawer-tab-icon" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="drawer-body">
          {loading || !user ? (
            <div className="admin-empty">Loading user...</div>
          ) : tab === 'balances' ? (
            <BalancesTab userId={userId} wallets={wallets} onChange={refetch} />
          ) : tab === 'address' ? (
            <AddressTab userId={userId} addresses={addresses} addressRequests={addressRequests} onChange={refetch} />
          ) : tab === 'transactions' ? (
            <TransactionsTab transactions={transactions} onChange={refetch} />          ) : (
            <SettingsTab user={user} onChange={refetch} />
          )}
        </div>
      </aside>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 1: Balances — credit / debit / set per asset            */
/* ─────────────────────────────────────────────────────────── */

function BalancesTab({ userId, wallets, onChange }) {
  const [openAsset, setOpenAsset] = useState(null); // { asset, mode }
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const rpcByMode = {
    credit: 'admin_credit_wallet',
    debit: 'admin_debit_wallet',
    set: 'admin_set_wallet_balance',
  };

  async function apply(userId, mode) {
    if (!amount || Number(amount) <= 0) {
      setMsg({ ok: false, text: 'Enter an amount greater than 0' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const args = { p_user_id: userId, p_asset: openAsset.asset, p_amount: Number(amount) };
    if (mode !== 'set' && note) args.p_note = note;

    const { error } = await supabase.rpc(rpcByMode[mode], args);
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
    } else {
      setMsg({ ok: true, text: `${mode === 'set' ? 'Balance set to' : `${mode}ed`} ${amount} ${openAsset.asset}` });
      setAmount('');
      setNote('');
      setOpenAsset(null);
      onChange();
    }
  }

  if (wallets.length === 0) {
    return <div className="admin-empty">This user has no wallet rows yet.</div>;
  }

  return (
    <div className="drawer-section">
      {msg && <p className={`admin-msg ${msg.ok ? 'ok' : 'bad'}`}>{msg.text}</p>}
      {wallets.map((w) => {
        const meta = coinMeta(w.asset);
        const open = openAsset?.asset === w.asset;
        return (
          <div key={w.asset} className="balance-row">
            <div className="balance-info">
              <DataIcon name={meta.icon} className="balance-icon data-icon" style={{ color: meta.color }} />
              <div>
                <span className="balance-asset">{w.asset}</span>
                <span className="balance-amount">{Number(w.balance).toLocaleString('en-US', { maximumFractionDigits: 8 })}</span>
              </div>
            </div>
            <div className="balance-actions">
              {['credit', 'debit', 'set'].map((mode) => (
                <button
                  key={mode}
                  className={`balance-btn ${mode} ${open && openAsset.mode === mode ? 'on' : ''}`}
                  onClick={() => { setOpenAsset(open && openAsset.mode === mode ? null : { asset: w.asset, mode }); setMsg(null); }}
                >
                  {mode === 'set' ? 'Set' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            {open && openAsset.mode && (
              <div className="balance-form">
                <input
                  className="form-input balance-input"
                  type="number"
                  min="0"
                  step="any"
                  placeholder={`Amount of ${w.asset}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
                {openAsset.mode !== 'set' && (
                  <input
                    className="form-input balance-input"
                    placeholder="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                )}
                <button className="btn-primary balance-apply" disabled={busy} onClick={() => apply(userId, openAsset.mode)}>
                  {busy ? 'Working...' : 'Apply'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 2: Address — assign/edit + pending requests             */
/* ─────────────────────────────────────────────────────────── */

function AddressTab({ userId, addresses, addressRequests, onChange }) {
  const ASSETS = ['BTC', 'ETH', 'USDT'];
  const [form, setForm] = useState({ asset: 'USDT', address: '', network: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const pending = addressRequests.filter((r) => r.status === 'pending');
  const existing = (asset) => addresses.find((a) => a.asset === asset);

  async function assign(userId) {
    if (form.address.trim().length < 10) {
      setMsg({ ok: false, text: 'Address looks too short' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.rpc('admin_assign_address', {
      p_user_id: userId,
      p_asset: form.asset,
      p_address: form.address.trim(),
      p_network: form.network.trim() || 'Unknown network',
    });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
    } else {
      setMsg({ ok: true, text: `${form.asset} address assigned` });
      setForm((f) => ({ ...f, address: '', network: '' }));
      onChange();
    }
  }

  async function reject(requestId) {
    setBusy(true);
    const { error } = await supabase.rpc('admin_reject_request', { p_request_id: requestId });
    setBusy(false);
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Request rejected' });
    if (!error) onChange();
  }

  return (
    <div className="drawer-section">
      {msg && <p className={`admin-msg ${msg.ok ? 'ok' : 'bad'}`}>{msg.text}</p>}

      {pending.length > 0 && (
        <div className="pending-requests">
          <h4 className="drawer-subtitle">Pending requests</h4>
          {pending.map((r) => (
            <div key={r.id} className="pending-row">
              <span className="badge badge-gold">{r.asset} requested</span>
              <div className="pending-actions">
                <button
                  className="balance-btn credit"
                  onClick={() => setForm((f) => ({ ...f, asset: r.asset }))}
                >
                  Fill form
                </button>
                <button className="balance-btn debit" disabled={busy} onClick={() => reject(r.id)}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h4 className="drawer-subtitle">Assign address</h4>
      <div className="assign-form">
        <label className="drawer-label">Asset</label>
        <div className="coin-selector">
          {ASSETS.map((a) => (
            <button
              key={a}
              className={`coin-btn ${form.asset === a ? 'active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, asset: a }))}
            >
              {a}
            </button>
          ))}
        </div>
        <label className="drawer-label">Address</label>
        <input
          className="form-input"
          placeholder="0x… / bc1… / TJ9x…"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
        <label className="drawer-label">Network</label>
        <input
          className="form-input"
          placeholder="e.g. Ethereum (ERC-20)"
          value={form.network}
          onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
        />
        <button className="btn-primary assign-submit" disabled={busy} onClick={() => assign(userId)}>
          {busy ? 'Saving...' : existing(form.asset) ? `Update ${form.asset} address` : `Assign ${form.asset} address`}
        </button>
      </div>

      <h4 className="drawer-subtitle">Current addresses</h4>
      {addresses.length === 0 ? (
        <p className="admin-dim">None assigned yet.</p>
      ) : (
        addresses.map((a) => (
          <div key={a.id} className="current-addr">
            <span className="badge badge-purple">{a.asset}</span>
            <code className="addr-code">{a.address}</code>
            <span className="admin-dim">{a.network}</span>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 3: Transactions — mark pending withdrawals done/failed  */
/* ─────────────────────────────────────────────────────────── */

function TransactionsTab({ transactions, onChange }) {
  const [busyId, setBusyId] = useState(null);

  async function mark(txnId, status) {
    setBusyId(txnId);
    await supabase.rpc('admin_mark_txn_status', { p_txn_id: txnId, p_status: status });
    setBusyId(null);
    onChange();
  }

  if (transactions.length === 0) {
    return <div className="admin-empty">No transactions yet.</div>;
  }

  return (
    <div className="drawer-section">
      {transactions.map((tx) => (
        <div key={tx.id} className="txn-row">
          <div className="txn-main">
            <span className={`badge ${tx.status === 'completed' ? 'badge-green' : tx.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>
              {tx.status}
            </span>
            <span className="txn-type">{tx.type}</span>
            <span className="txn-amount">
              {Number(tx.amount_crypto).toLocaleString('en-US', { maximumFractionDigits: 8 })} {tx.asset}
            </span>
          </div>
          <div className="txn-meta">
            <span className="admin-dim">{fmtDate(tx.created_at)}</span>
            {tx.reference && <span className="txn-ref">{tx.reference}</span>}
          </div>
          {tx.type === 'withdraw' && tx.status === 'pending' && (
            <div className="txn-actions">
              <button className="balance-btn credit" disabled={busyId === tx.id} onClick={() => mark(tx.id, 'completed')}>
                <CheckIcon className="btn-tiny-icon" /> Completed
              </button>
              <button className="balance-btn debit" disabled={busyId === tx.id} onClick={() => mark(tx.id, 'failed')}>
                <XCircleIcon className="btn-tiny-icon" /> Failed
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tab 4: Settings — suspend toggle + gas fee                  */
/* ─────────────────────────────────────────────────────────── */

function SettingsTab({ user, onChange }) {
  const [fee, setFee] = useState(String(user.gas_fee ?? '3.80'));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const { profile: me } = useAuth();

  async function saveFee() {
    const v = Number(fee);
    if (Number.isNaN(v) || v < 0 || v > 100) {
      setMsg({ ok: false, text: 'Gas fee must be between 0 and 100' });
      return;
    }
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc('admin_set_gas_fee', {
      p_user_id: user.id,
      p_fee: v,
    });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
    } else {
      setMsg({ ok: true, text: `Gas fee set to $${Number(data).toFixed(2)}` });
      onChange();
    }
  }

  async function toggleStatus() {
    const next = user.status === 'suspended' ? 'active' : 'suspended';
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.rpc('admin_set_user_status', {
      p_user_id: user.id,
      p_status: next,
    });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
    } else {
      setMsg({ ok: true, text: next === 'suspended' ? 'User suspended' : 'User re-activated' });
      onChange();
    }
  }

  return (
    <div className="drawer-section">
      {msg && <p className={`admin-msg ${msg.ok ? 'ok' : 'bad'}`}>{msg.text}</p>}

      <h4 className="drawer-subtitle">Withdrawal gas fee</h4>
      <p className="admin-hint">
        Charged in USD on every withdrawal from this account. Default $3.80.
      </p>
      <div className="fee-row">
        <span className="fee-prefix">$</span>
        <input
          className="form-input fee-input"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />
        <button className="btn-primary fee-save" disabled={busy} onClick={saveFee}>
          {busy ? '...' : 'Save'}
        </button>
      </div>

      <h4 className="drawer-subtitle">Account status</h4>
      <div className="status-row">
        <span className={`badge ${user.status === 'suspended' ? 'badge-red' : 'badge-green'}`}>
          {user.status || 'active'}
        </span>
        <button
          className={`balance-btn ${user.status === 'suspended' ? 'credit' : 'debit'}`}
          disabled={busy || user.id === me?.id}
          onClick={toggleStatus}
        >
          {user.status === 'suspended' ? 'Re-activate user' : 'Suspend user'}
        </button>
      </div>
      {user.id === me?.id && (
        <p className="admin-hint">You can't suspend your own admin account.</p>
      )}
    </div>
  );
}
