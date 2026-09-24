import React, { useEffect, useState } from 'react';
import { Users, ExternalLink, User, ShieldCheck } from 'lucide-react';
import { studentApi } from '../../api/student';
import { Group } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getGroups().then(res => {
      setGroups(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Loading your project group rosters..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1000px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Student Workspace' },
          { label: 'Project Groups' },
        ]}
        title="My Project Groups"
        subtitle="Team rosters, assigned research topics, and faculty guides across enrolled PBL activities"
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Groups Assigned"
          description="You are currently working individually or group rosters have not yet been formed for your enrolled activities."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groups.map(grp => (
            <div
              key={grp.id}
              className="section-block"
              style={{ padding: '0', overflow: 'hidden' }}
            >
              {/* Group Summary Header */}
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'var(--surface-secondary)',
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
                    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {grp.group_name}
                    </span>
                    <span className="badge badge-subtle font-mono" style={{ fontSize: '0.6875rem' }}>
                      {grp.group_code}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--accent-text)', fontWeight: 500 }}>
                      {grp.pbl_title || 'PBL Activity'}
                    </span>
                  </div>
                </div>

                {grp.project?.guide_faculty_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Guide:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {grp.project.guide_faculty_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Project & Topic Banner */}
              {grp.project && (
                <div
                  style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                        Topic / Project Title
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                        Approved
                      </span>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {grp.project.title}
                    </span>
                    {grp.project.topic && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Scope: {grp.project.topic}
                      </span>
                    )}
                  </div>

                  {grp.project.external_url && (
                    <a
                      href={grp.project.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <ExternalLink size={12} />
                      <span>Repository</span>
                    </a>
                  )}
                </div>
              )}

              {/* Member Roster List */}
              <div style={{ padding: '12px 18px' }}>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                  }}
                >
                  Roster Members ({grp.members.length})
                </div>

                <div className="table-responsive">
                  <table className="data-table data-table-compact">
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>Student</th>
                        <th style={{ width: '30%' }}>Enrollment ID</th>
                        <th style={{ width: '20%', textAlign: 'right' }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grp.members.map((m, idx) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--surface-secondary)',
                                  border: '1px solid var(--border)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.6875rem',
                                  fontWeight: 600,
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {m.student_name.slice(0, 1).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {m.student_name}
                              </span>
                            </div>
                          </td>
                          <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {m.enrollment_number}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {idx === 0 ? (
                              <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                                Group Lead
                              </span>
                            ) : (
                              <span className="badge badge-subtle" style={{ fontSize: '0.6875rem' }}>
                                Member
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
