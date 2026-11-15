import { formatDate } from '../../utils/formatters';

export default function DriveStatus({ connection, isConnected, onDisconnect, onConnect, isConfigured }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>Google Drive Connection</h2>
          <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
            Each message box owner stores their received photos and videos directly in their own Google Drive.
          </p>
        </div>
        <span className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 'var(--font-size-sm)', padding: '4px 12px' }}>
          {isConnected ? '● Connected' : '○ Not Connected'}
        </span>
      </div>

      {isConnected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ backgroundColor: 'var(--color-gray-50)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div>
              <span className="label">Connected Google Account</span>
              <p style={{ fontWeight: 600, color: 'var(--color-gray-800)' }}>{connection?.googleAccountId || 'Google Account'}</p>
            </div>
            <div>
              <span className="label">Application Root Folder</span>
              <p style={{ fontWeight: 500, color: 'var(--color-gray-800)' }}>📁 Personal Message Box</p>
            </div>
            <div>
              <span className="label">Connected Since</span>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                {connection?.connectedAt ? formatDate(connection.connectedAt) : 'Recently'}
              </p>
            </div>
          </div>

          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 'var(--radius-md)',
            color: '#065F46',
            fontSize: 'var(--font-size-sm)',
          }}>
            🔒 <strong>Privacy Guarantee:</strong> The application uses the restricted <code>drive.file</code> scope. It can only view and manage files that were uploaded through this application. Your other personal Google Drive files remain completely private and inaccessible.
          </div>

          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <button
              onClick={onDisconnect}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--color-danger)' }}
            >
              Disconnect Google Drive
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: 'var(--radius-md)',
            color: '#92400E',
            fontSize: 'var(--font-size-sm)',
          }}>
            ⚠️ <strong>Action Required:</strong> You cannot create or activate message boxes until your Google Drive is connected. Visitors need your Drive storage to upload photos and videos.
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <button
              onClick={onConnect}
              className="btn btn-primary"
              disabled={!isConfigured}
            >
              🔗 Connect Google Drive Account
            </button>
            {!isConfigured && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', alignSelf: 'center' }}>
                (Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
