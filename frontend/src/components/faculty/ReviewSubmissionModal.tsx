import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { facultyApi, SubmissionRow } from '../../api/faculty';

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
  const [internalMarks, setInternalMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (submission) {
      setInternalMarks(submission.internal_marks != null ? String(submission.internal_marks) : '');
      setFeedback(submission.feedback || '');
      setIsRejected(submission.is_rejected || false);
    }
  }, [submission]);

  if (!submission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await facultyApi.reviewSubmission({
        student_id: submission.student_id,
        component_id: submission.component_id,
        internal_marks: internalMarks ? parseFloat(internalMarks) : undefined,
        feedback: feedback || undefined,
        is_rejected: isRejected,
      });
      onReviewSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faculty Submission Review & Grading"
      maxWidth="500px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${isRejected ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : isRejected ? 'Submit as Rejected' : 'Save Review'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Student and Component Header */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
          }}
        >
          <div><strong>Student:</strong> {submission.student_name} ({submission.enrollment_number})</div>
          <div><strong>Component:</strong> {submission.component_title}</div>
          <div><strong>Division:</strong> {submission.division_name}</div>
        </div>

        {/* Rejection toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isRejected}
              onChange={e => setIsRejected(e.target.checked)}
            />
            <span style={{ fontWeight: 600, color: isRejected ? 'var(--danger)' : 'var(--text-primary)' }}>
              Mark Submission as Rejected
            </span>
          </label>
        </div>

        {/* Internal Marks input */}
        <div className="form-group">
          <label className="form-label">
            Internal Faculty Marks (Faculty Only — NEVER shown to Student)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="100"
            className="input-text"
            placeholder="e.g. 24.5"
            value={internalMarks}
            onChange={e => setInternalMarks(e.target.value)}
          />
        </div>

        {/* Feedback input */}
        <div className="form-group">
          <label className="form-label">Faculty Feedback & Guidance (Visible to Student)</label>
          <textarea
            className="textarea-box"
            rows={3}
            placeholder="Provide specific constructive evaluation notes or correction instructions..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
