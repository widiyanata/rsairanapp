import { useLocation } from 'react-router-dom';

export default function Header({ isSidebarOpen, onToggleSidebar }) {
  const location = useLocation();

  // Derive page name from route
  const getPageName = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/kronologi')) return 'Kronologi';
    if (path.startsWith('/grading')) return 'Grading';
    if (path.startsWith('/investigasi')) return 'Investigasi';
    return '';
  };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="header-minimal border-bottom px-4 py-3 d-flex align-items-center justify-content-between bg-white">
      <div className="d-flex align-items-center gap-4">
        <button onClick={onToggleSidebar} className="btn-icon">
          <i className={isSidebarOpen ? 'fas fa-arrow-left' : 'fas fa-bars'}></i>
        </button>
        <div className="breadcrumb-minimal d-none d-md-flex align-items-center gap-2 small">
          <span className="text-muted">RS Airan Raya</span>
          <span className="breadcrumb-sep">/</span>
          <span className="fw-medium">{getPageName()}</span>
        </div>
      </div>

      <div className="header-right d-flex align-items-center gap-3">
        <div className="date-minimal d-none d-lg-block text-muted">{today}</div>
        <div className="v-divider"></div>
        <button className="btn-icon">
          <i className="far fa-bell"></i>
        </button>
      </div>
    </header>
  );
}
