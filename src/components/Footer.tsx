import React, { useState } from 'react';
import { Anchor, Phone, ShieldCheck, Info, X } from 'lucide-react';

export const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'privacy' | 'cookie' | null>(null);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-coral)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Anchor size={18} color="white" />
            </div>
            <div>
              <div className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>
                Pescheria Pessano
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-sea-blue)', fontWeight: 600 }}>
                Finale Ligure (SV)
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <a href="#hero" style={footerLinkStyle}>Home</a>
            <a href="#poke" style={footerLinkStyle}>Componi la tua poke</a>
            <a href="#servizi" style={footerLinkStyle}>Servizi</a>
            <a href="#orari" style={footerLinkStyle}>Orari</a>
            <a href="#contatti" style={footerLinkStyle}>Dove Siamo</a>
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
              <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                <p style={{ marginBottom: '0.85rem' }}>
                  La <strong>Pescheria Pessano</strong> (Via Avvocato Emanuele Rossi, 17, Finale Ligure) rispetta la tua privacy in conformità al Regolamento UE 2016/679 (GDPR).
                </p>
                <p style={{ marginBottom: '0.85rem' }}>
                  I dati inseriti (es. il nome nel configuratore Poke) vengono utilizzati <strong>esclusivamente in tempo reale</strong> per generare il messaggio dell'ordine da inviare su WhatsApp. Nessun dato personale viene salvato su database, server o ceduto a terzi.
                </p>
                <p>
                  Per qualsiasi chiarimento o contatto diretto puoi chiamare la pescheria al numero <strong>019 692623</strong>.
                </p>
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
                <p style={{ marginBottom: '0.85rem' }}>
                  Questo sito web <strong>NON utilizza alcun cookie di profilazione</strong>, tracciamento pubblicitario o strumenti di monitoraggio comportamentale (Google Analytics, Facebook Pixel, ecc.).
                </p>
                <p style={{ marginBottom: '0.85rem' }}>
                  Le interazioni dell'utente (come la scelta degli ingredienti del Poke o il calcolo degli orari) avvengono interamente all'interno della memoria del browser per la sola durata della sessione.
                </p>
                <p>
                  Pertanto, ai sensi delle direttive del Garante Privacy e del GDPR, <strong>non è richiesto alcun banner di consenso per i cookie</strong>.
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
