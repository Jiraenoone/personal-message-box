import { useState } from 'react';
import { Link } from 'react-router-dom';
import useBoxes from '../hooks/useBoxes';
import useAuth from '../hooks/useAuth';
import BoxCard from '../components/boxes/BoxCard';
import BoxForm from '../components/boxes/BoxForm';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

export default function BoxesPage() {
  const { boxes, loading, error, createBox, toggleStatus, refreshBoxes } = useBoxes();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDriveConnected = user?.driveConnection?.status === 'ACTIVE';

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      await createBox(formData);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <LoadingSpinner message="Loading your message boxes..." />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div>
            <h1>My Message Boxes</h1>
            <p>Create and manage your private QR code message boxes</p>
          </div>
          <div>
            {isDriveConnected ? (
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                + Create New Box
              </button>
            ) : (
              <Link to="/google-drive" className="btn btn-primary">
                🔗 Connect Drive to Create Box
              </Link>
            )}
          </div>
        </div>

        {/* Warning if Drive is not connected */}
        {!isDriveConnected && (
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: 'var(--radius-md)',
            color: '#92400E',
            marginBottom: 'var(--spacing-xl)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--spacing-sm)',
          }}>
            <span>⚠️ Google Drive must be connected before you can create message boxes.</span>
            <Link to="/google-drive" className="btn btn-sm btn-primary">
              Connect Drive Now
            </Link>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <ErrorMessage message={error} onRetry={refreshBoxes} />
          </div>
        )}

        {/* Boxes Grid or Empty State */}
        {boxes.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No message boxes yet"
              description="Create your first message box to get a unique QR Code and start receiving private messages, photos, and videos."
              action={
                isDriveConnected ? (
                  <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
                    Create Your First Box
                  </button>
                ) : (
                  <Link to="/google-drive" className="btn btn-primary">
                    Connect Google Drive First
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--spacing-lg)',
          }}>
            {boxes.map((box) => (
              <BoxCard
                key={box.id}
                box={box}
                onToggleStatus={toggleStatus}
              />
            ))}
          </div>
        )}

        {/* Create Box Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title="Create New Message Box"
        >
          <BoxForm
            onSubmit={handleCreate}
            onCancel={() => setIsModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>
      </div>
    </div>
  );
}
