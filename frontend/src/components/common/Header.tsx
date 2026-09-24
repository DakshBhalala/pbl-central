import React from 'react';
import { Menu, LogOut, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenSearch?: () => void;
  title?: string;
  contextLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onOpenSearch,
  title = 'Workspace',
  contextLabel,
}) => {
  const { user, logout } = useAuth();

  // Academic Context Determination
  const defaultContext = user?.role === 'STUDENT'
    ? 'Computer Engineering · Semester 5 · Division A'
    : user?.role === 'FACULTY'
    ? 'Computer Engineering · Faculty Operations'
    : 'Institutional Management · System Console';

  const academicContext = contextLabel || defaultContext;

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '12px',
      }}
    >
      {/* Left: Mobile Menu Trigger + Academic Context Hierarchy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <button
          type="button"
          className="btn btn-secondary btn-icon btn-sm mobile-only"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={16} />
        </button>

        {/* Minimal Brand Mark on mobile when sidebar is hidden */}
        <div className="mobile-only" style={{ display: 'none' }}>
          <BrandLogo size={20} showText={false} />
        </div>

        {/* Academic Hierarchy Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          <span style={{ color: 'var(--border-strong)', fontSize: '0.75rem' }}>/</span>
          <span
            className="truncate text-secondary"
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
            title={academicContext}
          >
            {academicContext}
          </span>
        </div>
      </div>

      {/* Right: Global Spotlight Search (Ctrl+K), User Role, Notifications, Theme, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {onOpenSearch && (
          <button
            type="button"
            className="search-trigger-btn"
            onClick={onOpenSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              minWidth: '190px',
              justifyContent: 'space-between',
              transition: 'border-color var(--transition-fast)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <span>Search workspace...</span>
            </span>
            <kbd
              style={{
                fontSize: '0.65rem',
                fontFamily: 'inherit',
                padding: '1px 5px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              ⌘K
            </kbd>
          </button>
        )}

        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              backgroundColor: 'var(--surface-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
            }}
            className="user-badge"
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name || user.username}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                padding: '1px 4px',
                borderRadius: '2px',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-text)',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {user.role}
            </span>
          </div>
        )}

        <NotificationCenter />

        <button
          type="button"
          className="btn btn-secondary btn-icon btn-sm text-danger"
          onClick={logout}
          title="Sign Out"
        >
          <LogOut size={14} />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .search-trigger-btn {
            min-width: unset !important;
            padding: 4px 6px !important;
          }
          .search-trigger-btn span span,
          .search-trigger-btn kbd {
            display: none !important;
          }
          .user-badge {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
