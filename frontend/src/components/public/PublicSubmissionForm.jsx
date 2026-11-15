import { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import FileUploader from './FileUploader';
import UploadProgress from './UploadProgress';
import publicService from '../../services/publicService';

export default function PublicSubmissionForm({ slug, limits, onSuccess }) {
  const [senderName, setSenderName] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const validate = () => {
    const errs = {};
    if (!senderName.trim()) errs.senderName = 'กรุณากรอกชื่อผู้ส่ง';
    else if (senderName.trim().length > limits.maxSenderName) errs.senderName = `ชื่อยาวได้ไม่เกิน ${limits.maxSenderName} ตัวอักษร`;
    if (content.length > limits.maxContent) errs.content = `ข้อความยาวได้ไม่เกิน ${limits.maxContent} ตัวอักษร`;
    if (!content.trim() && items.length === 0) errs.content = 'กรุณาพิมพ์ข้อความ หรือแนบไฟล์อย่างน้อย 1 ไฟล์';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    setProgress(0);
    try {
      const result = await publicService.submitMessage(
        slug,
        { senderName: senderName.trim(), content, files: items.map((i) => i.file) },
        setProgress
      );
      items.forEach((i) => URL.revokeObjectURL(i.url));
      onSuccess(result);
    } catch (err) {
      const details = err.details?.map((d) => d.message).join(' · ');
      setError(details || err.message || 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <Input
        id="senderName"
        label="ชื่อผู้ส่ง *"
        placeholder="ชื่อของคุณ"
        value={senderName}
        maxLength={limits.maxSenderName}
        autoComplete="name"
        onChange={(e) => { setSenderName(e.target.value); setFieldErrors((f) => ({ ...f, senderName: undefined })); }}
        error={fieldErrors.senderName}
        disabled={submitting}
      />

      <div>
        <label htmlFor="content" className="label">ข้อความ</label>
        <textarea
          id="content"
          className={`input ${fieldErrors.content ? 'input-error' : ''}`}
          rows={5}
          placeholder="พิมพ์ข้อความของคุณ..."
          value={content}
          maxLength={limits.maxContent}
          onChange={(e) => { setContent(e.target.value); setFieldErrors((f) => ({ ...f, content: undefined })); }}
          disabled={submitting}
          style={{ resize: 'vertical', minHeight: 120, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)' }}>
          {fieldErrors.content ? <p className="error-text">{fieldErrors.content}</p> : <span />}
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', whiteSpace: 'nowrap' }}>
            {content.length}/{limits.maxContent}
          </span>
        </div>
      </div>

      <div>
        <span className="label">แนบรูปภาพ / วิดีโอ (ไม่บังคับ)</span>
        <FileUploader
          items={items}
          onChange={(next) => { setItems(next); setFieldErrors((f) => ({ ...f, content: undefined })); }}
          limits={limits}
          disabled={submitting}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      {submitting && <UploadProgress percent={progress} hasFiles={items.length > 0} />}

      <Button type="submit" size="lg" disabled={submitting} style={{ width: '100%' }}>
        {submitting ? 'กำลังส่ง...' : 'ส่งข้อความ'}
      </Button>
    </form>
  );
}
