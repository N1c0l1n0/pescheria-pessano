import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import { getStoreStatus } from '../utils/openingHours';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [status, setStatus] = useState(() => getStoreStatus());

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
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease',
        backgroundColor: isScrolled
          ? 'rgba(11, 37, 69, 0.95)'
          : 'rgba(11, 37, 69, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(141, 169, 196, 0.15)',
        boxShadow: isScrolled ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <div className="container" style={{ padding: '0.85rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <a
            href="#hero"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'white',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                flexShrink: 0,
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.8)',
              }}
            >
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
                  fontSize: 'clamp(1.05rem, 4vw, 1.25rem)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                Pescheria Pessano
              </div>
              <div
                className="brand-subtitle"
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--color-sea-blue)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Finale Ligure (SV)
              </div>
            </div>
          </a>

          {/* Nav Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '1.5rem',
            }}
            className="desktop-nav"
          >
            <Link to="/" style={navLinkStyle}>Home</Link>
            <Link to="/componi-poke" style={navLinkStyle}>Componi Poke</Link>
            <a href="#servizi" style={navLinkStyle}>Servizi</a>
            <a href="#orari" style={navLinkStyle}>Orari</a>
            <a href="#contatti" style={navLinkStyle}>Contatti</a>
          </nav>

          {/* Right Header Status & Call */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {/* Live Store Status Badge (Aperto / Chiuso only) */}
            <div
              className={status.isOpen ? 'badge-live-open' : 'badge-live-closed'}
              title={status.nextEventText}
              style={{ display: 'none', whiteSpace: 'nowrap', padding: '0.35rem 0.85rem' }}
              id="header-status-badge"
            >
              <span className="dot"></span>
              <span>{status.isOpen ? 'Aperto' : 'Chiuso'}</span>
            </div>

            {/* Quick Call Button */}
            <a
              href="tel:019692623"
              className="btn btn-coral header-phone-btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Phone size={15} />
              <span>019 692623</span>
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.4rem',
              }}
              className="mobile-toggle"
              aria-label="Apri Menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              className={status.isOpen ? 'badge-live-open' : 'badge-live-closed'}
              style={{ alignSelf: 'flex-start' }}
            >
              <span className="dot"></span>
              <span>{status.message}</span>
              <span style={{ opacity: 0.85, fontSize: '0.75rem' }}>
                ({status.nextEventText})
              </span>
            </div>

            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Home</Link>
            <Link to="/componi-poke" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Componi la tua poke</Link>
            <a href="#servizi" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>I Nostri Servizi</a>
            <a href="#orari" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Orari di Apertura</a>
            <a href="#contatti" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Dove Siamo & Contatti</a>
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

const navLinkStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.85)',
  textDecoration: 'none',
  fontSize: '0.925rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'color 0.2s ease',
};

const mobileNavLinkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '1.05rem',
  fontWeight: 600,
};
