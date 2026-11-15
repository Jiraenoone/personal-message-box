import { useState } from 'react';
import Modal from './Modal';
import ErrorMessage from './ErrorMessage';

/**
 * Confirmation modal for destructive actions. onConfirm may be async; errors are shown inline.
 */
export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (busy) return;
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-lg)' }}>{message}</p>
      {error && <div style={{ marginBottom: 'var(--spacing-md)' }}><ErrorMessage message={error} /></div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)' }}>
        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={busy}>Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
