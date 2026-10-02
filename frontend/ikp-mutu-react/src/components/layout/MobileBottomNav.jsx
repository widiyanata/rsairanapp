import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MENU_ITEMS } from '../../config/permissions';

export default function MobileBottomNav({ onOpenMenu }) {
  const { hasAccessDynamic } = useAuth();

  const navItems = MENU_ITEMS.filter((item) => {
    let feature = 'dashboard';
    if (item.path === '/kronologi') feature = 'kronologi';
    else if (item.path === '/grading') feature = 'grading';
    else if (item.path === '/investigasi') feature = 'investigasi';
    else if (item.path === '/users') feature = 'users';

    return hasAccessDynamic(feature);
  });

  return (
    <nav className="mobile-bottom-nav d-lg-none" aria-label="Navigasi Bawah">
      <div className="mobile-nav-inner">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-icon-wrapper">
              <i className={item.icon}></i>
            </div>
            <span className="nav-label-text">{item.name}</span>
          </NavLink>
        ))}

        {/* Menu Drawer Toggle */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="mobile-nav-item mobile-nav-menu-btn"
          aria-label="Buka Menu"
        >
          <div className="nav-icon-wrapper">
            <i className="fas fa-bars"></i>
          </div>
          <span className="nav-label-text">Menu</span>
        </button>
      </div>
    </nav>
  );
}
