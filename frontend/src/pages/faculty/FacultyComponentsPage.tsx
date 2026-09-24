import React, { useEffect, useState } from 'react';
import { ListTodo, ExternalLink, Calendar } from 'lucide-react';
import { facultyApi } from '../../api/faculty';
import { PblActivityDetail, Component } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { DeadlineBadge } from '../../components/common/DeadlineBadge';
import { AppSelect } from '../../components/common/AppSelect';
import { formatDateTime } from '../../utils/date';
import { EmptyState } from '../../components/common/EmptyState';

export const FacultyComponentsPage: React.FC = () => {
  const [details, setDetails] = useState<PblActivityDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    facultyApi.getPblActivities().then(async pbls => {
      const detailed = await Promise.all(
        pbls.map(p => facultyApi.getPblDetail(p.id))
      );
      setDetails(detailed);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading components registry..." />;

  const allComponents = details.flatMap(p =>
    p.components.map(c => ({ ...c, subject_name: p.subject_name, pbl_title: p.title }))
  );

  const filtered = allComponents.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.subject_name && c.subject_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.component_type_name && c.component_type_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || c.component_type_name === typeFilter;
    return matchesSearch && matchesType;
  });

  const uniqueTypes = Array.from(new Set(allComponents.map(c => c.component_type_name).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Console' },
          { label: 'Component Registry' },
        ]}
        title="Component Registry"
        subtitle="Universal index of all milestone assignments, deadlines, and submission links across PBL subjects"
      />

      <TableToolbar
        searchPlaceholder="Filter components by title or subject..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={allComponents.length}
        filteredCount={filtered.length}
        onClearFilters={() => {
          setSearch('');
          setTypeFilter('ALL');
        }}
        filterSlots={
          <AppSelect
            size="sm"
            value={typeFilter}
            onChange={val => setTypeFilter(String(val))}
            style={{ minWidth: '180px' }}
            options={[
              { value: 'ALL', label: 'All Component Types' },
              ...uniqueTypes.filter((t): t is string => Boolean(t)).map(t => ({ value: t, label: t })),
            ]}
          />
        }
      />

      <div className="panel" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No Components Found"
            description="Create components within your PBL activities."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Component Title</th>
                  <th style={{ width: '15%' }}>Type</th>
                  <th style={{ width: '20%' }}>Subject</th>
                  <th style={{ width: '15%' }}>Deadline</th>
                  <th style={{ width: '10%' }}>Scope</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Links</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {c.title}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-subtle">{c.component_type_name}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {c.subject_name || c.pbl_title}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatDateTime(c.deadline)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-subtle">
                        {c.is_group ? 'Group' : 'Individual'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        {c.external_submission_url && (
                          <a
                            href={c.external_submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Open Submission Form"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
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
