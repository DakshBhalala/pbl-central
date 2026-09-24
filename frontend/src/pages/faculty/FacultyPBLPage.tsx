import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, Layers, Users, ArrowRight } from 'lucide-react';
import { facultyApi } from '../../api/faculty';
import { PblActivity } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppSelect } from '../../components/common/AppSelect';
import { EmptyState } from '../../components/common/EmptyState';
import { PBLBuilderModal } from '../../components/pbl/PBLBuilderModal';
import { DuplicatePBLModal } from '../../components/faculty/DuplicatePBLModal';
import { formatDate } from '../../utils/date';

export const FacultyPBLPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<PblActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('pbl-central:faculty-pbl-view-mode');
      if (saved === 'list' || saved === 'grid') return saved;
    } catch {}
    return 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('pbl-central:faculty-pbl-view-mode', mode);
    } catch {}
  };

  // Modals
  const [builderOpen, setBuilderOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<PblActivity | null>(null);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await facultyApi.getPblActivities();
      setActivities(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      await facultyApi.createPbl(data);
      setBuilderOpen(false);
      loadActivities();
      alert('PBL Activity successfully created!');
    } catch (err: any) {
      alert(err.message || 'Failed to create PBL activity');
    }
  };

  const handleDuplicate = async (pblId: number, data: any) => {
    try {
      await facultyApi.duplicatePbl(pblId, data);
      setDuplicateTarget(null);
      loadActivities();
      alert('PBL Activity structure duplicated into target semester!');
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate PBL activity');
    }
  };

  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  const filtered = activities.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.subject_name && p.subject_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.subject_code && p.subject_code.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading your PBL activities..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Console' },
          { label: 'PBL Management' },
        ]}
        title="PBL Activities"
        subtitle="Manage active curricula, component rubrics, group allocations, and duplicate structures across cohorts"
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setBuilderOpen(true)}
          >
            <Plus size={14} />
            <span>Create PBL Activity</span>
          </button>
        }
      />

      {/* Table Toolbar */}
      <TableToolbar
        searchPlaceholder="Filter activities by subject, code, or title..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={activities.length}
        filteredCount={filtered.length}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        density={density}
        onDensityChange={setDensity}
        onClearFilters={() => {
          setSearch('');
          setStatusFilter('ALL');
        }}
        filterSlots={
          <AppSelect
            size="sm"
            value={statusFilter}
            onChange={val => setStatusFilter(String(val))}
            style={{ minWidth: '140px' }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
          />
        }
      />

      {filtered.length === 0 ? (
        <div className="section-block" style={{ padding: '24px' }}>
          <EmptyState
            icon={Layers}
            title="No PBL Activities Found"
            description="Create your first PBL activity using the builder."
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setBuilderOpen(true)}
              >
                <Plus size={14} />
                <span>Open PBL Builder</span>
              </button>
            }
          />
        </div>
      ) : viewMode === 'list' ? (
        <div className="section-block view-mode-transition" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className={`data-table ${density === 'compact' ? 'data-table-compact' : 'data-table-comfortable'}`}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Subject & Title</th>
                  <th style={{ width: '15%' }}>Semester</th>
                  <th style={{ width: '15%' }}>Components</th>
                  <th style={{ width: '20%' }}>Schedule</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(pbl => (
                  <tr
                    key={pbl.id}
                    onClick={() => navigate(`/faculty/pbl/${pbl.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {pbl.subject_name || pbl.title}
                          </span>
                          {pbl.subject_code && (
                            <span className="badge badge-subtle" style={{ fontSize: '0.6875rem' }}>
                              {pbl.subject_code}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {pbl.title}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        Sem {pbl.semester_name || 'N/A'} (Div {pbl.division_name || 'All'})
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {pbl.component_count ?? pbl.components_count ?? 0} components
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatDate(pbl.start_date)} — {formatDate(pbl.end_date)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge type="pbl" status={pbl.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDuplicateTarget(pbl)}
                          title="Duplicate to new semester"
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/faculty/pbl/${pbl.id}`)}
                        >
                          <span>Manage</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="pbl-cards-grid view-mode-transition">
          {filtered.map(pbl => (
            <div
              key={pbl.id}
              className="pbl-card"
              onClick={() => navigate(`/faculty/pbl/${pbl.id}`)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {pbl.subject_code && (
                      <span className="badge badge-accent font-mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {pbl.subject_code}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Sem {pbl.semester_name || 'N/A'} (Div {pbl.division_name || 'All'})
                    </span>
                  </div>
                  <StatusBadge type="pbl" status={pbl.status} />
                </div>

                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.35 }}>
                  {pbl.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={13} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontWeight: 500 }}>{pbl.component_count ?? pbl.components_count ?? 0} components</span>
                  </span>
                  <span>·</span>
                  <span>{formatDate(pbl.start_date)} — {formatDate(pbl.end_date)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }} onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDuplicateTarget(pbl)}
                  title="Duplicate to new semester"
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/faculty/pbl/${pbl.id}`)}
                >
                  <span>Manage</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Builder Modal */}
      <PBLBuilderModal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Duplicate Modal */}
      {duplicateTarget && (
        <DuplicatePBLModal
          isOpen={!!duplicateTarget}
          onClose={() => setDuplicateTarget(null)}
          pbl={duplicateTarget}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
};
