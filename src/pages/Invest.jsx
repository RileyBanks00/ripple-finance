import { useState } from 'react';
import { useProducts } from '../hooks/useSupabase';
import './Invest.css';

const FILTERS = ['All', 'Fixed', 'HYSA', 'Crypto'];

function ProductCard({ product, onInvest }) {
  const [hovered, setHovered] = useState(false);
  const riskColor = { Low: '#00d4aa', Medium: '#f5a623', High: '#ff4f6d' }[product.risk];

  return (
    <div
      className={`invest-card ${hovered ? 'hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ '--card-color': product.color }}
    >
      <div className="invest-card-top">
        <div className="invest-card-icon" style={{ background: product.gradient }}>{product.icon}</div>
        <div className="invest-card-meta">
          <span className="invest-card-type">{product.type.toUpperCase()}</span>
          <span className="invest-card-risk" style={{ color: riskColor }}>● {product.risk}</span>
        </div>
      </div>

      <h3 className="invest-card-name">{product.name}</h3>
      <p className="invest-card-sub">{product.subtitle}</p>

      <div className="invest-card-apy">
        <span className="invest-apy-num" style={{ color: product.color }}>{product.apy}%</span>
        <span className="invest-apy-label">APY</span>
      </div>

      <div className="invest-card-details">
        <div className="invest-detail">
          <span className="detail-label">Min. Deposit</span>
          <span className="detail-value">${product.minDeposit.toLocaleString()}</span>
        </div>
        <div className="invest-detail">
          <span className="detail-label">Duration</span>
          <span className="detail-value">{product.duration ? `${product.duration} days` : 'Flexible'}</span>
        </div>
      </div>

      <ul className="invest-features">
        {product.features.map(f => (
          <li key={f}><span className="feat-check" style={{ color: product.color }}>✓</span> {f}</li>
        ))}
      </ul>

      <button
        className="invest-btn"
        style={{ background: product.gradient }}
        onClick={() => onInvest(product)}
        id={`invest-btn-${product.id}`}
      >
        Invest Now
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}

function InvestModal({ product, onClose }) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1); // 1=input, 2=confirm, 3=success
  const usd = parseFloat(amount) || 0;
  const projectedYield = product ? (usd * product.apy / 100 * (product.duration || 365) / 365) : 0;

  if (!product) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {step === 1 && (
          <>
            <div className="modal-icon" style={{ background: product.gradient }}>{product.icon}</div>
            <h2 className="modal-title">Invest in {product.name}</h2>
            <p className="modal-sub">{product.subtitle} · {product.apy}% APY</p>

            <div className="modal-field">
              <label>Investment Amount (USD)</label>
              <div className="modal-input-wrap">
                <span className="modal-input-prefix">$</span>
                <input
                  type="number"
                  placeholder={`Min $${product.minDeposit}`}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="modal-input"
                  id="invest-amount-input"
                />
              </div>
              <div className="modal-quick-amounts">
                {[500, 1000, 2500, 5000].map(v => (
                  <button key={v} className="quick-btn" onClick={() => setAmount(String(v))}>${v.toLocaleString()}</button>
                ))}
              </div>
            </div>

            {usd > 0 && (
              <div className="modal-projection">
                <div className="proj-row">
                  <span>Investment</span>
                  <span>${usd.toLocaleString()}</span>
                </div>
                <div className="proj-row">
                  <span>Duration</span>
                  <span>{product.duration ? `${product.duration} days` : 'Ongoing'}</span>
                </div>
                <div className="proj-row highlight">
                  <span>Projected Yield</span>
                  <span className="proj-yield">+${projectedYield.toFixed(2)}</span>
                </div>
                <div className="proj-row highlight">
                  <span>Projected Total</span>
                  <span className="proj-total">${(usd + projectedYield).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              className="btn-primary modal-action-btn"
              style={{ background: product.gradient, width: '100%', justifyContent: 'center' }}
              onClick={() => usd >= product.minDeposit && setStep(2)}
              id="modal-continue-btn"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="modal-title">Confirm Investment</h2>
            <div className="confirm-details">
              {[
                ['Product', product.name],
                ['Amount', `$${parseFloat(amount).toLocaleString()}`],
                ['APY', `${product.apy}%`],
                ['Duration', product.duration ? `${product.duration} days` : 'Flexible'],
                ['Projected Yield', `+$${projectedYield.toFixed(2)}`],
              ].map(([k,v]) => (
                <div className="confirm-row" key={k}>
                  <span>{k}</span><strong>{v}</strong>
                </div>
              ))}
            </div>
            <div className="modal-2btns">
              <button className="btn-secondary" onClick={() => setStep(1)} id="modal-back-btn">Back</button>
              <button className="btn-primary" onClick={() => setStep(3)} id="modal-confirm-btn"
                style={{ background: product.gradient, flex: 1, justifyContent: 'center' }}>
                Confirm
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="success-screen">
            <div className="success-icon">🎉</div>
            <h2>Investment Placed!</h2>
            <p>Your ${parseFloat(amount).toLocaleString()} investment in <strong>{product.name}</strong> is now active and earning {product.apy}% APY.</p>
            <button className="btn-primary" onClick={onClose} id="modal-done-btn"
              style={{ background: product.gradient, width: '100%', justifyContent: 'center', marginTop: 24 }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Invest() {
  const { data: availableProducts, loading } = useProducts();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  if (loading) {
    return <div style={{ padding: 40, color: '#fff' }}><h2>Loading products...</h2></div>;
  }

  const filtered = availableProducts.filter(p =>
    filter === 'All' || p.type === filter.toLowerCase()
  );

  return (
    <div className="invest-page">
      <div className="invest-header">
        <div>
          <h1 className="page-title">Investment Products</h1>
          <p className="page-sub">Choose how your crypto works for you — from safe yields to high-growth portfolios.</p>
        </div>
      </div>

      <div className="invest-filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            id={`filter-${f.toLowerCase()}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="invest-grid">
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} onInvest={setSelected} />
        ))}
      </div>

      {selected && <InvestModal product={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
