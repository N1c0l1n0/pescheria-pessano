import React, { useState } from 'react';
import { Waves, Anchor, Sparkles, Search, Info, X, ShieldCheck, MessageCircle, ZoomIn } from 'lucide-react';
import { useFishCatalog } from '../hooks/useFishCatalog';
import type { FishItem } from '../types/fishCatalog';
import { FEATURES } from '../constants/features';

export type { FishItem } from '../types/fishCatalog';

export const FishMenuCatalog: React.FC = () => {
  const { items, loading } = useFishCatalog();
  const [activeOrigin, setActiveOrigin] = useState<'all' | 'Mar Ligure' | 'Medit. Occ.'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesOrigin = activeOrigin === 'all' ? true : item.origin === activeOrigin;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.origin.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOrigin && matchesSearch;
  });

  return (
    <section
      id="pesce-fresco"
      className="section-surface-alt"
      style={{
        padding: '5.5rem 0',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(19, 64, 116, 0.04) 0%, transparent 75%)',
      }}
    >
      <div className="container">

        {/* Section Header */}
        <div className="section-header">
          <div className="section-kicker">
            <Waves size={15} color="var(--color-ocean-medium)" />
            <span>Selezione Artigianale Pessano · Finale Ligure</span>
          </div>
          <div className="hairline-gold" />
          <h2 className="section-title">
            Banco del Pesce Fresco del Giorno
          </h2>
          <p className="section-lede">
            Pescato locale selezionato ogni mattina dai nostri pescatori di fiducia nel Mar Ligure e nel Mediterraneo.
            Qualità artigianale, pulizia gratuita al banco e freschezza garantita.
          </p>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            marginBottom: '3rem',
            alignItems: 'center',
          }}
        >
          {/* Origin Filter Tabs */}
          <div className="fish-filter-scroll">
            <button
              type="button"
              onClick={() => setActiveOrigin('all')}
              style={filterBtnStyle(activeOrigin === 'all')}
            >
              Tutto ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveOrigin('Mar Ligure')}
              style={filterBtnStyle(activeOrigin === 'Mar Ligure')}
            >
              Mar Ligure
            </button>
            <button
              type="button"
              onClick={() => setActiveOrigin('Medit. Occ.')}
              style={filterBtnStyle(activeOrigin === 'Medit. Occ.')}
            >
              Medit. Occidentale
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
            <Search
              size={18}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Cerca acciughe, branzino, orata, calamari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.8rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(11, 37, 69, 0.15)',
                backgroundColor: 'white',
                fontSize: '0.95rem',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            Caricamento selezione del giorno...
          </p>
        )}

        {/* Clean Grid Layout */}
        <div className="fish-grid">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedFish(item)}
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid rgba(11, 37, 69, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
              }}
              className="fish-card-hover"
            >
              {/* Wood Accent Top Border for Artisan Craftsmanship Feel */}
              <div
                style={{
                  height: '4px',
                  backgroundColor: item.origin === 'Mar Ligure' ? 'var(--color-sea-blue)' : '#C68B59',
                  width: '100%',
                }}
              />

              {/* Card Image Container */}
              <div className="fish-card-media">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  style={{
                    objectPosition:
                      item.id === 'nasello' ? 'center 22%' : item.id === 'polpo' ? 'center 32%' : 'center',
                  }}
                  className="fish-card-img"
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', '/hero_pescheria.jpg');
                  }}
                />

                {/* Top Left Origin Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '0.85rem',
                    left: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: item.origin === 'Mar Ligure' ? 'rgba(11, 37, 69, 0.88)' : 'rgba(30, 41, 59, 0.88)',
                    backdropFilter: 'blur(8px)',
                    color: item.origin === 'Mar Ligure' ? '#38BDF8' : '#FCD34D',
                    fontSize: '0.775rem',
                    fontWeight: 800,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 2,
                  }}
                >
                  {item.origin === 'Mar Ligure' ? (
                    <>
                      <Waves size={13} />
                      <span>Mar Ligure</span>
                    </>
                  ) : (
                    <>
                      <Anchor size={13} />
                      <span>Medit. Occ.</span>
                    </>
                  )}
                </div>

                {/* Top Right Zoom Badge */}
                <div
                  className="fish-card-zoom-badge"
                  title="Visualizza foto completa"
                  aria-hidden="true"
                  style={{ zIndex: 2 }}
                >
                  <ZoomIn size={15} />
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: 'var(--color-ocean-dark)',
                      marginBottom: '0.5rem',
                      lineHeight: 1.25,
                    }}
                  >
                    {item.name}
                  </h3>
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(11, 37, 69, 0.08)',
                    paddingTop: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        fontWeight: 700,
                      }}
                    >
                      Prezzo al Kg
                    </span>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: 'var(--color-ocean-dark)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      € {item.pricePerKg.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(19, 64, 116, 0.08)',
                      color: 'var(--color-ocean-dark)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.775rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Info size={14} color="var(--color-ocean-medium)" />
                    <span>Dettagli</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clean Artisanal Guarantee Footer Banner */}
        <div
          className="fish-banner-responsive"
          style={{
            marginTop: '3.5rem',
            padding: '1.5rem 2rem',
            borderRadius: 'var(--radius-md)',
            background:
              'radial-gradient(ellipse 80% 120% at 100% 0%, rgba(143, 182, 204, 0.18), transparent 50%), var(--color-ocean-dark)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid rgba(201, 162, 39, 0.22)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} color="var(--color-sea-blue)" />
            </div>
            <div>
              <h4 className="font-serif" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.15rem', color: 'white' }}>
                {FEATURES.ONLINE_ORDERING
                  ? 'Ordina il Pesce Fresco del Giorno Online'
                  : 'Pesce Fresco del Giorno al Banco & Asporto'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-sea-blue)', margin: 0 }}>
                {FEATURES.ONLINE_ORDERING
                  ? 'Scegli la pezzatura, richiedi pulizia e sfilettatura gratuite e ritira al banco quando preferisci.'
                  : `Scegli la pezzatura, richiedi pulizia e sfilettatura gratuite. Prenota al banco o inviaci un messaggio WhatsApp a ${FEATURES.WHATSAPP_DISPLAY}.`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="#poke-fritti"
              style={{
                padding: '0.7rem 1.3rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-coral)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.875rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: 'var(--shadow-glow)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Scopri Poke & Coni Fritti</span>
              <Sparkles size={15} />
            </a>

            <a
              href={FEATURES.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-banner"
              title="Prenota su WhatsApp (+39 345 948 5857)"
              aria-label="Invia messaggio WhatsApp per prenotare il pescato del giorno"
            >
              <MessageCircle size={16} color="#25D366" strokeWidth={2.2} />
              <span>Prenota su WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Clean Full-Image Lightbox Modal (Full image + Name ONLY) */}
      {selectedFish && (
        <div
          className="fish-modal-container"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(11, 37, 69, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedFish(null)}
        >
          <div
            className="fish-modal-content"
            style={{
              backgroundColor: 'var(--color-ocean-dark)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '680px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setSelectedFish(null)}
              style={{
                position: 'absolute',
                top: '0.85rem',
                right: '0.85rem',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Full Uncropped Image */}
            <div
              style={{
                position: 'relative',
                maxHeight: '65vh',
                backgroundColor: '#05101F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
              }}
            >
              <img
                src={selectedFish.image}
                alt={selectedFish.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--color-ocean-dark)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '0.4rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <h3
                  className="font-serif"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: 'white',
                    margin: 0,
                    letterSpacing: '0.02em',
                    textAlign: 'left',
                  }}
                >
                  {selectedFish.name}
                </h3>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38BDF8' }}>
                    € {selectedFish.pricePerKg.toFixed(2).replace('.', ',')}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)', marginLeft: '0.25rem' }}>
                    / kg
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--color-sea-blue)', fontSize: '0.85rem', margin: '0 0 0.85rem 0', textAlign: 'left' }}>
                {selectedFish.origin}
                {selectedFish.isPopular ? ' • Prodotto popolare' : ''}
              </p>

              {selectedFish.description ? (
                <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1rem 0', textAlign: 'left' }}>
                  {selectedFish.description}
                </p>
              ) : null}

              {selectedFish.cookingTip ? (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    marginBottom: '1rem',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FCD34D', marginBottom: '0.2rem' }}>
                    Consiglio dello Chef Pessano:
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {selectedFish.cookingTip}
                  </div>
                </div>
              ) : null}

              {selectedFish.winePairing ? (
                <div
                  style={{
                    padding: '0.65rem 0.95rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.18)',
                    marginBottom: '1.25rem',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38BDF8' }}>
                    Vino consigliato:
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                    {selectedFish.winePairing}
                  </span>
                </div>
              ) : null}

              <a
                href={`https://wa.me/${FEATURES.WHATSAPP_NUMBER}?text=${encodeURIComponent(`Ciao Pescheria Pessano, vorrei prenotare: ${selectedFish.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  padding: '0.75rem 1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  width: '100%',
                }}
                onClick={() => setSelectedFish(null)}
              >
                <MessageCircle size={15} />
                <span>Prenota su WhatsApp ({FEATURES.WHATSAPP_DISPLAY})</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

function filterBtnStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '0.45rem 0.85rem',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    backgroundColor: isActive ? 'var(--color-ocean-dark)' : 'transparent',
    color: isActive ? 'white' : 'var(--color-text-muted)',
    fontWeight: isActive ? 800 : 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    wordBreak: 'keep-all',
  };
}
