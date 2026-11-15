import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useMessages from '../hooks/useMessages';
import MessageFilters from '../components/messages/MessageFilters';
import MessageList from '../components/messages/MessageList';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const STORAGE_WARNING = 'Deleted, but some files could not be removed from Google Drive. You may need to delete them there manually.';

export default function InboxPage() {
  const { id } = useParams();
  const {
    messages, box, pagination, loading, error, page, setPage,
    filter, setFilter, search, setSearch, refresh, deleteMessage, deleteAll,
  } = useMessages(id);
  const [toDelete, setToDelete] = useState(null); // message | 'all' | null
  const [notice, setNotice] = useState('');

  const handleConfirm = async () => {
    const result = toDelete === 'all' ? await deleteAll() : await deleteMessage(toDelete.id);
    setNotice(result?.storageCleanup && result.storageCleanup !== 'done' ? STORAGE_WARNING : '');
  };

  const isFiltered = Boolean(filter || search);

  return (
    <div className="page">
      <div className="container-md">
        <div style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
          <Link to={`/boxes/${id}`}>&larr; Back to box</Link>
        </div>

        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ wordBreak: 'break-word' }}>📬 {box?.title || 'Inbox'}</h1>
            <p>{pagination.total} message{pagination.total === 1 ? '' : 's'}{isFiltered ? ' match' : ''}</p>
          </div>
          {pagination.total > 0 && !isFiltered && (
            <button className="btn btn-danger btn-sm" onClick={() => setToDelete('all')}>🗑 Delete all</button>
          )}
        </div>

        {notice && <div style={{ marginBottom: 'var(--spacing-md)' }}><ErrorMessage message={notice} /></div>}

        <MessageFilters filter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} />

        {error ? (
          <ErrorMessage message={error} onRetry={refresh} />
        ) : loading && messages.length === 0 ? (
          <LoadingSpinner message="Loading messages..." />
        ) : messages.length === 0 ? (
          <div className="card">
            <EmptyState
              title={isFiltered ? 'No messages match' : 'No messages yet'}
              description={isFiltered ? 'Try a different filter or search.' : 'Share your QR code or link — messages will show up here.'}
              action={!isFiltered && <Link to={`/boxes/${id}`} className="btn btn-primary">Show QR code</Link>}
            />
          </div>
        ) : (
          <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity var(--transition-fast)' }}>
            <MessageList boxId={id} messages={messages} onDelete={setToDelete} />
          </div>
        )}

        {pagination.totalPages > 1 && (
          <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>&larr; Newer</button>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>Page {page} of {pagination.totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= pagination.totalPages || loading} onClick={() => setPage(page + 1)}>Older &rarr;</button>
          </nav>
        )}

        <ConfirmDialog
          isOpen={toDelete !== null}
          title={toDelete === 'all' ? 'Delete all messages?' : 'Delete message?'}
          message={toDelete === 'all'
            ? `All ${pagination.total} messages in this box and their photos/videos in Google Drive will be permanently deleted. This cannot be undone.`
            : `The message from "${toDelete?.senderName}" and its attachments in Google Drive will be permanently deleted. This cannot be undone.`}
          confirmLabel={toDelete === 'all' ? 'Delete all' : 'Delete'}
          onConfirm={handleConfirm}
          onClose={() => setToDelete(null)}
        />
      </div>
    </div>
  );
}
