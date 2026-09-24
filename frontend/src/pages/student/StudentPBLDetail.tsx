import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Users,
  Layers,
  Calendar,
  BookOpen,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  MessageSquareQuote,
  FileText,
} from 'lucide-react';
import { studentApi } from '../../api/student';
import { PblActivityDetail, Component, ProgressState, SubmissionState, Group, Topic } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DeadlineBadge } from '../../components/common/DeadlineBadge';
import { Drawer } from '../../components/common/Drawer';
import { Modal } from '../../components/common/Modal';
import { AppSelect } from '../../components/common/AppSelect';
import { formatDateTime, formatDate, getDaysRemainingLabel } from '../../utils/date';

export const StudentPBLDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pbl, setPbl] = useState<PblActivityDetail | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'project' | 'group' | 'timeline'>('overview');

  // Drawer state for component inspect/edit
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  // Propose topic modal
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [proposing, setProposing] = useState(false);

  // Topic pool modal
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectingTopic, setSelectingTopic] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [detailRes, groupsRes] = await Promise.all([
        studentApi.getPblDetail(Number(id)),
        studentApi.getGroups(),
      ]);
      setPbl(detailRes);
      setGroups(groupsRes.filter(g => g.pbl_activity_id === Number(id)));

      // If drawer was open, refresh selectedComponent data
      if (selectedComponent) {
        const refreshed = detailRes.components.find(c => c.id === selectedComponent.id);
        if (refreshed) setSelectedComponent(refreshed);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateProgress = async (componentId: number, state: ProgressState) => {
    try {
      await studentApi.updateProgress(componentId, state);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error updating progress');
    }
  };

  const handleUpdateSubmission = async (componentId: number, state: SubmissionState) => {
    try {
      await studentApi.updateSubmission(componentId, state);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error updating submission');
    }
  };

  const handleProposeTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pbl || !topicTitle) return;
    try {
      setProposing(true);
      const studentGroup = groups[0];
      await studentApi.proposeTopic({
        pbl_activity_id: pbl.id,
        title: topicTitle,
        description: topicDesc,
        group_id: studentGroup ? studentGroup.id : undefined,
      });
      setProposeModalOpen(false);
      setTopicTitle('');
      setTopicDesc('');
      alert('Topic proposed successfully! Automatically approved per academic regulations.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to propose topic');
    } finally {
      setProposing(false);
    }
  };

  const handleOpenPool = async () => {
    if (!pbl) return;
    setPoolModalOpen(true);
    try {
      setLoadingTopics(true);
      const res = await studentApi.getAvailableTopics(pbl.id);
      setAvailableTopics(res);
    } catch {
      // handled
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleSelectTopic = async (topicId: number) => {
    if (!pbl) return;
    try {
      setSelectingTopic(true);
      const studentGroup = groups[0];
      await studentApi.selectTopic(pbl.id, topicId, studentGroup ? studentGroup.id : undefined);
      setPoolModalOpen(false);
      alert('Topic selected from pool successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to select topic');
    } finally {
      setSelectingTopic(false);
    }
  };

  if (loading || !pbl) return <LoadingState message="Loading PBL activity details..." />;

  const myGroup = groups[0];

  // Calculate completion metrics
  const totalComps = pbl.components.length;
  const completedComps = pbl.components.filter(c => c.student_progress_state === 'DONE').length;
  const completionPct = totalComps > 0 ? Math.round((completedComps / totalComps) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Enterprise Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Student Workspace' },
          { label: 'My PBL', path: '/student/pbl' },
          { label: pbl.subject_name || pbl.title },
        ]}
        title={pbl.subject_name ? `${pbl.subject_name} PBL` : pbl.title}
        subtitle={`${pbl.subject_code ? pbl.subject_code + ' · ' : ''}${pbl.semester_name ? 'Semester ' + pbl.semester_name + ' · ' : ''}Division ${pbl.division_name || 'Assigned'}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge type="pbl" status={pbl.status} />
          </div>
        }
      />

      {/* Tab Strip with smooth mobile scrolling */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          gap: '4px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: '1px',
        }}
        className="tabs-nav"
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'components', label: `Components (${pbl.components.length})` },
          { id: 'project', label: 'Project' },
          { id: 'group', label: 'Group' },
          { id: 'timeline', label: 'Timeline' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-btn ${isActive ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW & COMPONENTS */}
      {(activeTab === 'overview' || activeTab === 'components') && (
        <div className="view-mode-transition" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Progress & Faculty Ribbon */}
          <div className="panel" style={{ padding: '18px 22px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Curriculum Progress
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {completionPct}%
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {completedComps} / {totalComps} milestones completed
                  </span>
                </div>
                <div style={{ marginTop: '8px', maxWidth: '280px' }}>
                  <ProgressBar percentage={completionPct} size="sm" />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Faculty Guides
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {pbl.faculty_members && pbl.faculty_members.length > 0
                    ? pbl.faculty_members.map(f => f.name).join(', ')
                    : 'Department Faculty Coordinator'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Schedule: {formatDate(pbl.start_date)} to {formatDate(pbl.end_date)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Topic Mode & Scope
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {pbl.topic_mode.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {myGroup ? `Group: ${myGroup.group_name} (${myGroup.group_code})` : 'Individual Track'}
                </div>
              </div>
            </div>
          </div>

          {/* Clean Components Task List Table */}
          <div className="panel" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Components & Deliverables</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Click any row to open the full submission sheet and instructions
                </p>
              </div>
            </div>

            {pbl.components.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No components currently configured for this PBL curriculum.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '6%', textAlign: 'center' }}>#</th>
                      <th style={{ width: '35%' }}>Component Deliverable</th>
                      <th style={{ width: '15%' }}>Type</th>
                      <th style={{ width: '18%' }}>Deadline</th>
                      <th style={{ width: '14%' }}>Status</th>
                      <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pbl.components.map((comp, idx) => {
                      const isDone = comp.student_progress_state === 'DONE';
                      const isInProgress = comp.student_progress_state === 'IN_PROGRESS';
                      const isOverdue = comp.deadline_state === 'OVERDUE';
                      const num = String(idx + 1).padStart(2, '0');

                      return (
                        <tr
                          key={comp.id}
                          onClick={() => setSelectedComponent(comp)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }} className="font-mono">
                            {num}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {/* Semantic Status Dot/Icon */}
                              {isDone ? (
                                <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                              ) : isOverdue ? (
                                <AlertTriangle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                              ) : isInProgress ? (
                                <Clock size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
                              ) : (
                                <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              )}
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {comp.title}
                                </span>
                                {comp.assignment_custom_description && (
                                  <div style={{ fontSize: '0.6875rem', color: 'var(--accent)' }}>
                                    Your group instructions active
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-subtle" style={{ fontSize: '0.6875rem' }}>
                              {comp.component_type_name}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.8125rem' }}>{formatDate(comp.deadline)}</span>
                              <span style={{ fontSize: '0.6875rem', color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                                {getDaysRemainingLabel(comp.deadline, comp.deadline_state)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  color: isDone ? 'var(--color-success)' : isInProgress ? 'var(--color-warning)' : 'var(--text-muted)',
                                }}
                              >
                                {isDone ? '✓ Done' : isInProgress ? '◐ In Progress' : '○ To Do'}
                              </span>
                              {comp.student_submission_state === 'SUBMITTED' && (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                  Submitted
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedComponent(comp);
                              }}
                            >
                              Sheet
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PROJECT & TOPIC */}
      {activeTab === 'project' && (
        <div className="view-mode-transition" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          <div className="panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Project Topic</h3>
              {pbl.topic_mode === 'STUDENT_PROPOSED' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setProposeModalOpen(true)}
                >
                  <PlusCircle size={13} />
                  <span>Propose Topic</span>
                </button>
              )}
              {pbl.topic_mode === 'STUDENT_LIST' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenPool}
                >
                  <PlusCircle size={13} />
                  <span>Select from Pool</span>
                </button>
              )}
            </div>

            {myGroup?.project ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current Project Assignment
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {myGroup.project.title}
                </div>
                {myGroup.project.topic && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Topic: {myGroup.project.topic}
                  </div>
                )}
                {myGroup.project.external_url && (
                  <a
                    href={myGroup.project.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                  >
                    <ExternalLink size={12} />
                    <span>Project Repository / Documentation</span>
                  </a>
                )}
              </div>
            ) : (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No project or topic has been assigned yet. Use the button above to propose or choose a topic.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: GROUP DETAILS */}
      {activeTab === 'group' && (
        <div className="panel view-mode-transition" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Assigned Project Group</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Collaborative team membership for this subject
              </p>
            </div>
            {myGroup && (
              <span className="badge badge-subtle font-mono">{myGroup.group_code}</span>
            )}
          </div>

          {myGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {myGroup.group_name}
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Team Members ({myGroup.members.length})
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Enrollment No.</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myGroup.members.map(m => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 500 }}>{m.student_name}</td>
                          <td className="font-mono text-muted">{m.enrollment_number}</td>
                          <td>
                            <span className="badge badge-subtle" style={{ fontSize: '0.6875rem' }}>
                              Member
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              You are currently registered as an individual student for this subject activity.
            </div>
          )}
        </div>
      )}

      {/* TAB: TIMELINE (Section 33: Gantt milestone schedule) */}
      {activeTab === 'timeline' && (
        <div className="section-block view-mode-transition">
          <div className="section-header">
            <span className="section-title">Timeline Schedule</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {pbl.components.length} components · {formatDate(pbl.start_date)} to {formatDate(pbl.end_date)}
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              overflowX: 'auto',
            }}
          >
            <div style={{ minWidth: '600px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pbl.components.map((comp, idx) => {
                const isDone = comp.student_progress_state === 'DONE';
                const isInProgress = comp.student_progress_state === 'IN_PROGRESS';
                const isOverdue = comp.deadline_state === 'OVERDUE';

                return (
                  <div
                    key={comp.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr 110px',
                      alignItems: 'center',
                      gap: '16px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                        {comp.title}
                      </span>
                    </div>

                    {/* Progress duration bar */}
                    <div
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--surface-secondary)',
                        height: '12px',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: isDone ? '100%' : isInProgress ? '50%' : '15%',
                          backgroundColor: isDone ? 'var(--color-success)' : isOverdue ? 'var(--color-danger)' : 'var(--accent)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="font-mono">
                      {formatDate(comp.deadline)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER FOR COMPONENT DETAILS & SUBMISSION (Section 28) */}
      <Drawer
        isOpen={Boolean(selectedComponent)}
        onClose={() => setSelectedComponent(null)}
        title={selectedComponent?.title || 'Component Deliverable'}
        subtitle={`${pbl.subject_name || 'Subject'} · ${selectedComponent?.component_type_name || ''}`}
        width="480px"
      >
        {selectedComponent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Metadata strip */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Date</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  {formatDateTime(selectedComponent.deadline)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Schedule Status</span>
                <DeadlineBadge state={selectedComponent.deadline_state} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scope</span>
                <span style={{ fontSize: '0.8125rem' }}>
                  {selectedComponent.is_group ? 'Group Deliverable' : 'Individual Submission'}
                </span>
              </div>
            </div>

            {/* Checklist Progress Switcher */}
            <AppSelect
              label="Progress Status"
              value={selectedComponent.student_progress_state || 'TODO'}
              onChange={val => handleUpdateProgress(selectedComponent.id, val as ProgressState)}
              fullWidth
              options={[
                { value: 'TODO', label: 'To Do' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'DONE', label: 'Done' },
              ]}
            />

              {/* Submission State Switcher */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>Submission Status</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <StatusBadge type="submission" status={selectedComponent.student_submission_state || 'NOT_SUBMITTED'} />
                  {selectedComponent.student_submission_state === 'REJECTED' ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                      Locked by faculty (Resubmission not permitted)
                    </span>
                  ) : selectedComponent.student_submission_state !== 'SUBMITTED' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUpdateSubmission(selectedComponent.id, 'SUBMITTED')}
                    >
                      Mark as Submitted
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} />
                      <span>Submitted for Evaluation</span>
                    </span>
                  )}
                </div>
              </div>

            {/* Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="form-label" style={{ margin: 0 }}>Instructions</span>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                }}
              >
                {selectedComponent.assignment_custom_description || selectedComponent.description || 'Follow standard department guidelines for this deliverable.'}
              </div>
            </div>

            {/* Submission & Resource Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="form-label" style={{ margin: 0 }}>External Submission & Resources</span>
              {selectedComponent.external_submission_url && (
                <a
                  href={selectedComponent.external_submission_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ justifyContent: 'center' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Submission Form (Google Form)</span>
                </a>
              )}
              {selectedComponent.external_classroom_url && (
                <a
                  href={selectedComponent.external_classroom_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Google Classroom Assignment</span>
                </a>
              )}
              {selectedComponent.external_resource_url && (
                <a
                  href={selectedComponent.external_resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  <ExternalLink size={14} />
                  <span>Access Reference Drive / Materials</span>
                </a>
              )}
            </div>

            {/* Faculty Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span className="form-label" style={{ margin: 0 }}>Faculty Guide</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {pbl.faculty_members && pbl.faculty_members.length > 0
                  ? pbl.faculty_members.map(f => f.name).join(', ')
                  : 'Department Faculty Coordinator'}
              </span>
            </div>

            {/* Faculty Feedback (if any) */}
            {selectedComponent.faculty_feedback && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-subtle)',
                  borderLeft: '3px solid var(--accent)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-text)' }}>
                  <MessageSquareQuote size={14} />
                  <span>Faculty Feedback</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', margin: 0 }}>
                  {selectedComponent.faculty_feedback}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Propose Topic Modal */}
      <Modal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        title="Propose PBL Project Topic"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setProposeModalOpen(false)}
              disabled={proposing}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleProposeTopic}
              disabled={proposing}
            >
              {proposing ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </>
        }
      >
        <form onSubmit={handleProposeTopic} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Topic Title</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Distributed Consensus Engine on Edge IoT"
              value={topicTitle}
              onChange={e => setTopicTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Brief Description & Problem Statement</label>
            <textarea
              className="textarea-box"
              rows={3}
              placeholder="Detail the technical requirements and architecture..."
              value={topicDesc}
              onChange={e => setTopicDesc(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Select from Topic Pool Modal */}
      <Modal
        isOpen={poolModalOpen}
        onClose={() => setPoolModalOpen(false)}
        title="Select Topic from Faculty Pool"
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Choose a verified topic from the faculty curriculum bank.
          </p>

          {loadingTopics ? (
            <LoadingState message="Loading available topics..." />
          ) : availableTopics.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No predefined topics are currently registered in this pool.
            </div>
          ) : (
            availableTopics.map(t => (
              <div
                key={t.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.title}</h4>
                  {t.description && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {t.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSelectTopic(t.id)}
                  disabled={selectingTopic}
                >
                  {selectingTopic ? 'Selecting...' : 'Select'}
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
