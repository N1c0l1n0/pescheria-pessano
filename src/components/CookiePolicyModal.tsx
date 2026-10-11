import React from 'react';
import { Info, X } from 'lucide-react';
import { PRIVACY_CONTROLLER_NAME } from '../constants/legalCopy';
import { FEATURES } from '../constants/features';

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
            La presente informativa descrive l&apos;utilizzo dei cookie e degli strumenti di archiviazione locale
            da parte del sito web di <strong>{PRIVACY_CONTROLLER_NAME}</strong>
            {FEATURES.ONLINE_ORDERING
              ? ', inclusa la piattaforma di composizione e gestione degli ordini online.'
              : ', configurato come vetrina informativa.'}
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            Questo sito web <strong>non utilizza cookie di profilazione</strong>, tracciamento pubblicitario o
            strumenti di monitoraggio comportamentale degli utenti (come Google Analytics, Meta Pixel, ecc.).
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Archiviazione locale tecnica (sempre attiva):</strong> utilizziamo unicamente{' '}
            <strong>localStorage</strong> per:
          </p>
          <ul style={{ margin: '0 0 0.75rem 1.1rem', padding: 0 }}>
            <li>
              <code>pessano_cookie_consent</code> — memorizza la scelta espressa dall&apos;utente (accettazione o
              rifiuto) in merito al caricamento della mappa interattiva (fino a revoca o cancellazione della cache del browser).
            </li>
            {FEATURES.ONLINE_ORDERING && (
              <li>
                <code>pescheria_pessano_orders_store</code> — backup locale tecnico dello stato dell&apos;ordine
                (necessario per consentire il tracking in tempo reale e il recupero della sessione sul dispositivo del cliente).
              </li>
            )}
          </ul>
          <p style={{ marginBottom: '0.75rem' }}>
            {FEATURES.ONLINE_ORDERING
              ? "L'archiviazione tecnica è strettamente funzionale all'esecuzione del servizio richiesto dal cliente. Non vengono installati tracker pubblicitari."
              : 'Nessun dato personale, identificativo di carrello o informazione di profilazione viene memorizzato durante la navigazione della vetrina.'}
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Font (sempre attivi, nessuna terza parte):</strong> i caratteri Playfair Display, Plus Jakarta Sans e Barlow
            Condensed sono self-hosted sui nostri server. Nessuna richiesta o tracciamento viene effettuato verso Google Fonts.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Google Maps (consenso richiesto):</strong> la mappa interattiva della nostra sede è fornita da{' '}
            <strong>Google Ireland Limited</strong> e viene caricata <em>esclusivamente previo tuo consenso esplicito</em>.
            In caso di consenso, Google può impostare cookie tecnici o di preferenza. Consulta la{' '}
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
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Link esterni:</strong> i link verso Google Maps o WhatsApp aprono servizi di terze parti solo dopo il tuo
            click volontario; in quel caso si applicano le rispettive informative privacy.
          </p>
          <p style={{ margin: 0 }}>
            Puoi modificare o revocare il consenso espresso in qualsiasi momento tramite il link{' '}
            <strong>Gestisci cookie</strong> presente nel footer del sito.
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
