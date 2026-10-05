import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { facultyApi, SubmissionRow } from '../../api/faculty';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionRow | null;
  onReviewSaved: () => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  submission,
  onReviewSaved,
}) => {
  const [decision, setDecision] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (submission) {
      if (submission.is_rejected || submission.submission_state === 'REJECTED') {
        setDecision('REJECTED');
      } else {
        setDecision('ACCEPTED');
      }
      setFeedback(submission.feedback || '');
    }
  }, [submission]);

  if (!submission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const isRejected = decision === 'REJECTED';
      await facultyApi.reviewSubmission({
        student_id: submission.student_id,
        component_id: submission.component_id,
        status: decision,
        feedback: feedback || undefined,
        is_rejected: isRejected,
      });
      onReviewSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evaluate Student Submission"
      maxWidth="500px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${decision === 'ACCEPTED' ? 'btn-primary' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? 'Saving...'
              : decision === 'ACCEPTED'
              ? 'Accept Submission'
              : 'Reject Submission'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Student and Component Header */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            lineHeight: '1.5',
          }}
        >
          <div><strong>Student:</strong> {submission.student_name} ({submission.enrollment_number})</div>
          <div><strong>Component:</strong> {submission.component_title}</div>
          {submission.division_name && <div><strong>Division:</strong> {submission.division_name}</div>}
        </div>

        {/* Accept or Reject Decision Selection */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
            Evaluation Decision
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setDecision('ACCEPTED')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md, 8px)',
                border: decision === 'ACCEPTED' ? '2px solid #10b981' : '1px solid var(--border-color, #e2e8f0)',
                backgroundColor: decision === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-primary, #ffffff)',
                color: decision === 'ACCEPTED' ? '#047857' : 'var(--text-secondary, #64748b)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle2 size={18} color={decision === 'ACCEPTED' ? '#10b981' : '#94a3b8'} />
              <span>Accept</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECTED')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md, 8px)',
                border: decision === 'REJECTED' ? '2px solid #ef4444' : '1px solid var(--border-color, #e2e8f0)',
                backgroundColor: decision === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-primary, #ffffff)',
                color: decision === 'REJECTED' ? '#b91c1c' : 'var(--text-secondary, #64748b)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <XCircle size={18} color={decision === 'REJECTED' ? '#ef4444' : '#94a3b8'} />
              <span>Reject</span>
            </button>
          </div>
        </div>

        {/* Feedback input */}
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px' }}>
            Faculty Feedback & Remarks <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(Visible to Student)</span>
          </label>
          <textarea
            className="textarea-box"
            rows={4}
            placeholder={
              decision === 'ACCEPTED'
                ? 'Optional remarks (e.g. Excellent work on architecture and code structure)...'
                : 'Reason for rejection and revision requirements for the student...'
            }
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
      </form>
    </Modal>
  );
};
