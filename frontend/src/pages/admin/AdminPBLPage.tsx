import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { PblActivity } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppSelect } from '../../components/common/AppSelect';
import { formatDate } from '../../utils/date';

export const AdminPBLPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<PblActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    adminApi.getHistory().then(res => {
      setActivities(res);
      setLoading(false);
    });
  }, []);

  const filtered = activities.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.subject_name && p.subject_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.subject_code && p.subject_code.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingState message="Loading all college PBL activities..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'PBL Oversight' },
        ]}
        title="Institution-Wide PBL Oversight"
        subtitle="Universal monitoring across all active and historical Problem-Based Learning curricula"
      />

      <TableToolbar
        searchPlaceholder="Filter activities by subject or title..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={activities.length}
        filteredCount={filtered.length}
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

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Subject & Activity</th>
                <th style={{ width: '15%' }}>Semester</th>
                <th style={{ width: '15%' }}>Components</th>
                <th style={{ width: '20%' }}>Schedule</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No PBL activities match your search.
                  </td>
                </tr>
              ) : (
                filtered.map(pbl => (
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
                            <span className="badge badge-subtle">{pbl.subject_code}</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pbl.title}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem' }}>
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
                    <td style={{ textAlign: 'right' }}>
                      <StatusBadge type="pbl" status={pbl.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
