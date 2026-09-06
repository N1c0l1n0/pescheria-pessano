import React from 'react';
import { Info, X } from 'lucide-react';
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_CONTACT_PHONE,
  PRIVACY_CONTROLLER_ADDRESS,
  PRIVACY_CONTROLLER_NAME,
  PRIVACY_RETENTION_CONSENT,
  PRIVACY_RETENTION_ORDERS,
} from '../constants/legalCopy';

type PrivacyPolicyModalProps = {
  open: boolean;
  onClose: () => void;
};

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ open, onClose }) => {
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
        aria-labelledby="privacy-policy-title"
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
          aria-label="Chiudi informativa privacy"
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <Info color="var(--color-ocean-medium)" size={24} />
          <h3
            id="privacy-policy-title"
            className="font-serif"
            style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ocean-dark)', margin: 0 }}
          >
            Informativa sulla Privacy
          </h3>
        </div>

        <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>{PRIVACY_CONTROLLER_NAME}</strong> ({PRIVACY_CONTROLLER_ADDRESS}) è il titolare del trattamento
            ai sensi del Regolamento UE 2016/679 (GDPR). Contatti:{' '}
            <strong>{PRIVACY_CONTACT_PHONE}</strong>,{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Dati raccolti:</strong> nome referente, numero di telefono e, per le consegne, indirizzo. Durante
            l&apos;ordine online i dati vengono trasmessi al nostro database cloud (
            <strong>Supabase Inc.</strong>, hosting — possibile trasferimento verso gli USA con garanzie contrattuali
            Standard Contractual Clauses).
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Finalità e base giuridica:</strong> gestione ed esecuzione dell&apos;ordine (Art. 6(1)(b) GDPR):
            identificazione al banco, tracking live dello stato, comunicazioni di avviso ritiro/consegna anche via{' '}
            <strong>WhatsApp</strong> (Meta Platforms Ireland Ltd., su iniziativa del cliente o del personale).
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Conservazione:</strong> {PRIVACY_RETENTION_ORDERS} {PRIVACY_RETENTION_CONSENT}
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Destinatari:</strong> personale autorizzato della pescheria; fornitori tecnici Supabase (hosting
            dati ordine) e, su link volontario, Google Maps / WhatsApp. Non vendiamo dati né profili pubblicitari.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Diritti dell&apos;interessato:</strong> accesso, rettifica, cancellazione, limitazione, portabilità,
            opposizione, revoca del consenso (ove applicabile), reclamo al{' '}
            <a
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Garante per la Protezione dei Dati Personali
            </a>
            . Per esercitare i diritti scrivi a{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {PRIVACY_CONTACT_EMAIL}
            </a>{' '}
            o chiama il <strong>{PRIVACY_CONTACT_PHONE}</strong>.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Sicurezza:</strong> accesso agli ordini da area staff protetta da credenziali; il tracking
            dell&apos;ordine è accessibile tramite link personale fornito al cliente dopo l&apos;ordine — la
            riservatezza dei dati dipende dalla custodia del link, non condividerlo con terzi.
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
