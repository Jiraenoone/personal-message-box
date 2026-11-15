import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../common/Input';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import { isValidEmail, isValidPassword } from '../../utils/validators';

export default function RegisterForm() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};

    if (!displayName.trim()) {
      errs.displayName = 'Your name is required';
    } else if (displayName.trim().length > 100) {
      errs.displayName = 'Name must be 100 characters or less';
    }

    if (!email) {
      errs.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (!isValidPassword(password)) {
      errs.password = 'Must be at least 8 characters with at least one letter and one number';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
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
      await register({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-gray-900)' }}>
          Create an Account
        </h1>
        <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
          Start receiving messages and media directly into your Google Drive
        </p>
      </div>

      {serverError && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <ErrorMessage message={serverError} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <Input
          id="displayName"
          label="Your Name or Nickname"
          type="text"
          placeholder="e.g. Alex"
          autoComplete="name"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (errors.displayName) setErrors((prev) => ({ ...prev, displayName: '' }));
          }}
          error={errors.displayName}
          disabled={isSubmitting}
        />

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
          placeholder="At least 8 characters (letters & numbers)"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
          }}
          error={errors.password}
          disabled={isSubmitting}
        />

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          error={errors.confirmPassword}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div style={{ marginTop: 'var(--spacing-xl)', textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ fontWeight: 600 }}>
          Sign In
        </Link>
      </div>
    </div>
  );
}
