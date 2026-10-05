import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Derive page name from route
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Dashboard', isSubpage: false };
    if (path === '/kronologi') return { title: 'Kronologi', isSubpage: false };
    if (path.startsWith('/kronologi/form')) return { title: 'Form Kronologi', isSubpage: true, backTo: '/kronologi' };
    if (path.startsWith('/grading')) return { title: 'Grading Mutu', isSubpage: false };
    if (path.startsWith('/investigasi')) return { title: 'Investigasi', isSubpage: false };
    if (path.startsWith('/users')) return { title: 'User Management', isSubpage: false };
    if (path.startsWith('/profile')) return { title: 'Profil Saya', isSubpage: false };
    return { title: 'IKP Mutu', isSubpage: false };
  };

  const { title, isSubpage, backTo } = getPageInfo();

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="header-minimal border-bottom px-3 px-md-4 py-2 py-md-3 d-flex align-items-center justify-content-between bg-white sticky-top">
      <div className="d-flex align-items-center gap-2 gap-md-3">
        {isSubpage ? (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="btn-icon mobile-header-btn"
            title="Kembali"
            aria-label="Kembali"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        ) : (
          <button
            onClick={onToggleSidebar}
            className="btn-icon mobile-header-btn d-none d-lg-flex"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            <i className={isSidebarOpen ? 'fas fa-arrow-left' : 'fas fa-bars'}></i>
          </button>
        )}

        {/* Mobile Page Title */}
        <div className="d-lg-none d-flex align-items-center gap-2">
          <span className="fw-bold fs-6 text-dark text-truncate" style={{ maxWidth: '200px' }}>
            {title}
          </span>
        </div>

        {/* Desktop Breadcrumb */}
        <div className="breadcrumb-minimal d-none d-lg-flex align-items-center gap-2 small">
          <span className="text-muted">RS Airan Raya</span>
          <span className="breadcrumb-sep">/</span>
          <span className="fw-medium">{title}</span>
        </div>
      </div>

      <div className="header-right d-flex align-items-center gap-2 gap-md-3">
        <div className="date-minimal d-none d-lg-block text-muted">{today}</div>
        <div className="v-divider d-none d-lg-block"></div>

        {/* User Role Badge on Mobile / Desktop */}
        <div className="user-badge-header d-flex align-items-center gap-2">
          <div
            className="avatar-header-pill d-flex align-items-center gap-2 px-2 py-1 rounded-pill bg-light border cursor-pointer hover-bg-subtle"
            onClick={() => navigate('/profile')}
            title="Buka Manajemen Profil"
            style={{ cursor: 'pointer' }}
          >
            <span className="avatar-letter">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="small fw-semibold text-truncate d-none d-sm-inline" style={{ maxWidth: '120px' }}>
              {user?.nama || user?.username}
            </span>
            <span className="badge bg-primary text-white text-uppercase" style={{ fontSize: '9px', padding: '2px 6px' }}>
              {user?.role || 'Staff'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

