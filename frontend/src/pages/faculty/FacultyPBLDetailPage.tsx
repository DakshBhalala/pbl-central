import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Layers,
  Calendar,
  Users,
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { facultyApi, SubmissionRow } from '../../api/faculty';
import { academicApi } from '../../api/academic';
import { PblActivityDetail, Component, ComponentType, Group, Topic } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { AppSelect } from '../../components/common/AppSelect';
import { ReviewSubmissionModal } from '../../components/faculty/ReviewSubmissionModal';
import { formatDateTime, formatDate } from '../../utils/date';

export const FacultyPBLDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pbl, setPbl] = useState<PblActivityDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'components' | 'submissions' | 'groups' | 'topics'>('components');

  // Modals
  const [addComponentOpen, setAddComponentOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<SubmissionRow | null>(null);

  // Add component state
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [compTypeId, setCompTypeId] = useState<number>(1);
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compDeadline, setCompDeadline] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16)
  );
  const [compSubUrl, setCompSubUrl] = useState('');
  const [compClassUrl, setCompClassUrl] = useState('');
  const [compIsGroup, setCompIsGroup] = useState(false);
  const [compScope, setCompScope] = useState<'ALL' | 'DIVISION'>('ALL');
  const [addingComp, setAddingComp] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [detailRes, subsRes, groupsRes, topicsRes, ctsRes] = await Promise.all([
        facultyApi.getPblDetail(Number(id)),
        facultyApi.getSubmissions(Number(id)),
        facultyApi.getGroups(Number(id)),
        facultyApi.getTopics(Number(id)),
        academicApi.getComponentTypes(),
      ]);
      setPbl(detailRes);
      setSubmissions(subsRes);
      setGroups(groupsRes);
      setTopics(topicsRes);
      setComponentTypes(ctsRes);
      if (ctsRes.length > 0) setCompTypeId(ctsRes[0].id);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !compTitle) return;
    try {
      setAddingComp(true);
      await facultyApi.addComponent(Number(id), {
        component_type_id: Number(compTypeId),
        title: compTitle,
        description: compDesc,
        deadline: new Date(compDeadline).toISOString(),
        submission_required: true,
        external_submission_url: compSubUrl || null,
        external_classroom_url: compClassUrl || null,
        is_group: compIsGroup,
        assignments: [{ scope_type: compScope, target_id: null }],
      });
      setAddComponentOpen(false);
      setCompTitle('');
      setCompDesc('');
      setCompSubUrl('');
      setCompClassUrl('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to add component');
    } finally {
      setAddingComp(false);
    }
  };

  const handleDeleteComponent = async (compId: number) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;
    try {
      await facultyApi.deleteComponent(compId);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete component');
    }
  };

  if (loading || !pbl) return <LoadingState message="Loading activity details..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Console' },
          { label: 'PBL Activities', path: '/faculty/pbl' },
          { label: pbl.subject_name || pbl.title },
        ]}
        title={pbl.title}
        subtitle={`${pbl.subject_code ? pbl.subject_code + ' — ' : ''}${pbl.subject_name || ''} · Semester ${pbl.semester_name || ''}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge type="pbl" status={pbl.status} />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAddComponentOpen(true)}
            >
              <Plus size={14} />
              <span>Add Component</span>
            </button>
          </div>
        }
      />

      {/* Overview Metadata Panel */}
      <div className="panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Schedule
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {formatDate(pbl.start_date)} — {formatDate(pbl.end_date)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Faculty Coordinators
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {pbl.faculty_members.map(f => f.name).join(', ') || 'Department Faculty'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Topic Mode
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {pbl.topic_mode.replace(/_/g, ' ')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Milestones
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)', marginTop: '2px' }}>
              {pbl.components.length} components · {submissions.length} submissions
            </div>
          </div>
        </div>
      </div>

      {/* Cloudflare Tab Strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '4px' }}>
        {[
          { id: 'components', label: `Components (${pbl.components.length})` },
          { id: 'submissions', label: `Submissions (${submissions.length})` },
          { id: 'groups', label: `Groups (${groups.length})` },
          { id: 'topics', label: `Topics (${topics.length})` },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPONENTS */}
      {activeTab === 'components' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          {pbl.components.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No components configured yet. Click "Add Component" above.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Component Deliverable</th>
                    <th style={{ width: '15%' }}>Type</th>
                    <th style={{ width: '20%' }}>Deadline</th>
                    <th style={{ width: '15%' }}>Scope</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pbl.components.map(comp => (
                    <tr key={comp.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {comp.title}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-subtle">{comp.component_type_name}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatDateTime(comp.deadline)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-subtle">
                          {comp.is_group ? 'Group' : 'Individual'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {comp.external_submission_url && (
                            <a
                              href={comp.external_submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                            >
                              <ExternalLink size={12} />
                              <span>Form</span>
                            </a>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon btn-sm text-danger"
                            onClick={() => handleDeleteComponent(comp.id)}
                            title="Delete component"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="panel" style={{ overflow: 'hidden' }}>
          {submissions.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No student submissions recorded yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Student</th>
                    <th style={{ width: '15%' }}>Enrollment</th>
                    <th style={{ width: '10%' }}>Division</th>
                    <th style={{ width: '20%' }}>Deliverable</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '10%' }}>Marks</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{sub.student_name}</td>
                      <td className="font-mono text-muted">{sub.enrollment_number}</td>
                      <td>{sub.division_name || '—'}</td>
                      <td>{sub.component_title}</td>
                      <td>
                        <StatusBadge type="submission" status={sub.submission_state} />
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {sub.internal_marks != null ? `${sub.internal_marks} pts` : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReviewTarget(sub)}
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GROUPS */}
      {activeTab === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {groups.length === 0 ? (
            <div className="panel" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', gridColumn: '1 / -1' }}>
              No groups formed for this activity yet.
            </div>
          ) : (
            groups.map(g => (
              <div key={g.id} className="panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{g.group_name}</h4>
                  <span className="font-mono badge badge-subtle">{g.group_code}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Members ({g.members.length}):
                  </span>
                  <div style={{ fontSize: '0.8125rem', marginTop: '2px', color: 'var(--text-secondary)' }}>
                    {g.members.map(m => `${m.student_name} (${m.enrollment_number})`).join(', ') || 'No members assigned'}
                  </div>
                </div>
                {g.project && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Project: <strong style={{ color: 'var(--text-primary)' }}>{g.project.title}</strong>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: TOPICS */}
      {activeTab === 'topics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {topics.length === 0 ? (
            <div className="panel" style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No project topics logged for this activity.
            </div>
          ) : (
            topics.map(t => (
              <div
                key={t.id}
                className="panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  borderLeft: t.status === 'APPROVED' ? '3px solid var(--color-success)' : '3px solid var(--color-danger)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{t.title}</h4>
                    <StatusBadge type="topic" status={t.status} />
                  </div>
                  {t.description && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                      {t.description}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Proposed by: {t.proposed_by_student_name || 'Faculty Pool'} · Mode: {t.mode.replace(/_/g, ' ')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {t.status === 'APPROVED' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm text-danger"
                      onClick={async () => {
                        const reason = prompt('Enter rejection feedback reason for student:');
                        if (reason) {
                          await facultyApi.rejectTopic(t.id, reason);
                          loadAll();
                        }
                      }}
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        await facultyApi.approveTopic(t.id);
                        loadAll();
                      }}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Component Modal */}
      <Modal
        isOpen={addComponentOpen}
        onClose={() => setAddComponentOpen(false)}
        title="Add PBL Component"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddComponentOpen(false)}
              disabled={addingComp}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddComponent}
              disabled={addingComp}
            >
              {addingComp ? 'Adding...' : 'Add Component'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddComponent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <AppSelect
              label="Component Type"
              value={compTypeId}
              onChange={val => setCompTypeId(Number(val))}
              fullWidth
              options={componentTypes.map(ct => ({
                value: ct.id,
                label: ct.name,
              }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Wireshark Network Packet Inspection"
              value={compTitle}
              onChange={e => setCompTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deadline Date & Time</label>
            <input
              type="datetime-local"
              className="input-text"
              value={compDeadline}
              onChange={e => setCompDeadline(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">External Submission Google Form URL</label>
            <input
              type="url"
              className="input-text"
              placeholder="https://forms.google.com/..."
              value={compSubUrl}
              onChange={e => setCompSubUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">External Google Classroom URL</label>
            <input
              type="url"
              className="input-text"
              placeholder="https://classroom.google.com/..."
              value={compClassUrl}
              onChange={e => setCompClassUrl(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={compIsGroup}
                onChange={e => setCompIsGroup(e.target.checked)}
              />
              Group-based Task
            </label>

            <AppSelect
              size="sm"
              value={compScope}
              onChange={val => setCompScope(val as any)}
              style={{ minWidth: '220px' }}
              options={[
                { value: 'ALL', label: 'Assign to All Enrolled Students' },
                { value: 'DIVISION', label: 'Division Level' },
              ]}
            />
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewSubmissionModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          submission={reviewTarget}
          onReviewSaved={loadAll}
        />
      )}
    </div>
  );
};
