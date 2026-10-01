import React, { useState, useEffect } from 'react';
import { Component, ComponentType } from '../../types';
import { Modal } from '../common/Modal';
import { AppSelect } from '../common/AppSelect';

export interface MilestoneFormData {
  component_type_id: number;
  title: string;
  description: string;
  deadline: string;
  external_submission_url: string;
  external_classroom_url: string;
  is_group: boolean;
  scope_type: 'ALL' | 'DIVISION';
}

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MilestoneFormData) => Promise<void>;
  initialData?: Component | null;
  componentTypes: ComponentType[];
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  componentTypes,
}) => {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState<MilestoneFormData>({
    component_type_id: componentTypes[0]?.id || 1,
    title: '',
    description: '',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
    external_submission_url: '',
    external_classroom_url: '',
    is_group: false,
    scope_type: 'ALL',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          component_type_id: initialData.component_type_id,
          title: initialData.title,
          description: initialData.description || '',
          deadline: new Date(initialData.deadline).toISOString().slice(0, 16),
          external_submission_url: initialData.external_submission_url || '',
          external_classroom_url: initialData.external_classroom_url || '',
          is_group: initialData.is_group,
          scope_type: 'ALL',
        });
      } else {
        setFormData({
          component_type_id: componentTypes[0]?.id || 1,
          title: '',
          description: '',
          deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
          external_submission_url: '',
          external_classroom_url: '',
          is_group: false,
          scope_type: 'ALL',
        });
      }
    }
  }, [isOpen, initialData, componentTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof MilestoneFormData>(key: K, value: MilestoneFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Milestone Deliverable' : 'Add Milestone Deliverable'}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Milestone' : 'Add Milestone'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="form-group">
          <label className="form-label">Deliverable Title</label>
          <input
            type="text"
            className="input-text"
            placeholder="e.g., Literature Survey & Problem Formulation"
            value={formData.title}
            onChange={e => updateField('title', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Deliverable Type</label>
          <AppSelect
            value={formData.component_type_id}
            onChange={val => updateField('component_type_id', Number(val))}
            options={componentTypes.map(ct => ({
              value: ct.id,
              label: ct.name,
            }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Deliverable Instructions & Rubric</label>
          <textarea
            className="input-text"
            rows={3}
            placeholder="Provide specific guidelines, evaluation criteria, or file specifications..."
            value={formData.description}
            onChange={e => updateField('description', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Deadline Date & Time</label>
          <input
            type="datetime-local"
            className="input-text"
            value={formData.deadline}
            onChange={e => updateField('deadline', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">External Submission Google Form URL (Optional)</label>
          <input
            type="url"
            className="input-text"
            placeholder="https://forms.google.com/..."
            value={formData.external_submission_url}
            onChange={e => updateField('external_submission_url', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Google Classroom / Resource URL (Optional)</label>
          <input
            type="url"
            className="input-text"
            placeholder="https://classroom.google.com/..."
            value={formData.external_classroom_url}
            onChange={e => updateField('external_classroom_url', e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_group}
              onChange={e => updateField('is_group', e.target.checked)}
            />
            Group Deliverable
          </label>

          {!isEdit && (
            <AppSelect
              size="sm"
              value={formData.scope_type}
              onChange={val => updateField('scope_type', val as 'ALL' | 'DIVISION')}
              style={{ minWidth: '220px' }}
              options={[
                { value: 'ALL', label: 'Assign to All Enrolled Students' },
                { value: 'DIVISION', label: 'Division Level' },
              ]}
            />
          )}
        </div>
      </form>
    </Modal>
  );
};
