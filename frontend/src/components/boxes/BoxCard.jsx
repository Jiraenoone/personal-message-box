import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

export default function BoxCard({ box, onToggleStatus }) {
  const [copied, setCopied] = useState(false);
  const isActive = box.status === 'ACTIVE';
  const publicUrl = box.publicUrl || `${window.location.origin}/m/${box.publicSlug}`;

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        {/* Header: Status badge & message count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <span className={`badge ${isActive ? 'badge-success' : 'badge-warning'}`}>
            {isActive ? '● Active' : '○ Closed / Inactive'}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', fontWeight: 500 }}>
            📬 {box.messageCount || 0} messages
          </span>
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-gray-900)', marginBottom: 'var(--spacing-xs)' }}>
          <Link to={`/boxes/${box.id}`} style={{ color: 'inherit' }}>
            {box.title}
          </Link>
        </h3>

        {/* Description */}
        <p style={{
          color: 'var(--color-gray-600)',
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--spacing-md)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.5rem',
        }}>
          {box.description || 'No description provided.'}
        </p>

        {/* Created date */}
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', marginBottom: 'var(--spacing-md)' }}>
          Created on {formatDate(box.createdAt)}
        </p>
      </div>

      {/* Footer Actions */}
      <div style={{
        paddingTop: 'var(--spacing-md)',
        borderTop: '1px solid var(--color-gray-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--spacing-xs)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <Link to={`/boxes/${box.id}`} className="btn btn-secondary btn-sm" title="View QR Code & Settings">
            QR & Settings
          </Link>
          <Link to={`/boxes/${box.id}/inbox`} className="btn btn-primary btn-sm" title="View Received Messages">
            Inbox ({box.messageCount || 0})
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            title="Copy Public URL"
          >
            {copied ? '✓ Copied' : '🔗 Copy'}
          </button>
          <button
            onClick={() => onToggleStatus(box.id, box.status)}
            className="btn btn-secondary btn-sm"
            title={isActive ? 'Deactivate Box' : 'Activate Box'}
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            {isActive ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
