import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_ITEMS, hasAccess } from '../../config/permissions';

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const { user, logout } = useAuth();

  const visibleMenuItems = MENU_ITEMS.filter(
    (item) => hasAccess(user?.role, item.roles)
  );

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header py-4 px-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="logo-circle"></div>
            <h5 className="mb-0 fw-bold ls-tight">IKP MUTU</h5>
          </div>
          {isMobile && (
            <button onClick={onClose} className="btn-icon">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <nav className="sidebar-nav px-3 flex-grow-1">
          <div className="nav-label mb-3 px-3">Menu Utama</div>
          <ul className="list-unstyled d-flex flex-column gap-1">
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
        </nav>

        <div className="sidebar-footer p-4 border-top">
          <div className="user-minimal d-flex align-items-center gap-3">
            <div className="avatar-minimal flex-center">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details overflow-hidden">
              <div className="fw-bold small text-truncate">{user?.username}</div>
              <div className="text-muted" style={{ fontSize: '10px' }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={logout}
              className="btn-icon ms-auto text-muted"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </aside>

      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}
    </>
  );
}
