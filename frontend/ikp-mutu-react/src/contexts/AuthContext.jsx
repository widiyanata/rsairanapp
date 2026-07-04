import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [permissions, setPermissions] = useState([]);

  const fetchPermissions = async () => {
    try {
      const { data } = await api.get('/getPermissions');
      setPermissions(data.data || []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  const hasAccessDynamic = useCallback((featureName) => {
    if (!user) return false;
    // admin always has full bypass
    if (user.role === 'admin') return true;
    
    // Check database entries
    return permissions.some(
      (p) => p.role.toLowerCase() === user.role.toLowerCase() && p.feature.toLowerCase() === featureName.toLowerCase()
    );
  }, [user, permissions]);

  const login = useCallback((userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('_temp_user');
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    permissions,
    hasAccessDynamic,
    refreshPermissions: fetchPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
