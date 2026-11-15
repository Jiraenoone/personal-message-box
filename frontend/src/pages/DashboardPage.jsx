import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useBoxes from '../hooks/useBoxes';
import { formatDate } from '../utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const { boxes } = useBoxes();
  const isDriveConnected = user?.driveConnection?.status === 'ACTIVE';

  const totalBoxes = boxes.length || user?._count?.messageBoxes || 0;
  const totalMessages = boxes.reduce((acc, b) => acc + (b.messageCount || 0), 0);

  return (
    <div className="page">
      <div className="container">
        {/* Welcome header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h1>Welcome back, {user?.displayName}!</h1>
            <p>Manage your message boxes, view received messages, and monitor your Google Drive storage.</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <Link to="/boxes" className="btn btn-primary">
              + New Message Box
            </Link>
          </div>
        </div>

        {/* Google Drive Status Alert if not connected */}
        {!isDriveConnected && (
          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <div>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: '#92400E' }}>
                  Google Drive Not Connected
                </h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: '#78350F' }}>
                  You must connect your Google Drive before you can create message boxes and receive media uploads.
                </p>
              </div>
            </div>
            <Link to="/google-drive" className="btn btn-primary btn-sm">
              Connect Google Drive Now
            </Link>
          </div>
        )}

        {/* Dashboard overview cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-2xl)',
        }}>
          <div className="card">
            <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              Message Boxes
            </p>
            <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-gray-900)', marginTop: 'var(--spacing-xs)' }}>
              {totalBoxes}
            </p>
            <Link to="/boxes" style={{ fontSize: 'var(--font-size-xs)', display: 'inline-block', marginTop: 'var(--spacing-sm)' }}>
              Manage boxes &rarr;
            </Link>
          </div>

          <div className="card">
            <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              Total Messages Received
            </p>
            <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-gray-900)', marginTop: 'var(--spacing-xs)' }}>
              {totalMessages}
            </p>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', display: 'inline-block', marginTop: 'var(--spacing-sm)' }}>
              Across all boxes
            </span>
          </div>

          <div className="card">
            <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              Google Drive Storage
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
              <span className={`badge ${isDriveConnected ? 'badge-success' : 'badge-warning'}`}>
                {isDriveConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Link to="/google-drive" style={{ fontSize: 'var(--font-size-xs)', display: 'inline-block', marginTop: 'var(--spacing-sm)' }}>
              Drive settings &rarr;
            </Link>
          </div>

          <div className="card">
            <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              Account Created
            </p>
            <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-gray-900)', marginTop: 'var(--spacing-xs)' }}>
              {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </p>
            <Link to="/settings" style={{ fontSize: 'var(--font-size-xs)', display: 'inline-block', marginTop: 'var(--spacing-sm)' }}>
              Account profile &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Message Boxes */}
        {boxes.length > 0 && (
          <div className="card" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Your Message Boxes</h2>
              <Link to="/boxes" className="btn btn-secondary btn-sm">View All ({boxes.length})</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {boxes.slice(0, 3).map((b) => (
                <div key={b.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'var(--color-gray-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-gray-200)',
                }}>
                  <div>
                    <Link to={`/boxes/${b.id}`} style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                      {b.title}
                    </Link>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', marginLeft: 'var(--spacing-sm)' }}>
                      {b.status} • {b.messageCount || 0} messages
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Link to={`/boxes/${b.id}`} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: 'var(--font-size-xs)' }}>
                      QR & Details
                    </Link>
                    <Link to={`/boxes/${b.id}/inbox`} className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: 'var(--font-size-xs)' }}>
                      Inbox
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Guide */}
        <div className="card">
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            Quick Setup Guide
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
              <div style={{
                backgroundColor: isDriveConnected ? 'var(--color-success)' : 'var(--color-primary)',
                color: 'var(--color-white)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                flexShrink: 0,
              }}>
                {isDriveConnected ? '✓' : '1'}
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Connect your Google Drive</h4>
                <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>
                  Authorize the app to store incoming message attachments securely in your personal Google Drive account.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
              <div style={{
                backgroundColor: totalBoxes > 0 ? 'var(--color-success)' : 'var(--color-gray-300)',
                color: totalBoxes > 0 ? 'var(--color-white)' : 'var(--color-gray-700)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                flexShrink: 0,
              }}>
                {totalBoxes > 0 ? '✓' : '2'}
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Create your message boxes</h4>
                <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>
                  Give each box a title and description, then generate its unique URL and QR Code.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
              <div style={{
                backgroundColor: 'var(--color-gray-300)',
                color: 'var(--color-gray-700)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 'var(--font-size-sm)',
                flexShrink: 0,
              }}>
                3
              </div>
              <div>
                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Share QR Code & Receive Messages</h4>
                <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>
                  Visitors scan the QR code to send you messages, images, and videos directly into your Drive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
