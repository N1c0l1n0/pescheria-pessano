import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { PokeBuilder } from '../components/PokeBuilder';
import { Footer } from '../components/Footer';

const iconProps = {
  width: 30,
  height: 30,
  viewBox: '0 0 32 32',
  fill: 'none',
  'aria-hidden': true as const,
};

const ProcessDatiIcon: React.FC = () => (
  <svg {...iconProps}>
    <rect x="5" y="6" width="22" height="20" rx="4" fill="#0A2342" />
    <rect x="5" y="6" width="22" height="6" rx="4" fill="#164A7C" />
    <rect x="5" y="10" width="22" height="2" fill="#164A7C" />
    <circle cx="12" cy="18.5" r="3.2" fill="#E8D49A" />
    <path d="M7.8 24.2c.6-2.2 2.2-3.4 4.2-3.4s3.6 1.2 4.2 3.4" stroke="#E8D49A" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="18.2" y="15.4" width="6.4" height="1.5" rx="0.75" fill="#8FB6CC" />
    <rect x="18.2" y="18.6" width="4.6" height="1.5" rx="0.75" fill="#8FB6CC" />
    <rect x="18.2" y="21.8" width="5.4" height="1.5" rx="0.75" fill="#8FB6CC" />
  </svg>
);

const ProcessPokeIcon: React.FC = () => (
  <svg {...iconProps}>
    <ellipse cx="16" cy="11" rx="11" ry="3.4" fill="#0A2342" />
    <path d="M5 11c0 8.2 4.8 15 11 15s11-6.8 11-15" fill="#164A7C" />
    <path d="M7.2 11c.4 6.8 4.2 12.2 8.8 12.2S24.4 17.8 24.8 11" fill="#0A2342" opacity="0.35" />
    <ellipse cx="16" cy="10.4" rx="9.2" ry="2.5" fill="#F6F2EA" />
    <circle cx="12.2" cy="10" r="2.1" fill="#E85D52" />
    <circle cx="16.6" cy="9.2" r="1.85" fill="#C9A227" />
    <circle cx="20.2" cy="10.3" r="1.7" fill="#2F6B4F" />
    <path d="M10.5 10.6c2.4.7 4.8.6 7.4-.2" stroke="#8FB6CC" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M8 25.5h16" stroke="#0A2342" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ProcessTrackIcon: React.FC = () => (
  <svg {...iconProps}>
    <path
      d="M5.4 15.2 26.2 6.4c1-.4 2 .6 1.5 1.6L19.2 28.2c-.4.9-1.7.8-1.9-.2l-1.8-8.2-8.2-1.8c-1-.2-1.1-1.5-.2-1.8Z"
      fill="#0A2342"
    />
    <path d="M17.2 18.2 26.6 7.6" stroke="#E8D49A" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M17.2 18.2 8.6 16.4" stroke="#8FB6CC" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const PokeBuilderPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToOrderSection = (sectionId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-sand)', width: '100%', overflowX: 'hidden' }}>
      <Header />

      <main style={{ flex: 1, width: '100%', overflowX: 'hidden' }}>
        <div className="page-banner order-page-banner">
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <Link to="/" className="order-breadcrumb">
              <ArrowLeft size={15} /> Torna alla homepage
            </Link>

            <div className="section-kicker" style={{ background: 'rgba(232, 212, 154, 0.12)', borderColor: 'rgba(232, 212, 154, 0.28)', color: 'var(--color-gold-soft)' }}>
              Asporto & Consegna
            </div>

            <h1
              className="font-serif heading-gradient"
              style={{
                fontSize: 'clamp(2.1rem, 4.6vw, 3.4rem)',
                fontWeight: 700,
                margin: '0.15rem 0 0 0',
                lineHeight: 1.12,
                letterSpacing: '-0.03em',
                maxWidth: '16ch',
              }}
            >
              Ordina dal banco, senza fila
            </h1>

            <p style={{ color: 'rgba(203, 213, 225, 0.92)', margin: '0.95rem 0 0 0', fontSize: '1.05rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              Componi la poke, scegli i coni fritti o prenota il pescato del giorno. Paghi al ritiro o in consegna e segui la preparazione in tempo reale.
            </p>

            <div className="order-process">
              <a
                href="#ordine-dati"
                className="order-process-step"
                onClick={scrollToOrderSection('ordine-dati')}
              >
                <div className="order-process-icon">
                  <ProcessDatiIcon />
                </div>
                <div className="order-process-copy">
                  <strong>I tuoi dati</strong>
                  <span>Nome, telefono e orario di ritiro o consegna.</span>
                </div>
              </a>
              <a
                href="#ordine-componi"
                className="order-process-step"
                onClick={scrollToOrderSection('ordine-componi')}
              >
                <div className="order-process-icon">
                  <ProcessPokeIcon />
                </div>
                <div className="order-process-copy">
                  <strong>Componi l'ordine</strong>
                  <span>Poke su misura, coni fritti o pesce fresco.</span>
                </div>
              </a>
              <a
                href="#ordine-invia"
                className="order-process-step"
                onClick={scrollToOrderSection('ordine-invia')}
              >
                <div className="order-process-icon">
                  <ProcessTrackIcon />
                </div>
                <div className="order-process-copy">
                  <strong>Invia e segui</strong>
                  <span>Il banco riceve l'ordine. Tu lo tracci dal vivo.</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <PokeBuilder />
      </main>

      <Footer />
    </div>
  );
};

export default PokeBuilderPage;
