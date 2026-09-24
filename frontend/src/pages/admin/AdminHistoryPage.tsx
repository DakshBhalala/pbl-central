import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Calendar } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { academicApi } from '../../api/academic';
import { PblActivity, AcademicYear, Department } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppSelect } from '../../components/common/AppSelect';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/date';

export const AdminHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyPbls, setHistoryPbls] = useState<PblActivity[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedYearId, setSelectedYearId] = useState<number>(0);
  const [selectedDeptId, setSelectedDeptId] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      academicApi.getAcademicYears(),
      academicApi.getDepartments(),
    ]).then(([years, depts]) => {
      setAcademicYears(years);
      setDepartments(depts);
    });
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getHistory(
        selectedYearId || undefined,
        undefined,
        selectedDeptId || undefined
      );
      setHistoryPbls(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedYearId, selectedDeptId]);

  const filtered = historyPbls.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.subject_name && p.subject_name.toLowerCase().includes(search.toLowerCase())) ||
    (p.subject_code && p.subject_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'Historical Archive' },
        ]}
        title="Historical Semester Archive"
        subtitle="Preserved historical Problem-Based Learning curricula and completed academic cohort records"
      />

      <TableToolbar
        searchPlaceholder="Filter archive by subject or activity..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={historyPbls.length}
        filteredCount={filtered.length}
        onClearFilters={() => {
          setSearch('');
          setSelectedYearId(0);
          setSelectedDeptId(0);
        }}
        filterSlots={
          <div style={{ display: 'flex', gap: '8px' }}>
            <AppSelect
              size="sm"
              value={selectedYearId}
              onChange={val => setSelectedYearId(Number(val))}
              style={{ minWidth: '180px' }}
              options={[
                { value: 0, label: 'All Academic Years' },
                ...academicYears.map(y => ({
                  value: y.id,
                  label: `${y.name} ${y.is_current ? '(Current)' : '(Archive)'}`,
                })),
              ]}
            />

            <AppSelect
              size="sm"
              value={selectedDeptId}
              onChange={val => setSelectedDeptId(Number(val))}
              style={{ minWidth: '160px' }}
              options={[
                { value: 0, label: 'All Departments' },
                ...departments.map(d => ({
                  value: d.id,
                  label: d.name,
                })),
              ]}
            />
          </div>
        }
      />

      <div className="panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <LoadingState message="Loading historical records..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Historical Records"
            description="No archived activities matched the selected filters."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Subject & Activity</th>
                  <th style={{ width: '15%' }}>Semester</th>
                  <th style={{ width: '15%' }}>Components</th>
                  <th style={{ width: '20%' }}>Term Schedule</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Status</th>
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
                        {pbl.components_count} components
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
