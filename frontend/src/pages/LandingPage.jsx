import { Link } from 'react-router-dom';
import { APP_NAME } from '../utils/constants';

export default function LandingPage() {
  return (
    <div className="page">
      <div className="container" style={{ textAlign: 'center', paddingTop: 'var(--spacing-3xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, color: 'var(--color-gray-900)', marginBottom: 'var(--spacing-md)' }}>
          {APP_NAME}
        </h1>
        <p style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-gray-500)', maxWidth: '600px', margin: '0 auto var(--spacing-xl)' }}>
          Create personal message boxes, share QR codes, and receive messages with images and videos — all stored securely in your Google Drive.
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>

        <div style={{ marginTop: 'var(--spacing-3xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)', maxWidth: '900px', margin: 'var(--spacing-3xl) auto 0' }}>
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>📦 Multiple Boxes</h3>
            <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>Create separate message boxes for different purposes, each with its own QR code.</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>📱 QR Code Sharing</h3>
            <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>Share your QR code and let anyone send you messages, images, and videos.</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--spacing-sm)' }}>🔒 Private & Secure</h3>
            <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>Messages are private. Media files are stored in your own Google Drive.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
