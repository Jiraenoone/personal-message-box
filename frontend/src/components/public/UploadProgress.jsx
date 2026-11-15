/**
 * Upload progress bar. After the browser finishes sending (100%),
 * the server is still saving files to the owner's storage, so show a "processing" state.
 */
export default function UploadProgress({ percent, hasFiles }) {
  const processing = percent >= 100;
  const label = !hasFiles
    ? 'กำลังส่งข้อความ...'
    : processing
      ? 'กำลังบันทึกไฟล์ไปยังกล่องข้อความ...'
      : `กำลังอัปโหลด ${percent}%`;

  return (
    <div aria-live="polite" style={{ marginTop: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)', marginBottom: 'var(--spacing-xs)' }}>
        <span>{label}</span>
        {hasFiles && !processing && <span>{percent}%</span>}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        style={{ height: 8, backgroundColor: 'var(--color-gray-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}
      >
        <div style={{
          width: `${hasFiles ? percent : 100}%`,
          height: '100%',
          backgroundColor: 'var(--color-primary)',
          transition: 'width var(--transition-normal)',
          animation: processing || !hasFiles ? 'pmb-pulse 1.2s ease-in-out infinite' : 'none',
        }} />
      </div>
      <style>{'@keyframes pmb-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }'}</style>
    </div>
  );
}
