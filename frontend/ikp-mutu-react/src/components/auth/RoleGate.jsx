import { useAuth } from '../../contexts/AuthContext';

/**
 * Conditionally render children based on dynamic feature permissions
 * Usage: <RoleGate feature="investigasi"><VerifikasiButton /></RoleGate>
 */
export default function RoleGate({ feature, children, fallback = null }) {
  const { hasAccessDynamic } = useAuth();

  if (!hasAccessDynamic(feature)) {
    return fallback;
  }

  return children;
}
