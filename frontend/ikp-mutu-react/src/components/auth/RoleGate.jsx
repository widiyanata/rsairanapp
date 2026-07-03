import { useAuth } from '../../contexts/AuthContext';
import { hasAccess } from '../../config/permissions';

/**
 * Conditionally render children based on user role
 * Usage: <RoleGate roles={['mutu', 'admin']}><VerifikasiButton /></RoleGate>
 */
export default function RoleGate({ roles, children, fallback = null }) {
  const { user } = useAuth();

  if (!user || !hasAccess(user.role, roles)) {
    return fallback;
  }

  return children;
}
