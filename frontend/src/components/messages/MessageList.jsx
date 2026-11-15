import { Link } from 'react-router-dom';
import { timeAgo, formatDateTime, truncateText } from '../../utils/formatters';

function Avatar({ name }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div aria-hidden style={{
      width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-full)',
      backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
    }}>
      {initial}
    </div>
  );
}

export default function MessageList({ boxId, messages, onDelete }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      {messages.map((m) => {
        const failed = m.files.filter((f) => f.uploadStatus === 'FAILED').length;
        return (
          <li key={m.id} className="card" style={{ padding: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
            <Avatar name={m.senderName} />
            <Link to={`/boxes/${boxId}/messages/${m.id}`} style={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)', alignItems: 'baseline' }}>
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.senderName}</strong>
                <time dateTime={m.createdAt} title={formatDateTime(m.createdAt)} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', whiteSpace: 'nowrap' }}>
                  {timeAgo(m.createdAt)}
                </time>
              </div>
              <p style={{ color: m.content ? 'var(--color-gray-600)' : 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)', marginTop: 2, wordBreak: 'break-word', fontStyle: m.content ? 'normal' : 'italic' }}>
                {m.content ? truncateText(m.content, 140) : 'No text — attachments only'}
              </p>
              {(m.imageCount > 0 || m.videoCount > 0 || failed > 0) && (
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                  {m.imageCount > 0 && <span className="badge badge-info">📷 {m.imageCount} image{m.imageCount > 1 ? 's' : ''}</span>}
                  {m.videoCount > 0 && <span className="badge badge-info">🎬 {m.videoCount} video</span>}
                  {failed > 0 && <span className="badge badge-danger">⚠ {failed} failed</span>}
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => onDelete(m)}
              className="btn btn-sm btn-secondary"
              aria-label={`Delete message from ${m.senderName}`}
              title="Delete message"
            >
              🗑
            </button>
          </li>
        );
      })}
    </ul>
  );
}
