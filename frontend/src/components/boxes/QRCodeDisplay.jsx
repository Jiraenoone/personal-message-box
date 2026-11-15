import { useState } from 'react';
import QRCode from 'react-qr-code';
import boxService from '../../services/boxService';

export default function QRCodeDisplay({ box }) {
  const [copied, setCopied] = useState(false);

  if (!box) return null;

  const publicUrl = box.publicUrl || `${window.location.origin}/m/${box.publicSlug}`;
  const downloadUrl = boxService.getQRCodeDownloadUrl(box.id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
      <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
        Share QR Code & Link
      </h3>
      <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', maxWidth: '400px' }}>
        Anyone can scan this QR code or click the link to send messages, photos, and videos to this box.
      </p>

      {/* QR Code Container */}
      <div style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        display: 'inline-block',
      }}>
        <QRCode
          value={publicUrl}
          size={200}
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          viewBox={`0 0 256 256`}
        />
      </div>

      {/* Public URL Box */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        backgroundColor: 'var(--color-gray-100)',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-gray-200)',
      }}>
        <input
          type="text"
          readOnly
          value={publicUrl}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'monospace',
            color: 'var(--color-gray-800)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleCopy}
          className="btn btn-sm btn-secondary"
          style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href={downloadUrl}
          download={`qrcode-${box.publicSlug}.png`}
          className="btn btn-primary btn-sm"
        >
          ⬇ Download QR Code (PNG)
        </a>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          ↗ Open Submission Page
        </a>
      </div>
    </div>
  );
}
