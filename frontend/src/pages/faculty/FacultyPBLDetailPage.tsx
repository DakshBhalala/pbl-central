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
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { facultyApi, SubmissionRow } from '../../api/faculty';
import { academicApi } from '../../api/academic';
import { PblActivityDetail, Component, ComponentType, Group, Topic } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { MilestoneModal, MilestoneFormData } from '../../components/faculty/MilestoneModal';
import { ReviewSubmissionModal } from '../../components/faculty/ReviewSubmissionModal';
import { formatDateTime, formatDate } from '../../utils/date';
import { useToast } from '../../context/ToastContext';

export const FacultyPBLDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [pbl, setPbl] = useState<PblActivityDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const [activeTab, setActiveTab] = useState<'components' | 'submissions' | 'groups'>('components');

  // Modals
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [activeMilestoneForEdit, setActiveMilestoneForEdit] = useState<Component | null>(null);
  const [editPblOpen, setEditPblOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<SubmissionRow | null>(null);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);

  // Edit PBL state
  const [editPblTitle, setEditPblTitle] = useState('');
  const [editPblDesc, setEditPblDesc] = useState('');
  const [editPblStartDate, setEditPblStartDate] = useState('');
  const [editPblEndDate, setEditPblEndDate] = useState('');
  const [savingPbl, setSavingPbl] = useState(false);

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

      setEditPblTitle(detailRes.title);
      setEditPblDesc(detailRes.description || '');
      setEditPblStartDate(detailRes.start_date);
      setEditPblEndDate(detailRes.end_date);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleTogglePublish = async () => {
    if (!pbl || !id) return;
    const isCurrentlyDraft = pbl.status === 'DRAFT';
    const nextStatus = isCurrentlyDraft ? 'ACTIVE' : 'DRAFT';

    try {
      setTogglingStatus(true);
      await facultyApi.updatePbl(Number(id), { status: nextStatus });
      if (isCurrentlyDraft) {
        toast.success('PBL activity published! Students have been notified.');
      } else {
        toast.info('PBL is now hidden. You can make changes quietly without notifying students.');
      }
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update visibility status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSavePblDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editPblTitle.trim()) return;

    try {
      setSavingPbl(true);
      await facultyApi.updatePbl(Number(id), {
        title: editPblTitle.trim(),
        description: editPblDesc.trim() || null,
        start_date: editPblStartDate,
        end_date: editPblEndDate,
      });
      setEditPblOpen(false);
      toast.success(
        pbl?.status === 'ACTIVE'
          ? 'Project updated successfully! Enrolled students have been notified.'
          : 'Project details saved in draft mode.'
      );
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update project details');
    } finally {
      setSavingPbl(false);
    }
  };

  const handleMilestoneSubmit = async (data: MilestoneFormData) => {
    if (!id) return;
    try {
      if (activeMilestoneForEdit) {
        await facultyApi.updateComponent(activeMilestoneForEdit.id, {
          component_type_id: data.component_type_id,
          title: data.title.trim(),
          description: data.description.trim() || null,
          deadline: new Date(data.deadline).toISOString(),
          submission_required: true,
          external_submission_url: data.external_submission_url.trim() || null,
          external_classroom_url: data.external_classroom_url.trim() || null,
          is_group: data.is_group,
        });
        toast.success(
          pbl?.status === 'ACTIVE'
            ? 'Milestone updated successfully! Changes reflected to students with notification.'
            : 'Milestone saved quietly in draft mode.'
        );
      } else {
        await facultyApi.addComponent(Number(id), {
          component_type_id: data.component_type_id,
          title: data.title.trim(),
          description: data.description.trim() || null,
          deadline: new Date(data.deadline).toISOString(),
          submission_required: true,
          external_submission_url: data.external_submission_url.trim() || null,
          external_classroom_url: data.external_classroom_url.trim() || null,
          is_group: data.is_group,
          assignments: [{ scope_type: data.scope_type, target_id: null }],
        });
        toast.success(
          pbl?.status === 'ACTIVE'
            ? 'Milestone added successfully! Assigned students have been notified.'
            : 'Milestone added quietly to draft project.'
        );
      }
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save milestone');
      throw err;
    }
  };

  const handleDeleteComponent = async (compId: number) => {
    if (!window.confirm('Are you sure you want to delete this milestone deliverable?')) return;
    try {
      await facultyApi.deleteComponent(compId);
      toast.success('Milestone deleted successfully');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete milestone');
    }
  };

  if (loading || !pbl) return <LoadingState message="Loading activity details..." />;

  const isDraft = pbl.status === 'DRAFT';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty' },
          { label: 'PBL Projects', path: '/faculty/pbl' },
          { label: pbl.subject_name || pbl.title },
        ]}
        title={pbl.title}
        subtitle={`${pbl.subject_code ? pbl.subject_code + ' — ' : ''}${pbl.subject_name || ''} · Semester ${pbl.semester_name || ''}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <StatusBadge type="pbl" status={pbl.status} />

            {/* Hide / Publish Toggle Action */}
            <button
              type="button"
              className={`btn btn-sm ${isDraft ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleTogglePublish}
              disabled={togglingStatus}
              title={
                isDraft
                  ? 'Currently hidden. Students cannot see this project. Click to publish to students.'
                  : 'Currently published. Click to hide this project from students while editing.'
              }
            >
              {isDraft ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{isDraft ? 'Publish Project' : 'Hide Project (Draft)'}</span>
            </button>

            {/* Edit PBL Details Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditPblOpen(true)}
              title="Edit project title, dates, and instructions"
            >
              <Edit3 size={14} />
              <span>Edit Details</span>
            </button>

            {/* Add Component Deliverable Button */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setActiveMilestoneForEdit(null);
                setIsMilestoneModalOpen(true);
              }}
            >
              <Plus size={14} />
              <span>Add Milestone</span>
            </button>
          </div>
        }
      />

      {/* Hidden / Draft Stage Notice Banner */}
      {isDraft && (
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--warning-subtle, rgba(217, 119, 6, 0.08))',
            border: '1px solid var(--warning, #d97706)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <EyeOff size={20} color="var(--warning, #d97706)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                Hidden Stage (Draft Mode)
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                Students cannot see this project or receive notifications. You can configure and edit all milestones freely, and notify students only when published.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleTogglePublish}
            disabled={togglingStatus}
          >
            <CheckCircle2 size={14} />
            <span>Publish Now</span>
          </button>
        </div>
      )}

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
              Visibility State
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: isDraft ? 'var(--warning, #d97706)' : 'var(--success, #16a34a)', marginTop: '2px' }}>
              {isDraft ? 'Hidden from Students (Draft)' : 'Published (Visible to Students)'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Milestones
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)', marginTop: '2px' }}>
              {pbl.components.length} deliverables · {submissions.length} submissions
            </div>
          </div>
        </div>

        {pbl.description && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Overview: </span>
            {pbl.description}
          </div>
        )}
      </div>

      {/* Tab Strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '4px' }}>
        {[
          { id: 'components', label: `Milestones (${pbl.components.length})` },
          { id: 'submissions', label: `Submissions (${submissions.length})` },
          { id: 'groups', label: `Student Groups (${groups.length})` },
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
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No milestones configured yet. Click "Add Milestone" above to create deliverables.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '35%' }}>Milestone Deliverable</th>
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
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {comp.title}
                        </div>
                        {comp.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                            {comp.description}
                          </div>
                        )}
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
                              title="Open External Form"
                            >
                              <ExternalLink size={12} />
                              <span>Form</span>
                            </a>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => {
                              setActiveMilestoneForEdit(comp);
                              setIsMilestoneModalOpen(true);
                            }}
                            title="Edit milestone deliverable"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-icon btn-sm text-danger"
                            onClick={() => handleDeleteComponent(comp.id)}
                            title="Delete milestone"
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
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
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
                      <td>
                        {sub.internal_marks !== undefined && sub.internal_marks !== null ? (
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sub.internal_marks} / 25
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReviewTarget(sub)}
                        >
                          <ClipboardCheck size={12} />
                          <span>Review</span>
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
        <div className="panel" style={{ overflow: 'hidden' }}>
          {groups.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              No project teams formed yet for this activity.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Group Name</th>
                    <th style={{ width: '20%' }}>Project Title</th>
                    <th style={{ width: '35%' }}>Members</th>
                    <th style={{ width: '20%' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(grp => (
                    <tr key={grp.id}>
                      <td style={{ fontWeight: 600 }}>{grp.group_name || (grp as any).name}</td>
                      <td>{grp.project?.title || <span style={{ color: 'var(--text-muted)' }}>No title assigned</span>}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {grp.members.map(m => (
                            <span key={m.id} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {m.student_name} ({m.enrollment_number || (m as any).student_enrollment})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(grp.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT MILESTONE DELIVERABLE */}
      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setActiveMilestoneForEdit(null);
        }}
        onSubmit={handleMilestoneSubmit}
        initialData={activeMilestoneForEdit}
        componentTypes={componentTypes}
      />

      {/* MODAL: EDIT PBL DETAILS */}
      <Modal
        isOpen={editPblOpen}
        onClose={() => setEditPblOpen(false)}
        title="Edit PBL Activity Details"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setEditPblOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSavePblDetails}
              disabled={savingPbl}
            >
              {savingPbl ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSavePblDetails} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input
              type="text"
              className="input-text"
              value={editPblTitle}
              onChange={e => setEditPblTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Syllabus</label>
            <textarea
              className="input-text"
              rows={4}
              value={editPblDesc}
              onChange={e => setEditPblDesc(e.target.value)}
              placeholder="Outline project objectives, milestones, and learning outcomes..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="input-text"
                value={editPblStartDate}
                onChange={e => setEditPblStartDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="input-text"
                value={editPblEndDate}
                onChange={e => setEditPblEndDate(e.target.value)}
                required
              />
            </div>
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
