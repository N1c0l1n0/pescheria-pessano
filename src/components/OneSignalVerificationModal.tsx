import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { requestPushPermission } from '../lib/onesignal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OneSignalVerificationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleGotItTap = async () => {
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
        backgroundColor: 'rgba(11, 37, 69, 0.65)',
        backdropFilter: 'blur(6px)',
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
          maxWidth: '460px',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          border: '1.5px solid rgba(11, 37, 69, 0.12)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '2px solid #38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
          }}
        >
          <Bell size={32} color="#0284C7" />
        </div>

        {/* Title required by OneSignal SDK guide */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--color-ocean-dark, #0B2545)',
            marginBottom: '0.75rem',
            lineHeight: 1.3,
          }}
        >
          Your OneSignal SDK integration is complete!
        </h3>

        {/* Message required by OneSignal SDK guide */}
        <p
          style={{
            fontSize: '0.95rem',
            color: '#475569',
            lineHeight: 1.5,
            marginBottom: '1.75rem',
            fontWeight: 500,
          }}
        >
          You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.
        </p>

        {/* Single button required by OneSignal SDK guide */}
        <button
          type="button"
          onClick={handleGotItTap}
          className="btn btn-coral"
          style={{
            width: '100%',
            padding: '0.85rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm, 8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span>Got it</span>
        </button>
      </div>
    </div>
  );
};
