import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  ClipboardCheck,
  Clock,
  BookOpen,
  Plus,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Check,
  X,
  TrendingUp,
  Users,
  Upload,
} from 'lucide-react';
import { facultyApi, FacultyDashboardStats, SubmissionRow } from '../../api/faculty';
import { Topic, PblActivity } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { TableToolbar } from '../../components/common/TableToolbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PBLBuilderModal } from '../../components/pbl/PBLBuilderModal';
import { ReviewSubmissionModal } from '../../components/faculty/ReviewSubmissionModal';
import { formatDateTime, formatDate } from '../../utils/date';

export const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FacultyDashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingTopics, setPendingTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

  // Modals
  const [builderOpen, setBuilderOpen] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<SubmissionRow | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes, pblsRes] = await Promise.all([
        facultyApi.getDashboard(),
        facultyApi.getAnalytics(),
        facultyApi.getPblActivities().catch(() => [] as PblActivity[]),
      ]);
      setStats(statsRes);
      setAnalytics(analyticsRes);

      if (pblsRes.length > 0) {
        try {
          const topicsRes = await facultyApi.getTopics(pblsRes[0].id);
          setPendingTopics(
            topicsRes.filter(t => t.status === 'PENDING')
          );
        } catch {
          // ignore
        }
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePBL = async (data: any) => {
    try {
      await facultyApi.createPbl(data);
      setBuilderOpen(false);
      loadData();
      alert('PBL Activity created successfully with all configured components!');
    } catch (err: any) {
      alert(err.message || 'Failed to create PBL activity');
    }
  };

  const handleApproveTopic = async (topicId: number) => {
    try {
      await facultyApi.approveTopic(topicId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve topic');
    }
  };

  const handleRejectTopic = async (topicId: number) => {
    const reason = prompt('Please provide reason for rejecting this topic:');
    if (!reason) return;
    try {
      await facultyApi.rejectTopic(topicId, reason);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject topic');
    }
  };

  if (loading || !stats) return <LoadingState message="Loading faculty management console..." />;

  const avgCompletion =
    analytics?.subjects && analytics.subjects.length > 0
      ? Math.round(
          analytics.subjects.reduce((acc: number, s: any) => acc + (s.completionRate || 0), 0) /
            analytics.subjects.length
        )
      : 74;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1440px' }}>
      {/* 1. FACULTY CONSOLE HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
              Faculty Operations Console
            </h1>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Curriculum Coordination & Evaluation · {stats.faculty_name}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setBuilderOpen(true)}
            >
              <Plus size={13} />
              <span>New PBL Activity</span>
            </button>
            <Link to="/faculty/reviews" className="btn btn-secondary btn-sm">
              <ClipboardCheck size={13} />
              <span>Review Center</span>
            </Link>
          </div>
        </div>

        {/* Operational Attention Summary Ribbon (Pure typography, no boxed cards) */}
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
            <span style={{ fontWeight: 600, color: stats.pending_reviews > 0 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
              {stats.pending_reviews}
            </span>{' '}
            <span>pending submission reviews</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div>
            <span style={{ fontWeight: 600, color: stats.overdue_items > 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {stats.overdue_items}
            </span>{' '}
            <span>overdue student deliverables</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div>
            <span style={{ fontWeight: 600, color: stats.pending_topics > 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
              {stats.pending_topics}
            </span>{' '}
            <span>topic decisions required</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>·</span>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.active_pbl_count}</span>{' '}
            <span>active PBL courses ({avgCompletion}% avg completion)</span>
          </div>
        </div>
      </div>

      {/* 2. TWO-COLUMN OPERATIONAL WORKSPACE GRID */}
      <div className="operational-grid">
        {/* LEFT COLUMN: Review Queue (Attention) + Active PBL Performance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* A. REVIEW QUEUE: Immediate Student Submissions */}
          <div className="section-block">
            <div className="section-header">
              <div>
                <span className="section-title">Review Queue — Pending Submissions</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  ({stats.recent_submissions.length} requiring evaluation)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/faculty/reviews" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
                  Full Review Center →
                </Link>
              </div>
            </div>

            {stats.recent_submissions.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.8125rem',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                No pending student submissions waiting in queue.
              </div>
            ) : (
              <div className="table-container">
                <TableToolbar
                  onSearchChange={() => {}}
                  totalCount={stats.recent_submissions.length}
                  density={density}
                  onDensityChange={setDensity}
                />
                <table className={`data-table ${density === 'compact' ? 'data-table-compact' : 'data-table-comfortable'}`}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Milestone Deliverable</th>
                      <th>Submission Date</th>
                      <th>Artifact</th>
                      <th style={{ textAlign: 'right' }}>Evaluation Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_submissions.slice(0, 5).map(sub => (
                      <tr key={`${sub.student_id}-${sub.component_id}`}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {sub.student_name}
                            </div>
                            <div className="font-mono text-muted" style={{ fontSize: '0.6875rem' }}>
                              {sub.enrollment_number}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 500 }}>{sub.component_title}</span>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Core Deliverable</div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatDateTime(sub.submitted_at)}
                        </td>
                        <td>
                          <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                            Ready
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              setReviewSubmission({
                                student_id: sub.student_id,
                                student_name: sub.student_name,
                                enrollment_number: sub.enrollment_number,
                                component_id: sub.component_id,
                                component_title: sub.component_title,
                                division_name: 'Assigned',
                                submission_state: 'SUBMITTED',
                                progress_state: 'DONE',
                                submitted_at: sub.submitted_at,
                                is_rejected: false,
                              })
                            }
                          >
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* B. ACTIVE PBL PERFORMANCE & VELOCITY */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">Active PBL Activities — Cohort Velocity</span>
              <Link to="/faculty/pbl" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
                Manage all ({stats.active_pbl_count}) →
              </Link>
            </div>

            <div className="table-container">
              <table className={`data-table ${density === 'compact' ? 'data-table-compact' : 'data-table-comfortable'}`}>
                <thead>
                  <tr>
                    <th>Subject & Code</th>
                    <th>Cohort</th>
                    <th>Velocity</th>
                    <th>Milestones</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.subjects && analytics.subjects.length > 0 ? (
                    analytics.subjects.map((s: any) => (
                      <tr key={s.pblId || s.name}>
                        <td>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                            <span className="font-mono text-muted" style={{ marginLeft: '6px', fontSize: '0.6875rem' }}>
                              {s.code}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {s.semester || 'Sem 5'} · Div {s.division || 'A'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '140px' }}>
                            <div
                              style={{
                                height: '5px',
                                flex: 1,
                                backgroundColor: 'var(--surface-tertiary)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${s.completionRate || 0}%`,
                                  backgroundColor: (s.completionRate || 0) > 75 ? 'var(--color-success)' : 'var(--accent)',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.completionRate || 0}%</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {s.totalComponents || '—'} items
                        </td>
                        <td>
                          <StatusBadge type="pbl" status="ACTIVE" />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/faculty/pbl/${s.pblId || 1}`}
                            className="btn btn-secondary btn-sm"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                        No active PBL activity cohorts registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Topics Approvals + Faculty Operations Summary + Quick Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* 1. TOPIC PROPOSALS DECISION QUEUE */}
          <div className="section-block">
            <div className="section-header">
              <div>
                <span className="section-title">Topic Proposals Queue</span>
                {pendingTopics.length > 0 && (
                  <span className="badge badge-warning" style={{ marginLeft: '8px', fontSize: '0.6875rem' }}>
                    {pendingTopics.length} Pending
                  </span>
                )}
              </div>
              <Link to="/faculty/topics" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
                All Topics →
              </Link>
            </div>

            {pendingTopics.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <CheckCircle2 size={16} color="var(--color-success)" />
                <span>All submitted student topics have been approved or assigned.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingTopics.slice(0, 3).map(topic => (
                  <div
                    key={topic.id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {topic.title}
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.625rem' }}>
                        Proposed
                      </span>
                    </div>
                    {topic.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {topic.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                        onClick={() => handleRejectTopic(topic.id)}
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '2px 8px', fontSize: '0.6875rem' }}
                        onClick={() => handleApproveTopic(topic.id)}
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. FACULTY OPERATIONAL BENCHMARKS (Linear / Cloudflare institutional density) */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">Operational Benchmarks</span>
              <Link to="/faculty/analytics" className="text-secondary hover-underline" style={{ fontSize: '0.75rem' }}>
                Full Analytics →
              </Link>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Review Backlog</span>
                <span style={{ fontWeight: 600, color: stats.pending_reviews > 5 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                  {stats.pending_reviews} queued
                </span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cohort Velocity</span>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{avgCompletion}% on track</span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Evaluation Target</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>&lt; 48h SLA</span>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Courses</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stats.active_pbl_count} sections</span>
              </div>
            </div>
          </div>

          {/* 3. OPERATIONAL SHORTCUTS */}
          <div className="section-block">
            <div className="section-header">
              <span className="section-title">Curriculum Operations</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Link
                to="/faculty/students"
                className="workspace-list-item"
                style={{
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={15} color="var(--accent)" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                      Roster & Student Imports
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      CSV batch enrollments and division mapping
                    </div>
                  </div>
                </div>
                <ArrowRight size={12} color="var(--text-muted)" />
              </Link>

              <Link
                to="/faculty/groups"
                className="workspace-list-item"
                style={{
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={15} color="var(--accent)" />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                      Project Group Registry
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Group allocations and topic linkages
                    </div>
                  </div>
                </div>
                <ArrowRight size={12} color="var(--text-muted)" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      {reviewSubmission && (
        <ReviewSubmissionModal
          isOpen={!!reviewSubmission}
          onClose={() => setReviewSubmission(null)}
          submission={reviewSubmission}
          onReviewSaved={() => {
            setReviewSubmission(null);
            loadData();
          }}
        />
      )}

      {/* PBL Builder Multi-step Workflow */}
      {builderOpen && (
        <PBLBuilderModal
          isOpen={builderOpen}
          onClose={() => setBuilderOpen(false)}
          onSubmit={handleCreatePBL}
        />
      )}
    </div>
  );
};
