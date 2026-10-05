import React, { useEffect, useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { AcademicYear, Semester, Division } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';

export const AdminAcademicPage: React.FC = () => {
  const [subTab, setSubTab] = useState<'years' | 'semesters' | 'divisions'>('years');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [yearName, setYearName] = useState('');
  const [yearStart, setYearStart] = useState('2027-07-01');
  const [yearEnd, setYearEnd] = useState('2028-06-30');
  const [isCurrentYear, setIsCurrentYear] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [yRes, sRes, dRes] = await Promise.all([
        adminApi.getAcademicYears(),
        adminApi.getSemesters(),
        adminApi.getDivisions(),
      ]);
      setYears(yRes);
      setSemesters(sRes);
      setDivisions(dRes);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName) return;
    try {
      await adminApi.createAcademicYear({
        name: yearName,
        start_date: yearStart,
        end_date: yearEnd,
        is_current: isCurrentYear,
      });
      setAddYearOpen(false);
      setYearName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create academic year');
    }
  };

  if (loading) return <LoadingState message="Loading academic hierarchy..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'Academic Setup' },
        ]}
        title="Academic Structure & Cohorts"
        subtitle="Configure Academic Years, Semester terms, and Division groupings across departments"
        actions={
          subTab === 'years' ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAddYearOpen(true)}
            >
              <Plus size={13} />
              <span>Add Academic Year</span>
            </button>
          ) : undefined
        }
      />

      {/* Cloudflare-style Tab Strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '4px' }}>
        {[
          { id: 'years', label: 'Academic Years', count: years.length },
          { id: 'semesters', label: 'Semesters', count: semesters.length },
          { id: 'divisions', label: 'Divisions', count: divisions.length },
        ].map(tab => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id as any)}
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
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--surface-secondary)',
                  color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        {subTab === 'years' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Academic Year</th>
                  <th style={{ width: '25%' }}>Start Date</th>
                  <th style={{ width: '25%' }}>End Date</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {years.map(y => (
                  <tr key={y.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{y.name}</span>
                    </td>
                    <td>{y.start_date}</td>
                    <td>{y.end_date}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${y.is_current ? 'badge-success' : 'badge-subtle'}`}>
                        {y.is_current ? 'Current Session' : 'Past'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {subTab === 'semesters' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Semester Name</th>
                  <th style={{ width: '15%' }}>Term Number</th>
                  <th style={{ width: '25%' }}>Academic Year</th>
                  <th style={{ width: '30%' }}>Department</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                    </td>
                    <td className="font-mono">{s.number}</td>
                    <td>{s.academic_year_name}</td>
                    <td>{s.department_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {subTab === 'divisions' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Division Name</th>
                  <th style={{ width: '50%' }}>Semester Cohort</th>
                </tr>
              </thead>
              <tbody>
                {divisions.map(d => (
                  <tr key={d.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Division {d.name}</span>
                    </td>
                    <td>{d.semester_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Year Modal */}
      <Modal
        isOpen={addYearOpen}
        onClose={() => setAddYearOpen(false)}
        title="Add Academic Year"
        maxWidth="440px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAddYearOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreateYear}>
              Save Year
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateYear} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Academic Year Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. 2027–28"
              value={yearName}
              onChange={e => setYearName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="input-text"
              value={yearStart}
              onChange={e => setYearStart(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="input-text"
              value={yearEnd}
              onChange={e => setYearEnd(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
