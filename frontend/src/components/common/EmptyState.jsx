export default function EmptyState({ title, description, action }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--spacing-3xl) var(--spacing-md)',
      color: 'var(--color-gray-500)',
    }}>
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 'var(--spacing-sm)' }}>
        {title}
      </h3>
      {description && <p style={{ marginBottom: 'var(--spacing-lg)' }}>{description}</p>}
      {action}
    </div>
  );
}
