import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ShieldCheck, Info, X } from 'lucide-react';
import { useSectionNavigate } from '../utils/navigation';

export const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'privacy' | 'cookie' | null>(null);
  const { navigateToSection } = useSectionNavigate();

  return (
    <footer
      style={{
        backgroundColor: 'var(--color-ocean-dark)',
        color: 'white',
        padding: '3rem 0 2rem 0',
        borderTop: '1px solid rgba(141, 169, 196, 0.2)',
      }}
    >
      <div className="container">
        
        {/* Main Footer Links */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Brand Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <img
                src="/logo_pescheria.png"
                alt="Pescheria Pessano Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div>
              <div className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Pescheria Pessano
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-sea-blue)' }}>
                Via Avvocato Emanuele Rossi, 17 - Finale Ligure (SV)
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <Link to="/" onClick={(e) => navigateToSection('hero', e)} style={footerLinkStyle}>Home</Link>
            <Link to="/componi-poke" style={footerLinkStyle}>Componi la tua poke</Link>
            <a href="/#servizi" onClick={(e) => navigateToSection('servizi', e)} style={footerLinkStyle}>Servizi</a>
            <a href="/#orari" onClick={(e) => navigateToSection('orari', e)} style={footerLinkStyle}>Orari</a>
            <a href="/#contatti" onClick={(e) => navigateToSection('contatti', e)} style={footerLinkStyle}>Dove Siamo</a>
          </div>

          {/* Direct Phone */}
          <a
            href="tel:019692623"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-sea-blue)',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            <Phone size={16} />
            <span>019 692623</span>
          </a>
        </div>

        {/* Informative Note & Copyright */}
        <div
          style={{
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.825rem',
            color: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          <div>
            © {new Date().getFullYear()} Pescheria Pessano — Via Avvocato Emanuele Rossi, 17, Finale Ligure (SV)
          </div>

          {/* Privacy & Cookie Links */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <button
              onClick={() => setModalType('privacy')}
              style={policyBtnStyle}
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setModalType('cookie')}
              style={policyBtnStyle}
            >
              Cookie Policy
            </button>
          </div>
        </div>

        {/* Short Statement Pill */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.775rem',
            color: 'rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <ShieldCheck size={16} color="var(--color-sea-blue)" style={{ flexShrink: 0 }} />
          <span>
            Questo sito ha scopo puramente informativo e di configurazione ordini. Non utilizza cookie di profilazione o tracciamento utenti.
          </span>
        </div>

      </div>

      {/* Modal for Privacy / Cookie Policy */}
      {modalType && (
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
          onClick={() => setModalType(null)}
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
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalType(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <Info color="var(--color-ocean-medium)" size={24} />
              <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-ocean-dark)', margin: 0 }}>
                {modalType === 'privacy' ? 'Informativa sulla Privacy' : 'Informativa sui Cookie'}
              </h3>
            </div>

            {modalType === 'privacy' ? (
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                <p style={{ marginBottom: '0.75rem' }}>
                  La <strong>Pescheria Pessano</strong> (Via Avvocato Emanuele Rossi, 17, Finale Ligure — SV) rispetta la tua privacy in conformità al Regolamento UE 2016/679 (GDPR).
                </p>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>Dati Raccolti:</strong> Durante la composizione dell'ordine vengono richiesti il <strong>Nome referente</strong> ed il <strong>Numero di telefono</strong>.
                </p>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>Finalità del Trattamento:</strong> I dati personali sono utilizzati <strong>esclusivamente per la gestione ed esecuzione dell'ordine</strong> (identificazione dell'ordine al banco, aggiornamento dello stato di preparazione tramite Live Tracker ed invio di notifiche di avviso per il ritiro).
                </p>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>Nessuna Profilazione:</strong> I dati non vengono ceduti a terzi né usati per inviare pubblicità o comunicazioni di marketing. Sono conservati in sicurezza per il tempo strettamente necessario all'evasione dell'ordine.
                </p>
                <p style={{ margin: 0 }}>
                  Per qualsiasi chiarimento o richiesta di cancellazione dati puoi contattare la pescheria al numero <strong>019 692623</strong>.
                </p>
              </div>
            ) : (
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                <p style={{ marginBottom: '0.75rem' }}>
                  Questo sito web <strong>NON utilizza alcun cookie di profilazione</strong>, tracciamento pubblicitario o strumenti di monitoraggio comportamentale (Google Analytics, Meta Pixel, ecc.).
                </p>
                <p style={{ marginBottom: '0.75rem' }}>
                  Viene impiegata unicamente l'archiviazione tecnica locale (<strong>localStorage</strong>) per salvare lo stato di avanzamento dell'ordine ed abilitare il servizio di notifiche Push in tempo reale.
                </p>
                <p style={{ margin: 0 }}>
                  Ai sensi delle direttive del Garante Privacy e del GDPR, l'uso di soli strumenti tecnici indispensabili all'erogazione del servizio <strong>non richiede alcun banner di consenso o blocco dei cookie</strong>.
                </p>
              </div>
            )}

            <button
              onClick={() => setModalType(null)}
              className="btn btn-ocean"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem' }}
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

const footerLinkStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'none',
  transition: 'color 0.2s ease',
};

const policyBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.75)',
  cursor: 'pointer',
  fontSize: '0.825rem',
  padding: 0,
  textDecoration: 'underline',
};
