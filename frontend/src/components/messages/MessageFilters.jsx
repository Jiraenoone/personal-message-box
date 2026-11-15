import { useEffect, useState } from 'react';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'image', label: '📷 Images' },
  { value: 'video', label: '🎬 Videos' },
  { value: 'text', label: '💬 Text only' },
];

export default function MessageFilters({ filter, onFilterChange, search, onSearchChange }) {
  const [query, setQuery] = useState(search);

  // Debounce search typing
  useEffect(() => {
    const t = setTimeout(() => { if (query.trim() !== search) onSearchChange(query.trim()); }, 350);
    return () => clearTimeout(t);
  }, [query, search, onSearchChange]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
      <div role="tablist" aria-label="Filter messages" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value || 'all'}
              role="tab"
              aria-selected={active}
              onClick={() => onFilterChange(f.value)}
              className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <input
        type="search"
        className="input"
        placeholder="Search sender or text..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search messages"
        style={{ maxWidth: 260, flex: '1 1 180px' }}
      />
    </div>
  );
}
