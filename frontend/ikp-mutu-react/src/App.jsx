import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KronologiList from './pages/kronologi/KronologiList';
import KronologiForm from './pages/kronologi/KronologiForm';
import GradingForm from './pages/grading/GradingForm';
import InvestigasiForm from './pages/investigasi/InvestigasiForm';
import { ROLES } from './config/permissions';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Kronologi — Perawat, Lainya */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.PERAWAT, ROLES.LAINYA, ROLES.ADMIN]} />}>
            <Route path="/kronologi" element={<KronologiList />} />
            <Route path="/kronologi/form" element={<KronologiForm />} />
            <Route path="/kronologi/form/:id" element={<KronologiForm />} />
          </Route>

          {/* Grading — Karu */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.KARU, ROLES.ADMIN]} />}>
            <Route path="/grading" element={<GradingForm />} />
          </Route>

          {/* Investigasi — Mutu */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.MUTU, ROLES.ADMIN]} />}>
            <Route path="/investigasi" element={<InvestigasiForm />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
