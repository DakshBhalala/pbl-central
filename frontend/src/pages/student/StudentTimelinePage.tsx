import React, { useEffect, useState } from 'react';
import { studentApi } from '../../api/student';
import { PblActivityDetail, Component } from '../../types';
import { GanttTimeline } from '../../components/timeline/GanttTimeline';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { ComponentCard } from '../../components/pbl/ComponentCard';

export const StudentTimelinePage: React.FC = () => {
  const [details, setDetails] = useState<PblActivityDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  useEffect(() => {
    studentApi.getPblActivities().then(async pbls => {
      const detailed = await Promise.all(
        pbls.map(p => studentApi.getPblDetail(p.id))
      );
      setDetails(detailed);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingState message="Generating Gantt schedule timeline..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        breadcrumbs={[
          { label: 'Student Workspace' },
          { label: 'Gantt Timeline' },
        ]}
        title="PBL Schedule Timeline"
        subtitle="Subject-wise Gantt timeline with milestone deadlines, active submission spans, and current date tracker"
      />

      <div className="section-block" style={{ padding: '16px', overflowX: 'auto' }}>
        <GanttTimeline
          pblActivities={details}
          onSelectComponent={setSelectedComponent}
        />
      </div>

      {selectedComponent && (
        <Modal
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
          title="Component Timeline Details"
          maxWidth="580px"
        >
          <ComponentCard component={selectedComponent} isStudent={true} />
        </Modal>
      )}
    </div>
  );
};
