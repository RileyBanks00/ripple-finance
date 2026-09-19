import { Navigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Suspended accounts are locked out of the app entirely.
  // Admins stay exempt so they can never lock themselves out.
  if (profile?.status === 'suspended' && profile?.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        textAlign: 'center',
        padding: 24,
      }}>
        <ShieldExclamationIcon style={{ width: 56, height: 56, color: 'var(--accent-danger)' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Account suspended</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
          This account has been suspended. If you believe this is a mistake,
          please contact support.
        </p>
      </div>
    );
  }

  return children;
}
