import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';

export default function BoxForm({ initialData = null, onSubmit, onCancel, isSubmitting = false }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Box title is required';
    } else if (title.trim().length > 200) {
      errs.title = 'Title must be 200 characters or less';
    }

    if (description && description.length > 2000) {
      errs.description = 'Description must be 2000 characters or less';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
      });
    } catch (err) {
      setSubmitError(err.message || 'Failed to save message box');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {submitError && <ErrorMessage message={submitError} />}

      <Input
        id="box-title"
        label="Message Box Title"
        placeholder="e.g. Birthday Wishes 2026, Wedding Guestbook, Secret Feedback..."
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
        }}
        error={errors.title}
        disabled={isSubmitting}
        maxLength={200}
      />

      <div>
        <label htmlFor="box-desc" className="label">
          Description (Optional)
        </label>
        <textarea
          id="box-desc"
          className={`input ${errors.description ? 'input-error' : ''}`}
          rows={3}
          placeholder="Tell visitors what this message box is for and what kind of messages they can leave..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
          }}
          disabled={isSubmitting}
          maxLength={2000}
        />
        {errors.description && <p className="error-text">{errors.description}</p>}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-sm)' }}>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Box' : 'Create Box'}
        </Button>
      </div>
    </form>
  );
}
