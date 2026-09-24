import React, { useEffect, useState } from 'react';
import { FileCheck, Plus } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ComponentType } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { Modal } from '../../components/common/Modal';

export const AdminComponentTypesPage: React.FC = () => {
  const [types, setTypes] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [saving, setSaving] = useState(false);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getComponentTypes();
      setTypes(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      setSaving(true);
      await adminApi.createComponentType({
        name,
        description: desc,
        icon,
        is_active: true,
      });
      setModalOpen(false);
      setName('');
      setDesc('');
      loadTypes();
    } catch (err: any) {
      alert(err.message || 'Failed to create component type');
    } finally {
      setSaving(false);
    }
  };

  const filtered = types.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingState message="Loading component types..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'Component Types' },
        ]}
        title="PBL Component Deliverables"
        subtitle="Manage dynamic deliverables (PPT, Report, Poster, Certification, Mini Project, etc.) and evaluation schemas"
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} />
            <span>Add Custom Type</span>
          </button>
        }
      />

      <TableToolbar
        searchPlaceholder="Filter component types by name..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={types.length}
        filteredCount={filtered.length}
        onClearFilters={() => setSearch('')}
      />

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Deliverable Type</th>
                <th style={{ width: '20%' }}>Icon Identifier</th>
                <th style={{ width: '35%' }}>Description</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No component types match your search.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</span>
                    </td>
                    <td>
                      <span className="font-mono text-muted">{t.icon}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.description || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${t.is_active ? 'badge-success' : 'badge-subtle'}`}>
                        {t.is_active ? 'Active' : 'Disabled'}
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
        title="Add Custom PBL Component Type"
        maxWidth="440px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Save Type'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Component Type Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Industry Field Visit, Patent Draft"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Icon Name (Lucide)</label>
            <input
              type="text"
              className="input-text font-mono"
              placeholder="FileText, Award, Presentation, Cpu"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description & Delivery Rubric</label>
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
