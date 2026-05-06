import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  useWallets, useInvestments, useTransactions, usePortfolioHistory
} from '../hooks/useSupabase';
import './Dashboard.css';

function StatCard({ label, value, sub, subColor, icon, gradient }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: gradient }}>{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {sub && <div className="stat-card-sub" style={{ color: subColor }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniPnLChart({ data, color = '#6c63ff' }) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g_${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.35}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
          fill={`url(#g_${color.replace('#','')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const txTypeStyle = {
  deposit:  { color: '#00d4aa', icon: '⬇', label: 'Deposit' },
  withdraw: { color: '#ff4f6d', icon: '⬆', label: 'Withdraw' },
  invest:   { color: '#6c63ff', icon: '📈', label: 'Invest' },
  yield:    { color: '#f5a623', icon: '💰', label: 'Yield' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: wallets, loading: wLoading } = useWallets();
  const { data: investments, loading: iLoading } = useInvestments();
  const { data: transactions, loading: tLoading } = useTransactions();
  const { data: portfolioHistory, loading: hLoading } = usePortfolioHistory();

  if (wLoading || iLoading || tLoading || hLoading) {
    return (
      <div style={{ padding: 40, color: '#fff' }}>
        <h2>Loading your dashboard...</h2>
      </div>
    );
  }

  const recentTx = transactions.slice(0, 5);
  
  // Calculations
  const walletTotal = wallets.reduce((sum, w) => sum + w.usdValue, 0);
  const investTotal = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalPortfolioValue = walletTotal + investTotal;

  const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
  const totalPnL = investments.reduce((sum, inv) => sum + inv.pnl, 0);
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const activeInvestmentsCount = investments.filter(i => i.status === 'active').length;
  const thisMonthYield = transactions
    .filter(t => t.type === 'yield')
    .reduce((sum, t) => sum + t.usdValue, 0); // Simplified for prototype

  // Dynamic Pie Data
  const pieData = [
    ...investments.map(inv => ({ name: inv.name, value: inv.currentValue, color: inv.color })),
    { name: 'Wallets', value: walletTotal, color: '#3b82f6' }
  ].filter(p => p.value > 0);

  // If completely empty, show a grey placeholder in pie
  if (pieData.length === 0) pieData.push({ name: 'Empty', value: 1, color: '#2a2b36' });

  return (
    <div className="dashboard">

      {/* Welcome */}
      <div className="dash-welcome">
        <div>
          <h1 className="dash-title">Good morning, {profile?.full_name?.split(' ')[0] || 'Investor'} 👋</h1>
          <p className="dash-subtitle">Here's your investment overview for today.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/invest')} id="dash-invest-btn">
          <span>+</span> New Investment
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard label="Total Portfolio" value={`$${totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`}
          sub={totalPnL > 0 ? `▲ +${totalPnLPercent.toFixed(2)}% overall` : 'Start investing'} subColor="#00d4aa"
          icon="💎" gradient="linear-gradient(135deg,#6c63ff,#3b82f6)" />
        <StatCard label="Total PnL" value={`+$${totalPnL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`}
          sub={totalPnL > 0 ? "▲ Profitable overall" : "-"} subColor="#00d4aa"
          icon="📈" gradient="linear-gradient(135deg,#00d4aa,#0891b2)" />
        <StatCard label="Active Investments" value={activeInvestmentsCount} sub="Fixed · HYSA · Crypto" subColor="#8892b0"
          icon="🔒" gradient="linear-gradient(135deg,#f5a623,#e87c27)" />
        <StatCard label="Total Yield Earned" value={`$${thisMonthYield.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`} sub="All time" subColor="#8892b0"
          icon="💰" gradient="linear-gradient(135deg,#9945ff,#6c63ff)" />
      </div>

      {/* Main Charts Row */}
      <div className="dash-charts-row">
        {/* Portfolio Chart */}
        <div className="dash-card portfolio-chart-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Portfolio Performance</h2>
              <p className="card-sub">History</p>
            </div>
            <div className="chart-range-btns">
              {['1M','3M','6M','1Y'].map(r => (
                <button key={r} className={`range-btn ${r==='1Y'?'active':''}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="portfolio-value-display">
            <span className="pv-amount">${totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</span>
            <span className="pv-change up">▲ +${totalPnL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} (+{totalPnLPercent.toFixed(2)}%)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={portfolioHistory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v/1000).toFixed(0)}K`} width={48} />
              <Tooltip
                contentStyle={{ background: '#161f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                formatter={v => [`$${v.toLocaleString()}`, 'Value']}
                labelStyle={{ color: '#8892b0' }}
              />
              <Area type="monotone" dataKey="value" stroke="#6c63ff" strokeWidth={2.5}
                fill="url(#pgGrad)" dot={false} activeDot={{ r: 5, fill: '#6c63ff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Allocation Pie */}
        <div className="dash-card allocation-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Allocation</h2>
              <p className="card-sub">Asset distribution</p>
            </div>
          </div>
          <PieChart width={180} height={180} style={{ margin: '0 auto' }}>
            <Pie data={pieData} cx={90} cy={90} innerRadius={55} outerRadius={80}
              dataKey="value" paddingAngle={3} stroke="none">
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#161f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
              formatter={v => [`$${v.toLocaleString()}`, '']}
            />
          </PieChart>
          <div className="pie-legend">
            {pieData.map(p => (
              <div className="pie-legend-item" key={p.name}>
                <span className="pie-dot" style={{ background: p.color }} />
                <span className="pie-name">{p.name}</span>
                <span className="pie-val">${(p.value/1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investments + Wallets Row */}
      <div className="dash-bottom-row">
        {/* Active Investments */}
        <div className="dash-card investments-card">
          <div className="card-header">
            <h2 className="card-title">Active Investments</h2>
            <button className="card-link" onClick={() => navigate('/portfolio')}>View All →</button>
          </div>
          <div className="investments-list">
            {investments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No active investments yet.</div>
            ) : (
              investments.map(inv => {
                // Fake mini chart data for visuals
                const mini = [1,2,3,4,5,6].map(i => ({ value: inv.currentValue - 100 + i*20 }));
                return (
                  <div className="investment-row" key={inv.id}>
                    <div className="inv-icon" style={{ background: `linear-gradient(135deg, ${inv.color}, #19172a)` }}>{inv.icon}</div>
                    <div className="inv-info">
                      <div className="inv-name">{inv.name}</div>
                      <div className="inv-meta">
                        <span className="badge badge-green">{inv.apy}% APY</span>
                        {inv.duration && <span className="inv-dur">{inv.duration}d lock</span>}
                      </div>
                    </div>
                    <div className="inv-chart"><MiniPnLChart data={mini} color={inv.color} /></div>
                    <div className="inv-values">
                      <div className="inv-current">${inv.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
                      <div className="inv-pnl up">▲ +${inv.pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} ({inv.pnlPercent > 0 ? '+' : ''}{inv.pnlPercent.toFixed(2)}%)</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Wallet Balances */}
        <div className="dash-card wallet-card">
          <div className="card-header">
            <h2 className="card-title">Wallet</h2>
            <button className="card-link" onClick={() => navigate('/deposit')}>Deposit →</button>
          </div>
          <div className="wallet-list">
            {wallets.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Your wallet is empty. Deposit crypto to start.</div>
            ) : (
              wallets.map(w => (
                <div className="wallet-row" key={w.coin}>
                  <div className="wallet-icon" style={{ background: w.color }}>{w.icon}</div>
                  <div className="wallet-info">
                    <div className="wallet-name">{w.name}</div>
                    <div className="wallet-bal">{w.balance} {w.coin}</div>
                  </div>
                  <div className="wallet-usd">
                    <div className="wallet-usd-val">${w.usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
                    <div className={`wallet-change ${w.change24h >= 0 ? 'up' : 'dn'}`}>
                      {w.change24h >= 0 ? '▲' : '▼'} {Math.abs(w.change24h)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dash-card recent-tx-card">
        <div className="card-header">
          <h2 className="card-title">Recent Transactions</h2>
          <button className="card-link" onClick={() => navigate('/transactions')}>View All →</button>
        </div>
        <div className="tx-table">
          <div className="tx-table-head">
            <span>Type</span><span>Asset</span><span>Amount</span><span>Status</span><span>Date</span>
          </div>
          {recentTx.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent transactions.</div>
          ) : (
            recentTx.map(tx => {
              const style = txTypeStyle[tx.type] || { color: '#ccc', icon: '•', label: tx.type };
              return (
                <div className="tx-table-row" key={tx.id}>
                  <span className="tx-type" style={{ color: style.color }}>
                    {style.icon} {style.label}
                  </span>
                  <span className="tx-asset">{tx.asset}</span>
                  <span className="tx-amount" style={{ color: tx.amount > 0 ? '#00d4aa' : '#ff4f6d' }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.asset}
                  </span>
                  <span className={`tx-status status-${tx.status}`}>{tx.status}</span>
                  <span className="tx-date">{tx.date} {tx.time}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
