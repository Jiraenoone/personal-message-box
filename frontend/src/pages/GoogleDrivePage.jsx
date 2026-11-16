import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import driveService from '../services/driveService';
import useAuth from '../hooks/useAuth';
import DriveStatus from '../components/dashboard/DriveStatus';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function GoogleDrivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { refreshUser } = useAuth();

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await driveService.getStatus();
      setStatusData(data);
    } catch (err) {
      setError(err.message || 'Failed to load Google Drive connection status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle the OAuth redirect result once, then drop it from the URL so it can't re-trigger
  useEffect(() => {
    const connected = searchParams.get('connected') === 'true';
    const errorCode = searchParams.get('error');
    if (!connected && !errorCode) return;

    if (connected) {
      setSuccessMsg('🎉 Google Drive has been successfully connected!');
      refreshUser();
    } else {
      const messages = {
        access_denied: 'You declined Google Drive access. Connect again and allow access to continue.',
        no_refresh_token: 'Google did not return offline access. Remove this app at myaccount.google.com/permissions, then connect again.',
        invalid_state: 'The connection request expired. Please try connecting again.',
        missing_code_or_state: 'The connection request was incomplete. Please try again.',
      };
      setError(messages[errorCode] || 'Could not connect Google Drive. Please try again.');
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, refreshUser]);

  const handleConnectOAuth = async () => {
    try {
      setActionLoading(true);
      setError('');
      const data = await driveService.getConnectUrl();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.message || 'Google OAuth credentials are not configured in backend .env');
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate Google OAuth');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? You will not be able to receive new media messages until you reconnect. Existing files in your Google Drive will NOT be deleted.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await driveService.disconnect();
      setSuccessMsg('Google Drive disconnected.');
      await fetchStatus();
      await refreshUser();
    } catch (err) {
      setError(err.message || 'Failed to disconnect Google Drive');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container-md">
          <LoadingSpinner message="Checking Google Drive connection..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container-md">
        <div className="page-header">
          <h1>Google Drive Integration</h1>
          <p>Manage your personal cloud storage connection for receiving message attachments</p>
        </div>

        {successMsg && (
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: '#D1FAE5',
            border: '1px solid #6EE7B7',
            borderRadius: 'var(--radius-md)',
            color: '#065F46',
            marginBottom: 'var(--spacing-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{successMsg}</span>
            <button
              onClick={() => setSuccessMsg('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46', fontWeight: 'bold' }}
            >
              &times;
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <ErrorMessage message={error} onRetry={fetchStatus} />
          </div>
        )}

        {actionLoading && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <LoadingSpinner size="sm" message="Updating connection..." />
          </div>
        )}

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <DriveStatus
            connection={statusData?.connection}
            isConnected={statusData?.isConnected}
            isConfigured={statusData?.isConfigured}
            onDisconnect={handleDisconnect}
            onConnect={handleConnectOAuth}
          />
        </div>

        {/* How It Works Explainer */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            📂 How Personal Message Box uses your Google Drive
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)' }}>
            <p>
              Unlike other platforms that store user media on shared cloud servers, <strong>Personal Message Box stores every file directly inside your own Google Drive</strong>.
            </p>

            <div style={{
              backgroundColor: 'var(--color-gray-900)',
              color: '#A7F3D0',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              lineHeight: 1.6,
            }}>
              Personal Message Box/<br />
              &nbsp;&nbsp;├── Box 001 - Birthday Wishes/<br />
              &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── Message 001/<br />
              &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── photo1.jpg<br />
              &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── video.mp4<br />
              &nbsp;&nbsp;└── Box 002 - Wedding Guestbook/<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Message 001/<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── congratulation.png
            </div>

            <ul style={{ paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <li><strong>Zero storage costs for the platform:</strong> Uses your existing Google Drive quota (15 GB free with Google).</li>
              <li><strong>Private attachments:</strong> Files are uploaded with private permissions; only you can access them.</li>
              <li><strong>Offline upload support:</strong> Visitors can send you messages even when you are offline; the backend transfers the files to your Drive folder automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
