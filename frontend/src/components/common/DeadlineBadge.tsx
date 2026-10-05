import React from 'react';
import { DeadlineState } from '../../types';
import { getDeadlineBadgeProps } from '../../utils/date';

interface DeadlineBadgeProps {
  state?: DeadlineState;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ state }) => {
  const { label, className } = getDeadlineBadgeProps(state);
  return <span className={`badge ${className}`}>{label}</span>;
};
