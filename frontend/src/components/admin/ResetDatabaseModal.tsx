import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, Database, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';

interface ResetDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetDatabaseModal: React.FC<ResetDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await adminApi.resetDatabase();
      success(res.message || 'Database reset to clean demo data successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err?.detail || err?.message || 'Failed to reset database. Please try again.';
      error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface-primary, #ffffff)',
          borderRadius: '12px',
          animation: 'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-secondary, #fafafa)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Reset Database to Demo Data
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Restore clean demo curriculum and sample projects for faculty presentation
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '4px',
                borderRadius: '6px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
              <strong>Notice:</strong> This action clears existing test submissions and re-populates the database with fresh official demo data so you can present a clean system to faculty.
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              What will be restored:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                <strong>15 Realistic Subjects:</strong> CS506 Web App Development, CS507 Cloud Computing, CS508 Cyber Security, CS301 DSA, IT501 Mobile Apps, etc.
              </li>
              <li>
                <strong>Clean Academic Structure:</strong> Current 2026–27 Academic Year, Semesters 3, 5, and 7 (all old 2025 data removed).
              </li>
              <li>
                <strong>Pre-configured Accounts:</strong> Administrator (<code>admin</code>), Faculty (<code>faculty01</code>, <code>faculty02</code>), and Students (<code>230101</code>, <code>230102</code>, etc.).
              </li>
              <li>
                <strong>Sample PBL Activities:</strong> Active Computer Networks, DBMS, OS, AI, plus a <strong>Draft (Hidden)</strong> Web App Development PBL for testing quiet editing and publishing.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: 'var(--surface-secondary, #fafafa)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{
              backgroundColor: '#d97706',
              borderColor: '#b45309',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Resetting Database...</span>
              </>
            ) : (
              <>
                <RotateCcw size={14} />
                <span>Yes, Reset to Demo Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
