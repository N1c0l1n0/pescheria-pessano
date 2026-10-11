import React from 'react';
import { Info, X } from 'lucide-react';
import {
  COMPANY_PEC,
  COMPANY_REA,
  COMPANY_VAT_NUMBER,
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_CONTACT_PHONE,
  PRIVACY_CONTROLLER_ADDRESS,
  PRIVACY_CONTROLLER_NAME,
  PRIVACY_RETENTION_CONSENT,
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
            <strong>Titolare del Trattamento:</strong> <strong>{PRIVACY_CONTROLLER_NAME}</strong> (P.IVA {COMPANY_VAT_NUMBER}, REA {COMPANY_REA}), con sede in {PRIVACY_CONTROLLER_ADDRESS}, è il Titolare del trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR). Recapiti di contatto: telefono <strong>{PRIVACY_CONTACT_PHONE}</strong>, PEC:{' '}
            <a href={`mailto:${COMPANY_PEC}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {COMPANY_PEC}
            </a>
            , email:{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {PRIVACY_CONTACT_EMAIL}
            </a>
            .
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Natura del sito (Sito Vetrina) e dati personali:</strong> Il presente sito ha natura puramente illustrativa ed informativa (&quot;sito vetrina&quot;) volta a presentare l&apos;attività, il banco del pescato e le specialità gastronomiche da asporto. <strong>Il sito non raccoglie dati personali dell&apos;utente tramite moduli di checkout, carrelli e-commerce o sistemi di tracking ordini</strong> (funzionalità di ordine online disattivate). La semplice consultazione delle pagine non richiede alcuna registrazione né l&apos;inserimento di dati identificativi.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Nessuna profilazione:</strong> La navigazione sul sito non comporta alcuna attività di profilazione, tracciamento comportamentale né l&apos;utilizzo di cookie pubblicitari o pixel di monitoraggio. Non vengono memorizzati dati personali degli utenti sui nostri server.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Contatti volontari dell&apos;utente:</strong> Eventuali contatti avvengono esclusivamente su iniziativa spontanea dell&apos;utente tramite chiamata telefonica tradizionale (<strong>{PRIVACY_CONTACT_PHONE}</strong>) o mediante il collegamento all&apos;applicazione WhatsApp (Meta Platforms Ireland Ltd.). In tali circostanze, i recapiti e le comunicazioni trasmesse volontariamente sono trattati esclusivamente per dare riscontro alle richieste informative o per accordi diretti al banco (Art. 6(1)(b) e (f) GDPR). L&apos;utilizzo di WhatsApp rimanda a una piattaforma terza soggetta alla relativa informativa privacy di Meta Platforms.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Servizi di terze parti e conservazione:</strong> Per facilitare la localizzazione del negozio è presente la mappa interattiva di Google Maps (Google Ireland Limited), attivata unicamente previo esplicito consenso dell&apos;utente tramite il banner cookie. {PRIVACY_RETENTION_CONSENT} Non vengono ceduti né diffusi dati a terzi per scopi promozionali.
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            <strong>Diritti dell&apos;interessato:</strong> Ai sensi degli artt. 15-22 del GDPR, l&apos;utente ha diritto in qualsiasi momento di richiedere l&apos;accesso ai propri dati, la rettifica, la cancellazione, la limitazione del trattamento, l&apos;opposizione al trattamento o la portabilità, nonché di proporre reclamo al{' '}
            <a
              href="https://www.garanteprivacy.it"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Garante per la Protezione dei Dati Personali
            </a>
            . Per qualsiasi richiesta o esercizio dei diritti è possibile scrivere all&apos;indirizzo PEC{' '}
            <a href={`mailto:${COMPANY_PEC}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {COMPANY_PEC}
            </a>
            , all&apos;indirizzo email{' '}
            <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} style={{ color: 'var(--color-ocean-medium)' }}>
              {PRIVACY_CONTACT_EMAIL}
            </a>{' '}
            o telefonare al <strong>{PRIVACY_CONTACT_PHONE}</strong>.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Sicurezza:</strong> La trasmissione delle pagine del sito è protetta mediante protocollo crittografato HTTPS con certificato SSL valido, a tutela della riservatezza e dell&apos;integrità della connessione.
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
