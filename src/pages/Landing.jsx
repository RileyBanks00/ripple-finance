import { useNavigate } from 'react-router-dom';
import rippleLogo from '../assets/ripple.png';
import { useEffect, useRef, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { stats, reviews, cryptoPrices, portfolioHistory } from '../data/mockData';
import Footer from '../components/Footer';
import './Landing.css';

const chartData = [
  { m: 'Jan', v: 28 }, { m: 'Feb', v: 31 }, { m: 'Mar', v: 29 },
  { m: 'Apr', v: 38 }, { m: 'May', v: 36 }, { m: 'Jun', v: 44 },
  { m: 'Jul', v: 42 }, { m: 'Aug', v: 50 }, { m: 'Sep', v: 48 },
  { m: 'Oct', v: 56 }, { m: 'Nov', v: 54 }, { m: 'Dec', v: 63 },
];

function TickerBar() {
  const prices = [...cryptoPrices, ...cryptoPrices];
  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {prices.map((p, i) => (
          <div className="ticker-item" key={i}>
            <span className="ticker-coin" style={{ color: p.color }}>{p.icon} {p.coin}</span>
            <span className="ticker-price">${p.price.toLocaleString()}</span>
            <span className={`ticker-change ${p.change >= 0 ? 'up' : 'dn'}`}>
              {p.change >= 0 ? '▲' : '▼'} {Math.abs(p.change)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review, style }) {
  return (
    <div className="review-card" style={style}>
      <div className="review-card-top">
        <div className="review-avatar" style={{ background: review.color }}>
          {review.avatar}
        </div>
        <div>
          <div className="review-name">{review.name}</div>
          <div className="review-role">{review.role}</div>
        </div>
        {review.verified && <div className="review-verified">✓ Verified</div>}
      </div>
      <div className="review-stars">{'★'.repeat(review.rating)}</div>
      <p className="review-text">"{review.text}"</p>
      <div className="review-date">{review.date}</div>
    </div>
  );
}

function MarqueeReviews() {
  // Duplicate cards so the loop is perfectly seamless
  const row1 = [...reviews, ...reviews];
  const row2 = [...[...reviews].reverse(), ...[...reviews].reverse()];
  return (
    <div className="marquee-wrapper">
      {/* Row 1 — scrolls right → left */}
      <div className="marquee-row">
        <div className="marquee-track marquee-track-left">
          {row1.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      </div>
      {/* Row 2 — scrolls left → right */}
      <div className="marquee-row">
        <div className="marquee-track marquee-track-right">
          {row2.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* NAV — logo sits free, glass pill holds links + actions */}
      <nav className="land-nav">
        {/* Logo lives OUTSIDE the glass */}
        <div className="land-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="land-logo-mark">
            <img src={rippleLogo} alt="Ripple Finance" className="land-logo-img" />
          </div>
          <span className="land-logo-text">Ripple</span>
        </div>

        {/* Liquid glass pill — contains links + divider + buttons */}
        <div className="land-nav-glass">
          <div className="land-nav-links">
            <a href="#products">Products</a>
            <a href="#how">How it Works</a>
            <a href="#reviews">Reviews</a>
          </div>
          <div className="land-nav-divider" />
          <div className="land-nav-actions">
            <button className="btn-secondary" onClick={() => navigate('/login')} id="nav-signin-btn">Sign In</button>
            <button className="btn-primary" onClick={() => navigate('/register')} id="nav-getstarted-btn">Get Started</button>
          </div>
        </div>
      </nav>

      {/* TICKER */}
      <TickerBar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-fade-up">
            <span className="hero-badge-dot" /> Trusted by 180,000+ investors globally
          </div>
          <h1 className="hero-title animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Invest Smarter with<br />
            <span className="gradient-text">Crypto-Powered</span><br />
            Finance
          </h1>
          <p className="hero-sub animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Deposit crypto and watch your wealth grow with fixed savings,
            high-yield accounts, and managed crypto portfolios — all in one premium platform.
          </p>
          <div className="hero-actions animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <button className="btn-primary hero-cta" onClick={() => navigate('/register')} id="hero-start-btn">
              Start Investing
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => navigate('/invest')} id="hero-explore-btn">
              Explore Products
            </button>
          </div>
          <div className="hero-stats animate-fade-up" style={{ animationDelay: '0.4s' }}>
            {stats.map(s => (
              <div className="hero-stat" key={s.label}>
                <span className="hero-stat-icon">{s.icon}</span>
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Chart Card */}
        <div className="hero-card animate-float">
          <div className="hero-card-header">
            <div>
              <div className="hero-card-label">Portfolio Value</div>
              <div className="hero-card-value">$63,420.80</div>
              <div className="hero-card-change up">▲ +24.8% this year</div>
            </div>
            <div className="hero-card-badge">Live</div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c63ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="m" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#161f35', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                formatter={v => [`$${v}K`, 'Value']}
                labelStyle={{ color: '#8892b0' }}
              />
              <Area type="monotone" dataKey="v" stroke="#6c63ff" strokeWidth={2.5} fill="url(#hGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="hero-card-coins">
            {['₿','Ξ','◎'].map((c, i) => (
              <div className="hero-coin-chip" key={i}>{c}</div>
            ))}
            <span className="hero-card-sub">Multi-asset portfolio</span>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="land-section" id="products">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Investment Products</div>
            <h2 className="section-title">Everything You Need to<br /><span className="gradient-text">Grow Your Wealth</span></h2>
            <p className="section-sub">From capital-protected fixed savings to high-growth crypto portfolios — built for every risk appetite.</p>
          </div>
          <div className="products-grid">
            {[
              { icon: '🔒', title: 'Fixed Savings', apy: '8.5–16%', desc: 'Lock your crypto for 30–180 days and earn guaranteed fixed returns. Capital protected and fully audited.', color: '#00d4aa', grad: 'linear-gradient(135deg,#00d4aa,#0891b2)', risk: 'Low Risk' },
              { icon: '💰', title: 'High-Yield Savings', apy: '8.2%', desc: 'A flexible savings account that earns daily. Withdraw anytime with no penalty — the perfect liquid yield strategy.', color: '#f5a623', grad: 'linear-gradient(135deg,#f5a623,#e87c27)', risk: 'Low Risk' },
              { icon: '📈', title: 'Crypto Growth', apy: '24.8%', desc: 'Invest in an auto-rebalanced BTC + ETH blend powered by DeFi yield strategies. Passive crypto income redefined.', color: '#6c63ff', grad: 'linear-gradient(135deg,#6c63ff,#3b82f6)', risk: 'Medium Risk' },
              { icon: '🚀', title: 'Altcoin Portfolio', apy: '38.5%', desc: 'Our highest-yield product. Actively managed exposure to SOL, BNB, AVAX and more. For the bold investor.', color: '#9945ff', grad: 'linear-gradient(135deg,#9945ff,#6c63ff)', risk: 'High Risk' },
            ].map(p => (
              <div className="product-card" key={p.title} style={{ '--accent': p.color }}>
                <div className="product-card-icon" style={{ background: p.grad }}>{p.icon}</div>
                <div className="product-card-body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
                <div className="product-card-footer">
                  <div className="product-apy">
                    <span className="apy-label">APY</span>
                    <span className="apy-value" style={{ color: p.color }}>{p.apy}</span>
                  </div>
                  <span className="badge badge-green">{p.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="land-section land-section-dark" id="how">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Simple Process</div>
            <h2 className="section-title">Start Investing in<br /><span className="gradient-text-green">3 Easy Steps</span></h2>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', title: 'Create Account', desc: 'Sign up in minutes. Pass simple KYC verification and you\'re ready to invest.' },
              { n: '02', title: 'Deposit Crypto', desc: 'Deposit BTC, ETH, USDT, SOL or BNB directly to your Ripple wallet. Instant confirmation.' },
              { n: '03', title: 'Earn & Grow', desc: 'Choose your investment product and watch your portfolio grow with real-time tracking.' },
            ].map(s => (
              <div className="step-card" key={s.n}>
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="land-section reviews-section" id="reviews">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Customer Reviews</div>
            <h2 className="section-title">Loved by Investors<br /><span className="gradient-text">Worldwide</span></h2>
            <p className="section-sub">Join thousands of satisfied investors earning with Ripple Finance.</p>
          </div>
        </div>
        <MarqueeReviews />
      </section>

      <Footer />
    </div>
  );
}
