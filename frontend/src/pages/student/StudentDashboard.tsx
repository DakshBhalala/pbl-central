import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { studentApi } from '../../api/student';
import { StudentDashboardData, ProgressState, SubmissionState } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDateTime, formatDate, getDaysRemainingLabel } from '../../utils/date';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getDashboard();
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleUpdateProgress = async (componentId: number, newState: ProgressState) => {
    try {
      await studentApi.updateProgress(componentId, newState);
      loadDashboard();
    } catch (e: any) {
      alert(e.message || 'Failed to update progress');
    }
  };

  const handleUpdateSubmission = async (componentId: number, newState: SubmissionState) => {
    try {
      await studentApi.updateSubmission(componentId, newState);
      loadDashboard();
    } catch (e: any) {
      alert(e.message || 'Failed to update submission state');
    }
  };

  if (loading || !data) {
    return <LoadingState message="Loading academic workspace..." />;
  }

  const overdueCount = data.overdue_items ? data.overdue_items.length : 0;
  const urgentCount = data.upcoming_deadlines
    ? data.upcoming_deadlines.filter(c => c.deadline_state === 'DUE_SOON').length
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* 1. WORKSPACE HEADER: Academic Context & System Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: 0 }}>
              Good morning, {data.student_name}
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {data.department_name} · {data.semester_name} · Division {data.division_name}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/student/pbl" className="btn btn-secondary btn-sm">
              <Layers size={13} />
              <span>My PBL</span>
            </Link>
            <Link to="/student/calendar" className="btn btn-secondary btn-sm">
              <Calendar size={13} />
              <span>Calendar</span>
            </Link>
          </div>
        </div>

        {/* Compact System Summary (Section 24: reads like system info, not marketing stats) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <span><strong style={{ color: 'var(--text-primary)' }}>{data.total_components_count}</strong> components</span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span><strong style={{ color: 'var(--text-primary)' }}>{data.active_pbl_count}</strong> active PBLs</span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span><strong style={{ color: 'var(--color-success)' }}>{data.completed_count}</strong> completed</span>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span><strong style={{ color: 'var(--color-warning)' }}>{data.pending_count}</strong> in progress</span>
          {overdueCount > 0 && (
            <>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span><strong style={{ color: 'var(--color-danger)' }}>{overdueCount}</strong> overdue</span>
            </>
          )}
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <span><strong style={{ color: 'var(--accent)' }}>{data.overall_progress_percentage}%</strong> overall completion</span>
        </div>
      </div>

      {/* 2. TWO-COLUMN WORKSPACE GRID (Section 23: Structure around attention, work, and schedule) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.1fr)',
          gap: '20px',
          alignItems: 'start',
        }}
        className="student-dashboard-grid"
      >
        {/* LEFT PRIMARY COLUMN: Attention + My PBL Workspace + Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* ATTENTION (Overdue deliverables requiring urgent action) */}
          {(overdueCount > 0 || urgentCount > 0) && (
            <div className="section-block">
              <div className="section-header">
                <span className="section-title" style={{ color: 'var(--color-danger)' }}>
                  Attention Required
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {overdueCount > 0 ? `${overdueCount} overdue` : ''}
                  {overdueCount > 0 && urgentCount > 0 ? ' · ' : ''}
                  {urgentCount > 0 ? `${urgentCount} due soon` : ''}
                </span>
              </div>

              <div className="workspace-list">
                {data.overdue_items.map(item => (
                  <div key={item.id} className="workspace-list-item" style={{ backgroundColor: 'var(--danger-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <AlertTriangle size={15} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '1px' }}>
                          {getDaysRemainingLabel(item.deadline, item.deadline_state)} · Due {formatDateTime(item.deadline)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {item.external_submission_url && (
                        <a
                          href={item.external_submission_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <ExternalLink size={12} />
                          <span>Submit</span>
                        </a>
                      )}
                      {item.student_submission_state === 'SUBMITTED' ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>
                          ✓ Submitted
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUpdateSubmission(item.id, 'SUBMITTED')}
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MY PBL WORKSPACE: Structured Academic Rows */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">My PBL Workspace</span>
              <Link to="/student/pbl" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
                View all ({data.subject_summaries.length}) →
              </Link>
            </div>

            <div className="workspace-list">
              {data.subject_summaries.map(sub => (
                <Link
                  key={sub.pbl_id}
                  to={`/student/pbl/${sub.pbl_id}`}
                  className="workspace-list-item"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono text-secondary" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {sub.subject_code}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {sub.subject_name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Guides: {sub.faculty_names.join(', ') || 'Department Faculty'}
                    </div>
                  </div>

                  {/* Linear Progress Bar with exact completed fraction */}
                  <div style={{ width: '190px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem' }}>
                      <span className="text-secondary font-mono">{sub.completed_components}/{sub.total_components} completed</span>
                      <span className="font-semibold text-primary font-mono">{sub.percentage}%</span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        width: '100%',
                        backgroundColor: 'var(--surface-tertiary)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${sub.percentage}%`,
                          backgroundColor: sub.percentage === 100 ? 'var(--color-success)' : 'var(--accent)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  <ArrowRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY STREAM */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">Recent Activity</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified feed</span>
            </div>

            {data.recent_notifications.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No recent activity recorded.
              </div>
            ) : (
              <div className="workspace-list">
                {data.recent_notifications.slice(0, 4).map(n => (
                  <div
                    key={n.id}
                    className="workspace-list-item"
                    style={{ padding: '8px 12px', fontSize: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                      <span style={{ color: 'var(--color-success)', fontSize: '0.8125rem', marginTop: '-1px' }}>✓</span>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</span>
                        <span style={{ color: 'var(--text-muted)' }}> — </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{n.message}</span>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN: Upcoming Schedule & Academic Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* UPCOMING SCHEDULE AGENDA */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">Upcoming Schedule</span>
              <Link to="/student/calendar" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
                Agenda →
              </Link>
            </div>

            {data.upcoming_deadlines.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No upcoming milestones scheduled.
              </div>
            ) : (
              <div className="workspace-list">
                {data.upcoming_deadlines.slice(0, 5).map(comp => {
                  const isUrgent = comp.deadline_state === 'DUE_SOON' || comp.deadline_state === 'OVERDUE';
                  return (
                    <div key={comp.id} className="workspace-list-item" style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                            {comp.title}
                          </span>
                          <span className="badge badge-subtle" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                            {comp.component_type_name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6875rem' }}>
                          <span style={{ color: isUrgent ? 'var(--color-danger)' : 'var(--text-secondary)', fontWeight: 500 }}>
                            {formatDate(comp.deadline)}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>·</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {getDaysRemainingLabel(comp.deadline, comp.deadline_state)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <StatusBadge type="submission" status={comp.student_submission_state || 'NOT_SUBMITTED'} />
                        {comp.external_submission_url && (
                          <a
                            href={comp.external_submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-subtle btn-sm"
                            title="Open submission form"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACADEMIC COHORT PROFILE SUMMARY */}
          <div className="section-block" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Enrolled Academic Cohort
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Department</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Computer Eng.</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Semester</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sem 5 (Div A)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Academic Cycle</span>
                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>2026–2027</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Active Projects</span>
                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{data.active_pbl_count} Enrolled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .student-dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
