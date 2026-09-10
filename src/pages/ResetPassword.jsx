import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ThemeToggle from '../components/ThemeToggle';
import {
  KeyIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import './Auth.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const minLength = password.length >= 6;
  const match = password === confirm && confirm.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!minLength) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!match) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    // The recovery link logs the user in with a temporary session,
    // so updateUser can set the new password directly.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setDone(true);
  };

  // ── Success screen ─────────────────────────────────────────────
  if (done) {
    return (
      <div className="auth-container">
        <div className="auth-theme-toggle"><ThemeToggle /></div>
        <div className="auth-card confirm-card">
          <div className="confirm-icon-wrap">
            <div className="confirm-icon-ring">
              <ShieldCheckIcon className="confirm-icon" />
            </div>
          </div>

          <h1 className="confirm-title">Password updated</h1>
          <p className="confirm-body">
            Your password has been changed successfully.
          </p>
          <p className="confirm-hint">
            Use your new password next time you sign in.
          </p>

          <button className="auth-button" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── New password form ──────────────────────────────────────────
  return (
    <div className="auth-container">
      <div className="auth-theme-toggle"><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Set a new password</h1>
          <p className="auth-subtitle">
            Choose a strong password you haven't used before.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <div className="input-icon-wrap">
              <KeyIcon className="input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="form-input has-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                type="button"
                className="input-trailing-btn"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeSlashIcon className="input-trailing-icon" /> : <EyeIcon className="input-trailing-icon" />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm new password</label>
            <div className="input-icon-wrap">
              <LockClosedIcon className="input-icon" />
              <input
                id="confirm"
                type={showPw ? 'text' : 'password'}
                className="form-input has-icon"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            {confirm.length > 0 && (
              <span className={`form-hint ${match ? 'ok' : 'bad'}`}>
                {match ? '✓ Passwords match' : 'Passwords do not match'}
              </span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>

        <div className="auth-footer">
          Didn't mean to reset?
          <Link to="/login" className="auth-link">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
