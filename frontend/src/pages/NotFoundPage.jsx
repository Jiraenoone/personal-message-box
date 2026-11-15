import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page">
      <div className="container text-center" style={{ paddingTop: 'var(--spacing-3xl)' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 800, color: 'var(--color-gray-200)', marginBottom: 'var(--spacing-md)' }}>404</h1>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-xl)' }}>The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
