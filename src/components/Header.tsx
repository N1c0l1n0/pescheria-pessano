import React, { useState, useEffect } from 'react';
import { Phone, Menu, X, Anchor } from 'lucide-react';
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
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-coral)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
              }}
            >
              <Anchor size={20} color="white" />
            </div>
            <div>
              <div
                className="font-serif"
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                Pescheria Pessano
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-sea-blue)',
                  letterSpacing: '0.1em',
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
              gap: '2rem',
            }}
            className="desktop-nav"
          >
            <a href="#hero" style={navLinkStyle}>Home</a>
            <a href="#poke" style={navLinkStyle}>Componi la tua poke</a>
            <a href="#servizi" style={navLinkStyle}>I Nostri Servizi</a>
            <a href="#orari" style={navLinkStyle}>Orari di Apertura</a>
            <a href="#contatti" style={navLinkStyle}>Dove Siamo & Contatti</a>
          </nav>

          {/* Right Header Status & Call */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {/* Live Store Status Badge */}
            <div
              className={status.isOpen ? 'badge-live-open' : 'badge-live-closed'}
              title={status.nextEventText}
              style={{ display: 'none', whiteSpace: 'nowrap' }}
              id="header-status-badge"
            >
              <span className="dot"></span>
              <span>{status.message}</span>
              <span style={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 500 }}>
                • {status.nextEventText}
              </span>
            </div>

            {/* Quick Call Button */}
            <a
              href="tel:019692623"
              className="btn btn-coral"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <Phone size={16} />
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

            <a href="#hero" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Home</a>
            <a href="#poke" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Componi la tua poke</a>
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
  fontWeight: 500,
  transition: 'color 0.2s ease',
};

const mobileNavLinkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '1.05rem',
  fontWeight: 600,
};
