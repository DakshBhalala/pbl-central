import React, { useState, useEffect } from 'react';
import { Copy, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { AppSelect } from '../common/AppSelect';
import { academicApi } from '../../api/academic';
import { AcademicYear, Semester, Subject, PblActivity } from '../../types';

interface DuplicatePBLModalProps {
  isOpen: boolean;
  onClose: () => void;
  pbl: PblActivity | null;
  onDuplicate: (pblId: number, data: any) => Promise<void>;
  isLoading?: boolean;
}

export const DuplicatePBLModal: React.FC<DuplicatePBLModalProps> = ({
  isOpen,
  onClose,
  pbl,
  onDuplicate,
  isLoading = false,
}) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [targetAcademicYearId, setTargetAcademicYearId] = useState<number>(0);
  const [targetSemesterId, setTargetSemesterId] = useState<number>(0);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (isOpen && pbl) {
      setNewTitle(`${pbl.title} (Duplicated Cohort)`);
      Promise.all([
        academicApi.getAcademicYears(),
        academicApi.getSemesters(pbl.department_id),
      ]).then(([years, sems]) => {
        setAcademicYears(years);
        setSemesters(sems);
        if (years.length > 0) setTargetAcademicYearId(years[0].id);
        if (sems.length > 0) setTargetSemesterId(sems[0].id);
      });
    }
  }, [isOpen, pbl]);

  if (!pbl) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onDuplicate(pbl.id, {
      target_academic_year_id: targetAcademicYearId,
      target_semester_id: targetSemesterId,
      new_title: newTitle,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate PBL Activity Structure"
      maxWidth="500px"
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
            <Copy size={14} />
            {isLoading ? 'Duplicating...' : 'Duplicate Structure'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--accent)',
            fontSize: '0.8125rem',
            color: 'var(--text-primary)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div>
            <strong>Structure Replication:</strong> Components, types, descriptions, submission links, and guides will be cloned. Past students, groups, student progress, submissions, and marks will <strong>NOT</strong> be duplicated.
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">New Activity Title</label>
          <input
            type="text"
            className="input-text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <AppSelect
            label="Target Academic Year"
            required
            value={targetAcademicYearId}
            onChange={val => setTargetAcademicYearId(Number(val))}
            fullWidth
            options={academicYears.map(y => ({
              value: y.id,
              label: y.name,
            }))}
          />
        </div>

        <div className="form-group">
          <AppSelect
            label="Target Semester"
            required
            value={targetSemesterId}
            onChange={val => setTargetSemesterId(Number(val))}
            fullWidth
            options={semesters.map(s => ({
              value: s.id,
              label: s.name,
            }))}
          />
        </div>
      </form>
    </Modal>
  );
};
