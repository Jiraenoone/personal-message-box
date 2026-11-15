export default function Button({ children, className = '', variant = 'primary', size = '', disabled = false, type = 'button', onClick, ...props }) {
  const classes = [
    'btn',
    variant ? `btn-${variant}` : '',
    size ? `btn-${size}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
