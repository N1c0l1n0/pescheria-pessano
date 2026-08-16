import React from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { requestPushPermission } from '../lib/onesignal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OneSignalVerificationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleEnablePush = async () => {
    await requestPushPermission();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(7, 21, 39, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0F172A',
          color: 'white',
          borderRadius: '20px',
          padding: '2rem 1.75rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          border: '1.5px solid rgba(56, 189, 248, 0.25)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94A3B8',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* Icon Container with Ocean Glow */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '2px solid #38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.3)',
            overflow: 'hidden',
          }}
        >
          <img
            src="/notification_icon.jpg"
            alt="Pescheria Pessano"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // Fallback to Bell Icon if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <Bell size={32} color="#38BDF8" style={{ display: 'none' }} />
        </div>

        {/* Italian Title */}
        <h3
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '0.75rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}
        >
          🍱 Vuoi sapere quando il tuo ordine è pronto?
        </h3>

        {/* Italian Description */}
        <p
          style={{
            fontSize: '0.925rem',
            color: '#94A3B8',
            lineHeight: 1.5,
            marginBottom: '1.75rem',
            fontWeight: 500,
          }}
        >
          Attiva le notifiche push per ricevere un avviso in tempo reale sul tuo dispositivo appena la tua Poke o il tuo piatto è pronto da Pescheria Pessano.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleEnablePush}
            className="btn btn-coral"
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: '#38BDF8',
              color: '#071527',
              border: 'none',
              boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
              cursor: 'pointer',
            }}
          >
            <CheckCircle2 size={20} />
            <span>Attiva Notifiche Push</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '0.65rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: '12px',
              backgroundColor: 'transparent',
              color: '#64748B',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Più tardi
          </button>
        </div>
      </div>
    </div>
  );
};

