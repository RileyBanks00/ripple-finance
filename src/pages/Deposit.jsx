import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { cryptoPrices } from '../data/mockData';
import { useDepositAddresses } from '../hooks/useSupabase';
import './Deposit.css';

const SUPPORTED_COINS = [
  { coin: 'BTC',  name: 'Bitcoin',  icon: '₿', color: '#f7931a', defaultNetwork: 'Bitcoin (BTC)' },
  { coin: 'ETH',  name: 'Ethereum', icon: 'Ξ', color: '#627eea', defaultNetwork: 'Ethereum (ERC-20)' },
  { coin: 'USDT', name: 'Tether',   icon: '₮', color: '#26a17b', defaultNetwork: 'Ethereum (ERC-20)' },
  { coin: 'SOL',  name: 'Solana',   icon: '◎', color: '#9945ff', defaultNetwork: 'Solana (SOL)' },
  { coin: 'BNB',  name: 'BNB',      icon: 'B', color: '#f0b90b', defaultNetwork: 'BNB Smart Chain (BEP-20)' },
];

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}



export default function Deposit() {
  const { data: dbAddresses, loading } = useDepositAddresses();
  const [selectedCoin, setSelectedCoin] = useState(SUPPORTED_COINS[0]);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');

  // Find user's specific address for the selected coin
  const userAddress = dbAddresses.find(a => a.asset === selectedCoin.coin);

  const price = cryptoPrices.find(p => p.coin === selectedCoin.coin)?.price || 1;
  const cryptoEquiv = amount ? (parseFloat(amount) / price).toFixed(6) : '';

  const isAvailable = selectedCoin.coin === 'BTC' || selectedCoin.coin === 'USDT';

  function handleCopy() {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="deposit-page">
      <div className="deposit-header">
        <div>
          <h1 className="page-title">Deposit Crypto</h1>
          <p className="page-sub">Send crypto to your Ripple wallet to start investing.</p>
        </div>
      </div>

      {/* Coin selector */}
      <div className="coin-selector">
        {SUPPORTED_COINS.map(c => (
          <button
            key={c.coin}
            className={`coin-btn ${selectedCoin.coin === c.coin ? 'active' : ''}`}
            onClick={() => setSelectedCoin(c)}
            id={`coin-btn-${c.coin.toLowerCase()}`}
            style={{ '--ccolor': c.color }}
          >
            <span className="coin-btn-icon" style={{ background: c.color }}>{c.icon}</span>
            <span className="coin-btn-name">{c.coin}</span>
          </button>
        ))}
      </div>

      <div className="deposit-main">
        {/* Left — Address & QR */}
        <div className="deposit-addr-card dash-card">
          <div className="deposit-coin-header">
            <div className="deposit-coin-icon" style={{ background: selectedCoin.color }}>
              {selectedCoin.icon}
            </div>
            <div>
              <h2 className="deposit-coin-name">{selectedCoin.name} ({selectedCoin.coin})</h2>
              <p className="deposit-coin-network">{userAddress?.network || selectedCoin.defaultNetwork}</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#8892b0' }}>Loading deposit details...</div>
          ) : !isAvailable ? (
            <div className="deposit-no-address" style={{ borderColor: 'rgba(255,79,109,0.3)', background: 'rgba(255,79,109,0.02)' }}>
              <div className="deposit-no-addr-icon" style={{ color: '#ff4f6d' }}>⚠</div>
              <h3>Temporarily Unavailable</h3>
              <p>Deposits via this platform for <strong>{selectedCoin.coin}</strong> are temporarily unavailable. Please select BTC or USDT instead.</p>
            </div>
          ) : userAddress ? (
            <>
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-flex', margin: '32px auto' }}>
                <QRCode value={userAddress.address} size={180} />
              </div>
              
              <div className="deposit-address-box">
                <div className="deposit-addr-label">Your Personal Deposit Address</div>
                <div className="deposit-addr-row">
                  <code className="deposit-addr-text">{userAddress.address}</code>
                  <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} id="copy-addr-btn">
                    {copied ? '✓ Copied!' : <><CopyIcon /> Copy</>}
                  </button>
                </div>
              </div>
              
              <div className="deposit-warnings">
                <div className="deposit-warn">
                  <span className="warn-icon">⚠</span>
                  <span>Only send <strong>{selectedCoin.coin}</strong> to this address. Sending any other asset will result in permanent loss.</span>
                </div>
                <div className="deposit-warn">
                  <span className="warn-icon">ℹ</span>
                  <span>Deposits require <strong>3 confirmations</strong> before they appear in your wallet.</span>
                </div>
              </div>
            </>
          ) : (
            <div className="deposit-no-address">
              <div className="deposit-no-addr-icon" style={{ color: selectedCoin.color }}>{selectedCoin.icon}</div>
              <h3>Address Not Assigned</h3>
              <p>You don't have a personal <strong>{selectedCoin.coin}</strong> deposit address yet.</p>
              <button className="btn-primary" style={{ marginTop: 16, background: selectedCoin.color }}>
                Request {selectedCoin.coin} Address
              </button>
            </div>
          )}
        </div>

        {/* Right — Calculator + Info */}
        <div className="deposit-right">
          {/* Calculator */}
          <div className="dash-card deposit-calc">
            <h3 className="deposit-calc-title">Amount Calculator</h3>
            <div className="calc-field">
              <label>USD Amount</label>
              <div className="calc-input-wrap">
                <span className="calc-prefix">$</span>
                <input
                  type="number"
                  placeholder="Enter USD amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="calc-input"
                  id="deposit-amount-input"
                />
              </div>
            </div>
            {cryptoEquiv && (
              <div className="calc-result">
                <span>≈</span>
                <span className="calc-crypto" style={{ color: selectedCoin.color }}>
                  {cryptoEquiv} {selectedCoin.coin}
                </span>
                <span className="calc-rate">@ ${price.toLocaleString()}/{selectedCoin.coin}</span>
              </div>
            )}
            <div className="calc-quick">
              {[100, 500, 1000, 5000].map(v => (
                <button key={v} className="quick-btn" onClick={() => setAmount(String(v))}>${v.toLocaleString()}</button>
              ))}
            </div>
          </div>

          {/* Live Prices */}
          <div className="dash-card deposit-prices">
            <h3 className="deposit-calc-title">Live Crypto Prices</h3>
            <div className="deposit-price-list">
              {cryptoPrices.map(p => (
                <div className="dep-price-row" key={p.coin}>
                  <span className="dep-price-icon" style={{ color: p.color }}>{p.icon}</span>
                  <span className="dep-price-coin">{p.coin}</span>
                  <span className="dep-price-val">${p.price.toLocaleString()}</span>
                  <span className={`dep-price-change ${p.change >= 0 ? 'up' : 'dn'}`}>
                    {p.change >= 0 ? '▲' : '▼'} {Math.abs(p.change)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="dash-card deposit-security">
            <div className="sec-row">
              <span className="sec-icon">🔐</span>
              <div>
                <strong>Bank-Level Security</strong>
                <p>All deposits are secured with 256-bit AES encryption and multi-sig wallet protection.</p>
              </div>
            </div>
            <div className="sec-row">
              <span className="sec-icon">⚡</span>
              <div>
                <strong>Instant Allocation</strong>
                <p>Funds are allocated to your chosen investment product immediately after confirmation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
