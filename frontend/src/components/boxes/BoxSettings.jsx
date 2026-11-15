import { useState } from 'react';
import BoxForm from './BoxForm';
import ErrorMessage from '../common/ErrorMessage';
import ConfirmDialog from '../common/ConfirmDialog';

export default function BoxSettings({ box, onUpdate, onToggleStatus, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isActive = box.status === 'ACTIVE';

  const handleUpdate = async (formData) => {
    try {
      setLoading(true);
      setError('');
      await onUpdate(box.id, formData);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update box');
    } finally {
      setLoading(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  // Errors are shown inside the ConfirmDialog
  const handleDelete = () => onDelete(box.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {error && <ErrorMessage message={error} />}

      {/* Edit Form or Display */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Box Details</h3>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
              ✏ Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <BoxForm
            initialData={box}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={loading}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <span className="label">Title</span>
              <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                {box.title}
              </p>
            </div>
            <div>
              <span className="label">Description</span>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)' }}>
                {box.description || 'No description provided.'}
              </p>
            </div>
            <div>
              <span className="label">Public Slug</span>
              <p style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--color-gray-500)' }}>
                {box.publicSlug}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Box Status Management */}
      <div className="card">
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Submission Status
        </h3>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
          When active, anyone with the QR code or link can submit messages. When paused, visitors will see a notice that submissions are closed.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span className={`badge ${isActive ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 'var(--font-size-sm)', padding: '4px 12px' }}>
              {isActive ? '● Submissions Open (ACTIVE)' : '○ Submissions Paused (INACTIVE)'}
            </span>
          </div>
          <button
            onClick={() => onToggleStatus(box.id, box.status)}
            className="btn btn-secondary btn-sm"
            disabled={loading}
          >
            {isActive ? 'Pause Submissions' : 'Resume Submissions'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: 'var(--color-danger)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-danger)', marginBottom: 'var(--spacing-xs)' }}>
          Danger Zone
        </h3>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
          Permanently delete this message box, all received messages, and their photos/videos in Google Drive.
        </p>
        <button
          onClick={() => setConfirmDelete(true)}
          className="btn btn-danger btn-sm"
          disabled={loading}
        >
          Delete Message Box
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete message box?"
        message={`"${box.title}" and all ${box.messageCount || 0} message(s), including their photos and videos in Google Drive, will be permanently deleted. The QR code will stop working. This cannot be undone.`}
        confirmLabel="Delete box"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
