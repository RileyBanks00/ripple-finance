import { useState } from 'react';
import QRCode from 'react-qr-code';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import { useDepositAddresses } from '../hooks/useSupabase';
import DataIcon from '../components/DataIcon';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import './Deposit.css';

const SUPPORTED_COINS = [
  { coin: 'BTC',  name: 'Bitcoin',  icon: 'coins',    color: '#f7931a', defaultNetwork: 'Bitcoin (BTC)' },
  { coin: 'ETH',  name: 'Ethereum', icon: 'cube',     color: '#627eea', defaultNetwork: 'Ethereum (ERC-20)' },
  { coin: 'USDT', name: 'Tether',   icon: 'banknote', color: '#26a17b', defaultNetwork: 'Ethereum (ERC-20)' },
  { coin: 'SOL',  name: 'Solana',   icon: 'bolt',     color: '#9945ff', defaultNetwork: 'Solana (SOL)' },
  { coin: 'BNB',  name: 'BNB',      icon: 'coins',    color: '#f0b90b', defaultNetwork: 'BNB Smart Chain (BEP-20)' },
];

export default function Deposit() {
  const { data: dbAddresses, loading } = useDepositAddresses();
  const { prices } = useCryptoPrices();
  const [selectedCoin, setSelectedCoin] = useState(SUPPORTED_COINS[0]);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');

  // Find user's specific address for the selected coin
  const userAddress = dbAddresses.find(a => a.asset === selectedCoin.coin);

  const priceRow = prices.find(p => p.coin === selectedCoin.coin);
  const price = priceRow?.price ?? 0;
  const cryptoEquiv = amount && price > 0 ? (parseFloat(amount) / price).toFixed(6) : '';



  function handleCopy() {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
            <span className="coin-btn-icon" style={{ background: c.color }}><DataIcon name={c.icon} /></span>
            <span className="coin-btn-name">{c.coin}</span>
          </button>
        ))}
      </div>

      <div className="deposit-main">
        {/* Left — Address & QR */}
        <div className="deposit-addr-card dash-card">
          <div className="deposit-coin-header">
            <div className="deposit-coin-icon" style={{ background: selectedCoin.color }}>
              <DataIcon name={selectedCoin.icon} />
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
              <ExclamationTriangleIcon className="deposit-no-addr-icon" style={{ color: 'var(--accent-danger)' }} />
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
                    {copied ? <><CheckIcon className="btn-icon-sm" /> Copied!</> : <><ClipboardDocumentIcon className="btn-icon-sm" /> Copy</>}
                  </button>
                </div>
              </div>
              
              <div className="deposit-warnings">
                <div className="deposit-warn">
                  <ExclamationTriangleIcon className="warn-icon" />
                  <span>Only send <strong>{selectedCoin.coin}</strong> to this address. Sending any other asset will result in permanent loss.</span>
                </div>
                <div className="deposit-warn">
                  <InformationCircleIcon className="warn-icon" />
                  <span>Deposits require <strong>3 confirmations</strong> before they appear in your wallet.</span>
                </div>
              </div>
            </>
          ) : (
            <div className="deposit-no-address">
              <DataIcon name={selectedCoin.icon} className="deposit-no-addr-icon data-icon" style={{ color: selectedCoin.color }} />
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
            <div className="calc-source-note">
              {priceRow?.source === 'live' ? 'Using live market rate' : 'Using cached rate — refreshes automatically'}
            </div>
          </div>

          {/* Live Prices */}
          <div className="dash-card deposit-prices">
            <h3 className="deposit-calc-title">Live Crypto Prices</h3>
            <div className="deposit-price-list">
              {prices.map(p => (
                <div className="dep-price-row" key={p.coin}>
                  <span className="dep-price-icon" style={{ color: p.color }}><DataIcon name={p.icon} className="data-icon-inline" /></span>
                  <span className="dep-price-coin">{p.coin}</span>
                  <span className="dep-price-val">
                    ${p.price.toLocaleString(undefined, { maximumFractionDigits: p.price < 1 ? 4 : 2 })}
                  </span>
                  <span className={`dep-price-change ${p.change >= 0 ? 'up' : 'dn'}`}>
                    {p.change >= 0 ? '▲' : '▼'} {Math.abs(p.change).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="dash-card deposit-security">
            <div className="sec-row">
              <LockClosedIcon className="sec-icon" />
              <div>
                <strong>Bank-Level Security</strong>
                <p>All deposits are secured with 256-bit AES encryption and multi-sig wallet protection.</p>
              </div>
            </div>
            <div className="sec-row">
              <BoltIcon className="sec-icon" />
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
