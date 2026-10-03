import React, { useEffect, useState } from 'react';
import {
  Database,
  Layers,
  Table,
  Key,
  Link as LinkIcon,
  Search,
  RefreshCw,
  HardDrive,
  Users,
  BookOpen,
  CheckCircle2,
  FileText,
  AlertCircle
} from 'lucide-react';
import { adminApi, StorageOverviewResponse, TableStorageInfo } from '../../api/admin';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';

const DOMAIN_GROUPS: Record<string, string[]> = {
  'Users & Roles': ['users', 'students', 'faculty', 'faculty_departments'],
  'Academic Hierarchy': ['departments', 'programs', 'academic_years', 'semesters', 'divisions', 'subjects'],
  'PBL & Milestones': ['pbl_activities', 'pbl_faculty', 'component_types', 'components', 'component_assignments'],
  'Teams & Projects': ['groups', 'group_members', 'projects'],
  'Progress & Reviews': ['student_component_progress', 'faculty_reviews', 'notifications'],
  'Topics Pool': ['topics', 'topic_histories'],
};

export const AdminStoragePage: React.FC = () => {
  const [data, setData] = useState<StorageOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTableName, setSelectedTableName] = useState<string>('pbl_activities');
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'schema' | 'data' | 'relations'>('data');

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStorageOverview();
      setData(res);
      if (res.tables.length > 0 && !res.tables.some(t => t.name === selectedTableName)) {
        setSelectedTableName(res.tables[0].name);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading || !data) {
    return <LoadingState message="Connecting to database and inspecting schemas..." />;
  }

  const totalRows = data.tables.reduce((acc, t) => acc + t.row_count, 0);

  // Filter tables
  const filteredTables = data.tables.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedDomain === 'ALL') return true;
    const allowed = DOMAIN_GROUPS[selectedDomain] || [];
    return allowed.includes(t.name);
  });

  const selectedTable: TableStorageInfo | undefined =
    data.tables.find(t => t.name === selectedTableName) || filteredTables[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Administrator' },
          { label: 'System Overview' },
          { label: 'Database Storage' },
        ]}
        title="Database Storage & Schema Explorer"
        subtitle={`Live inspection of ${data.total_tables} relational tables in ${data.database_file} (${data.engine})`}
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadOverview}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} />
            <span>Refresh Storage</span>
          </button>
        }
      />

      {/* Top Metric Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Database size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Database Engine
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data.engine}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              File: {data.database_file}
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Table size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Relational Tables
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {data.total_tables} Tables
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              6 Academic Core Domains
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Stored Records
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalRows} Rows
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              Populated with Active Curriculum Data
            </div>
          </div>
        </div>
      </div>

      {/* Main Master-Detail Work Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '18px',
          alignItems: 'start',
        }}
        className="storage-grid"
      >
        {/* LEFT COLUMN: Tables Directory */}
        <div className="panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Domain Filter Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Filter by Domain
            </label>
            <select
              className="input-text"
              style={{ fontSize: '0.75rem', height: '32px' }}
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value)}
            >
              <option value="ALL">All Domains ({data.total_tables} tables)</option>
              {Object.keys(DOMAIN_GROUPS).map(group => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-text"
              placeholder="Search table name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.75rem', height: '32px' }}
            />
          </div>

          {/* Table List */}
          <div
            style={{
              maxHeight: '560px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {filteredTables.map(t => {
              const isSelected = selectedTable?.name === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTableName(t.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <Table size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                      }}
                      className="font-mono truncate"
                    >
                      {t.name}
                    </span>
                  </div>

                  <span
                    className="badge"
                    style={{
                      fontSize: '0.6875rem',
                      padding: '1px 6px',
                      backgroundColor: isSelected ? 'var(--surface)' : 'var(--surface-secondary)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {t.row_count} rows
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Table Inspection Details */}
        {selectedTable && (
          <div className="panel" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Table Header Strip */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }} className="font-mono">
                    {selectedTable.name}
                  </h2>
                  <span className="badge badge-accent font-mono" style={{ fontSize: '0.75rem' }}>
                    {selectedTable.row_count} records
                  </span>
                  <span className="badge badge-subtle font-mono" style={{ fontSize: '0.75rem' }}>
                    {selectedTable.column_count} columns
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Primary physical relation in {data.database_file}
                </p>
              </div>

              {/* View Tabs */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'data' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('data')}
                >
                  <FileText size={13} />
                  <span>Live Records ({selectedTable.sample_rows.length})</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('schema')}
                >
                  <Key size={13} />
                  <span>Schema Columns ({selectedTable.columns.length})</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'relations' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('relations')}
                >
                  <LinkIcon size={13} />
                  <span>Foreign Keys ({selectedTable.foreign_keys.length})</span>
                </button>
              </div>
            </div>

            {/* TAB: LIVE RECORDS */}
            {activeTab === 'data' && (
              <div style={{ padding: '0' }}>
                {selectedTable.sample_rows.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    This table currently has 0 rows populated.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                    <table className="data-table data-table-compact">
                      <thead>
                        <tr>
                          {selectedTable.columns.map(col => (
                            <th key={col.name} className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                              {col.name}
                              {col.primary_key && <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>★ PK</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTable.sample_rows.map((row, idx) => (
                          <tr key={idx}>
                            {selectedTable.columns.map(col => {
                              const val = row[col.name];
                              const displayVal =
                                val === null || val === undefined
                                  ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>NULL</span>
                                  : typeof val === 'boolean'
                                  ? (val ? 'TRUE' : 'FALSE')
                                  : typeof val === 'object'
                                  ? JSON.stringify(val)
                                  : String(val);

                              return (
                                <td key={col.name} className="font-mono text-secondary" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={String(val)}>
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SCHEMA COLUMNS */}
            {activeTab === 'schema' && (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Column Name</th>
                      <th style={{ width: '25%' }}>SQL Data Type</th>
                      <th style={{ width: '20%' }}>Constraints</th>
                      <th style={{ width: '25%' }}>Nullability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.columns.map(col => (
                      <tr key={col.name}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {col.primary_key && <Key size={13} style={{ color: 'var(--accent)' }} />}
                            <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {col.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-subtle font-mono" style={{ fontSize: '0.6875rem' }}>
                            {col.type}
                          </span>
                        </td>
                        <td>
                          {col.primary_key ? (
                            <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                              Primary Key
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Standard Column</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: col.nullable ? 'var(--text-secondary)' : 'var(--color-danger)' }}>
                            {col.nullable ? 'Nullable' : 'NOT NULL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: FOREIGN KEYS */}
            {activeTab === 'relations' && (
              <div style={{ padding: '16px 20px' }}>
                {selectedTable.foreign_keys.length === 0 ? (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    No outgoing foreign key constraints declared on this table.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedTable.foreign_keys.map((fk, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-secondary)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <LinkIcon size={16} style={{ color: 'var(--accent)' }} />
                        <div style={{ flex: 1 }}>
                          <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {fk.constrained_columns.join(', ')}
                          </span>
                          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>➔ references</span>
                          <span className="font-mono text-accent" style={{ fontWeight: 600 }}>
                            {fk.referred_table}.{fk.referred_columns.join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 880px) {
          .storage-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
