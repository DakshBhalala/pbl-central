import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LoadingState } from '../components/common/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Verifying security credentials..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: '12px',
        }}
      >
        <ShieldAlert size={48} style={{ color: 'var(--danger)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>403 — Access Denied</h2>
        <p style={{ maxWidth: '420px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Your current account role (<strong>{user.role}</strong>) does not have authorization to view this administrative sector.
        </p>
        <Link
          to={
            user.role === 'STUDENT'
              ? '/student/dashboard'
              : user.role === 'FACULTY'
              ? '/faculty/dashboard'
              : '/admin/dashboard'
          }
          className="btn btn-primary"
          style={{ marginTop: '8px' }}
        >
          Return to My Workspace
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};
