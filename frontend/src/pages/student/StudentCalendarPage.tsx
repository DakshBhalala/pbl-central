import React, { useEffect, useState } from 'react';
import { studentApi } from '../../api/student';
import { Component, ProgressState, SubmissionState } from '../../types';
import { CalendarView } from '../../components/calendar/CalendarView';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';

export const StudentCalendarPage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await studentApi.getDashboard();
      const allComps = [...res.upcoming_deadlines, ...res.overdue_items];
      setComponents(allComps);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProgress = async (componentId: number, state: ProgressState) => {
    try {
      await studentApi.updateProgress(componentId, state);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error updating progress');
    }
  };

  const handleUpdateSubmission = async (componentId: number, state: SubmissionState) => {
    try {
      await studentApi.updateSubmission(componentId, state);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Error updating submission');
    }
  };

  if (loading) return <LoadingState message="Loading calendar events..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Student Workspace' },
          { label: 'Academic Calendar' },
        ]}
        title="Academic Calendar"
        subtitle="Month, Week, and Agenda schedules for all registered PBL deliverables and milestones"
      />

      <div className="section-block" style={{ padding: '16px' }}>
        <CalendarView
          components={components}
          onUpdateProgress={handleUpdateProgress}
          onUpdateSubmission={handleUpdateSubmission}
        />
      </div>
    </div>
  );
};
