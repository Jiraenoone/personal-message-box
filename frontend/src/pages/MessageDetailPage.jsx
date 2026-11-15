import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import messageService from '../services/messageService';
import MessageDetail from '../components/messages/MessageDetail';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function MessageDetailPage() {
  const { id, messageId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await messageService.getMessage(id, messageId));
    } catch (err) {
      setError(err.message || 'Failed to load message');
    } finally {
      setLoading(false);
    }
  }, [id, messageId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    await messageService.deleteMessage(id, messageId);
    navigate(`/boxes/${id}/inbox`, { replace: true });
  };

  return (
    <div className="page">
      <div className="container-md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <Link to={`/boxes/${id}/inbox`} style={{ fontSize: 'var(--font-size-sm)' }}>
            &larr; Back to {data?.box?.title ? `"${data.box.title}"` : 'inbox'}
          </Link>
          {data && (
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmOpen(true)}>🗑 Delete</button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner message="Loading message..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : (
          <MessageDetail message={data.message} />
        )}

        <ConfirmDialog
          isOpen={confirmOpen}
          title="Delete message?"
          message={`The message from "${data?.message?.senderName}" and its attachments in Google Drive will be permanently deleted. This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setConfirmOpen(false)}
        />
      </div>
    </div>
  );
}
