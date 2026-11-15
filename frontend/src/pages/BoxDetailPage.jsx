import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import boxService from '../services/boxService';
import QRCodeDisplay from '../components/boxes/QRCodeDisplay';
import BoxSettings from '../components/boxes/BoxSettings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function BoxDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBox = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await boxService.getBox(id);
      setBox(data);
    } catch (err) {
      setError(err.message || 'Failed to load message box');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBox();
  }, [fetchBox]);

  const handleUpdate = async (boxId, updateData) => {
    const updated = await boxService.updateBox(boxId, updateData);
    setBox(updated);
  };

  const handleToggleStatus = async (boxId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await boxService.updateStatus(boxId, newStatus);
    setBox(updated);
  };

  const handleDelete = async (boxId) => {
    await boxService.deleteBox(boxId);
    navigate('/boxes', { replace: true });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container-md">
          <LoadingSpinner message="Loading message box details..." />
        </div>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div className="page">
        <div className="container-md">
          <ErrorMessage message={error || 'Message box not found'} />
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <Link to="/boxes" className="btn btn-secondary">
              &larr; Back to My Boxes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
          <Link to="/boxes">&larr; Back to My Boxes</Link>
        </div>

        {/* Page Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
              <h1>{box.title}</h1>
              <span className={`badge ${box.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                {box.status}
              </span>
            </div>
            <p>{box.description || 'No description provided.'}</p>
          </div>

          <div>
            <Link to={`/boxes/${box.id}/inbox`} className="btn btn-primary">
              📬 Open Inbox ({box.messageCount || 0} messages)
            </Link>
          </div>
        </div>

        {/* Grid Layout: QR Code on Left, Settings on Right */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'var(--spacing-xl)',
          alignItems: 'start',
        }}>
          <div>
            <QRCodeDisplay box={box} />
          </div>

          <div>
            <BoxSettings
              box={box}
              onUpdate={handleUpdate}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
