import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}) => {
  let accentColor = 'var(--text-primary)';
  if (variant === 'accent') accentColor = 'var(--accent)';
  if (variant === 'success') accentColor = 'var(--success)';
  if (variant === 'warning') accentColor = 'var(--warning)';
  if (variant === 'danger') accentColor = 'var(--danger)';

  return (
    <div className="card card-compact" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        {Icon && <Icon size={16} />}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: accentColor, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {subtitle && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};
