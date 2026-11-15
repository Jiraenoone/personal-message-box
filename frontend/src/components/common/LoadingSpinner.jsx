export default function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeMap = { sm: '1rem', md: '2rem', lg: '3rem' };
  const spinnerSize = sizeMap[size] || sizeMap.md;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-xl)', gap: 'var(--spacing-md)' }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid var(--color-gray-200)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }}
      />
      {message && <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>{message}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
