import React from 'react';

interface ProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  showLabel = false,
  size = 'md',
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const isComplete = clamped === 100;

  const height = size === 'sm' ? '6px' : size === 'lg' ? '12px' : '8px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div className="progress-track" style={{ height }}>
        <div
          className={`progress-fill ${isComplete ? 'success' : ''}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '35px', textAlign: 'right', color: 'var(--text-secondary)' }}>
          {clamped}%
        </span>
      )}
    </div>
  );
};
