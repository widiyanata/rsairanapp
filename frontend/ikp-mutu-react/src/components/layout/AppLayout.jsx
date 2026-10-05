import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import { useDevice } from '../../hooks/useDevice';

export default function AppLayout() {
  const { isMobile } = useDevice();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Close sidebar on route change when on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  return (
    <div
      className={`app-container ${!isSidebarOpen && !isMobile ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile-view' : ''}`}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      <main className="main-wrapper">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <div className="content-body p-3 p-sm-4 p-lg-5 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <MobileBottomNav onOpenMenu={openSidebar} />
    </div>
  );
}

