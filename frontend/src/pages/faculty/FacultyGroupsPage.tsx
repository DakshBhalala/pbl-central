import React, { useEffect, useState } from 'react';
import { Users, Plus, User } from 'lucide-react';
import { facultyApi } from '../../api/faculty';
import { PblActivity, Group } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { AppSelect } from '../../components/common/AppSelect';

export const FacultyGroupsPage: React.FC = () => {
  const [activities, setActivities] = useState<PblActivity[]>([]);
  const [selectedPblId, setSelectedPblId] = useState<number>(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // New group modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    facultyApi.getPblActivities().then(pbls => {
      setActivities(pbls);
      if (pbls.length > 0) setSelectedPblId(pbls[0].id);
      else setLoading(false);
    });
  }, []);

  const loadGroups = async () => {
    if (!selectedPblId) return;
    try {
      setLoading(true);
      const res = await facultyApi.getGroups(selectedPblId);
      setGroups(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPblId) loadGroups();
  }, [selectedPblId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !groupCode || !selectedPblId) return;
    try {
      setSaving(true);
      await facultyApi.createGroup(selectedPblId, {
        group_name: groupName,
        group_code: groupCode,
        pbl_activity_id: selectedPblId,
        member_student_ids: [],
      });
      setCreateModalOpen(false);
      setGroupName('');
      setGroupCode('');
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Console' },
          { label: 'Group Management' },
        ]}
        title="Project Group Oversight"
        subtitle="Manage student group allocations, project codes, and membership rosters across subject cohorts"
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
              onClick={() => {
                setGroupCode(`GRP-${Date.now().toString().slice(-4)}`);
                setCreateModalOpen(true);
              }}
            >
              <Plus size={14} />
              <span>Create Group</span>
            </button>
          </div>
        }
      />

      {loading ? (
        <LoadingState message="Loading groups..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Groups Formed"
          description="Click 'Create Group' to initialize groups for this PBL activity."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {groups.map(grp => (
            <div key={grp.id} className="panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{grp.group_name}</h3>
                <span className="font-mono badge badge-subtle">{grp.group_code}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Members ({grp.members.length}):
                </span>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  {grp.members.length === 0 ? (
                    <li style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No students assigned yet.</li>
                  ) : (
                    grp.members.map(m => (
                      <li
                        key={m.id}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--surface-secondary)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.8125rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={12} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 500 }}>{m.student_name}</span>
                        </div>
                        <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                          {m.enrollment_number}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {grp.project && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  Project: <strong style={{ color: 'var(--text-primary)' }}>{grp.project.title}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project Group"
        maxWidth="440px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCreateModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreateGroup} disabled={saving}>
              {saving ? 'Creating...' : 'Save Group'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Group Gamma, Team Quantum"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Group Code Identifier</label>
            <input
              type="text"
              className="input-text font-mono"
              placeholder="e.g. GRP-CN-03"
              value={groupCode}
              onChange={e => setGroupCode(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
