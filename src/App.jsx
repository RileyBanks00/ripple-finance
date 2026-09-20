import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Invest from './pages/Invest';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/globals.css';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-root">
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-main">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="app-content">
            <ErrorBoundary>
              <Routes>
                <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/invest"       element={<ProtectedRoute><Invest /></ProtectedRoute>} />
                <Route path="/portfolio"    element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/deposit"      element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
                <Route path="/withdraw"     element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
                <Route path="/admin"        element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
                <Route path="*"             element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}

// Only profiles with role='admin' may pass; everyone else is bounced.
function AdminRoute({ children }) {
  const { profile } = useAuth();
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Redirect already-logged-in users away from auth pages
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
