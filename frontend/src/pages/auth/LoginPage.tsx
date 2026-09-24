import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check, Shield, User, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('230101');
  const [password, setPassword] = useState('Student@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user.role === 'STUDENT') navigate('/student/dashboard');
      else if (user.role === 'FACULTY') navigate('/faculty/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setShowDemoMenu(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        position: 'relative',
      }}
    >
      {/* Top Utility Bar with Theme Toggle & Institutional Badge */}
      <header
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrandLogo size={22} showText={false} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            PBL Central
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Academic Session 2026–2027
          </span>
        </div>
      </header>

      {/* Centered Structured Authentication Panel */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          zIndex: 1,
        }}
      >
        {/* Workspace Card */}
        <div
          className="login-card-enter"
          style={{
            width: '100%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Card Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BrandLogo size={28} showText={false} />
              <div>
                <h1
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  PBL Central
                </h1>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                  }}
                >
                  Academic Workspace
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                marginTop: '8px',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Sign in to manage enrolled curricula, student groups, milestone deliverables, and evaluation rubrics.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--danger-subtle)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--danger-text)',
                fontSize: '0.75rem',
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                Enrollment Number / Username
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="e.g. 230101 or faculty01"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                style={{ height: '36px', fontSize: '0.8125rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                Account Password
              </label>
              <input
                type="password"
                className="input-text"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ height: '36px', fontSize: '0.8125rem' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                height: '36px',
                marginTop: '6px',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign in to Workspace'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {/* Demo Account Switcher (Section 21) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick evaluation access:</span>
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                style={{ fontSize: '0.75rem', gap: '4px', color: 'var(--text-secondary)' }}
              >
                <span>Use demo account</span>
                <ChevronDown
                  size={12}
                  style={{
                    transform: showDemoMenu ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--transition-fast)',
                  }}
                />
              </button>
            </div>

            {showDemoMenu && (
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '6px',
                  backgroundColor: 'var(--surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                {[
                  { label: 'Student Persona', sub: 'Rahul Patel (230101)', u: '230101', p: 'Student@123' },
                  { label: 'Faculty Guide', sub: 'Dr. Rajesh Sharma (faculty01)', u: 'faculty01', p: 'Faculty@123' },
                  { label: 'System Administrator', sub: 'Institutional Admin (admin)', u: 'admin', p: 'Admin@123' },
                ].map(item => {
                  const isSelected = username === item.u;
                  return (
                    <button
                      key={item.u}
                      type="button"
                      onClick={() => selectDemoAccount(item.u, item.p)}
                      style={{
                        padding: '6px 10px',
                        background: isSelected ? 'var(--surface)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-xs)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {item.sub}
                        </div>
                      </div>
                      {isSelected && <Check size={12} style={{ color: 'var(--accent)' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Academic Context */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <div>Department of Computer Engineering · Session 2026–2027</div>
          <div style={{ fontSize: '0.6875rem', marginTop: '2px', color: 'var(--text-muted)' }}>
            Subject-wise Problem-Based Learning Management System
          </div>
        </div>
      </div>
    </div>
  );
};
