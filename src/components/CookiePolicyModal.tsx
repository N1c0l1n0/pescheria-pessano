import React from 'react';
import { Info, X } from 'lucide-react';

type CookiePolicyModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CookiePolicyModal: React.FC<CookiePolicyModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 37, 69, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '550px',
          width: '100%',
          padding: '2rem',
          color: 'var(--color-text-dark)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          maxHeight: 'min(85vh, 720px)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-policy-title"
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Chiudi informativa cookie"
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <Info color="var(--color-ocean-medium)" size={24} />
          <h3
            id="cookie-policy-title"
            className="font-serif"
            style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ocean-dark)', margin: 0 }}
          >
            Informativa sui Cookie
          </h3>
        </div>

        <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            Questo sito web <strong>non utilizza cookie di profilazione</strong>, tracciamento pubblicitario o
            strumenti di monitoraggio comportamentale (Google Analytics, Meta Pixel, ecc.).
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Cookie tecnici (sempre attivi):</strong> viene impiegata l&apos;archiviazione tecnica locale (
            <strong>localStorage</strong>) per salvare lo stato di avanzamento dell&apos;ordine ed abilitare il servizio
            di notifiche push in tempo reale. Non richiedono consenso.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Font (sempre attivi, nessuna terza parte):</strong> Playfair Display, Plus Jakarta Sans e Barlow
            Condensed sono self-hosted. Nessuna richiesta a Google Fonts.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Google Maps (consenso richiesto):</strong> la mappa interattiva è fornita da{' '}
            <strong>Google Ireland Limited</strong> e può impostare cookie di terze parti. Finalità: mostrare la
            posizione della pescheria. Base giuridica: consenso. Consulta la{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Privacy Policy di Google
            </a>{' '}
            e le{' '}
            <a
              href="https://policies.google.com/technologies/cookies"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              informazioni sui cookie Google
            </a>
            .
          </p>
          <p style={{ margin: 0 }}>
            Puoi revocare o modificare il consenso in qualsiasi momento tramite il link{' '}
            <strong>Gestisci cookie</strong> nel footer del sito.
          </p>
        </div>

        <button
          onClick={onClose}
          className="btn btn-ocean"
          style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }}
        >
          Ho capito
        </button>
      </div>
    </div>
  );
};
