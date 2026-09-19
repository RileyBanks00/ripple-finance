import { useState } from 'react';
import {
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import DataIcon from '../components/DataIcon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useWallets } from '../hooks/useSupabase';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import './Withdraw.css';

const SUPPORTED_COINS = [
  { coin: 'BTC',   label: 'Bitcoin',  network: 'Bitcoin' },
  { coin: 'ETH',   label: 'Ethereum', network: 'Ethereum (ERC-20)' },
  { coin: 'USDT',  label: 'Tether',   network: 'Ethereum (ERC-20)' },
];

const fmtUsd = (n) =>
  Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function Withdraw() {
  const { profile } = useAuth();
  const { data: wallets, loading } = useWallets();
  const { prices } = useCryptoPrices();

  const [selectedCoin, setSelectedCoin] = useState(SUPPORTED_COINS[0]);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }
  const [formError, setFormError] = useState('');

  const wallet = wallets.find((w) => w.coin === selectedCoin.coin);
  const balance = wallet?.balance ?? 0;

  const priceRow = prices.find((c) => c.coin === selectedCoin.coin);
  const price = priceRow?.price ?? 0;
  const gasFeeUsd = Number(profile?.gas_fee ?? 3.80);
  const gasFeeCrypto = price > 0 ? gasFeeUsd / price : 0;
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = amountNum * price;
  const totalCrypto = amountNum + gasFeeCrypto;
  const enough = amountNum > 0 && balance >= totalCrypto;

  function validate() {
    if (!address.trim()) return 'Enter a destination wallet address.';
    if (address.trim().length < 10) return 'That wallet address looks too short.';
    if (amountNum <= 0) return 'Enter an amount greater than 0.';
    if (!enough) {
      return `Insufficient balance: you need ${totalCrypto.toFixed(6)} ${selectedCoin.coin} (amount + gas fee) but have ${balance.toFixed(6)}.`;
    }
    return '';
  }

  function handleSendClick() {
    const err = validate();
    setFormError(err);
    if (!err) setConfirming(true);
  }

  async function handleConfirm() {
    setSending(true);
    setResult(null);

    const { data: newBalance, error } = await supabase.rpc('user_request_withdrawal', {
      p_asset: selectedCoin.coin,
      p_amount: amountNum,
      p_address: address.trim(),
      p_network: selectedCoin.network,
      p_price_usd: price,
      p_amount_usd: amountUsd,
    });

    setSending(false);
    setConfirming(false);

    if (error) {
      setResult({ ok: false, text: error.message });
    } else {
      setResult({
        ok: true,
        text: `Sent ${amountNum.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${selectedCoin.coin} (− ${gasFeeCrypto.toFixed(6)} ${selectedCoin.coin} gas). New balance: ${Number(newBalance).toFixed(6)} ${selectedCoin.coin}.`,
      });
      setAmount('');
      setAddress('');
    }
  }

  return (
    <div className="withdraw-page">
      <div className="deposit-header">
        <div>
          <h1 className="page-title">Withdraw</h1>
          <p className="page-sub">Send crypto to an external wallet — instant transfer</p>
        </div>
      </div>

      {result && (
        <div className={`withdraw-result ${result.ok ? 'ok' : 'bad'}`}>
          {result.ok
            ? <CheckCircleIcon className="result-icon" />
            : <ExclamationTriangleIcon className="result-icon" />}
          <span>{result.text}</span>
        </div>
      )}

      <div className="glass-card withdraw-card">
        {/* Coin selector */}
        <div className="coin-selector">
          {SUPPORTED_COINS.map((c) => {
            const meta = { BTC: '#f7931a', ETH: '#627eea', USDT: '#26a17b' }[c.coin];
            return (
              <button
                key={c.coin}
                className={`coin-btn ${selectedCoin.coin === c.coin ? 'active' : ''}`}
                onClick={() => { setSelectedCoin(c); setFormError(''); }}
              >
                <DataIcon name={c.coin.toLowerCase()} className="coin-btn-icon data-icon" style={{ color: meta }} />
                {c.coin}
              </button>
            );
          })}
        </div>

        {/* Balance + amounts */}
        <div className="withdraw-amounts">
          <div className="withdraw-row">
            <span className="withdraw-label">Available balance</span>
            <span className="withdraw-value">
              {loading ? '…' : `${balance.toLocaleString('en-US', { maximumFractionDigits: 8 })} ${selectedCoin.coin}`}
            </span>
          </div>
          <div className="withdraw-row">
            <span className="withdraw-label">Network</span>
            <span className="withdraw-value dim">{selectedCoin.network}</span>
          </div>
        </div>

        {/* Form */}
        <div className="withdraw-form">
          <label className="withdraw-label" htmlFor="w-amount">Amount ({selectedCoin.coin})</label>
          <input
            id="w-amount"
            className="form-input"
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setFormError(''); }}
          />
          {amountNum > 0 && price > 0 && (
            <span className="form-hint">≈ {fmtUsd(amountUsd)}</span>
          )}

          <label className="withdraw-label" htmlFor="w-address">Destination wallet address</label>
          <input
            id="w-address"
            className="form-input"
            placeholder={`Your ${selectedCoin.coin} ${selectedCoin.network} address`}
            value={address}
            onChange={(e) => { setAddress(e.target.value); setFormError(''); }}
          />
        </div>

        {formError && <p className="withdraw-error">{formError}</p>}

        <button className="btn-primary withdraw-send" onClick={handleSendClick}>
          <ArrowsRightLeftIcon className="send-icon" />
          Send {selectedCoin.coin}
        </button>
      </div>

      {/* Confirm modal */}
      {confirming && (
        <div className="modal-overlay" onClick={() => !sending && setConfirming(false)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="withdraw-modal-title">Confirm withdrawal</h3>

            <div className="confirm-row">
              <span>Amount</span>
              <strong>{amountNum.toLocaleString('en-US', { maximumFractionDigits: 8 })} {selectedCoin.coin}</strong>
            </div>
            <div className="confirm-row">
              <span>Network</span>
              <strong className="dim">{selectedCoin.network}</strong>
            </div>
            <div className="confirm-row">
              <span>Destination</span>
              <code className="confirm-addr">{address.trim()}</code>
            </div>

            {/* Gas fee notice */}
            <div className="gas-notice">
              <BoltIcon className="gas-icon" />
              <div>
                <strong>Gas fee: {fmtUsd(gasFeeUsd)}</strong>
                <p>
                  ≈ {gasFeeCrypto.toFixed(6)} {selectedCoin.coin} will be deducted on top of
                  the amount. Total: <strong>{totalCrypto.toFixed(6)} {selectedCoin.coin}</strong>.
                </p>
              </div>
            </div>

            {!enough && (
              <p className="withdraw-error">Balance changed — not enough {selectedCoin.coin} for amount + gas fee.</p>
            )}

            <div className="modal-2btns">
              <button className="btn-secondary" disabled={sending} onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={sending || !enough} onClick={handleConfirm}>
                {sending ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
