export default function Input({ label, error, id, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <input
        id={id}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
