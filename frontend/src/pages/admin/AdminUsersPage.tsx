import React, { useEffect, useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { Modal } from '../../components/common/Modal';

export const AdminUsersPage: React.FC = () => {
  const [roleTab, setRoleTab] = useState<'faculty' | 'students'>('faculty');
  const [faculty, setFaculty] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New Faculty Modal
  const [addFacultyOpen, setAddFacultyOpen] = useState(false);
  const [facName, setFacName] = useState('');
  const [facUsername, setFacUsername] = useState('');
  const [facCode, setFacCode] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facPhone, setFacPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [facRes, stuRes] = await Promise.all([
        adminApi.getFaculty(),
        adminApi.getStudents(),
      ]);
      setFaculty(facRes);
      setStudents(stuRes);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facUsername) return;
    try {
      setSaving(true);
      await adminApi.createFaculty({
        name: facName,
        username: facUsername,
        faculty_code: facCode || null,
        email: facEmail || null,
        phone: facPhone || null,
        password: 'Faculty@123',
      });
      setAddFacultyOpen(false);
      setFacName('');
      setFacUsername('');
      setFacCode('');
      setFacEmail('');
      setFacPhone('');
      loadUsers();
      alert('Faculty account created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create faculty account');
    } finally {
      setSaving(false);
    }
  };

  const filteredFaculty = faculty.filter(
    f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase()) ||
      (f.faculty_code && f.faculty_code.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment_number.toLowerCase().includes(search.toLowerCase()) ||
      (s.department_name && s.department_name.toLowerCase().includes(search.toLowerCase()))
  );

  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');

  if (loading) return <LoadingState message="Loading institutional users..." />;

  const currentList = roleTab === 'faculty' ? faculty : students;
  const currentFiltered = roleTab === 'faculty' ? filteredFaculty : filteredStudents;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Admin Console' },
          { label: 'User Directory' },
        ]}
        title="Institutional User Accounts"
        subtitle="Manage faculty coordinator credentials and enrolled student rosters"
        actions={
          roleTab === 'faculty' ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setFacUsername(`faculty${(faculty.length + 1).toString().padStart(2, '0')}`);
                setFacCode(`FAC-CE-${(faculty.length + 1).toString().padStart(2, '0')}`);
                setAddFacultyOpen(true);
              }}
            >
              <Plus size={13} />
              <span>Add Faculty</span>
            </button>
          ) : undefined
        }
      />

      {/* Tab Strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '4px' }}>
        {[
          { id: 'faculty', label: 'Faculty Staff', count: faculty.length },
          { id: 'students', label: 'Enrolled Students', count: students.length },
        ].map(tab => {
          const isActive = roleTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setRoleTab(tab.id as any);
                setSearch('');
              }}
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

      <TableToolbar
        searchPlaceholder={roleTab === 'faculty' ? 'Filter faculty by name, username, or code...' : 'Filter students by name, enrollment, or department...'}
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={currentList.length}
        filteredCount={currentFiltered.length}
        density={density}
        onDensityChange={setDensity}
        onClearFilters={() => setSearch('')}
      />

      <div className="section-block" style={{ overflow: 'hidden' }}>
        {roleTab === 'faculty' && (
          <div className="table-responsive">
            <table className={`data-table ${density === 'compact' ? 'data-table-compact' : 'data-table-comfortable'}`}>
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Faculty Name</th>
                  <th style={{ width: '20%' }}>Username</th>
                  <th style={{ width: '20%' }}>Employee Code</th>
                  <th style={{ width: '30%' }}>Contact Info</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No faculty records match search.
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map(f => (
                    <tr key={f.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</span>
                      </td>
                      <td className="font-mono">{f.username}</td>
                      <td>
                        <span className="font-mono badge badge-subtle">{f.faculty_code || '—'}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {f.email || f.phone || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {roleTab === 'students' && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Student Name</th>
                  <th style={{ width: '15%' }}>Enrollment Number</th>
                  <th style={{ width: '25%' }}>Department</th>
                  <th style={{ width: '15%' }}>Semester & Division</th>
                  <th style={{ width: '20%' }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No student records match search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                      </td>
                      <td className="font-mono text-muted">{s.enrollment_number}</td>
                      <td>{s.department_name}</td>
                      <td>
                        <span>{s.semester_name}</span> · <span className="badge badge-subtle">Div {s.division_name}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.email || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Faculty Modal */}
      <Modal
        isOpen={addFacultyOpen}
        onClose={() => setAddFacultyOpen(false)}
        title="Add Faculty Account"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAddFacultyOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreateFaculty} disabled={saving}>
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Dr. Ramesh Kumar"
              value={facName}
              onChange={e => setFacName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Login Username</label>
            <input
              type="text"
              className="input-text font-mono"
              placeholder="e.g. faculty03"
              value={facUsername}
              onChange={e => setFacUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Faculty Code</label>
            <input
              type="text"
              className="input-text font-mono"
              placeholder="e.g. FAC-CE-03"
              value={facCode}
              onChange={e => setFacCode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email (Optional)</label>
            <input
              type="email"
              className="input-text"
              placeholder="faculty@college.edu"
              value={facEmail}
              onChange={e => setFacEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone (Optional)</label>
            <input
              type="text"
              className="input-text"
              placeholder="+91 98765 43210"
              value={facPhone}
              onChange={e => setFacPhone(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Default temporary password: <code>Faculty@123</code>.
          </div>
        </form>
      </Modal>
    </div>
  );
};
