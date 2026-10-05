import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_ITEMS } from '../../config/permissions';

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const { user, logout, hasAccessDynamic } = useAuth();

  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    let feature = 'dashboard';
    if (item.path === '/kronologi') feature = 'kronologi';
    else if (item.path === '/grading') feature = 'grading';
    else if (item.path === '/investigasi') feature = 'investigasi';
    else if (item.path === '/users') feature = 'users';
    
    return hasAccessDynamic(feature);
  });

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header py-4 px-4 d-flex align-items-center justify-content-between border-bottom border-light">
          <div className="d-flex align-items-center gap-2">
            <div className="logo-circle"></div>
            <div>
              <h5 className="mb-0 fw-bold ls-tight">IKP MUTU</h5>
              <div className="text-muted" style={{ fontSize: '10px' }}>RS Airan Raya</div>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="btn-icon rounded-circle bg-light"
              style={{ width: '36px', height: '36px' }}
              aria-label="Tutup Menu"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <nav className="sidebar-nav px-3 py-3 flex-grow-1 overflow-y-auto">
          <div className="nav-label mb-2 px-3">Menu Utama</div>
          <ul className="list-unstyled d-flex flex-column gap-2 mb-3">
            {visibleMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `nav-link-minimal ${isActive ? 'active' : ''}`
                  }
                  onClick={isMobile ? onClose : undefined}
                >
                  <i className={`${item.icon} nav-icon`}></i>
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-label mb-2 px-3">Pengaturan Akun</div>
          <ul className="list-unstyled d-flex flex-column gap-2">
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `nav-link-minimal ${isActive ? 'active' : ''}`
                }
                onClick={isMobile ? onClose : undefined}
              >
                <i className="fas fa-user-cog nav-icon"></i>
                <span>Profil Saya</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer p-3 p-md-4 border-top">
          <div className="user-minimal d-flex align-items-center gap-2">
            <NavLink
              to="/profile"
              onClick={isMobile ? onClose : undefined}
              className="d-flex align-items-center gap-2 text-decoration-none text-dark flex-grow-1 overflow-hidden"
              title="Buka Profil Saya"
            >
              <div className="avatar-minimal flex-center fw-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details overflow-hidden">
                <div className="fw-bold small text-truncate" title={user?.nama || user?.username}>
                  {user?.nama || user?.username}
                </div>
                <div className="badge bg-secondary-subtle text-secondary text-uppercase" style={{ fontSize: '9px' }}>
                  {user?.role}
                </div>
              </div>
            </NavLink>
            <button
              onClick={logout}
              className="btn-icon ms-auto text-danger p-2"
              title="Logout"
              aria-label="Keluar Aplikasi"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      {isMobile && isOpen && (
        <div className="sidebar-overlay active" onClick={onClose}></div>
      )}
    </>
  );
}
