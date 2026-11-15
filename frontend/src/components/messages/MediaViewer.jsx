import { useCallback, useEffect, useState } from 'react';
import messageService from '../../services/messageService';

/**
 * Fullscreen lightbox for a list of media files (images and videos).
 * Keyboard: ← / → to navigate, Esc to close. Swipe left/right on touch screens.
 * @param {{ files: Array<{id,url,kind,fileName}>, startIndex: number, onClose: () => void }} props
 */
export default function MediaViewer({ files, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [touchX, setTouchX] = useState(null);
  const file = files[index];
  const hasMany = files.length > 1;

  const prev = useCallback(() => setIndex((i) => (i - 1 + files.length) % files.length), [files.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % files.length), [files.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasMany) prev();
      else if (e.key === 'ArrowRight' && hasMany) next();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next, hasMany]);

  if (!file) return null;

  const navBtn = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 44, height: 44, borderRadius: 'var(--radius-full)', border: 'none',
    background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '1.5rem', cursor: 'pointer',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Media viewer: ${file.fileName}`}
      onClick={onClose}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null || !hasMany) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        setTouchX(null);
      }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 'var(--spacing-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', color: 'white', fontSize: 'var(--font-size-sm)',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasMany && `${index + 1} / ${files.length} · `}{file.fileName}
        </span>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexShrink: 0 }}>
          <a href={messageService.fileUrl(file.url, { download: true })} style={{ color: 'white' }} title="Download">⬇ Download</a>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.75rem', lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>
      </div>

      {/* Media */}
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '100vw', maxHeight: '100vh', padding: '56px var(--spacing-md) var(--spacing-md)' }}>
        {file.kind === 'image' ? (
          <img
            key={file.id}
            src={messageService.fileUrl(file.url)}
            alt={file.fileName}
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 80px)', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
        ) : (
          <video
            key={file.id}
            src={messageService.fileUrl(file.url)}
            controls
            autoPlay
            playsInline
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 80px)', display: 'block', margin: '0 auto' }}
          />
        )}
      </div>

      {hasMany && (
        <>
          <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); prev(); }} style={{ ...navBtn, left: 12 }}>‹</button>
          <button aria-label="Next" onClick={(e) => { e.stopPropagation(); next(); }} style={{ ...navBtn, right: 12 }}>›</button>
        </>
      )}
    </div>
  );
}
