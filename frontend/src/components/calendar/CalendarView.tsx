import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Component } from '../../types';
import { SegmentedControl } from '../common/SegmentedControl';
import { DeadlineBadge } from '../common/DeadlineBadge';
import { Modal } from '../common/Modal';
import { ComponentCard } from '../pbl/ComponentCard';

interface CalendarViewProps {
  components: Component[];
  onUpdateProgress?: (componentId: number, state: any) => void;
  onUpdateSubmission?: (componentId: number, state: any) => void;
}

type CalendarMode = 'month' | 'week' | 'agenda';

export const CalendarView: React.FC<CalendarViewProps> = ({
  components,
  onUpdateProgress,
  onUpdateSubmission,
}) => {
  const [mode, setMode] = useState<CalendarMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const prevPeriod = () => {
    if (mode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (mode === 'week') setCurrentDate(subWeeks(currentDate, 1));
  };

  const nextPeriod = () => {
    if (mode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (mode === 'week') setCurrentDate(addWeeks(currentDate, 1));
  };

  const getDayComponents = (day: Date): Component[] => {
    return components.filter(c => {
      try {
        const d = parseISO(c.deadline);
        return isSameDay(d, day);
      } catch {
        return false;
      }
    });
  };

  // Month View Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Week View Generation
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Agenda View Generation: sort all components by deadline
  const sortedComponents = [...components].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Calendar Top Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
            {mode === 'month' && format(currentDate, 'MMMM yyyy')}
            {mode === 'week' && `Week of ${format(weekStart, 'dd MMM')} – ${format(weekEnd, 'dd MMM yyyy')}`}
            {mode === 'agenda' && 'All PBL Deadlines & Milestones'}
          </h2>

          {mode !== 'agenda' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-icon btn-sm"
                onClick={prevPeriod}
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-icon btn-sm"
                onClick={nextPeriod}
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </button>
            </div>
          )}
        </div>

        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'month', label: 'Month' },
            { value: 'week', label: 'Week' },
            { value: 'agenda', label: 'Agenda' },
          ]}
        />
      </div>

      {/* MONTH VIEW */}
      {mode === 'month' && (
        <div
          className="table-container view-mode-transition"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(100px, 1fr))',
            backgroundColor: 'var(--border)',
            gap: '1px',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div
              key={d}
              style={{
                backgroundColor: 'var(--surface-secondary)',
                padding: '8px',
                textAlign: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              {d}
            </div>
          ))}

          {monthDays.map(day => {
            const dayComps = getDayComponents(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDate = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                style={{
                  backgroundColor: 'var(--surface)',
                  minHeight: '90px',
                  padding: '6px',
                  opacity: isCurrentMonth ? 1 : 0.45,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isTodayDate ? 700 : 500,
                    color: isTodayDate ? '#fff' : 'var(--text-secondary)',
                    backgroundColor: isTodayDate ? 'var(--accent)' : 'transparent',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {format(day, 'd')}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
                  {dayComps.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComponent(c)}
                      style={{
                        padding: '2px 4px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        backgroundColor:
                          c.deadline_state === 'COMPLETED'
                            ? 'var(--success-subtle)'
                            : c.deadline_state === 'OVERDUE'
                            ? 'var(--danger-subtle)'
                            : 'var(--accent-subtle)',
                        color:
                          c.deadline_state === 'COMPLETED'
                            ? 'var(--success-text)'
                            : c.deadline_state === 'OVERDUE'
                            ? 'var(--danger-text)'
                            : 'var(--accent-text)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={c.title}
                    >
                      {c.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEK VIEW */}
      {mode === 'week' && (
        <div
          className="table-container view-mode-transition"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))',
            backgroundColor: 'var(--border)',
            gap: '1px',
          }}
        >
          {weekDays.map(day => {
            const dayComps = getDayComponents(day);
            const isTodayDate = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                style={{
                  backgroundColor: 'var(--surface)',
                  minHeight: '220px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {format(day, 'EEE')}
                  </span>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: isTodayDate ? 700 : 500,
                      color: isTodayDate ? '#fff' : 'var(--text-primary)',
                      backgroundColor: isTodayDate ? 'var(--accent)' : 'transparent',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dayComps.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComponent(c)}
                      className="card card-compact card-interactive"
                      style={{ padding: '8px', borderLeft: '3px solid var(--accent)' }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {c.component_type_name}
                      </span>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{c.title}</div>
                      <div style={{ marginTop: '4px' }}>
                        <DeadlineBadge state={c.deadline_state} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AGENDA VIEW */}
      {mode === 'agenda' && (
        <div className="view-mode-transition" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedComponents.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No deadline items scheduled.
            </div>
          ) : (
            sortedComponents.map(c => (
              <div
                key={c.id}
                className="card card-compact card-interactive"
                onClick={() => setSelectedComponent(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      padding: '6px 10px',
                      backgroundColor: 'var(--surface-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      minWidth: '58px',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {format(parseISO(c.deadline), 'MMM')}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {format(parseISO(c.deadline), 'dd')}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {c.component_type_name} • {c.is_group ? 'Group Task' : 'Individual'}
                    </span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.title}
                    </h4>
                  </div>
                </div>

                <DeadlineBadge state={c.deadline_state} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedComponent && (
        <Modal
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
          title="Component Detail"
          maxWidth="580px"
        >
          <ComponentCard
            component={selectedComponent}
            onUpdateProgress={onUpdateProgress}
            onUpdateSubmission={onUpdateSubmission}
            isStudent={true}
          />
        </Modal>
      )}
    </div>
  );
};
