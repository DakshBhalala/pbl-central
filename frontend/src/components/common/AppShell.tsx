import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../context/AuthContext';

export const AppShell: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageTitle = (path: string): string => {
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/pbl/')) return 'PBL Detail';
    if (path.includes('/pbl')) return 'PBL Activities';
    if (path.includes('/calendar')) return 'Calendar';
    if (path.includes('/timeline')) return 'Timeline';
    if (path.includes('/groups')) return 'Project Groups';
    if (path.includes('/topics')) return 'Topics';
    if (path.includes('/reviews')) return 'Reviews';
    if (path.includes('/analytics')) return 'Analytics';
    if (path.includes('/departments')) return 'Departments';
    if (path.includes('/academic')) return 'Academic Setup';
    if (path.includes('/subjects')) return 'Subjects';
    if (path.includes('/users')) return 'User Accounts';
    if (path.includes('/component-types')) return 'Component Types';
    if (path.includes('/history')) return 'Archive';
    if (path.includes('/settings')) return 'System Settings';
    if (path.includes('/profile')) return 'Profile';
    return 'Workspace';
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-canvas)' }}>
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          title={pageTitle}
        />
        <main
          style={{
            flex: 1,
            padding: '24px 32px',
            maxWidth: 'var(--content-max-width)',
            width: '100%',
            margin: '0 auto',
          }}
          className="app-shell-main"
        >
          <div key={location.pathname} className="page-transition-wrap">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {user?.role === 'STUDENT' && <BottomNav />}

      <style>{`
        @media (max-width: 768px) {
          .app-shell-main {
            padding: 16px 14px !important;
            padding-bottom: calc(var(--bottom-nav-height) + 24px) !important;
          }
        }
      `}</style>
    </div>
  );
};
