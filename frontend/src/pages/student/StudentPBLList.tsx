import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Calendar, User } from 'lucide-react';
import { studentApi } from '../../api/student';
import { PblActivity } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/date';

export const StudentPBLList: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<PblActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'>('ALL');
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  // View Mode: 'list' (dense comparison table) vs 'grid' (object-oriented cards)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('pbl-central:pbl-view-mode');
      if (saved === 'list' || saved === 'grid') return saved;
    } catch {}
    return 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      localStorage.setItem('pbl-central:pbl-view-mode', mode);
    } catch {}
  };

  useEffect(() => {
    studentApi.getPblActivities().then(res => {
      setActivities(res);
      setLoading(false);
    });
  }, []);

  const filtered = activities.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.subject_name && p.subject_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.subject_code && p.subject_code.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && p.status === 'ACTIVE') ||
      (selectedStatus === 'COMPLETED' && p.status === 'COMPLETED') ||
      (selectedStatus === 'ARCHIVED' && p.status === 'ARCHIVED');

    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading your PBL subjects..." />;

  const statusCounts = {
    ALL: activities.length,
    ACTIVE: activities.filter(a => a.status === 'ACTIVE').length,
    COMPLETED: activities.filter(a => a.status === 'COMPLETED').length,
    ARCHIVED: activities.filter(a => a.status === 'ARCHIVED').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Student Workspace' },
          { label: 'My PBL' },
        ]}
        title="My PBL Activities"
        subtitle="Subject-wise Problem-Based Learning curriculum and milestone tracking"
      />

      {/* Cloudflare-style Tab Strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '4px' }}>
        {(['ALL', 'ACTIVE', 'COMPLETED', 'ARCHIVED'] as const).map(tab => {
          const isActive = selectedStatus === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedStatus(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'var(--transition-fast)',
              }}
            >
              <span>{tab === 'ALL' ? 'All Activities' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--surface-secondary)',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                }}
              >
                {statusCounts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table Toolbar with Search, count, view-mode switch (List vs Grid), and density toggle */}
      <TableToolbar
        searchPlaceholder="Search by subject code, name, or title..."
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
          setSelectedStatus('ALL');
        }}
      />

      {/* Content Area: List Mode vs Grid Mode */}
      {filtered.length === 0 ? (
        <div className="section-block" style={{ padding: '24px' }}>
          <EmptyState
            icon={Layers}
            title="No PBL Activities Found"
            description="No activities matched your search criteria."
          />
        </div>
      ) : viewMode === 'list' ? (
        /* ==================== LIST MODE (Dense Comparison Table) ==================== */
        <div className="section-block view-mode-transition" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className={`data-table ${density === 'compact' ? 'data-table-compact' : 'data-table-comfortable'}`}>
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Subject & Activity</th>
                  <th style={{ width: '22%' }}>Faculty Guide</th>
                  <th style={{ width: '14%' }}>Components</th>
                  <th style={{ width: '20%' }}>Curriculum Schedule</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(pbl => {
                  return (
                    <tr
                      key={pbl.id}
                      onClick={() => navigate(`/student/pbl/${pbl.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {pbl.subject_name || pbl.title}
                            </span>
                            {pbl.subject_code && (
                              <span className="badge badge-accent font-mono" style={{ fontSize: '0.6875rem' }}>
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
                          {pbl.faculty_members && pbl.faculty_members.length > 0
                            ? pbl.faculty_members.map(f => f.name).join(', ')
                            : pbl.faculty_names?.join(', ') || 'Department Faculty'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          {pbl.component_count || pbl.components_count || 0} components
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {formatDate(pbl.start_date)} — {formatDate(pbl.end_date)}
                          </span>
                          <div>
                            <StatusBadge type="pbl" status={pbl.status} />
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/student/pbl/${pbl.id}`);
                          }}
                        >
                          <span>Open</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== GRID MODE (Object-Oriented Cards) ==================== */
        <div className="pbl-cards-grid view-mode-transition">
          {filtered.map(pbl => {
            const facultyName =
              pbl.faculty_members && pbl.faculty_members.length > 0
                ? pbl.faculty_members.map(f => f.name).join(', ')
                : pbl.faculty_names?.join(', ') || 'Department Faculty';
            const componentCount = pbl.component_count || pbl.components_count || 0;
            const progress = pbl.progress_percentage ?? (pbl.status === 'COMPLETED' ? 100 : 33);

            return (
              <div
                key={pbl.id}
                className="pbl-card"
                onClick={() => navigate(`/student/pbl/${pbl.id}`)}
              >
                <div>
                  {/* Top Header: Code badge, Subject Name, and Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      {pbl.subject_code && (
                        <span
                          className="badge badge-accent font-mono"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {pbl.subject_code}
                        </span>
                      )}
                      <span
                        className="truncate"
                        style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}
                      >
                        {pbl.subject_name || 'Curriculum Subject'}
                      </span>
                    </div>
                    <StatusBadge type="pbl" status={pbl.status} />
                  </div>

                  {/* PBL Title */}
                  <h3
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '10px',
                      lineHeight: 1.35,
                    }}
                  >
                    {pbl.title}
                  </h3>

                  {/* Component Count & Topic Mode Metadata */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '14px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={13} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontWeight: 500 }}>{componentCount} components</span>
                    </span>
                    <span>·</span>
                    <span className="truncate" style={{ color: 'var(--text-muted)' }}>
                      {pbl.topic_mode?.replace(/_/g, ' ') || 'Topic Track'}
                    </span>
                  </div>

                  {/* Progress Section with Percentage */}
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                        Deliverable Progress
                      </span>
                      <span
                        className="font-mono"
                        style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar percentage={progress} size="sm" />
                  </div>
                </div>

                {/* Card Footer: Faculty & Actions */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: 'var(--text-secondary)',
                        minWidth: 0,
                      }}
                    >
                      <User size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span className="truncate" title={facultyName}>
                        {facultyName}
                      </span>
                    </span>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={12} />
                      <span>{formatDate(pbl.end_date)}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/student/pbl/${pbl.id}`);
                    }}
                  >
                    <span>Open Workspace</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
