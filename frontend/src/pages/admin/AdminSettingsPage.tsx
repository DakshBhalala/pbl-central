import React, { useState } from 'react';
import { Settings, Database, Shield, Server, CheckCircle2, Lock, Terminal, Cpu, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ResetDatabaseModal } from '../../components/admin/ResetDatabaseModal';

export const AdminSettingsPage: React.FC = () => {
  const [showResetModal, setShowResetModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '880px' }}>
      <ResetDatabaseModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={() => {}}
      />
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'System Settings' },
        ]}
        title="Instance Parameters & Infrastructure"
        subtitle="Server environment parameters, database engine drivers, security policies, and notification gateway configuration"
      />

      {/* SECTION 1: INFRASTRUCTURE & STORAGE */}
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
          <Database size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Relational Persistence & Storage
          </span>
        </div>

        <div className="workspace-list">
          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '580px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Relational Database Engine
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Configured with local relational SQLite for instant zero-dependency execution. PostgreSQL is production-ready via <code>DATABASE_URL</code>.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success font-mono">SQLite (Active)</span>
              <span className="badge badge-subtle font-mono">Postgres-Ready</span>
            </div>
          </div>

          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '580px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Foreign Key Constraints & Referential Integrity
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Strict relational integrity enforced across College, Department, Semester, Subject, PBL, Group, and Component hierarchies.
              </span>
            </div>
            <span className="badge badge-success">Enforced</span>
          </div>

          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.03)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '540px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RotateCcw size={14} style={{ color: '#d97706' }} />
                <span>Demo Data Environment Reset</span>
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Restore clean demo data anytime for faculty presentation (15 realistic subjects, Semesters 3/5/7, pre-configured faculty/students, and active/draft PBL activities).
              </span>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#d97706',
                borderColor: 'rgba(217, 119, 6, 0.35)',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Database</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACCESS CONTROL & SECURITY */}
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
            Access Control & Confidentiality
          </span>
        </div>

        <div className="workspace-list">
          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '580px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Multi-Role Authorization (RBAC)
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Token-verified role boundaries across Administrator, Faculty Guide/Coordinator, and Enrolled Student roles.
              </span>
            </div>
            <span className="badge badge-success">3 Roles Active</span>
          </div>

          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '580px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Internal Evaluation Confidentiality
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Faculty marks, rubric assessments, and private notes are restricted from student API responses and serialization schemas.
              </span>
            </div>
            <span className="badge badge-success">Isolated</span>
          </div>

          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '580px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Department Isolation Boundary
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Students and faculty belong strictly to their academic departments unless assigned as multi-department coordinators.
              </span>
            </div>
            <span className="badge badge-success">Enforced</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: NOTIFICATIONS & DISPATCH */}
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
          <Server size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Notification & Delivery Gateway
          </span>
        </div>

        <div className="workspace-list">
          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '580px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Dispatch Gateway Provider
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Currently operating in zero-cost development broadcast mode with console logging. Production SMTP can be configured in <code>.env</code>.
              </span>
            </div>
            <span className="badge badge-accent">Console Broadcast</span>
          </div>

          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '580px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Delivery Channels
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                In-app notification feed, deadline reminders, and faculty review status change alerts.
              </span>
            </div>
            <span className="badge badge-subtle">In-App + Terminal</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: ACADEMIC CONTEXT PARAMETERS */}
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
          <Cpu size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Academic Environment Configuration
          </span>
        </div>

        <div className="workspace-list">
          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Current Academic Session
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Active calendar cycle for subject enrollment and grading.
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>2026–2027</span>
          </div>

          <div className="workspace-list-item" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Default Primary Department
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Base department context for multi-cohort operations.
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Department of Computer Engineering</span>
          </div>
        </div>
      </div>
    </div>
  );
};
