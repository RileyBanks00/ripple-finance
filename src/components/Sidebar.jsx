import { NavLink, useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import rippleLogo from '../assets/ripple.png';
import './Sidebar.css';

const navItems = [
  { to: '/dashboard',    icon: Squares2X2Icon,    label: 'Dashboard' },
  { to: '/invest',       icon: ArrowTrendingUpIcon, label: 'Invest' },
  { to: '/portfolio',    icon: BriefcaseIcon,     label: 'Portfolio' },
  { to: '/transactions', icon: ClipboardDocumentListIcon, label: 'Transactions' },
  { to: '/deposit',      icon: ArrowDownTrayIcon, label: 'Deposit' },
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
              <span className="sidebar-link-icon"><item.icon className="sidebar-nav-icon" /></span>
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
              <button onClick={handleLogout} className="sidebar-signout-btn">
                <ArrowRightStartOnRectangleIcon className="sidebar-signout-icon" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
