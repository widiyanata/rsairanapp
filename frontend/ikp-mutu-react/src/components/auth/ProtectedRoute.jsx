import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ feature }) {
  const { isAuthenticated, hasAccessDynamic } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (feature && !hasAccessDynamic(feature)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
