import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import publicService from '../services/publicService';
import PublicSubmissionForm from '../components/public/PublicSubmissionForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Button from '../components/common/Button';

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-50)', padding: 'var(--spacing-lg) var(--spacing-md)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {children}
        <p style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-400)', marginTop: 'var(--spacing-lg)' }}>
          Personal Message Box
        </p>
      </div>
    </div>
  );
}

function StatusCard({ icon, title, text, children }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl) var(--spacing-lg)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>{icon}</div>
      <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--spacing-sm)' }}>{title}</h1>
      {text && <p style={{ color: 'var(--color-gray-500)' }}>{text}</p>}
      {children}
    </div>
  );
}

export default function PublicSubmitPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null, notFound: false });
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    setState({ loading: true, data: null, error: null, notFound: false });
    try {
      const data = await publicService.getBox(slug);
      setState({ loading: false, data, error: null, notFound: false });
    } catch (err) {
      setState({ loading: false, data: null, error: err.message, notFound: err.code === 'NOT_FOUND' });
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (state.data?.box?.title) document.title = `${state.data.box.title} · Personal Message Box`;
  }, [state.data]);

  if (state.loading) {
    return <Shell><LoadingSpinner message="กำลังโหลด..." /></Shell>;
  }

  if (state.notFound) {
    return <Shell><StatusCard icon="🔍" title="ไม่พบกล่องข้อความนี้" text="ลิงก์อาจไม่ถูกต้อง หรือกล่องข้อความถูกลบไปแล้ว" /></Shell>;
  }

  if (state.error) {
    return <Shell><ErrorMessage message="โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่" onRetry={load} /></Shell>;
  }

  const { box, limits } = state.data;

  if (box.status !== 'ACTIVE') {
    return <Shell><StatusCard icon="🔒" title="กล่องนี้ปิดรับข้อความแล้ว" text={`"${box.title}" ไม่ได้เปิดรับข้อความในขณะนี้`} /></Shell>;
  }

  if (!box.acceptingMessages) {
    return <Shell><StatusCard icon="⏸️" title="ยังไม่สามารถรับข้อความได้" text="เจ้าของกล่องยังไม่ได้เชื่อมต่อที่เก็บไฟล์ กรุณาลองใหม่ภายหลัง" /></Shell>;
  }

  if (result) {
    const failed = result.data?.files?.failed || 0;
    return (
      <Shell>
        <StatusCard icon="✅" title="ส่งข้อความสำเร็จ!" text={`ข้อความของคุณถูกส่งถึง "${box.title}" แล้ว`}>
          {failed > 0 && (
            <p style={{ color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
              มีไฟล์ {failed} ไฟล์ที่อัปโหลดไม่สำเร็จ
            </p>
          )}
          <Button size="lg" onClick={() => setResult(null)} style={{ marginTop: 'var(--spacing-lg)' }}>
            ส่งอีกข้อความ
          </Button>
        </StatusCard>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)' }}>💌</div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, wordBreak: 'break-word' }}>{box.title}</h1>
          {box.description && (
            <p style={{ color: 'var(--color-gray-600)', marginTop: 'var(--spacing-xs)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {box.description}
            </p>
          )}
        </div>
        <PublicSubmissionForm slug={slug} limits={limits} onSuccess={setResult} />
      </div>
    </Shell>
  );
}
