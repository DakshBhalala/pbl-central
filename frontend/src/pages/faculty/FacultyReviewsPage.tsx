import React, { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { facultyApi, SubmissionRow } from '../../api/faculty';
import { PblActivity } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AppSelect } from '../../components/common/AppSelect';
import { ReviewSubmissionModal } from '../../components/faculty/ReviewSubmissionModal';
import { EmptyState } from '../../components/common/EmptyState';

export const FacultyReviewsPage: React.FC = () => {
  const [activities, setActivities] = useState<PblActivity[]>([]);
  const [selectedPblId, setSelectedPblId] = useState<number>(0);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState<SubmissionRow | null>(null);

  useEffect(() => {
    facultyApi.getPblActivities().then(pbls => {
      setActivities(pbls);
      if (pbls.length > 0) {
        setSelectedPblId(pbls[0].id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadSubmissions = async () => {
    if (!selectedPblId) return;
    try {
      setLoading(true);
      const res = await facultyApi.getSubmissions(selectedPblId);
      setSubmissions(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPblId) loadSubmissions();
  }, [selectedPblId]);

  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  const filtered = submissions.filter(
    s =>
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment_number.toLowerCase().includes(search.toLowerCase()) ||
      s.component_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Console' },
          { label: 'Submission Reviews' },
        ]}
        title="Submission Reviews & Internal Grading"
        subtitle="Evaluate student submissions, record confidential faculty rubric marks, provide feedback, and audit rejections"
      />

      {/* Table Toolbar */}
      <TableToolbar
        searchPlaceholder="Filter submissions by student name, enrollment, or deliverable..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={submissions.length}
        filteredCount={filtered.length}
        density={density}
        onDensityChange={setDensity}
        onClearFilters={() => setSearch('')}
        filterSlots={
          <AppSelect
            size="sm"
            value={selectedPblId}
            onChange={val => setSelectedPblId(Number(val))}
            style={{ minWidth: '240px' }}
            searchable={activities.length > 5}
            options={activities.map(p => ({
              value: p.id,
              label: `${p.subject_code} - ${p.title}`,
            }))}
          />
        }
      />

      <div className="section-block" style={{ overflow: 'hidden' }}>
        {loading ? (
          <LoadingState message="Loading submissions..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No Submissions Found"
            description="There are currently no recorded submissions for this activity."
          />
        ) : (
          <div className="table-responsive">
            <table className={`data-table ${density === 'compact' ? 'data-table-compact' : 'data-table-comfortable'}`}>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Student</th>
                  <th style={{ width: '15%' }}>Enrollment</th>
                  <th style={{ width: '10%' }}>Division</th>
                  <th style={{ width: '20%' }}>Deliverable</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%' }}>Marks</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {sub.student_name}
                      </span>
                    </td>
                    <td className="font-mono text-muted">{sub.enrollment_number}</td>
                    <td>{sub.division_name || '—'}</td>
                    <td>
                      <span style={{ fontSize: '0.8125rem' }}>{sub.component_title}</span>
                    </td>
                    <td>
                      <StatusBadge type="submission" status={sub.submission_state} />
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {sub.internal_marks != null ? `${sub.internal_marks} pts` : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setReviewTarget(sub)}
                      >
                        Grade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewSubmissionModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          submission={reviewTarget}
          onReviewSaved={loadSubmissions}
        />
      )}
    </div>
  );
};
