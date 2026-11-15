import { useEffect, useRef, useState } from 'react';
import { formatFileSize } from '../../utils/formatters';

/**
 * Drag-and-drop / tap-to-pick uploader for images and videos with thumbnails.
 * items: [{ id, file, kind: 'image'|'video', url }]
 */
export default function FileUploader({ items, onChange, limits, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);

  // Revoke object URLs on unmount
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => () => itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url)), []);

  const accept = [...limits.imageTypes, ...limits.videoTypes].join(',');
  const imageCount = items.filter((i) => i.kind === 'image').length;
  const videoCount = items.filter((i) => i.kind === 'video').length;

  const addFiles = (fileList) => {
    const newErrors = [];
    const added = [];
    let images = imageCount;
    let videos = videoCount;

    for (const file of Array.from(fileList)) {
      const isImage = limits.imageTypes.includes(file.type);
      const isVideo = limits.videoTypes.includes(file.type);

      if (!isImage && !isVideo) {
        newErrors.push(`"${file.name}" ไม่ใช่ไฟล์รูปภาพหรือวิดีโอที่รองรับ`);
      } else if (isImage && file.size > limits.maxImageSizeMB * 1024 * 1024) {
        newErrors.push(`"${file.name}" ใหญ่เกิน ${limits.maxImageSizeMB}MB`);
      } else if (isVideo && file.size > limits.maxVideoSizeMB * 1024 * 1024) {
        newErrors.push(`"${file.name}" ใหญ่เกิน ${limits.maxVideoSizeMB}MB`);
      } else if (isImage && images >= limits.maxImages) {
        newErrors.push(`แนบรูปได้สูงสุด ${limits.maxImages} รูป`);
      } else if (isVideo && videos >= limits.maxVideos) {
        newErrors.push(`แนบวิดีโอได้สูงสุด ${limits.maxVideos} คลิป`);
      } else {
        if (isImage) images += 1; else videos += 1;
        added.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          kind: isImage ? 'image' : 'video',
          url: URL.createObjectURL(file),
        });
      }
    }

    setErrors([...new Set(newErrors)]);
    if (added.length) onChange([...items, ...added]);
  };

  const remove = (id) => {
    const item = items.find((i) => i.id === id);
    if (item) URL.revokeObjectURL(item.url);
    onChange(items.filter((i) => i.id !== id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-gray-300)'}`,
          backgroundColor: dragOver ? 'var(--color-primary-light)' : 'var(--color-gray-50)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg) var(--spacing-md)',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all var(--transition-fast)',
        }}
      >
        <div style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-xs)' }}>📎</div>
        <p style={{ fontWeight: 600, color: 'var(--color-gray-700)' }}>แตะเพื่อเลือก หรือลากไฟล์มาวางที่นี่</p>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--spacing-xs)' }}>
          รูปภาพ (JPG, PNG, WEBP) สูงสุด {limits.maxImages} รูป · {limits.maxImageSizeMB}MB/รูป<br />
          วิดีโอ (MP4, MOV, WEBM) สูงสุด {limits.maxVideos} คลิป · {limits.maxVideoSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          hidden
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {errors.length > 0 && (
        <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-md)' }}>
          {errors.map((err) => <li key={err} className="error-text">{err}</li>)}
        </ul>
      )}

      {items.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 'var(--spacing-sm)',
          marginTop: 'var(--spacing-md)',
        }}>
          {items.map((item) => (
            <div key={item.id} style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: 'var(--color-gray-900)',
              border: '1px solid var(--color-gray-200)',
            }}>
              {item.kind === 'image' ? (
                <img src={item.url} alt={item.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <video src={item.url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', left: 6, top: 6, fontSize: '0.7rem', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '1px 6px', borderRadius: 'var(--radius-sm)' }}>▶ วิดีโอ</span>
                </>
              )}
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: '0.65rem', color: 'white', background: 'rgba(0,0,0,0.55)', padding: '2px 6px' }}>
                {formatFileSize(item.file.size)}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  aria-label={`ลบ ${item.file.name}`}
                  style={{
                    position: 'absolute', right: 4, top: 4, width: 26, height: 26,
                    borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer',
                    background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '0.9rem', lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
