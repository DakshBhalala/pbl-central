import React, { useEffect, useState } from 'react';
import { GraduationCap, Upload, Plus, User } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { facultyApi } from '../../api/faculty';
import { academicApi } from '../../api/academic';
import { Department, Semester, Division } from '../../types';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { TableToolbar } from '../../components/common/TableToolbar';
import { StudentImportModal } from '../../components/faculty/StudentImportModal';
import { Modal } from '../../components/common/Modal';
import { AppSelect } from '../../components/common/AppSelect';

export const FacultyStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [selectedDeptId, setSelectedDeptId] = useState<number>(0);
  const [selectedSemId, setSelectedSemId] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // New Student Form
  const [name, setName] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [divisionId, setDivisionId] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    academicApi.getDepartments().then(depts => {
      setDepartments(depts);
      if (depts.length > 0) {
        setSelectedDeptId(depts[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      academicApi.getSemesters(selectedDeptId).then(sems => {
        setSemesters(sems);
        if (sems.length > 0) setSelectedSemId(sems[0].id);
      });
    }
  }, [selectedDeptId]);

  useEffect(() => {
    if (selectedSemId) {
      academicApi.getDivisions(selectedSemId).then(divs => {
        setDivisions(divs);
        if (divs.length > 0) setDivisionId(divs[0].id);
      });
    }
  }, [selectedSemId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await facultyApi.getStudents(
        selectedDeptId || undefined,
        selectedSemId || undefined
      );
      setStudents(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeptId) loadStudents();
  }, [selectedDeptId, selectedSemId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !enrollmentNumber || !selectedDeptId || !selectedSemId || !divisionId) return;
    try {
      setSaving(true);
      await facultyApi.createStudent({
        name,
        enrollment_number: enrollmentNumber,
        email,
        phone_number: phone,
        department_id: selectedDeptId,
        semester_id: selectedSemId,
        division_id: divisionId,
        password: 'Student@123',
      });
      setAddModalOpen(false);
      setName('');
      setEnrollmentNumber('');
      setEmail('');
      setPhone('');
      loadStudents();
      alert('Student account created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create student');
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.enrollment_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Console' },
          { label: 'Student Cohort' },
        ]}
        title="Student Cohort Roster"
        subtitle="Manage enrolled students, individual account additions, and batch CSV imports"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload size={13} />
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus size={13} />
              <span>Add Student</span>
            </button>
          </div>
        }
      />

      {/* Table Toolbar */}
      <TableToolbar
        searchPlaceholder="Filter students by name or enrollment number..."
        searchValue={search}
        onSearchChange={setSearch}
        totalCount={students.length}
        filteredCount={filtered.length}
        onClearFilters={() => setSearch('')}
        filterSlots={
          <div style={{ display: 'flex', gap: '8px' }}>
            <AppSelect
              size="sm"
              value={selectedDeptId}
              onChange={val => setSelectedDeptId(Number(val))}
              style={{ minWidth: '170px' }}
              options={departments.map(d => ({
                value: d.id,
                label: d.name,
              }))}
            />

            <AppSelect
              size="sm"
              value={selectedSemId}
              onChange={val => setSelectedSemId(Number(val))}
              style={{ minWidth: '140px' }}
              options={semesters.map(s => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </div>
        }
      />

      <div className="panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <LoadingState message="Loading student records..." />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Name</th>
                  <th style={{ width: '15%' }}>Enrollment Number</th>
                  <th style={{ width: '20%' }}>Department</th>
                  <th style={{ width: '15%' }}>Semester</th>
                  <th style={{ width: '10%' }}>Division</th>
                  <th style={{ width: '15%' }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No student records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {s.name}
                        </span>
                      </td>
                      <td className="font-mono text-muted">{s.enrollment_number}</td>
                      <td>{s.department_name}</td>
                      <td>{s.semester_name}</td>
                      <td>
                        <span className="badge badge-subtle">Div {s.division_name}</span>
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

      {/* CSV Import Modal */}
      <StudentImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        departmentId={selectedDeptId}
        onImportSuccess={loadStudents}
      />

      {/* Add Single Student Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Enrolled Student Account"
        maxWidth="480px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAddStudent} disabled={saving}>
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="input-text"
              placeholder="e.g. Rahul Patel"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Enrollment Number (Username)</label>
            <input
              type="text"
              className="input-text font-mono"
              placeholder="e.g. 230105"
              value={enrollmentNumber}
              onChange={e => setEnrollmentNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <AppSelect
              label="Division"
              required
              value={divisionId}
              onChange={val => setDivisionId(Number(val))}
              fullWidth
              options={divisions.map(d => ({
                value: d.id,
                label: `Division ${d.name}`,
              }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="input-text"
              placeholder="student@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Note: Default temporary password is <code>Student@123</code>.
          </div>
        </form>
      </Modal>
    </div>
  );
};
