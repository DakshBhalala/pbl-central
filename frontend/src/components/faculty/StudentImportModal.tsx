import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Modal } from '../common/Modal';
import { facultyApi } from '../../api/faculty';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number;
  onImportSuccess: () => void;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);

    try {
      setLoading(true);
      const res = await facultyApi.previewStudentImport(departmentId, selected);
      setPreviewData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!previewData || previewData.valid_rows.length === 0) return;
    try {
      setImporting(true);
      await facultyApi.executeStudentImport(previewData.valid_rows);
      onImportSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import students');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Students from CSV"
      maxWidth="680px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={importing}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={!previewData || previewData.valid_count === 0 || importing}
          >
            {importing ? 'Importing...' : `Import ${previewData?.valid_count || 0} Valid Accounts`}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Sample format hint */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
            Supported CSV Format:
          </div>
          <code>name,enrollment_number,semester,division,email,phone</code>
        </div>

        {/* Upload box */}
        <div
          style={{
            border: '2px dashed var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('csv-upload-input')?.click()}
        >
          <input
            id="csv-upload-input"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <FileSpreadsheet size={32} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {file ? file.name : 'Click to select CSV file'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Instant validation against enrolled accounts and divisions
          </div>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ padding: '8px', fontSize: '0.75rem' }}>
            {error}
          </div>
        )}

        {/* Preview Results */}
        {previewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.8125rem' }}>
              <span className="badge badge-success">
                <CheckCircle2 size={12} />
                {previewData.valid_count} Valid Rows
              </span>
              {previewData.invalid_count > 0 && (
                <span className="badge badge-danger">
                  <AlertTriangle size={12} />
                  {previewData.invalid_count} Error Rows
                </span>
              )}
            </div>

            {/* Error rows notice if any */}
            {previewData.invalid_rows.length > 0 && (
              <div
                style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  padding: '8px 12px',
                  backgroundColor: 'var(--danger-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--danger-text)',
                }}
              >
                {previewData.invalid_rows.map((inv: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    <strong>Row {inv.row_number}:</strong> {inv.errors.join(', ')}
                  </div>
                ))}
              </div>
            )}

            {/* Valid rows preview table */}
            {previewData.valid_rows.length > 0 && (
              <div className="table-container" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Enrollment</th>
                      <th>Semester</th>
                      <th>Division</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.valid_rows.slice(0, 10).map((row: any, i: number) => (
                      <tr key={i}>
                        <td>{row.name}</td>
                        <td className="font-mono">{row.enrollment_number}</td>
                        <td>{row.semester_name}</td>
                        <td>{row.division_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
