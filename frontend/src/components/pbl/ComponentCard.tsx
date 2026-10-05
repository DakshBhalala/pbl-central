import React from 'react';
import {
  ExternalLink,
  Calendar,
  User,
  Users,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  FileText,
  Award,
  Presentation,
  FlaskConical,
  PenTool,
  Cpu,
  BookOpen,
} from 'lucide-react';
import { Component, ProgressState, SubmissionState } from '../../types';
import { DeadlineBadge } from '../common/DeadlineBadge';
import { StatusBadge } from '../common/StatusBadge';
import { AppSelect } from '../common/AppSelect';
import { formatDateTime, getDaysRemainingLabel } from '../../utils/date';

interface ComponentCardProps {
  component: Component;
  onUpdateProgress?: (componentId: number, state: ProgressState) => void;
  onUpdateSubmission?: (componentId: number, state: SubmissionState) => void;
  isStudent?: boolean;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  onUpdateProgress,
  onUpdateSubmission,
  isStudent = true,
}) => {
  const getIcon = (name?: string) => {
    switch (name) {
      case 'PPT':
      case 'Presentation':
        return Presentation;
      case 'Certification Course':
        return Award;
      case 'Experiment':
        return FlaskConical;
      case 'Handwritten Assignment':
        return PenTool;
      case 'Mini Project':
        return Cpu;
      case 'Case Study':
        return BookOpen;
      default:
        return FileText;
    }
  };

  const IconComp = getIcon(component.component_type_name);
  const daysLabel = getDaysRemainingLabel(component.deadline, component.deadline_state);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--surface-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <IconComp size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {component.component_type_name || 'Component'}
              </span>
              <span className="badge badge-muted" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                {component.is_group ? 'Group Task' : 'Individual'}
              </span>
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {component.title}
            </h4>
          </div>
        </div>

        <DeadlineBadge state={component.deadline_state} />
      </div>

      {/* Description */}
      {(component.assignment_custom_description || component.description) && (
        <div>
          {component.assignment_custom_description && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                Group/Scope Specific Instructions
              </span>
            </div>
          )}
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {component.assignment_custom_description || component.description}
          </p>
        </div>
      )}

      {/* Meta details */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '8px 10px',
          backgroundColor: 'var(--surface-secondary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
          <span>Due: <strong>{formatDateTime(component.deadline)}</strong> ({daysLabel})</span>
        </div>
      </div>

      {/* Student progress & submission status row */}
      {isStudent && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            paddingTop: '6px',
            borderTop: '1px solid var(--border)',
          }}
        >
          {/* Student personal checklist toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Progress:
            </span>
            <AppSelect
              size="sm"
              value={component.student_progress_state || 'TODO'}
              onChange={val => onUpdateProgress?.(component.id, val as ProgressState)}
              style={{ width: '120px' }}
              options={[
                { value: 'TODO', label: 'To Do' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'DONE', label: 'Done' },
              ]}
            />
          </div>

          {/* Submission tracking toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Submission:
            </span>
            <StatusBadge type="submission" status={component.student_submission_state || 'NOT_SUBMITTED'} />
            {component.student_submission_state === 'REJECTED' ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                Resubmission locked
              </span>
            ) : component.student_submission_state !== 'SUBMITTED' ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onUpdateSubmission?.(component.id, 'SUBMITTED')}
              >
                Mark Submitted
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>
                ✓ Submitted
              </span>
            )}
          </div>
        </div>
      )}

      {/* Faculty feedback banner if present */}
      {component.faculty_feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '8px 10px',
            backgroundColor: 'var(--accent-subtle)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--accent)',
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
          }}
        >
          <MessageSquareQuote size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Faculty Feedback:</strong> {component.faculty_feedback}
          </div>
        </div>
      )}

      {/* External Action Links (Principle: Centralized Management Layer, does NOT replace Google Forms) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
        {component.external_submission_url && (
          <a
            href={component.external_submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            <ExternalLink size={13} />
            Open Submission Form
          </a>
        )}
        {component.external_classroom_url && (
          <a
            href={component.external_classroom_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={13} />
            Open Classroom
          </a>
        )}
        {component.external_resource_url && (
          <a
            href={component.external_resource_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={13} />
            Resources
          </a>
        )}
      </div>
    </div>
  );
};
