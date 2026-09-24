import React, { useEffect, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { academicApi } from '../../api/academic';
import { Subject, Department, Semester } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { Modal } from '../../components/common/Modal';
import { AppSelect } from '../../components/common/AppSelect';

export const AdminSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [deptId, setDeptId] = useState<number>(0);
  const [semId, setSemId] = useState<number>(0);
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, depts] = await Promise.all([
        adminApi.getSubjects(),
        academicApi.getDepartments(),
      ]);
      setSubjects(subs);
      setDepartments(depts);
      if (depts.length > 0) setDeptId(depts[0].id);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (deptId) {
      academicApi.getSemesters(deptId).then(sems => {
        setSemesters(sems);
        if (sems.length > 0) setSemId(sems[0].id);
      });
    }
  }, [deptId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !deptId || !semId) return;
    try {
      setSaving(true);
      await adminApi.createSubject({
        name,
        subject_code: code,
        department_id: deptId,
        semester_id: semId,
        description: desc,
        is_active: true,
      });
      setModalOpen(false);
      setName('');
      setCode('');
      setDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const filtered = subjects.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_code.toLowerCase().includes(search.toLowerCase()) ||
      (s.department_name && s.department_name.toLowerCase().includes(search.toLowerCase()))
  );

  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  if (loading) return <LoadingState message="Loading subjects..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'Subjects Directory' },
        ]}
        title="Curriculum Subjects"
        subtitle="Course catalog, academic subject codes, and curriculum syllabus mapping for PBL activities"
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} />
            <span>Add Subject</span>
          </button>
        }
      />

      <TableToolbar
        searchPlaceholder="Filter subjects by code, name, or department..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={subjects.length}
        filteredCount={filtered.length}
        density={density}
        onDensityChange={setDensity}
        onClearFilters={() => setSearch('')}
      />

      <div className="section-block" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className={`data-table ${density === 'compact' ? 'data-table-compact' : 'data-table-comfortable'}`}>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Subject Name</th>
                <th style={{ width: '15%' }}>Code</th>
                <th style={{ width: '25%' }}>Department</th>
                <th style={{ width: '15%' }}>Semester</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No subjects match your search.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                    </td>
                    <td>
                      <span className="font-mono badge badge-subtle">{s.subject_code}</span>
                    </td>
                    <td>{s.department_name}</td>
                    <td>{s.semester_name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${s.is_active ? 'badge-success' : 'badge-subtle'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Course Subject"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Subject'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Computer Networks"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject Code</label>
            <input
              type="text"
              className="input-text font-mono"
              placeholder="e.g. CS501"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <AppSelect
                label="Department"
                value={deptId}
                onChange={val => setDeptId(Number(val))}
                fullWidth
                options={departments.map(d => ({
                  value: d.id,
                  label: d.name,
                }))}
              />
            </div>

            <div className="form-group">
              <AppSelect
                label="Semester"
                value={semId}
                onChange={val => setSemId(Number(val))}
                fullWidth
                options={semesters.map(s => ({
                  value: s.id,
                  label: s.name,
                }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="textarea-box"
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
