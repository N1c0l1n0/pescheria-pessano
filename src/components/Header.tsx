import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Menu, X } from 'lucide-react';
import { FEATURES } from '../constants/features';
import { getStoreStatus } from '../utils/openingHours';
import { useSectionNavigate } from '../utils/navigation';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [status, setStatus] = useState(() => getStoreStatus());
  const { navigateToSection } = useSectionNavigate();
  const closeTimeoutRef = useRef<number | null>(null);

  const openMobileMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsMenuMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMobileMenuOpen(true);
      });
    });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMenuMounted(false);
      closeTimeoutRef.current = null;
    }, 240); // Matches --panel-close-dur (240ms)
  };

  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  const handleSectionNav = (sectionId: string, e: React.MouseEvent) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setMobileMenuOpen(false);
    setIsMenuMounted(false);
    navigateToSection(sectionId, e);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      if (window.innerWidth >= 1100) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        setMobileMenuOpen(false);
        setIsMenuMounted(false);
      }
    };
    window.addEventListener('resize', handleResize);

    const interval = setInterval(() => {
      setStatus(getStoreStatus());
    }, 60000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
      <div className="container" style={{ paddingTop: '0.8rem', paddingBottom: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <a
            href="/#hero"
            onClick={(e) => handleSectionNav('hero', e)}
            className="header-brand"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'white',
              cursor: 'pointer',
              flexShrink: 0,
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
                  fontSize: 'clamp(1.02rem, 3.8vw, 1.28rem)',
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
              gap: 'clamp(0.85rem, 1.35vw, 1.4rem)',
              flexShrink: 0,
            }}
            className="desktop-nav"
            aria-label="Navigazione principale"
          >
            <Link to="/" onClick={(e) => handleSectionNav('hero', e)} className="nav-link">Home</Link>
            <a href="/#poke-fritti" onClick={(e) => handleSectionNav('poke-fritti', e)} className="nav-link">Poke & Fritti</a>
            <a href="/#pesce-fresco" onClick={(e) => handleSectionNav('pesce-fresco', e)} className="nav-link">Banco Pesce</a>
            <a href="/#servizi" onClick={(e) => handleSectionNav('servizi', e)} className="nav-link">Servizi</a>
            <a href="/#orari" onClick={(e) => handleSectionNav('orari', e)} className="nav-link">Orari</a>
            <a href="/#contatti" onClick={(e) => handleSectionNav('contatti', e)} className="nav-link">Contatti</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
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
              href={FEATURES.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="header-whatsapp-btn"
              title="Prenota su WhatsApp (+39 345 948 5857)"
              aria-label="Prenota con messaggio WhatsApp al +39 345 948 5857"
            >
              <MessageCircle size={18} strokeWidth={2.2} />
              <span className="header-whatsapp-text-full">Prenota su WhatsApp</span>
              <span className="header-whatsapp-dot" title="WhatsApp attivo" />
            </a>

            <button
              onClick={toggleMobileMenu}
              className="mobile-toggle"
              aria-label={mobileMenuOpen ? "Chiudi menu di navigazione" : "Apri menu di navigazione"}
              aria-expanded={mobileMenuOpen}
            >
              <span className="t-icon-swap" data-state={mobileMenuOpen ? "b" : "a"}>
                <span className="t-icon" data-icon="a" aria-hidden="true">
                  <Menu size={22} />
                </span>
                <span className="t-icon" data-icon="b" aria-hidden="true">
                  <X size={22} />
                </span>
              </span>
            </button>
          </div>
        </div>

        {isMenuMounted && (
          <div
            className={`mobile-nav-panel t-panel-slide ${mobileMenuOpen ? 'is-open' : 'is-closing'}`}
            data-open={mobileMenuOpen ? "true" : "false"}
          >
            <div className={`t-stagger ${mobileMenuOpen ? 'is-shown' : 'is-hiding'}`}>
              <div className="t-stagger-line t-stagger-line--1">
                <a
                  href="/#orari"
                  onClick={(e) => handleSectionNav('orari', e)}
                  className={status.isOpen ? 'badge-live-open' : 'badge-live-closed'}
                  style={{
                    alignSelf: 'flex-start',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                  }}
                  title="Clicca per consultare gli orari"
                >
                  <span className="dot"></span>
                  <span>{status.message}</span>
                  <span style={{ opacity: 0.85, fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                    ({status.nextEventText})
                  </span>
                </a>
              </div>

              <div className="t-stagger-line t-stagger-line--2">
                <Link to="/" onClick={(e) => handleSectionNav('hero', e)} className="mobile-nav-link">
                  Home
                </Link>
              </div>
              <div className="t-stagger-line t-stagger-line--3">
                <a href="/#poke-fritti" onClick={(e) => handleSectionNav('poke-fritti', e)} className="mobile-nav-link">
                  Poke Bowl & Coni Fritti
                </a>
              </div>
              <div className="t-stagger-line t-stagger-line--4">
                <a href="/#pesce-fresco" onClick={(e) => handleSectionNav('pesce-fresco', e)} className="mobile-nav-link">
                  Banco del Pesce Fresco
                </a>
              </div>
              <div className="t-stagger-line t-stagger-line--5">
                <a href="/#servizi" onClick={(e) => handleSectionNav('servizi', e)} className="mobile-nav-link">
                  I Nostri Servizi
                </a>
              </div>
              <div className="t-stagger-line t-stagger-line--6">
                <a href="/#orari" onClick={(e) => handleSectionNav('orari', e)} className="mobile-nav-link">
                  Orari di Apertura
                </a>
              </div>
              <div className="t-stagger-line t-stagger-line--7">
                <a href="/#contatti" onClick={(e) => handleSectionNav('contatti', e)} className="mobile-nav-link">
                  Dove Siamo & Contatti
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1100px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (min-width: 768px) {
          #header-status-badge { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
};
