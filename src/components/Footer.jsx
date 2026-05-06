import { useNavigate } from 'react-router-dom';
import rippleLogo from '../assets/ripple.png';
import './Footer.css';

const footerLinks = {
  Products: [
    { label: 'Fixed Savings',      path: '/invest' },
    { label: 'High-Yield Savings', path: '/invest' },
    { label: 'Crypto Growth',      path: '/invest' },
    { label: 'Altcoin Portfolio',  path: '/invest' },
    { label: 'Deposit Crypto',     path: '/deposit' },
  ],
  Company: [
    { label: 'About Us',      path: '#' },
    { label: 'Careers',       path: '#' },
    { label: 'Press Room',    path: '#' },
    { label: 'Blog',          path: '#' },
    { label: 'Contact',       path: '#' },
  ],
  Resources: [
    { label: 'Help Center',   path: '#' },
    { label: 'API Docs',      path: '#' },
    { label: 'Status Page',   path: '#' },
    { label: 'Whitepaper',    path: '#' },
    { label: 'Security',      path: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy',      path: '#' },
    { label: 'Terms of Service',    path: '#' },
    { label: 'Cookie Policy',       path: '#' },
    { label: 'Risk Disclaimer',     path: '#' },
    { label: 'AML Policy',          path: '#' },
  ],
};

const socials = [
  { icon: '𝕏', label: 'Twitter/X', href: '#' },
  { icon: 'in', label: 'LinkedIn', href: '#' },
  { icon: 'DC', label: 'Discord', href: '#' },
  { icon: 'TG', label: 'Telegram', href: '#' },
  { icon: 'YT', label: 'YouTube', href: '#' },
];

const badges = [
  { icon: '🔐', text: 'SSL Secured' },
  { icon: '✅', text: 'KYC Compliant' },
  { icon: '🛡', text: 'SOC 2 Certified' },
  { icon: '💎', text: '$250M Insurance' },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      {/* Top CTA Banner */}
      <div className="footer-cta-banner">
        <div className="container footer-cta-inner">
          <div className="footer-cta-text">
            <h2>Ready to grow your crypto?</h2>
            <p>Join 180,000+ investors earning up to 38.5% APY on Ripple Finance.</p>
          </div>
          <div className="footer-cta-actions">
            <button className="btn-primary" onClick={() => navigate('/register')} id="footer-start-btn">
              Start Earning Now
            </button>
            <button className="btn-secondary" onClick={() => navigate('/invest')} id="footer-explore-btn">
              Explore Products
            </button>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="footer-badges">
        <div className="container footer-badges-inner">
          {badges.map(b => (
            <div className="footer-badge" key={b.text}>
              <span className="footer-badge-icon">{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container footer-main-inner">
          {/* Brand column */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-mark">
                <img src={rippleLogo} alt="Ripple" className="footer-logo-img" />
              </div>
              <span className="footer-logo-text">Ripple</span>
            </div>
            <p className="footer-brand-desc">
              The next-generation crypto investment platform. Deposit, grow, and manage your digital wealth — all in one place.
            </p>
            {/* Social Links */}
            <div className="footer-socials">
              {socials.map(s => (
                <a key={s.label} href={s.href} className="footer-social-btn" aria-label={s.label}
                  id={`footer-social-${s.label.toLowerCase().replace('/','-')}`}>
                  {s.icon}
                </a>
              ))}
            </div>

          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([cat, links]) => (
            <div className="footer-col" key={cat}>
              <h4 className="footer-col-title">{cat}</h4>
              <ul className="footer-col-links">
                {links.map(l => (
                  <li key={l.label}>
                    <a href={l.path} className="footer-link" onClick={e => {
                      if (l.path.startsWith('/')) { e.preventDefault(); navigate(l.path); }
                    }}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="footer-stats-bar">
        <div className="container footer-stats-inner">
          {[
            { label: 'Total Value Locked', value: '$2.4B+' },
            { label: 'Active Users',       value: '180K+' },
            { label: 'Avg. APY',           value: '18.6%' },
            { label: 'Uptime',             value: '99.99%' },
          ].map(s => (
            <div className="footer-stat" key={s.label}>
              <div className="footer-stat-val">{s.value}</div>
              <div className="footer-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <div className="footer-bottom-left">
            <span>© 2025 Ripple Finance, Inc. All rights reserved.</span>
            <span className="footer-separator">·</span>
            <span>Registered in Delaware, USA</span>
          </div>
          <div className="footer-bottom-right">
            <span>🌍 English (US)</span>
            <span>USD ($)</span>
            <span className="footer-regulatory">
              ⚠ Investing involves risk. Past performance is not indicative of future results. Crypto assets are highly volatile. Only invest what you can afford to lose.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
