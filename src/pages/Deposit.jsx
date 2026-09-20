import { useEffect, useState } from 'react';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import { useDepositAddresses, useAddressRequests } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import DataIcon from '../components/DataIcon';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon,
  BoltIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
// All listed coins accept deposits — admin assigns each user a
// personal address per asset from the admin portal.
import './Deposit.css';

const SUPPORTED_COINS = [
  { coin: 'BTC',  name: 'Bitcoin',  icon: 'coins',    color: '#f7931a', defaultNetwork: 'Bitcoin (BTC)' },
  { coin: 'ETH',  name: 'Ethereum', icon: 'cube',     color: '#627eea', defaultNetwork: 'Ethereum (ERC-20)' },
  { coin: 'USDT', name: 'Tether',   icon: 'banknote', color: '#26a17b', defaultNetwork: 'Ethereum (ERC-20)' },
  { coin: 'SOL',  name: 'Solana',   icon: 'bolt',     color: '#9945ff', defaultNetwork: 'Solana (SOL)' },
  { coin: 'BNB',  name: 'BNB',      icon: 'coins',    color: '#f0b90b', defaultNetwork: 'BNB Smart Chain (BEP-20)' },
];

// Top-3 major currencies for the exchange calculator
const CURRENCIES = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
];

export default function Deposit() {
  const { data: dbAddresses, loading } = useDepositAddresses();
  const { data: addressRequests } = useAddressRequests();
  const { prices, fiatRates } = useCryptoPrices();
  const [selectedCoin, setSelectedCoin] = useState(SUPPORTED_COINS[0]);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [cryptoInput, setCryptoInput] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');

  const hasPendingRequest = addressRequests.some(
    r => r.asset === selectedCoin.coin && r.status === 'pending'
  );

  // Find user's specific address for the selected coin
  const userAddress = dbAddresses.find(a => a.asset === selectedCoin.coin);

  const priceRow = prices.find(p => p.coin === selectedCoin.coin);
  const price = priceRow?.price ?? 0;
  const activeCurrency =
    { ...CURRENCIES.find(c => c.code === currency), rate: fiatRates?.[currency] ?? CURRENCIES.find(c => c.code === currency).rate };
  const fmtFiat = (v) =>
    Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: v < 1 ? 4 : 2 });

  // fiat → crypto (typing fiat); the crypto input mirrors it and vice versa
  const cryptoEquiv = amount && price > 0 && parseFloat(amount) > 0
    ? (parseFloat(amount) / activeCurrency.rate / price).toFixed(6)
    : '';
  const quickAmounts = [100, 500, 1000, 5000];

  // Keep the two inputs consistent: typing fiat updates crypto and vice versa
  function handleCryptoInput(v) {
    setCryptoInput(v);
    const n = parseFloat(v);
    setAmount(n > 0 && price > 0 ? String(+(n * price * activeCurrency.rate).toFixed(2)) : '');
  }

  function handleCopy() {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // User asks for a deposit address → writes a 'pending' row via RPC.
  // An admin assigns the real address from Supabase; realtime then
  // swaps this pending card for the address + QR automatically.
  async function handleRequestAddress() {
    if (requesting || hasPendingRequest) return;
    setRequesting(true);
    setRequestError('');

    const { error: rpcError } = await supabase.rpc('request_deposit_address', {
      p_asset: selectedCoin.coin,
    });

    if (rpcError) {
      setRequestError(
        rpcError.message.includes('duplicate key')
          ? 'You already have a pending request for this asset.'
          : 'Could not submit your request. Please try again.'
      );
    }
    setRequesting(false);
  }

  // Clear any stale request error when switching coins
  useEffect(() => {
    setRequestError('');
  }, [selectedCoin.coin]);

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
          ) : userAddress?.address ? (
            <>
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
                  <span>Deposits appear in your wallet after network processing — usually within minutes.</span>
                </div>
              </div>
            </>
          ) : (
            <div className="deposit-no-address">
              <DataIcon name={selectedCoin.icon} className="deposit-no-addr-icon data-icon" style={{ color: selectedCoin.color }} />
              <h3>Address Not Assigned</h3>
              <p>You don't have a personal <strong>{selectedCoin.coin}</strong> deposit address yet.</p>

              {hasPendingRequest ? (
                <div className="deposit-request-pending">
                  <ClockIcon className="pending-icon" />
                  <div>
                    <strong>Request pending</strong>
                    <p>
                      Your {selectedCoin.coin} address request is being reviewed.
                      It will appear here automatically once approved.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  style={{ marginTop: 16, background: selectedCoin.color }}
                  onClick={handleRequestAddress}
                  disabled={requesting}
                  id="request-addr-btn"
                >
                  {requesting
                    ? 'Submitting request...'
                    : `Request ${selectedCoin.coin} Address`}
                </button>
              )}

              {requestError && (
                <p className="deposit-request-error">{requestError}</p>
              )}
            </div>
          )}
        </div>

        {/* Right — Calculator + Info */}
        <div className="deposit-right">
          {/* Calculator — fiat (USD/EUR/GBP) ⇄ selected crypto */}
          <div className="dash-card deposit-calc">
            <h3 className="deposit-calc-title">Exchange Calculator</h3>

            <div className="calc-field">
              <div className="calc-field-head">
                <label>You Send</label>
                <div className="calc-currency-pills">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      className={`calc-pill ${currency === c.code ? 'active' : ''}`}
                      onClick={() => { setCurrency(c.code); setAmount(''); }}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
              <div className="calc-input-wrap">
                <span className="calc-prefix">{activeCurrency.symbol}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={`Enter ${currency} amount`}
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
                <span className="calc-rate">
                  @ {activeCurrency.symbol}{fmtFiat(price / activeCurrency.rate)}/{selectedCoin.coin}
                </span>
              </div>
            )}

            {cryptoEquiv && (
              <div className="calc-field calc-reverse">
                <label>You Receive</label>
                <div className="calc-input-wrap">
                  <span className="calc-prefix" style={{ color: selectedCoin.color }}>
                    <DataIcon name={selectedCoin.icon} className="data-icon-inline" />
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={cryptoInput}
                    onChange={e => handleCryptoInput(e.target.value)}
                    className="calc-input"
                  />
                </div>
              </div>
            )}

            <div className="calc-quick">
              {quickAmounts.map(v => (
                <button key={v} className="quick-btn" onClick={() => { setCryptoInput(''); setAmount(String(v)); }}>
                  {activeCurrency.symbol}{v.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="calc-source-note">
              {priceRow?.source === 'live' ? 'Live market rates · USD · EUR · GBP' : 'Cached rates — refreshes automatically'}
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
