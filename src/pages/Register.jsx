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
      // By default Supabase auto-signs in if email confirmations are disabled.
      // If email confirmations are enabled, they need to check their email.
      // We will assume auto-sign-in or a simple redirect for now.
      navigate('/dashboard');
    }
  };

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
