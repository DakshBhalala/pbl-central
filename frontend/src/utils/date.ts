import { format, formatDistanceToNow, parseISO, isPast, isToday } from 'date-fns';
import { DeadlineState } from '../types';

export function formatDate(dateString: string, formatStr: string = 'dd MMM yyyy'): string {
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(d, formatStr);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
}

export function getDeadlineBadgeProps(state?: DeadlineState): { label: string; className: string } {
  switch (state) {
    case 'COMPLETED':
      return { label: 'Completed', className: 'badge-success' };
    case 'OVERDUE':
      return { label: 'Overdue', className: 'badge-danger' };
    case 'DUE_TODAY':
      return { label: 'Due Today', className: 'badge-danger' };
    case 'DUE_SOON':
      return { label: 'Due Soon', className: 'badge-warning' };
    case 'UPCOMING':
    default:
      return { label: 'Upcoming', className: 'badge-accent' };
  }
}

export function getDaysRemainingLabel(deadlineStr: string, state?: DeadlineState): string {
  if (state === 'COMPLETED') return 'Done';
  try {
    const d = parseISO(deadlineStr);
    if (isPast(d) && !isToday(d)) {
      return `${formatDistanceToNow(d)} overdue`;
    }
    if (isToday(d)) {
      return 'Due today';
    }
    return `Due in ${formatDistanceToNow(d)}`;
  } catch {
    return 'Deadline set';
  }
}
