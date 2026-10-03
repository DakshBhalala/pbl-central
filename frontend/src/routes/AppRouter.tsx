import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '../components/common/AppShell';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentPBLList } from '../pages/student/StudentPBLList';
import { StudentPBLDetail } from '../pages/student/StudentPBLDetail';
import { StudentCalendarPage } from '../pages/student/StudentCalendarPage';
import { StudentNotificationsPage } from '../pages/student/StudentNotificationsPage';
import { StudentProfilePage } from '../pages/student/StudentProfilePage';

// Faculty Pages
import { FacultyDashboard } from '../pages/faculty/FacultyDashboard';
import { FacultyPBLPage } from '../pages/faculty/FacultyPBLPage';
import { FacultyPBLDetailPage } from '../pages/faculty/FacultyPBLDetailPage';
import { FacultyStudentsPage } from '../pages/faculty/FacultyStudentsPage';
import { FacultyReviewsPage } from '../pages/faculty/FacultyReviewsPage';
import { FacultyProfilePage } from '../pages/faculty/FacultyProfilePage';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminDepartmentsPage } from '../pages/admin/AdminDepartmentsPage';
import { AdminAcademicPage } from '../pages/admin/AdminAcademicPage';
import { AdminSubjectsPage } from '../pages/admin/AdminSubjectsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminComponentTypesPage } from '../pages/admin/AdminComponentTypesPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminStoragePage } from '../pages/admin/AdminStoragePage';

export const AppRouter: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Root redirect logic
  const getHomeRedirect = () => {
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={getHomeRedirect()} />

      {/* Student Protected Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="pbl" element={<StudentPBLList />} />
        <Route path="pbl/:id" element={<StudentPBLDetail />} />
        <Route path="calendar" element={<StudentCalendarPage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />

        {/* Graceful redirects for removed features */}
        <Route path="timeline" element={<Navigate to="/student/calendar" replace />} />
        <Route path="groups" element={<Navigate to="/student/pbl" replace />} />
      </Route>

      {/* Faculty Protected Routes */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['FACULTY']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="pbl" element={<FacultyPBLPage />} />
        <Route path="pbl/:id" element={<FacultyPBLDetailPage />} />
        <Route path="students" element={<FacultyStudentsPage />} />
        <Route path="reviews" element={<FacultyReviewsPage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="profile" element={<FacultyProfilePage />} />

        {/* Graceful redirects for removed features */}
        <Route path="components" element={<Navigate to="/faculty/pbl" replace />} />
        <Route path="groups" element={<Navigate to="/faculty/pbl" replace />} />
        <Route path="topics" element={<Navigate to="/faculty/pbl" replace />} />
        <Route path="analytics" element={<Navigate to="/faculty/dashboard" replace />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="departments" element={<AdminDepartmentsPage />} />
        <Route path="academic" element={<AdminAcademicPage />} />
        <Route path="subjects" element={<AdminSubjectsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="component-types" element={<AdminComponentTypesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="storage" element={<AdminStoragePage />} />

        {/* Graceful redirects for removed features */}
        <Route path="pbl" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="history" element={<Navigate to="/admin/academic" replace />} />
      </Route>

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              textAlign: 'center',
              gap: '16px',
              padding: '24px',
            }}
          >
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              404
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
              The page you are looking for does not exist in PBL Central.
            </p>
            <a href="/" className="btn btn-primary">
              Return to Dashboard
            </a>
          </div>
        }
      />
    </Routes>
  );
};
