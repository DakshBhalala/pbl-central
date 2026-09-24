import React, { useEffect, useState } from 'react';
import { Building, Plus } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { Department } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { Modal } from '../../components/common/Modal';

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDepartments();
      setDepartments(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    try {
      setSaving(true);
      await adminApi.createDepartment({ name, code, description: desc, is_active: true });
      setModalOpen(false);
      setName('');
      setCode('');
      setDesc('');
      loadDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    } finally {
      setSaving(false);
    }
  };

  const filtered = departments.filter(
    d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState message="Loading departments..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'Departments' },
        ]}
        title="Academic Departments"
        subtitle="Configure institutional engineering branches, codes, and department status"
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} />
            <span>Add Department</span>
          </button>
        }
      />

      <TableToolbar
        searchPlaceholder="Filter departments by name or code..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={departments.length}
        filteredCount={filtered.length}
        onClearFilters={() => setSearch('')}
      />

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Department Name</th>
                <th style={{ width: '15%' }}>Code</th>
                <th style={{ width: '35%' }}>Description</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No departments match your search.
                  </td>
                </tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</span>
                    </td>
                    <td>
                      <span className="font-mono badge badge-subtle">{d.code}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{d.description || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${d.is_active ? 'badge-success' : 'badge-subtle'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
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
        title="Add Academic Department"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Department'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Department Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Computer Engineering"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Code (Unique)</label>
            <input
              type="text"
              className="input-text font-mono"
              placeholder="e.g. CE"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
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
