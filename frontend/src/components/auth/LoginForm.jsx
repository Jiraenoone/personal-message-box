import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../common/Input';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import { isValidEmail } from '../../utils/validators';
import GoogleSignInButton, { OrDivider, GOOGLE_LOGIN_ERRORS } from './GoogleSignInButton';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  const googleErrorCode = new URLSearchParams(location.search).get('error');
  const googleError = googleErrorCode ? (GOOGLE_LOGIN_ERRORS[googleErrorCode] || GOOGLE_LOGIN_ERRORS.google_failed) : '';

  const validate = () => {
    const errs = {};
    if (!email) {
      errs.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('test@example.com');
    setPassword('test123456');
    setErrors({});
    setServerError('');
  };

  return (
    <div className="card" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
          Welcome Back
        </h1>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
          Sign in to manage your message boxes and view received messages
        </p>
      </div>

      {(serverError || googleError) && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <ErrorMessage message={serverError || googleError} />
        </div>
      )}

      <GoogleSignInButton />
      <OrDivider />

      {/* Quick Test Login Helper — development only */}
      {import.meta.env.DEV && <div style={{
        marginBottom: 'var(--spacing-lg)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: '#EEF2FF',
        border: '1px solid #C7D2FE',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          <div>
            <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#3730A3' }}>
              🧪 Demo Test Account
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: '#4338CA' }}>
              test@example.com / test123456
            </p>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px' }}
          >
            ⚡ Auto-fill
          </button>
        </div>
      </div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
          }}
          error={errors.email}
          disabled={isSubmitting}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
          }}
          error={errors.password}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" style={{ fontWeight: 600 }}>
          Create one now
        </Link>
      </div>
    </div>
  );
}
