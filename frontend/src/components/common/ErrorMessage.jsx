export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div style={{
      padding: 'var(--spacing-md)',
      backgroundColor: '#FEE2E2',
      border: '1px solid #FECACA',
      borderRadius: 'var(--radius-md)',
      color: '#991B1B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--spacing-md)',
    }}>
      <p style={{ fontSize: 'var(--font-size-sm)' }}>{message}</p>
      {onRetry && (
        <button className="btn btn-sm btn-secondary" onClick={onRetry}>Retry</button>
      )}
    </div>
  );
}
