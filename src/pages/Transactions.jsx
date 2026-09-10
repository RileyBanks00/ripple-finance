import { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon as ExportIcon,
} from '@heroicons/react/24/outline';
import { useTransactions } from '../hooks/useSupabase';
import './Transactions.css';

const TYPE_FILTERS = ['All', 'Deposit', 'Withdraw', 'Invest', 'Yield'];
const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed'];

const txStyle = {
  deposit:  { color: 'var(--accent-secondary)', bg: 'rgba(0,212,170,0.1)',  icon: ArrowDownTrayIcon, label: 'Deposit'  },
  withdraw: { color: 'var(--accent-danger)', bg: 'rgba(255,79,109,0.1)', icon: ArrowUpTrayIcon, label: 'Withdraw' },
  invest:   { color: 'var(--accent-primary)', bg: 'rgba(108,99,255,0.1)', icon: ArrowTrendingUpIcon, label: 'Invest'   },
  yield:    { color: 'var(--accent-gold)', bg: 'rgba(245,166,35,0.1)', icon: GiftIcon, label: 'Yield'    },
};

export default function Transactions() {
  const { data: transactions, loading } = useTransactions();
  const [typeFilter,   setTypeFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search,       setSearch]       = useState('');

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-primary)' }}><h2>Loading transactions...</h2></div>;
  }

  const filtered = transactions.filter(tx => {
    const matchType   = typeFilter   === 'All' || tx.type   === typeFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || tx.status === statusFilter.toLowerCase();
    const matchSearch = search === '' ||
      tx.asset.toLowerCase().includes(search.toLowerCase()) ||
      tx.hash.toLowerCase().includes(search.toLowerCase()) ||
      tx.type.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const totals = {
    deposited: transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.usdValue, 0),
    withdrawn: transactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.usdValue, 0),
    invested:  transactions.filter(t => t.type === 'invest').reduce((s, t) => s + t.usdValue, 0),
    yield:     transactions.filter(t => t.type === 'yield').reduce((s, t) => s + t.usdValue, 0),
  };

  return (
    <div className="tx-page">
      <div className="tx-page-header">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-sub">Complete record of all your activity on Ripple Finance.</p>
        </div>
        <button className="btn-secondary" id="export-btn">
          <ExportIcon className="btn-icon" />
          Export CSV
        </button>
      </div>

      {/* Summary Chips */}
      <div className="tx-summary-chips">
        {[
          { label: 'Total Deposited', value: `$${totals.deposited.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`, color: '#00d4aa' },
          { label: 'Total Withdrawn', value: `$${totals.withdrawn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`, color: '#ff4f6d' },
          { label: 'Total Invested',  value: `$${totals.invested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`,  color: '#6c63ff' },
          { label: 'Total Yield',     value: `$${totals.yield.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`,            color: '#f5a623' },
        ].map(c => (
          <div className="tx-chip" key={c.label} style={{ '--chip-color': c.color }}>
            <div className="tx-chip-val" style={{ color: c.color }}>{c.value}</div>
            <div className="tx-chip-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="tx-controls">
        <div className="tx-search-wrap">
          <MagnifyingGlassIcon className="tx-search-icon" />
          <input
            type="text"
            placeholder="Search by asset, type, hash..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="tx-search-input"
            id="tx-search-input"
          />
        </div>
        <div className="tx-filter-groups">
          <div className="tx-filter-group">
            {TYPE_FILTERS.map(f => (
              <button key={f} className={`filter-btn ${typeFilter === f ? 'active' : ''}`}
                onClick={() => setTypeFilter(f)} id={`type-filter-${f.toLowerCase()}`}>{f}</button>
            ))}
          </div>
          <div className="tx-filter-group">
            {STATUS_FILTERS.map(f => (
              <button key={f} className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
                onClick={() => setStatusFilter(f)} id={`status-filter-${f.toLowerCase()}`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dash-card tx-full-table">
        <div className="tx-count">{filtered.length} transactions</div>
        <div className="tx-full-head">
          <span>Transaction</span>
          <span>Asset</span>
          <span>Amount (USD)</span>
          <span>Status</span>
          <span>Hash / Ref</span>
          <span>Date & Time</span>
        </div>
        {filtered.length === 0 ? (
          <div className="tx-empty">
            <MagnifyingGlassIcon className="tx-empty-icon" />
            <div>No transactions match your filters.</div>
          </div>
        ) : (
          filtered.map(tx => {
            const s = txStyle[tx.type] || { color: 'var(--text-secondary)', bg: 'var(--bg-glass)', icon: null, label: tx.type };
            return (
              <div className="tx-full-row" key={tx.id}>
                <span className="tx-type-cell">
                  <span className="tx-type-badge" style={{ background: s.bg, color: s.color }}>
                    {s.icon ? <s.icon className="tx-type-badge-icon" /> : null} {s.label}
                  </span>
                </span>
                <span className="tx-asset-cell">
                  <span className="tx-coin-badge">{tx.asset}</span>
                </span>
                <span className="tx-amount-cell" style={{ color: tx.amount > 0 ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.asset}
                  <span className="tx-usd-val">${tx.usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
                </span>
                <span>
                  <span className={`tx-status status-${tx.status}`}>{tx.status}</span>
                </span>
                <span className="tx-hash">{tx.hash}</span>
                <span className="tx-datetime">{tx.date} <span className="tx-time">{tx.time}</span></span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
