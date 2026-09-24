import React, { useEffect, useState } from 'react';
import { BookOpen, Check, X, History, Plus } from 'lucide-react';
import { facultyApi } from '../../api/faculty';
import { PblActivity, Topic } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { AppSelect } from '../../components/common/AppSelect';
import { formatDateTime } from '../../utils/date';

export const FacultyTopicsPage: React.FC = () => {
  const [activities, setActivities] = useState<PblActivity[]>([]);
  const [selectedPblId, setSelectedPblId] = useState<number>(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // History inspection modal
  const [selectedHistoryTopic, setSelectedHistoryTopic] = useState<Topic | null>(null);

  useEffect(() => {
    facultyApi.getPblActivities().then(pbls => {
      setActivities(pbls);
      if (pbls.length > 0) setSelectedPblId(pbls[0].id);
      else setLoading(false);
    });
  }, []);

  const loadTopics = async () => {
    if (!selectedPblId) return;
    try {
      setLoading(true);
      const res = await facultyApi.getTopics(selectedPblId);
      setTopics(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPblId) loadTopics();
  }, [selectedPblId]);

  const handleReject = async (topicId: number) => {
    const reason = prompt('Please provide reason for rejecting this topic (visible to student):');
    if (!reason) return;
    try {
      await facultyApi.rejectTopic(topicId, reason);
      loadTopics();
    } catch (err: any) {
      alert(err.message || 'Failed to reject topic');
    }
  };

  const handleApprove = async (topicId: number) => {
    try {
      await facultyApi.approveTopic(topicId);
      loadTopics();
    } catch (err: any) {
      alert(err.message || 'Failed to approve topic');
    }
  };

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMode, setNewMode] = useState<'STUDENT_LIST' | 'FACULTY_ASSIGNED'>('STUDENT_LIST');
  const [addingTopic, setAddingTopic] = useState(false);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPblId || !newTitle.trim()) return;
    try {
      setAddingTopic(true);
      await facultyApi.createTopic(selectedPblId, {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        mode: newMode,
      });
      setAddModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadTopics();
    } catch (err: any) {
      alert(err.message || 'Failed to create topic');
    } finally {
      setAddingTopic(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Console' },
          { label: 'Topic Pool & Approvals' },
        ]}
        title="Topic Pool & Oversight"
        subtitle="Audit student proposals (auto-approved by default per academic rules) and maintain predefined curriculum topic banks"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AppSelect
              size="sm"
              value={selectedPblId}
              onChange={val => setSelectedPblId(Number(val))}
              style={{ minWidth: '240px' }}
              searchable={activities.length > 5}
              options={activities.map(p => ({
                value: p.id,
                label: `${p.subject_code} - ${p.title}`,
              }))}
            />

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus size={14} />
              <span>Add Topic</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Loading topics..." />
      ) : topics.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Topics Registered"
          description="There are currently no topics proposed or assigned for this activity."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {topics.map(t => {
            const isApproved = t.status === 'APPROVED';
            return (
              <div
                key={t.id}
                className="panel"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  borderLeft: isApproved ? '3px solid var(--color-success)' : '3px solid var(--color-danger)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t.title}
                    </h3>
                    <StatusBadge type="topic" status={t.status} />
                    <span className="badge badge-subtle" style={{ fontSize: '0.6875rem' }}>
                      {t.mode.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {t.description && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {t.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <div>Proposed By: <strong style={{ color: 'var(--text-secondary)' }}>{t.proposed_by_student_name || 'Faculty Pool'}</strong></div>
                    {t.assigned_to_group_name && <div>Group: <strong style={{ color: 'var(--text-secondary)' }}>{t.assigned_to_group_name}</strong></div>}
                    <div>Created: {formatDateTime(t.created_at)}</div>
                  </div>

                  {t.rejection_reason && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--danger-subtle)',
                        color: 'var(--danger-text)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <strong>Rejection Reason:</strong> {t.rejection_reason}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {t.history && t.history.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedHistoryTopic(t)}
                      title="Audit trail"
                    >
                      <History size={13} />
                      <span>History ({t.history.length})</span>
                    </button>
                  )}

                  {isApproved ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm text-danger"
                      onClick={() => handleReject(t.id)}
                    >
                      <X size={13} />
                      <span>Reject</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApprove(t.id)}
                    >
                      <Check size={13} />
                      <span>Approve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {selectedHistoryTopic && (
        <Modal
          isOpen={!!selectedHistoryTopic}
          onClose={() => setSelectedHistoryTopic(null)}
          title={`Topic History: ${selectedHistoryTopic.title}`}
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedHistoryTopic.history.map((h, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{h.action}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(h.created_at)}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {h.comment || 'No comment provided.'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Audited By: {h.changed_by_name || 'System'}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Add Topic Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Topic to Curriculum Pool"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={addingTopic}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateTopic}
              disabled={addingTopic || !newTitle.trim()}
            >
              {addingTopic ? 'Adding Topic...' : 'Add Topic'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Topic Title</label>
            <input
              type="text"
              className="input-text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Adaptive Rate Limiting via Token Bucket Algorithms"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Topic Description & Scope</label>
            <textarea
              className="textarea-box"
              rows={3}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Describe requirements, research objectives, or technical boundaries..."
            />
          </div>

          <div className="form-group">
            <AppSelect
              label="Availability Mode"
              value={newMode}
              onChange={val => setNewMode(val as any)}
              fullWidth
              options={[
                { value: 'STUDENT_LIST', label: 'Student Selects From List (Pool)' },
                { value: 'FACULTY_ASSIGNED', label: 'Faculty Assigned' },
              ]}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
