import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/outline';
import './Auth.css';

const RESEND_COOLDOWN = 60; // seconds

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const cooldownRef = useRef(null);

  // Tick the resend cooldown down once per second while active
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown > 0]);

  // Normalize provider errors: never reveal whether an account exists,
  // and translate rate limits into friendly copy.
  function mapResetError(err) {
    const msg = (err?.message || err?.msg || String(err)).toLowerCase();
    if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('429')) {
      return 'Too many reset requests. Please wait a minute and try again.';
    }
    if (msg.includes('invalid') && msg.includes('email')) {
      return 'That email address looks invalid. Please check it and try again.';
    }
    // Everything else (including "user not found") gets the same generic text —
    // we always show the success screen so bots can't probe for real accounts.
    return 'If an account exists for this email, a reset link is on its way.';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(mapResetError(resetError));
      setLoading(false);
      return;
    }

    setLoading(false);
    setCooldown(RESEND_COOLDOWN);
    setSent(true);
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(mapResetError(resetError));
    } else {
      setCooldown(RESEND_COOLDOWN);
    }
    setLoading(false);
  };

  // ── Email sent confirmation screen ─────────────────────────────
  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-theme-toggle"><ThemeToggle /></div>
        <div className="auth-card confirm-card">
          <div className="confirm-icon-wrap">
            <div className="confirm-icon-ring">
              <EnvelopeOpenIcon className="confirm-icon" />
            </div>
          </div>

          <h1 className="confirm-title">Check your inbox</h1>
          <p className="confirm-body">
            If an account exists for <strong className="confirm-email">{email}</strong>,
            we've sent a link to reset your password.
          </p>
          <p className="confirm-hint">
            The link expires shortly. If it doesn't arrive within a few minutes,
            check your spam folder or request another one below.
          </p>

          <button className="auth-button" onClick={() => navigate('/login')}>
            Back to Sign In
          </button>

          <p className="confirm-resend">
            Didn't get the email?{' '}
            {cooldown > 0 ? (
              <span className="resend-cooldown">
                Resend available in {cooldown}s
              </span>
            ) : (
              <button
                className="confirm-resend-btn"
                onClick={handleResend}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Resend link'}
              </button>
            )}
          </p>
        </div>
      </div>
    );
  }

  // ── Request form ───────────────────────────────────────────────
  return (
    <div className="auth-container">
      <div className="auth-theme-toggle"><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Forgot password?</h1>
          <p className="auth-subtitle">
            Enter your account email and we'll send you a reset link.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-icon-wrap">
              <EnvelopeIcon className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-input has-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Sending reset link...' : (
              <span className="auth-button-inner">
                <PaperAirplaneIcon className="btn-icon-sm" /> Send Reset Link
              </span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Remembered it after all?
          <Link to="/login" className="auth-link">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
