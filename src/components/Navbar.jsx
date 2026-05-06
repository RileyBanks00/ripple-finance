import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <span /><span /><span />
      </button>

      <div className="topbar-right">
        <div className="topbar-live-badge">
          <span className="live-dot" />
          <span>Markets Live</span>
        </div>

        <button className="topbar-btn" onClick={() => navigate('/deposit')} id="nav-deposit-btn">
          <span>+</span> Deposit
        </button>

        <div className="topbar-notifications" role="button" tabIndex={0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notif-dot" />
        </div>

        <div className="topbar-avatar">
          {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}
