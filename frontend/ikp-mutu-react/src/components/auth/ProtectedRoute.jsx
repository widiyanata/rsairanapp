import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess } from '../../config/permissions';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAccess(user?.role, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
