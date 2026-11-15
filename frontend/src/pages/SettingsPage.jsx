import useAuth from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <div className="container-md">
        <div className="page-header">
          <h1>Account Settings</h1>
          <p>View your profile and account information</p>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
            Profile Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <label className="label">Display Name</label>
              <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 500, color: 'var(--color-gray-900)' }}>
                {user?.displayName}
              </p>
            </div>

            <div>
              <label className="label">Email Address</label>
              <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 500, color: 'var(--color-gray-900)' }}>
                {user?.email}
              </p>
            </div>

            <div>
              <label className="label">User ID (UUID)</label>
              <p style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--color-gray-500)' }}>
                {user?.id}
              </p>
            </div>

            <div>
              <label className="label">Account Created</label>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ borderColor: 'var(--color-danger)' }}>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-danger)', marginBottom: 'var(--spacing-xs)' }}>
            Sign Out of Account
          </h3>
          <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>
            This will end your current session and clear authentication cookies.
          </p>
          <button onClick={logout} className="btn btn-danger btn-sm">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
