import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, ShieldCheck } from 'lucide-react';
import { useSectionNavigate } from '../utils/navigation';
import { useCookieConsent } from '../context/CookieConsentContext';

export const Footer: React.FC = () => {
  const { navigateToSection } = useSectionNavigate();
  const { reopenBanner, openCookiePolicy, openPrivacyPolicy } = useCookieConsent();

  return (
    <footer
      className="footer-site"
      style={{
        color: 'white',
        padding: '3.25rem 0 2rem 0',
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
                boxShadow: '0 0 0 1.5px rgba(201, 162, 39, 0.5), 0 6px 14px rgba(0, 0, 0, 0.25)',
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
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gold-soft)', letterSpacing: '0.04em' }}>
                Via Avvocato Emanuele Rossi, 17 - Finale Ligure (SV)
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <Link to="/" onClick={(e) => navigateToSection('hero', e)} style={footerLinkStyle}>Home</Link>
            <Link to="/componi-poke" style={footerLinkStyle}>Componi la tua poke</Link>
            <a href="/#servizi" onClick={(e) => navigateToSection('servizi', e)} style={footerLinkStyle}>Servizi</a>
            <a href="/#recensioni" onClick={(e) => navigateToSection('recensioni', e)} style={footerLinkStyle}>Recensioni</a>
            <a href="/#orari" onClick={(e) => navigateToSection('orari', e)} style={footerLinkStyle}>Orari</a>
            <a href="/#contatti" onClick={(e) => navigateToSection('contatti', e)} style={footerLinkStyle}>Dove Siamo</a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Pescheria+Pessano+Via+Avvocato+Emanuele+Rossi+17+Finale+Ligure"
              target="_blank"
              rel="noopener noreferrer"
              style={footerLinkStyle}
            >
              Google Maps
            </a>
          </div>

          {/* Direct Phone */}
          <a
            href="tel:019692623"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-gold-soft)',
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
              onClick={openPrivacyPolicy}
              style={policyBtnStyle}
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={openCookiePolicy}
              style={policyBtnStyle}
            >
              Cookie Policy
            </button>
            <span>•</span>
            <button
              onClick={reopenBanner}
              style={policyBtnStyle}
            >
              Gestisci cookie
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
            Utilizza solo cookie tecnici. Google Maps viene caricato solo previo consenso.
          </span>
        </div>

      </div>
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
