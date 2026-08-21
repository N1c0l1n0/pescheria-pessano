import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Waves, Anchor, Sparkles, Search, Info, X, ShieldCheck } from 'lucide-react';

export interface FishItem {
  id: string;
  name: string;
  origin: string; // 'Mar Ligure' | 'Medit. Occ.'
  locationDetail: string;
  pricePerKg: number;
  image: string;
  description: string;
  cookingTip: string;
  winePairing: string;
  isPopular?: boolean;
}

export const FISH_CATALOG: FishItem[] = [
  {
    id: 'acciughe',
    name: 'Acciughe del Golfo',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 18.00,
    image: '/pesce/acciughe.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'tonno-pinna-gialla',
    name: 'Tonno Pinna Gialla',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 44.00,
    image: '/pesce/tonno_pinna_gialla.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'pescatrice',
    name: 'Rana Pescatrice (Coda di Rospo)',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 28.00,
    image: '/pesce/pescatrice.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'polpo',
    name: 'Polpo Verace del Golfo',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 34.00,
    image: '/pesce/polpo.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'triglia',
    name: 'Triglia di Scoglio Nostrana',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 34.00,
    image: '/pesce/triglia.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: false,
  },
  {
    id: 'nasello',
    name: 'Nasello Fresco di Paranza',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 38.00,
    image: '/pesce/nasello.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: false,
  },
  {
    id: 'calamari',
    name: 'Calamari Veraci Nostrani',
    origin: 'Medit. Occ.',
    locationDetail: '',
    pricePerKg: 42.00,
    image: '/pesce/calamari.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'branzino',
    name: 'Branzino Selvaggio del Golfo',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 50.00,
    image: '/pesce/branzino.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'pesce-spada',
    name: 'Pesce Spada del Golfo',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 50.00,
    image: '/pesce/pesce_spada.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'orata',
    name: 'Orata di Mare Nostrana',
    origin: 'Mar Ligure',
    locationDetail: '',
    pricePerKg: 56.00,
    image: '/pesce/orata.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
  {
    id: 'rombo',
    name: 'Rombo Chiodato del Mediterraneo',
    origin: 'Medit. Occ.',
    locationDetail: '',
    pricePerKg: 58.00,
    image: '/pesce/rombo.jpg',
    description: '',
    cookingTip: '',
    winePairing: '',
    isPopular: true,
  },
];

export const FishMenuCatalog: React.FC = () => {
  const [activeOrigin, setActiveOrigin] = useState<'all' | 'Mar Ligure' | 'Medit. Occ.'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFish, setSelectedFish] = useState<FishItem | null>(null);

  const filteredItems = FISH_CATALOG.filter((item) => {
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
              Tutto ({FISH_CATALOG.length})
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
              <div style={{ position: 'relative', height: '220px', overflow: 'hidden', backgroundColor: '#0B2545' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                  }}
                  className="fish-card-img"
                  onError={(e) => {
                    // Fallback image if file error
                    (e.target as HTMLElement).setAttribute('src', '/hero_pescheria.jpg');
                  }}
                />

                {/* Gradient overlay for text contrast */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(11, 37, 69, 0.7) 0%, transparent 60%)',
                  }}
                />

                {/* Top Left Origin Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
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


              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  {/* Nome del Pesce in evidenza */}
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: 'var(--color-ocean-dark)',
                      marginBottom: '0.75rem',
                      lineHeight: 1.25,
                    }}
                  >
                    {item.name}
                  </h3>
                </div>

                {/* Card Footer: Prezzo al Kg */}
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
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                      Prezzo al Kg
                    </span>
                    <span
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 900,
                        color: 'var(--color-ocean-dark)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      € {item.pricePerKg.toFixed(2).replace('.', ',')}
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: '3px' }}>
                        / Kg
                      </span>
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
                    <span>Ingrandisci</span>
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
                Ordina il Pesce Fresco del Giorno Online
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-sea-blue)', margin: 0 }}>
                Scegli la pezzatura, richiedi pulizia e sfilettatura gratuite e ritira al banco quando preferisci.
              </p>
            </div>
          </div>

          <Link
            to="/componi-poke?tab=pesce"
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
            <span>Ordina Pesce Fresco</span>
            <Sparkles size={15} />
          </Link>
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
                padding: '1.25rem 1.5rem 1.5rem',
                backgroundColor: 'var(--color-ocean-dark)',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3
                className="font-serif"
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: 'white',
                  margin: '0 0 0.5rem 0',
                  letterSpacing: '0.02em',
                }}
              >
                {selectedFish.name}
              </h3>
              <p style={{ color: 'var(--color-sea-blue)', fontSize: '0.875rem', margin: '0 0 0.75rem 0' }}>
                {selectedFish.origin}
                {selectedFish.isPopular ? ' • Prodotto popolare' : ''}
              </p>
              <p style={{ color: 'white', fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem 0' }}>
                € {selectedFish.pricePerKg.toFixed(2).replace('.', ',')} / Kg
              </p>
              <Link
                to="/componi-poke?tab=pesce"
                className="btn btn-coral"
                style={{ textDecoration: 'none', fontSize: '0.875rem', padding: '0.7rem 1.25rem' }}
                onClick={() => setSelectedFish(null)}
              >
                Ordina questo pesce
              </Link>
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
