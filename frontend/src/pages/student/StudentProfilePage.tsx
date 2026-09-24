import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/auth';
import { studentApi } from '../../api/student';
import { StudentDashboardData } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';

export const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Contact info state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactStatus, setContactStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    studentApi.getDashboard().then(res => {
      setProfile(res);
      setEmail(res.email || '');
      setPhone(res.phone_number || '');
      setLoading(false);
    });
  }, []);

  const handleContactUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus(null);
    try {
      setContactLoading(true);
      await studentApi.updateProfile({ email, phone_number: phone });
      setContactStatus({ type: 'success', message: 'Contact preferences updated successfully.' });
    } catch (err: any) {
      setContactStatus({ type: 'error', message: err.message || 'Failed to update contact info.' });
    } finally {
      setContactLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }

    try {
      setPasswordLoading(true);
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordStatus({ type: 'success', message: 'Account password updated successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || !profile) return <LoadingState message="Loading profile settings..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '780px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Student Workspace' },
          { label: 'Profile & Settings' },
        ]}
        title="Student Profile & Settings"
        subtitle="Manage personal communication preferences and institutional security credentials"
      />

      {/* SECTION 1: ACADEMIC IDENTITY */}
      <div className="section-block" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <User size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Academic Identity
          </span>
        </div>

        <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Full Name
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {profile.student_name}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Enrollment Number
            </div>
            <div className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {profile.enrollment_number}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Department
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {profile.department_name}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Semester & Division
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {profile.semester_name} · Division {profile.division_name}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMMUNICATIONS & CONTACT */}
      <div className="section-block" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Shield size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Communication Preferences
          </span>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {contactStatus && (
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: contactStatus.type === 'success' ? 'var(--color-success-subtle)' : 'var(--danger-subtle)',
                color: contactStatus.type === 'success' ? 'var(--color-success)' : 'var(--danger-text)',
              }}
            >
              {contactStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{contactStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleContactUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  className="input-text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Phone Number</label>
                <input
                  type="tel"
                  className="input-text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              disabled={contactLoading}
            >
              {contactLoading ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 3: SECURITY CREDENTIALS */}
      <div className="section-block" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--surface-secondary)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Lock size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Security Credentials
          </span>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {passwordStatus && (
            <div
              style={{
                marginBottom: '14px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: passwordStatus.type === 'success' ? 'var(--color-success-subtle)' : 'var(--danger-subtle)',
                color: passwordStatus.type === 'success' ? 'var(--color-success)' : 'var(--danger-text)',
              }}
            >
              {passwordStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Current Password</label>
              <input
                type="password"
                className="input-text"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>New Password (min 6 chars)</label>
              <input
                type="password"
                className="input-text"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Confirm New Password</label>
              <input
                type="password"
                className="input-text"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
