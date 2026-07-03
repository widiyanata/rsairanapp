import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useDevice } from '../../hooks/useDevice';

export default function AppLayout() {
  const { isMobile } = useDevice();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div
      className={`app-container ${!isSidebarOpen && !isMobile ? 'sidebar-collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
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
        <div className="content-body p-4 p-lg-5 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
