import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import { getStoreStatus } from '../utils/openingHours';
import { useSectionNavigate } from '../utils/navigation';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState(() => getStoreStatus());
  const { navigateToSection } = useSectionNavigate();

  const handleSectionNav = (sectionId: string, e: React.MouseEvent) => {
    setMobileMenuOpen(false);
    navigateToSection(sectionId, e);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const interval = setInterval(() => {
      setStatus(getStoreStatus());
    }, 60000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
      <div className="container" style={{ paddingTop: '0.8rem', paddingBottom: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a
            href="/#hero"
            onClick={(e) => handleSectionNav('hero', e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              textDecoration: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <div className="brand-logo-ring">
              <img
                src="/logo_pescheria.png"
                alt="Pescheria Pessano Finale Ligure Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                className="font-serif brand-title"
                style={{
                  fontSize: 'clamp(1.05rem, 4vw, 1.28rem)',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.02em',
                }}
              >
                Pescheria Pessano
              </div>
              <div
                className="brand-subtitle"
                style={{
                  fontSize: '0.62rem',
                  color: 'var(--color-gold-soft)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  marginTop: '0.12rem',
                }}
              >
                Finale Ligure · SV
              </div>
            </div>
          </a>

          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '1.35rem',
            }}
            className="desktop-nav"
          >
            <Link to="/" onClick={(e) => handleSectionNav('hero', e)} className="nav-link">Home</Link>
            <a href="/#pesce-fresco" onClick={(e) => handleSectionNav('pesce-fresco', e)} className="nav-link">Banco Pesce</a>
            <Link to="/componi-poke" className="nav-link">Ordina d'Asporto</Link>
            <a href="/#servizi" onClick={(e) => handleSectionNav('servizi', e)} className="nav-link">Servizi</a>
            <a href="/#recensioni" onClick={(e) => handleSectionNav('recensioni', e)} className="nav-link">Recensioni</a>
            <a href="/#orari" onClick={(e) => handleSectionNav('orari', e)} className="nav-link">Orari</a>
            <a href="/#contatti" onClick={(e) => handleSectionNav('contatti', e)} className="nav-link">Contatti</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href="/#orari"
              onClick={(e) => handleSectionNav('orari', e)}
              className={status.isOpen ? 'badge-live-open' : 'badge-live-closed'}
              title={`${status.nextEventText} — Clicca per consultare gli orari`}
              style={{
                display: 'none',
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              id="header-status-badge"
            >
              <span className="dot"></span>
              <span>{status.isOpen ? 'Aperto' : 'Chiuso'}</span>
            </a>

            <a
              href="tel:019692623"
              className="btn btn-coral header-phone-btn"
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Phone size={16} />
              <span className="header-phone-text">019 692623</span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'white',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '10px',
                display: 'inline-flex',
              }}
              className="mobile-toggle"
              aria-label="Apri Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1.1rem 0 0.35rem',
              borderTop: '1px solid rgba(232, 212, 154, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.95rem',
            }}
          >
            <a
              href="/#orari"
              onClick={(e) => handleSectionNav('orari', e)}
              className={status.isOpen ? 'badge-live-open' : 'badge-live-closed'}
              style={{
                alignSelf: 'flex-start',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              title="Clicca per consultare gli orari"
            >
              <span className="dot"></span>
              <span>{status.message}</span>
              <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>
                ({status.nextEventText})
              </span>
            </a>

            <Link to="/" onClick={(e) => handleSectionNav('hero', e)} style={mobileNavLinkStyle}>Home</Link>
            <a href="/#pesce-fresco" onClick={(e) => handleSectionNav('pesce-fresco', e)} style={mobileNavLinkStyle}>Banco del Pesce Fresco</a>
            <Link to="/componi-poke" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Ordina d'Asporto</Link>
            <a href="/#servizi" onClick={(e) => handleSectionNav('servizi', e)} style={mobileNavLinkStyle}>I Nostri Servizi</a>
            <a href="/#recensioni" onClick={(e) => handleSectionNav('recensioni', e)} style={mobileNavLinkStyle}>Recensioni</a>
            <a href="/#orari" onClick={(e) => handleSectionNav('orari', e)} style={mobileNavLinkStyle}>Orari di Apertura</a>
            <a href="/#contatti" onClick={(e) => handleSectionNav('contatti', e)} style={mobileNavLinkStyle}>Dove Siamo & Contatti</a>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 992px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
          #header-status-badge { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
};

const mobileNavLinkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '1.05rem',
  fontWeight: 600,
  letterSpacing: '-0.01em',
};
