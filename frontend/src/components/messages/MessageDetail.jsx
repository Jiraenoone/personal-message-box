import { useState } from 'react';
import MediaViewer from './MediaViewer';
import messageService from '../../services/messageService';
import { formatDateTime, formatFileSize } from '../../utils/formatters';

export default function MessageDetail({ message }) {
  const [viewerIndex, setViewerIndex] = useState(null);
  const viewable = message.files.filter((f) => f.url && (f.kind === 'image' || f.kind === 'video'));
  const images = viewable.filter((f) => f.kind === 'image');
  const videos = viewable.filter((f) => f.kind === 'video');
  const unavailable = message.files.filter((f) => !f.url);

  return (
    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
        <div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, wordBreak: 'break-word' }}>{message.senderName}</h2>
        </div>
        <time dateTime={message.createdAt} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
          {formatDateTime(message.createdAt)}
        </time>
      </div>

      {message.content ? (
        // Plain text rendered by React (escaped) — never as HTML
        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7, color: 'var(--color-gray-800)' }}>
          {message.content}
        </p>
      ) : (
        <p style={{ color: 'var(--color-gray-400)', fontStyle: 'italic' }}>No text message.</p>
      )}

      {videos.length > 0 && (
        <section style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-sm)' }}>
            🎬 Video
          </h3>
          {videos.map((v) => (
            <div key={v.id} style={{ marginBottom: 'var(--spacing-sm)' }}>
              <video
                src={messageService.fileUrl(v.url)}
                controls
                playsInline
                preload="metadata"
                style={{ width: '100%', maxHeight: 480, borderRadius: 'var(--radius-md)', backgroundColor: 'black' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 4 }}>
                <span>{v.fileName} · {formatFileSize(v.fileSize)}</span>
                <a href={messageService.fileUrl(v.url, { download: true })}>⬇ Download</a>
              </div>
            </div>
          ))}
        </section>
      )}

      {images.length > 0 && (
        <section style={{ marginTop: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-sm)' }}>
            📷 Images ({images.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--spacing-sm)' }}>
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setViewerIndex(viewable.indexOf(img))}
                aria-label={`Open ${img.fileName}`}
                style={{ padding: 0, border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '1', cursor: 'zoom-in', background: 'var(--color-gray-100)' }}
              >
                <img src={messageService.fileUrl(img.url)} alt={img.fileName} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        </section>
      )}

      {unavailable.length > 0 && (
        <p style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
          ⚠ {unavailable.length} attachment(s) failed to upload and are not available: {unavailable.map((f) => f.fileName).join(', ')}
        </p>
      )}

      {viewerIndex !== null && (
        <MediaViewer files={viewable} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}
