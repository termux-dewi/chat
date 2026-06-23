import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './services/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import NetworkStatus from './pages/NetworkStatus';
import './index.css';

function ProtectedRoute({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  const { token, user } = useAuthStore();
  
  if (!token) return <Navigate to="/login" />;
  if (isAdmin && user?.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network/:id"
          element={
            <ProtectedRoute>
              <NetworkStatus />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;