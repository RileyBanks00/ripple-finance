import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import rippleLogo from '../assets/ripple.png';
import './Auth.css';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const minLength = password.length >= 6;
  const match = password === confirmPassword && confirmPassword.length > 0;

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

    const { error: signUpError } = await signUp(email, password, fullName);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSubmitted(true);
    }
  };

  // ── Email confirmation screen ─────────────────────────────────
  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-theme-toggle"><ThemeToggle /></div>
        <div className="auth-card confirm-card">
          <div className="confirm-icon-wrap">
            <div className="confirm-icon-ring">
              <svg className="confirm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 7l10 7 10-7" />
              </svg>
            </div>
          </div>

          <h1 className="confirm-title">Check your email</h1>
          <p className="confirm-body">
            We've sent a confirmation link to<br />
            <strong className="confirm-email">{email}</strong>
          </p>
          <p className="confirm-hint">
            Click the link in the email to activate your account. If you don't see it, check your spam folder.
          </p>

          <button className="auth-button" onClick={() => navigate('/login')}>
            Go to Sign In
          </button>

          <p className="confirm-resend">
            Wrong email?{' '}
            <button className="confirm-resend-btn" onClick={() => setSubmitted(false)}>
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────
  return (
    <div className="auth-container">
      <div className="auth-theme-toggle"><ThemeToggle /></div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <div className="auth-logo-mark">
              <img src={rippleLogo} alt="Ripple Finance" className="auth-logo-img" />
            </div>
            <span className="auth-logo-text">Ripple</span>
          </div>
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Start growing your wealth with crypto</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <div className="input-icon-wrap">
              <UserIcon className="input-icon" />
              <input
                id="fullName"
                type="text"
                className="form-input has-icon"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </div>
          </div>

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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrap">
              <LockClosedIcon className="input-icon" />
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
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-icon-wrap">
              <LockClosedIcon className="input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPw ? 'text' : 'password'}
                className="form-input has-icon"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                type="button"
                className="input-trailing-btn"
                onClick={() => setShowConfirmPw((s) => !s)}
                aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPw ? <EyeSlashIcon className="input-trailing-icon" /> : <EyeIcon className="input-trailing-icon" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <span className={`form-hint ${match ? 'ok' : 'bad'}`}>
                {match ? '✓ Passwords match' : 'Passwords do not match'}
              </span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
