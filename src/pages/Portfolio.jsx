import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useWallets, useInvestments, usePortfolioHistory } from '../hooks/useSupabase';
import './Portfolio.css';

// Monthly yield is fake data for the prototype visualization unless we build a complex query
const monthlyYield = [
  { month: 'Jan', fixed: 0, hysa: 0, crypto: 0 },
  { month: 'Feb', fixed: 0, hysa: 0, crypto: 0 },
  { month: 'Mar', fixed: 0, hysa: 0, crypto: 0 },
  { month: 'Apr', fixed: 0, hysa: 0, crypto: 0 },
  { month: 'May', fixed: 120, hysa: 58, crypto: 210 },
  { month: 'Jun', fixed: 135, hysa: 63, crypto: 290 },
];

function InvestmentProgressCard({ inv, history }) {
  const progress = inv.duration ? Math.min((inv.pnlPercent / (inv.apy / 3)) * 100, 100) : 100;
  
  return (
    <div className="port-inv-card" style={{ '--inv-color': inv.color }}>
      <div className="port-inv-header">
        <div className="port-inv-icon" style={{ background: `linear-gradient(135deg, ${inv.color}, #19172a)` }}>{inv.icon}</div>
        <div className="port-inv-info">
          <h3>{inv.name}</h3>
          <div className="port-inv-meta">
            <span className="badge badge-green">{inv.apy}% APY</span>
            <span className="port-inv-status">● {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
          </div>
        </div>
        <div className="port-inv-right">
          <div className="port-inv-value">${inv.currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
          <div className="port-inv-pnl up">▲ +${inv.pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})} ({inv.pnlPercent > 0 ? '+' : ''}{inv.pnlPercent.toFixed(2)}%)</div>
        </div>
      </div>

      <div className="port-inv-chart">
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={history.map((p,i) => ({ date: p.date, value: inv.currentValue - 100 + i*20 }))}
            margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad_${inv.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={inv.color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={inv.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#161f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
              formatter={v => [`$${v.toFixed(0)}`, 'Value']}
            />
            <Area type="monotone" dataKey="value" stroke={inv.color} strokeWidth={2}
              fill={`url(#grad_${inv.id})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="port-inv-footer">
        <div className="port-detail">
          <span>Invested</span>
          <strong>${inv.totalInvested.toLocaleString()}</strong>
        </div>
        <div className="port-detail">
          <span>Duration</span>
          <strong>{inv.duration ? `${inv.duration} days` : 'Flexible'}</strong>
        </div>
        <div className="port-detail">
          <span>Status</span>
          <strong style={{textTransform:'capitalize'}}>{inv.status}</strong>
        </div>
        <div className="port-detail">
          <span>Progress</span>
          <div className="port-progress-bar">
            <div className="port-progress-fill" style={{ width: `${progress}%`, background: inv.color }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { data: investments, loading: iLoad } = useInvestments();
  const { data: wallets, loading: wLoad } = useWallets();
  const { data: portfolioHistory, loading: hLoad } = usePortfolioHistory();

  if (iLoad || wLoad || hLoad) {
    return <div style={{ padding: 40, color: '#fff' }}><h2>Loading portfolio...</h2></div>;
  }

  const totalInvested = investments.reduce((s, i) => s + i.totalInvested, 0);
  const totalCurrent  = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalPnL      = investments.reduce((s, i) => s + i.pnl, 0);
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  const walletTotal = wallets.reduce((sum, w) => sum + w.usdValue, 0);
  const totalPortfolioValue = totalCurrent + walletTotal;

  return (
    <div className="portfolio-page">
      <div className="port-header">
        <div>
          <h1 className="page-title">My Portfolio</h1>
          <p className="page-sub">Track performance across all your active investments.</p>
        </div>
      </div>

      {/* Top Summary */}
      <div className="port-summary-cards">
        {[
          { label: 'Total Invested', value: `$${totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`, sub: `Across ${investments.length} products`, color: '#6c63ff' },
          { label: 'Current Value',  value: `$${totalCurrent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`,  sub: 'Market value today', color: '#00d4aa' },
          { label: 'Total PnL',      value: `+$${totalPnL.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`,      sub: `+${totalPnLPercent.toFixed(2)}% return`,     color: '#f5a623' },
          { label: 'Portfolio Value',value: `$${totalPortfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}`, sub: 'Incl. wallet balances', color: '#3b82f6' },
        ].map(c => (
          <div className="port-summary-card" key={c.label} style={{ '--c': c.color }}>
            <div className="port-summary-label">{c.label}</div>
            <div className="port-summary-value" style={{ color: c.color }}>{c.value}</div>
            <div className="port-summary-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Portfolio chart */}
      <div className="dash-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Portfolio Growth</h2>
            <p className="card-sub">12-month performance</p>
          </div>
          <div className="port-total-badge">
            <span className="port-badge-up">▲ +{totalPnLPercent.toFixed(2)}% YTD</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={portfolioHistory} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v/1000).toFixed(0)}K`} width={48} />
            <Tooltip
              contentStyle={{ background: '#161f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
              formatter={v => [`$${v.toLocaleString()}`, 'Portfolio']}
              labelStyle={{ color: '#8892b0' }}
            />
            <Area type="monotone" dataKey="value" stroke="#00d4aa" strokeWidth={2.5}
              fill="url(#portGrad)" dot={false} activeDot={{ r: 5, fill: '#00d4aa' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Yield Bar Chart */}
      <div className="dash-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Monthly Yield Breakdown</h2>
            <p className="card-sub">Earnings by product type</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyYield} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `$${v}`} width={44} />
            <Tooltip
              contentStyle={{ background: '#161f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              formatter={v => [`$${v}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#8892b0' }} />
            <Bar dataKey="fixed"  fill="#00d4aa" radius={[4,4,0,0]} name="Fixed Savings" />
            <Bar dataKey="hysa"   fill="#f5a623" radius={[4,4,0,0]} name="High-Yield" />
            <Bar dataKey="crypto" fill="#6c63ff" radius={[4,4,0,0]} name="Crypto" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Individual investment cards */}
      <div>
        <h2 className="port-section-title">Active Investments</h2>
        <div className="port-inv-list">
          {investments.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>No active investments.</div>
          ) : (
            investments.map(inv => (
              <InvestmentProgressCard key={inv.id} inv={inv} history={portfolioHistory} />
            ))
          )}
        </div>
      </div>

      {/* Wallet breakdown */}
      <div className="dash-card" style={{ marginTop: 32 }}>
        <div className="card-header">
          <h2 className="card-title">Wallet Holdings</h2>
          <p className="card-sub">Real-time balance snapshot</p>
        </div>
        <div className="port-wallet-grid">
          {wallets.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>Your wallet is empty.</div>
          ) : (
            wallets.map(w => (
              <div className="port-wallet-chip" key={w.coin}>
                <div className="pwc-icon" style={{ background: w.color }}>{w.icon}</div>
                <div className="pwc-info">
                  <div className="pwc-name">{w.name}</div>
                  <div className="pwc-bal">{w.balance} {w.coin}</div>
                </div>
                <div className="pwc-usd">
                  <div className="pwc-val">${w.usdValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits:2})}</div>
                  <div className={w.change24h >= 0 ? 'up' : 'dn'}>
                    {w.change24h >= 0 ? '▲' : '▼'} {Math.abs(w.change24h)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
