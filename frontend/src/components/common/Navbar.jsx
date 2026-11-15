import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/boxes', label: 'My Boxes' },
  { to: '/google-drive', label: 'Google Drive' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(`${path}/`));

  // Public submit page (/m/:slug) is for visitors who scanned a QR code — no app navigation
  if (location.pathname.startsWith('/m/')) return null;

  const linkStyle = (to) => ({
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    color: isActive(to) ? 'var(--color-primary)' : 'var(--color-gray-600)',
  });

  return (
    <header style={{
      backgroundColor: 'var(--color-white)',
      borderBottom: '1px solid var(--color-gray-200)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-md)',
        height: '64px',
      }}>
        {/* Brand */}
        <Link to={user ? '/dashboard' : '/'} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          fontWeight: 700,
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-gray-900)',
          minWidth: 0,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '1.5rem' }}>📬</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{APP_NAME}</span>
        </Link>

        {/* Desktop navigation */}
        {user ? (
          <nav className="nav-desktop" style={{ alignItems: 'center', gap: 'var(--spacing-md)' }}>
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} style={linkStyle(l.to)}>{l.label}</Link>
            ))}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginLeft: 'var(--spacing-md)',
              paddingLeft: 'var(--spacing-md)',
              borderLeft: '1px solid var(--color-gray-200)',
            }}>
              <Link to="/settings" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-gray-800)' }} title="Account Settings">
                👤 {user.displayName}
              </Link>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary" style={{ marginLeft: 'var(--spacing-xs)' }}>
                Sign Out
              </button>
            </div>
          </nav>
        ) : (
          <div className="nav-desktop" style={{ alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Link to="/login" className="btn btn-sm btn-secondary">Sign In</Link>
            <Link to="/register" className="btn btn-sm btn-primary">Get Started</Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="nav-toggle btn btn-sm btn-secondary"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
          style={{ fontSize: '1.1rem', lineHeight: 1, padding: '6px 10px' }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <nav id="mobile-menu" className="nav-mobile" style={{
          borderTop: '1px solid var(--color-gray-200)',
          backgroundColor: 'var(--color-white)',
          padding: 'var(--spacing-sm) var(--spacing-md) var(--spacing-md)',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {user ? (
            <>
              {NAV_LINKS.map((l) => (
                <Link key={l.to} to={l.to} style={{ ...linkStyle(l.to), fontSize: 'var(--font-size-base)', padding: '10px 4px' }}>{l.label}</Link>
              ))}
              <Link to="/settings" style={{ ...linkStyle('/settings'), fontSize: 'var(--font-size-base)', padding: '10px 4px' }}>
                👤 {user.displayName}
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
