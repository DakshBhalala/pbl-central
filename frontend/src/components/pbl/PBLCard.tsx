import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, User, Calendar, ArrowRight } from 'lucide-react';
import { PblActivity } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface PBLCardProps {
  pbl: PblActivity;
  linkPrefix?: string;
  extraAction?: React.ReactNode;
}

export const PBLCard: React.FC<PBLCardProps> = ({
  pbl,
  linkPrefix = '/student/pbl',
  extraAction,
}) => {
  return (
    <div className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>
            {pbl.subject_code} — {pbl.subject_name}
          </span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '2px' }}>
            {pbl.title}
          </h3>
        </div>
        <StatusBadge type="pbl" status={pbl.status} />
      </div>

      {pbl.description && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {pbl.description}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={13} />
          <span>{pbl.component_count} Components</span>
        </div>

        {pbl.faculty_members && pbl.faculty_members.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={13} />
            <span>Guide: {pbl.faculty_members.map(f => f.name).join(', ')}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} />
          <span>{pbl.semester_name}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '6px' }}>
        {extraAction ? extraAction : <div />}
        <Link
          to={`${linkPrefix}/${pbl.id}`}
          className="btn btn-secondary btn-sm"
          style={{ textDecoration: 'none' }}
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
};
