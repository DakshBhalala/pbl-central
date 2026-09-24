import React from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { PblActivityDetail, Component } from '../../types';
import { DeadlineBadge } from '../common/DeadlineBadge';

interface GanttTimelineProps {
  pblActivities: PblActivityDetail[];
  onSelectComponent?: (comp: Component) => void;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  pblActivities,
  onSelectComponent,
}) => {
  // Determine overall date range from activities
  let earliestDate = new Date();
  let latestDate = new Date(Date.now() + 60 * 86400000);

  pblActivities.forEach(p => {
    try {
      const s = parseISO(p.start_date);
      const e = parseISO(p.end_date);
      if (s < earliestDate) earliestDate = s;
      if (e > latestDate) latestDate = e;
    } catch {
      // ignore
    }
  });

  const totalDays = Math.max(differenceInDays(latestDate, earliestDate), 30);
  const today = new Date();
  const todayOffsetDays = differenceInDays(today, earliestDate);
  const todayPercent = Math.min(100, Math.max(0, (todayOffsetDays / totalDays) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Timeline window: <strong>{format(earliestDate, 'dd MMM yyyy')}</strong> — <strong>{format(latestDate, 'dd MMM yyyy')}</strong>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
          <span>Active Timeline</span>
          <span style={{ width: '2px', height: '14px', backgroundColor: 'var(--danger)', marginLeft: '8px' }} />
          <span>Current Date Marker</span>
        </div>
      </div>

      {/* Horizontal scrolling timeline container */}
      <div
        className="table-container"
        style={{
          overflowX: 'auto',
          minWidth: '100%',
          padding: '16px',
          position: 'relative',
        }}
      >
        <div style={{ minWidth: '760px', position: 'relative' }}>
          {/* Today line indicator */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `calc(220px + (100% - 220px) * ${todayPercent / 100})`,
              width: '2px',
              backgroundColor: 'var(--danger)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-18px',
                left: '-16px',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: 'var(--danger)',
                backgroundColor: 'var(--surface)',
                padding: '1px 4px',
                borderRadius: '3px',
                border: '1px solid var(--danger)',
              }}
            >
              Today
            </span>
          </div>

          {/* Activities and Component Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pblActivities.map(pbl => {
              const start = parseISO(pbl.start_date);
              const end = parseISO(pbl.end_date);
              const pblStartOffset = Math.max(0, differenceInDays(start, earliestDate));
              const pblDuration = Math.max(1, differenceInDays(end, start));
              const pblLeftPct = (pblStartOffset / totalDays) * 100;
              const pblWidthPct = Math.min(100 - pblLeftPct, (pblDuration / totalDays) * 100);

              return (
                <div key={pbl.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Activity Row */}
                  <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                    <div style={{ width: '220px', paddingRight: '12px', flexShrink: 0 }}>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {pbl.subject_name || pbl.title}
                      </strong>
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: '14px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: `${pblLeftPct}%`,
                          width: `${pblWidthPct}%`,
                          height: '100%',
                          backgroundColor: 'var(--surface-tertiary)',
                          borderRadius: '4px',
                          border: '1px solid var(--border-strong)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Components sub-rows */}
                  {pbl.components.map(comp => {
                    const compDeadline = parseISO(comp.deadline);
                    // Approximate component duration of 14 days before deadline
                    const compStartOffset = Math.max(0, differenceInDays(compDeadline, earliestDate) - 10);
                    const compEndOffset = Math.max(0, differenceInDays(compDeadline, earliestDate));
                    const compDuration = Math.max(3, compEndOffset - compStartOffset);

                    const compLeftPct = Math.min(95, (compStartOffset / totalDays) * 100);
                    const compWidthPct = Math.min(100 - compLeftPct, (compDuration / totalDays) * 100);

                    const isDone = comp.deadline_state === 'COMPLETED';
                    const isOverdue = comp.deadline_state === 'OVERDUE';
                    const barColor = isDone ? 'var(--success)' : isOverdue ? 'var(--danger)' : 'var(--accent)';

                    return (
                      <div
                        key={comp.id}
                        style={{ display: 'flex', alignItems: 'center', height: '28px', cursor: 'pointer' }}
                        onClick={() => onSelectComponent?.(comp)}
                      >
                        <div style={{ width: '220px', paddingLeft: '16px', paddingRight: '12px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ↳ {comp.title}
                          </span>
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: '18px' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: `${compLeftPct}%`,
                              width: `${compWidthPct}%`,
                              height: '100%',
                              backgroundColor: barColor,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 6px',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                            title={`${comp.title} - Due ${format(compDeadline, 'dd MMM')}`}
                          >
                            {format(compDeadline, 'dd MMM')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
