import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import rippleLogo from '../assets/ripple.png';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard',    icon: '⊞', label: 'Dashboard' },
  { to: '/invest',       icon: '📈', label: 'Invest' },
  { to: '/portfolio',    icon: '💼', label: 'Portfolio' },
  { to: '/transactions', icon: '📋', label: 'Transactions' },
  { to: '/deposit',      icon: '⬇', label: 'Deposit' },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo" onClick={() => { navigate('/'); onClose(); }}>
          <div className="sidebar-logo-mark">
            <img src={rippleLogo} alt="Ripple" className="sidebar-logo-img" />
          </div>
          <span className="sidebar-logo-text">Ripple</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
              <span className="sidebar-link-indicator" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{profile?.full_name || 'User'}</span>
              <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', fontSize: '11px', cursor: 'pointer', padding: 0, textAlign: 'left', marginTop: '2px' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
