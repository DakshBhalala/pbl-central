import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { Modal } from '../common/Modal';
import { AppSelect } from '../common/AppSelect';
import { academicApi } from '../../api/academic';
import { Department, AcademicYear, Semester, Subject, ComponentType, FacultySimple } from '../../types';

interface PBLBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

interface ComponentRow {
  component_type_id: number;
  title: string;
  description: string;
  deadline: string;
  submission_required: boolean;
  external_submission_url: string;
  external_classroom_url: string;
  external_resource_url: string;
  is_group: boolean;
  scope_type: 'ALL' | 'DIVISION' | 'GROUP' | 'STUDENT';
}

export const PBLBuilderModal: React.FC<PBLBuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [facultyList, setFacultyList] = useState<FacultySimple[]>([]);

  // Form states
  const [departmentId, setDepartmentId] = useState<number>(0);
  const [academicYearId, setAcademicYearId] = useState<number>(0);
  const [semesterId, setSemesterId] = useState<number>(0);
  const [subjectId, setSubjectId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topicMode, setTopicMode] = useState<string>('STUDENT_PROPOSED');
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<number[]>([]);

  // Components list
  const [components, setComponents] = useState<ComponentRow[]>([
    {
      component_type_id: 1,
      title: 'Initial Presentation',
      description: 'Prepare initial project presentation.',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      submission_required: true,
      external_submission_url: 'https://forms.google.com/',
      external_classroom_url: 'https://classroom.google.com/',
      external_resource_url: '',
      is_group: false,
      scope_type: 'ALL',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        academicApi.getDepartments(),
        academicApi.getAcademicYears(),
        academicApi.getComponentTypes(),
        academicApi.getFacultyList(),
      ]).then(([depts, years, cts, facs]) => {
        setDepartments(depts);
        setAcademicYears(years);
        setComponentTypes(cts);
        setFacultyList(facs);

        if (depts.length > 0) setDepartmentId(depts[0].id);
        if (years.length > 0) setAcademicYearId(years[0].id);
        if (cts.length > 0 && components[0]) {
          setComponents(prev => [{ ...prev[0], component_type_id: cts[0].id }]);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (departmentId) {
      academicApi.getSemesters(departmentId).then(sems => {
        setSemesters(sems);
        if (sems.length > 0) setSemesterId(sems[0].id);
      });
    }
  }, [departmentId]);

  useEffect(() => {
    if (departmentId && semesterId) {
      academicApi.getSubjects(departmentId, semesterId).then(subs => {
        setSubjects(subs);
        if (subs.length > 0) {
          setSubjectId(subs[0].id);
          if (!title) setTitle(`${subs[0].name} PBL Activity`);
        }
      });
    }
  }, [departmentId, semesterId]);

  const addComponentRow = () => {
    setComponents([
      ...components,
      {
        component_type_id: componentTypes[0]?.id || 1,
        title: '',
        description: '',
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
        submission_required: true,
        external_submission_url: '',
        external_classroom_url: '',
        external_resource_url: '',
        is_group: false,
        scope_type: 'ALL',
      },
    ]);
  };

  const removeComponentRow = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const updateComponentRow = (idx: number, field: keyof ComponentRow, val: any) => {
    const updated = [...components];
    updated[idx] = { ...updated[idx], [field]: val };
    setComponents(updated);
  };

  const handleFacultyToggle = (fid: number) => {
    setSelectedFacultyIds(prev =>
      prev.includes(fid) ? prev.filter(id => id !== fid) : [...prev, fid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !semesterId || !academicYearId) {
      alert('Please fill out all required academic fields.');
      return;
    }

    const payload = {
      title,
      description,
      subject_id: subjectId,
      academic_year_id: academicYearId,
      semester_id: semesterId,
      department_id: departmentId,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
      status: 'ACTIVE',
      topic_mode: topicMode,
      allow_student_groups: true,
      require_group_approval: false,
      faculty_ids: selectedFacultyIds,
      initial_components: components.map(c => ({
        component_type_id: Number(c.component_type_id),
        title: c.title,
        description: c.description,
        deadline: new Date(c.deadline).toISOString(),
        submission_required: c.submission_required,
        external_submission_url: c.external_submission_url || null,
        external_classroom_url: c.external_classroom_url || null,
        external_resource_url: c.external_resource_url || null,
        is_group: c.is_group,
        assignments: [{ scope_type: c.scope_type, target_id: null }],
      })),
    };

    await onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PBL Activity Builder"
      maxWidth="780px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Creating PBL...' : 'Save & Publish PBL'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Academic Hierarchy Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div className="form-group">
            <AppSelect
              label="Department"
              value={departmentId}
              onChange={val => setDepartmentId(Number(val))}
              fullWidth
              options={departments.map(d => ({ value: d.id, label: `${d.name} (${d.code})` }))}
            />
          </div>

          <div className="form-group">
            <AppSelect
              label="Academic Year"
              value={academicYearId}
              onChange={val => setAcademicYearId(Number(val))}
              fullWidth
              options={academicYears.map(y => ({ value: y.id, label: y.name }))}
            />
          </div>

          <div className="form-group">
            <AppSelect
              label="Semester"
              value={semesterId}
              onChange={val => setSemesterId(Number(val))}
              fullWidth
              options={semesters.map(s => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="form-group">
            <AppSelect
              label="Subject"
              value={subjectId}
              onChange={val => {
                const sid = Number(val);
                setSubjectId(sid);
                const sub = subjects.find(s => s.id === sid);
                if (sub) setTitle(`${sub.name} PBL Activity`);
              }}
              fullWidth
              searchable={subjects.length > 5}
              options={subjects.map(s => ({ value: s.id, label: `${s.subject_code} - ${s.name}` }))}
            />
          </div>
        </div>

        {/* Activity Details */}
        <div className="form-group">
          <label className="form-label">PBL Activity Title</label>
          <input
            type="text"
            className="input-text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="e.g. Computer Networks Hands-on PBL"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description & Student Instructions</label>
          <textarea
            className="textarea-box"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Outline objectives, deliverables, and guidelines..."
          />
        </div>

        {/* Topic Mode & Faculty Guides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          <div className="form-group">
            <AppSelect
              label="Topic Mode"
              value={topicMode}
              onChange={val => setTopicMode(String(val))}
              fullWidth
              options={[
                { value: 'STUDENT_PROPOSED', label: 'Student Proposes (Auto-Approved by default)' },
                { value: 'STUDENT_LIST', label: 'Student Selects From List' },
                { value: 'FACULTY_ASSIGNED', label: 'Faculty Assigned' },
                { value: 'NO_TOPIC', label: 'No Topic Needed' },
              ]}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Faculty Evaluators</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '6px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                maxHeight: '80px',
                overflowY: 'auto',
                backgroundColor: 'var(--surface-secondary)',
              }}
            >
              {facultyList.map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`btn btn-sm ${selectedFacultyIds.includes(f.id) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleFacultyToggle(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Components Builder */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
              PBL Components ({components.length})
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addComponentRow}
            >
              <Plus size={14} />
              Add Component
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {components.map((c, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AppSelect
                    size="sm"
                    style={{ width: '160px' }}
                    value={c.component_type_id}
                    onChange={val => updateComponentRow(idx, 'component_type_id', Number(val))}
                    options={componentTypes.map(ct => ({ value: ct.id, label: ct.name }))}
                  />

                  <input
                    type="text"
                    className="input-text"
                    style={{ flex: 1 }}
                    placeholder="Component Title (e.g. PPT Presentation, Report)"
                    value={c.title}
                    onChange={e => updateComponentRow(idx, 'title', e.target.value)}
                    required
                  />

                  <input
                    type="datetime-local"
                    className="input-text"
                    style={{ width: '180px' }}
                    value={c.deadline}
                    onChange={e => updateComponentRow(idx, 'deadline', e.target.value)}
                    required
                  />

                  {components.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-subtle btn-icon btn-sm text-danger"
                      onClick={() => removeComponentRow(idx)}
                      aria-label="Remove component"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="url"
                    className="input-text"
                    placeholder="Google Form Submission URL (optional)"
                    value={c.external_submission_url}
                    onChange={e => updateComponentRow(idx, 'external_submission_url', e.target.value)}
                  />
                  <input
                    type="url"
                    className="input-text"
                    placeholder="Google Classroom URL (optional)"
                    value={c.external_classroom_url}
                    onChange={e => updateComponentRow(idx, 'external_classroom_url', e.target.value)}
                  />

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={c.is_group}
                      onChange={e => updateComponentRow(idx, 'is_group', e.target.checked)}
                    />
                    Group Task
                  </label>

                  <AppSelect
                    size="sm"
                    style={{ width: '140px' }}
                    value={c.scope_type}
                    onChange={val => updateComponentRow(idx, 'scope_type', val)}
                    options={[
                      { value: 'ALL', label: 'All Students' },
                      { value: 'DIVISION', label: 'Division Scope' },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
