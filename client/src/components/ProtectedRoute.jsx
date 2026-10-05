import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from './ui.jsx';

/**
 * Role based route guard.
 *  <ProtectedRoute role="admin">…</ProtectedRoute>
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname, message: 'Please sign in to continue.' }} />;
  }

  if (role && user.role !== role) {
    // Signed in but the wrong role - send to their own home instead of the login page
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}
