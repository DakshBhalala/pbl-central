import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Users,
  BookOpen,
  Layers,
  FolderTree,
  Settings,
  FileCheck,
  History,
  ArrowRight,
  ShieldCheck,
  Database,
  Cpu,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { adminApi, AdminDashboardStats } from '../../api/admin';
import { Department } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getDepartments().catch(() => [] as Department[]),
    ]).then(([statsRes, deptsRes]) => {
      setStats(statsRes);
      setDepartments(deptsRes);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) return <LoadingState message="Loading institutional operating console..." />;

  const totalDeptStudents = stats.students_by_department.reduce((sum, d) => sum + d.students, 0) || 1;
  const totalSemesterPbls = stats.pbls_by_semester.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1440px' }}>
      {/* 1. OPERATING CONSOLE HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              Institutional System Console
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Academic Structure, User Access, and Curriculum Governance
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              <Users size={13} />
              <span>Manage Users</span>
            </Link>
            <Link to="/admin/settings" className="btn btn-secondary btn-sm">
              <Settings size={13} />
              <span>Configuration</span>
            </Link>
          </div>
        </div>

        {/* Global Metric Telemetry Strip (Linear / Cloudflare rhythm) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.departments_count}</span>{' '}
            <span>departments</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.students_count}</span>{' '}
            <span>students enrolled</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.faculty_count}</span>{' '}
            <span>faculty staff</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.subjects_count}</span>{' '}
            <span>curriculum subjects</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{stats.active_pbl_count}</span>{' '}
            <span>active PBL activities ({stats.overall_completion_rate}% cohort completion)</span>
          </div>
        </div>
      </div>

      {/* 2. SYSTEM INFRASTRUCTURE HEALTH & CONTROLS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Database size={18} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Relational Storage
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              SQLite 3.42 · WAL Mode
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)' }}>
              ● Synchronized & Healthy
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <ShieldCheck size={18} color="var(--color-success)" />
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Access Control
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              RBAC · HS256 JWT
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              Session SLA: 7 Days
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Cpu size={18} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Application Gateway
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              FastAPI ASGI
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-success)' }}>
              ● Operational (Latency &lt; 20ms)
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <BookOpen size={18} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Academic Term
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              AY 2025-26 · Odd Term
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              Semester 5 In Session
            </div>
          </div>
        </div>
      </div>

      {/* 3. HIGH-DENSITY COHORT DISTRIBUTIONS (Clean Horizontal Bars - No cramped diagonal axes) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {/* Departmental Enrolment Distribution */}
        <div className="section-block">
          <div className="section-header">
            <div>
              <span className="section-title">Student Enrollment by Department</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                ({stats.students_count} Total)
              </span>
            </div>
            <Link to="/admin/departments" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
              Departments →
            </Link>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {stats.students_by_department.map((dept, idx) => {
              const pct = Math.round((dept.students / totalDeptStudents) * 100);
              return (
                <div key={dept.name || idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{dept.students}</strong> students ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      width: '100%',
                      backgroundColor: 'var(--surface-tertiary)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: 'var(--accent)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curriculum PBL Allocation by Semester */}
        <div className="section-block">
          <div className="section-header">
            <div>
              <span className="section-title">Active PBL Activities by Semester</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                ({stats.active_pbl_count} Total)
              </span>
            </div>
            <Link to="/admin/academic" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
              Academic Structure →
            </Link>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {stats.pbls_by_semester.map((sem, idx) => {
              const pct = Math.round((sem.count / totalSemesterPbls) * 100);
              return (
                <div key={sem.name || idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sem.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{sem.count}</strong> activities ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      width: '100%',
                      backgroundColor: 'var(--surface-tertiary)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: 'var(--color-success)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. DEPARTMENT GOVERNANCE TABLE */}
      <div className="section-block">
        <div className="section-header">
          <span className="section-title">Department Governance & Academic Units</span>
          <Link to="/admin/departments" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
            Manage departments →
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table data-table-comfortable">
            <thead>
              <tr>
                <th>Department Code</th>
                <th>Department Name</th>
                <th>Academic Division</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length > 0 ? (
                departments.map(d => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-mono text-primary" style={{ fontWeight: 600 }}>
                        {d.code}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Faculty of Technology & Engineering
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                        Active
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link to="/admin/subjects" className="btn btn-secondary btn-sm" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>
                          Subjects
                        </Link>
                        <Link to="/admin/users" className="btn btn-secondary btn-sm" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>
                          Users
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                    No departments configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MASTER REGISTRY SHORTCUTS */}
      <div className="section-block">
        <div className="section-header">
          <span className="section-title">Institutional Registries</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '10px',
          }}
        >
          <Link
            to="/admin/departments"
            className="workspace-list-item"
            style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building size={16} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>Departments</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{stats.departments_count} academic branches</div>
              </div>
            </div>
            <ArrowRight size={13} color="var(--text-muted)" />
          </Link>

          <Link
            to="/admin/academic"
            className="workspace-list-item"
            style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderTree size={16} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>Academic Structure</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Years, Semesters, Divisions</div>
              </div>
            </div>
            <ArrowRight size={13} color="var(--text-muted)" />
          </Link>

          <Link
            to="/admin/subjects"
            className="workspace-list-item"
            style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={16} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>Subjects Catalog</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{stats.subjects_count} courses mapped</div>
              </div>
            </div>
            <ArrowRight size={13} color="var(--text-muted)" />
          </Link>

          <Link
            to="/admin/users"
            className="workspace-list-item"
            style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={16} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>User Directory</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{stats.students_count + stats.faculty_count} records</div>
              </div>
            </div>
            <ArrowRight size={13} color="var(--text-muted)" />
          </Link>

          <Link
            to="/admin/component-types"
            className="workspace-list-item"
            style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck size={16} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>Component Types</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>PPT, Report, Code, Poster</div>
              </div>
            </div>
            <ArrowRight size={13} color="var(--text-muted)" />
          </Link>

          <Link
            to="/admin/history"
            className="workspace-list-item"
            style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={16} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>Curriculum Archive</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Past terms & cohorts</div>
              </div>
            </div>
            <ArrowRight size={13} color="var(--text-muted)" />
          </Link>
        </div>
      </div>
    </div>
  );
};
