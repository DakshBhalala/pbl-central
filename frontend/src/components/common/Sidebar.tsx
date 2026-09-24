import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Clock,
  Users,
  Bell,
  User,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  BarChart2,
  FolderTree,
  ListTodo,
  History,
  Settings,
  X,
  FileCheck,
  Building,
  LucideIcon,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavSection {
  title?: string;
  items: Array<{
    to: string;
    label: string;
    icon: LucideIcon;
    badge?: string | number;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  let sections: NavSection[] = [];

  if (role === 'STUDENT') {
    sections = [
      {
        title: 'WORKSPACE',
        items: [
          { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
          { to: '/student/pbl', label: 'My PBL', icon: Layers },
          { to: '/student/calendar', label: 'Calendar', icon: Calendar },
          { to: '/student/timeline', label: 'Timeline', icon: Clock },
          { to: '/student/groups', label: 'Groups', icon: Users },
        ],
      },
      {
        title: 'ACCOUNT',
        items: [
          { to: '/student/notifications', label: 'Notifications', icon: Bell },
          { to: '/student/profile', label: 'Profile', icon: User },
        ],
      },
    ];
  } else if (role === 'FACULTY') {
    sections = [
      {
        title: 'WORKSPACE',
        items: [
          { to: '/faculty/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/faculty/pbl', label: 'PBL Activities', icon: Layers },
          { to: '/faculty/components', label: 'Components', icon: ListTodo },
          { to: '/faculty/groups', label: 'Groups', icon: Users },
          { to: '/faculty/topics', label: 'Topics', icon: BookOpen },
        ],
      },
      {
        title: 'REVIEW',
        items: [
          { to: '/faculty/reviews', label: 'Submissions', icon: ClipboardCheck },
          { to: '/faculty/analytics', label: 'Analytics', icon: BarChart2 },
        ],
      },
      {
        title: 'PEOPLE',
        items: [
          { to: '/faculty/students', label: 'Students', icon: GraduationCap },
        ],
      },
      {
        title: 'ACCOUNT',
        items: [
          { to: '/faculty/profile', label: 'Profile', icon: User },
          { to: '/faculty/notifications', label: 'Notifications', icon: Bell },
        ],
      },
    ];
  } else if (role === 'ADMIN') {
    sections = [
      {
        title: 'OVERVIEW',
        items: [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
      },
      {
        title: 'INSTITUTION',
        items: [
          { to: '/admin/departments', label: 'Departments', icon: Building },
          { to: '/admin/academic', label: 'Academic Setup', icon: FolderTree },
          { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
        ],
      },
      {
        title: 'PEOPLE',
        items: [
          { to: '/admin/users', label: 'Users', icon: Users },
        ],
      },
      {
        title: 'PBL',
        items: [
          { to: '/admin/pbl', label: 'Activities', icon: Layers },
          { to: '/admin/component-types', label: 'Component Types', icon: FileCheck },
          { to: '/admin/history', label: 'History', icon: History },
        ],
      },
      {
        title: 'SYSTEM',
        items: [
          { to: '/admin/settings', label: 'Settings', icon: Settings },
        ],
      },
    ];
  }

  const profilePath =
    role === 'STUDENT' ? '/student/profile' : role === 'FACULTY' ? '/faculty/profile' : '/admin/settings';

  const userInitials = (user.name || user.username)
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <BrandLogo size={22} showText={true} textVariant="compact" />

        {mobileOpen && (
          <button
            type="button"
            className="btn btn-subtle btn-icon btn-sm mobile-only"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {sections.map((sec, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {sec.title && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  padding: '6px 10px 4px 10px',
                }}
              >
                {sec.title}
              </div>
            )}
            {sec.items.map(item => {
              const IconComp = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/student/dashboard' || item.to === '/faculty/dashboard' || item.to === '/admin/dashboard'}
                  onClick={onCloseMobile}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <IconComp size={14} className="sidebar-nav-icon" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className="badge badge-accent"
                      style={{ fontSize: '0.625rem', padding: '1px 5px' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Refined User Area Footer */}
      <Link
        to={profilePath}
        onClick={onCloseMobile}
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          textDecoration: 'none',
          transition: 'background-color var(--transition-fast)',
        }}
        className="hover-subtle"
        title="View profile and account settings"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.6875rem',
              flexShrink: 0,
            }}
          >
            {userInitials || <User size={12} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
              {user.name || user.username}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {role}
            </span>
          </div>
        </div>
      </Link>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="desktop-sidebar-wrap" style={{ height: '100vh', position: 'sticky', top: 0 }}>
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 1000,
            display: 'flex',
          }}
        >
          <div
            className="mobile-sidebar-panel"
            onClick={e => e.stopPropagation()}
            style={{
              width: 'var(--sidebar-width)',
              height: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar-wrap {
            display: none !important;
          }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
};
