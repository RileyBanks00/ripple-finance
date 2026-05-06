import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Invest from './pages/Invest';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import Deposit from './pages/Deposit';
import ProtectedRoute from './components/ProtectedRoute';
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
            <Routes>
              <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/invest"       element={<ProtectedRoute><Invest /></ProtectedRoute>} />
              <Route path="/portfolio"    element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/deposit"      element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
              <Route path="*"             element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
