import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/outline';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
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

          <h1 className="confirm-title">Check your email</h1>
          <p className="confirm-body">
            We've sent a password reset link to<br />
            <strong className="confirm-email">{email}</strong>
          </p>
          <p className="confirm-hint">
            Click the link in the email to set a new password. The link expires shortly —
            if you don't see it, check your spam folder.
          </p>

          <button className="auth-button" onClick={() => navigate('/login')}>
            Back to Sign In
          </button>

          <p className="confirm-resend">
            Wrong email?{' '}
            <button className="confirm-resend-btn" onClick={() => setSent(false)}>
              Try again
            </button>
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
