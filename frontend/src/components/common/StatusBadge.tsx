import React from 'react';
import { ProgressState, SubmissionState, TopicStatus } from '../../types';

interface StatusBadgeProps {
  type: 'progress' | 'submission' | 'topic' | 'pbl';
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  let label = status;
  let className = 'badge-muted';

  if (type === 'progress') {
    switch (status as ProgressState) {
      case 'DONE':
        label = 'Done';
        className = 'badge-success';
        break;
      case 'IN_PROGRESS':
        label = 'In Progress';
        className = 'badge-warning';
        break;
      case 'TODO':
      default:
        label = 'To Do';
        className = 'badge-muted';
        break;
    }
  } else if (type === 'submission') {
    switch (status as SubmissionState) {
      case 'SUBMITTED':
        label = 'Submitted';
        className = 'badge-success';
        break;
      case 'REJECTED':
        label = 'Rejected';
        className = 'badge-danger';
        break;
      case 'NOT_SUBMITTED':
      default:
        label = 'Not Submitted';
        className = 'badge-muted';
        break;
    }
  } else if (type === 'topic') {
    switch (status as TopicStatus) {
      case 'APPROVED':
        label = 'Approved';
        className = 'badge-success';
        break;
      case 'REJECTED':
        label = 'Rejected';
        className = 'badge-danger';
        break;
      case 'PENDING':
      default:
        label = 'Pending';
        className = 'badge-warning';
        break;
    }
  } else if (type === 'pbl') {
    switch (status) {
      case 'ACTIVE':
        label = 'Active';
        className = 'badge-success';
        break;
      case 'COMPLETED':
        label = 'Completed';
        className = 'badge-accent';
        break;
      case 'ARCHIVED':
        label = 'Archived';
        className = 'badge-muted';
        break;
      case 'DRAFT':
      default:
        label = 'Draft';
        className = 'badge-warning';
        break;
    }
  }

  return <span className={`badge ${className}`}>{label}</span>;
};
