import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import rippleLogo from '../assets/ripple.png';
import './Auth.css';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
            <input
              id="fullName"
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
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
