import React, { useState } from 'react';
import { Waves, Anchor, Sparkles, ChefHat, Wine, Search, Info, X, ShieldCheck } from 'lucide-react';

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
    locationDetail: 'Pescato locale - Finale Ligure (SV)',
    pricePerKg: 18.00,
    image: '/pesce/acciughe.jpg',
    description: 'Acciughe freschissime pescate nelle acque del Mar Ligure. Carne soda, saporita e ricca di Omega 3.',
    cookingTip: 'Ideali impanate e fritte dorate in olio d\'oliva oppure marinate al limone e prezzemolo fresco.',
    winePairing: 'Lumassina Frizzante IGT Colline Savonesi',
    isPopular: true,
  },
  {
    id: 'sgombro',
    name: 'Sgombro Nostrano',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale - Ponente Ligure',
    pricePerKg: 26.00,
    image: '/pesce/tonno_pinna_gialla.jpg',
    description: 'Sgombro fresco del Mar Ligure. Pesce azzurro di primissima qualità, gustoso e nutriente.',
    cookingTip: 'Cottura al cartoccio con pomodorini datterini, capperi di Rocchetta e origano fresco.',
    winePairing: 'Vermentino Riviera Ligure di Ponente DOC',
    isPopular: false,
  },
  {
    id: 'pescatrice',
    name: 'Rana Pescatrice (Coda di Rospo)',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale - Mar Ligure',
    pricePerKg: 28.00,
    image: '/pesce/pescatrice.jpg',
    description: 'Rana Pescatrice del Mar Ligure. Polpa magra, compattissima e completamente priva di spine centrali.',
    cookingTip: 'Squisita in guazzetto al pomodoro con olive taggiasche e crostini di pane casereccio.',
    winePairing: 'Pigato della Riviera Ligure di Ponente DOC',
    isPopular: true,
  },
  {
    id: 'polpo',
    name: 'Polpo Verace del Golfo',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale - Golfo dell\'Isola',
    pricePerKg: 34.00,
    image: '/pesce/polpo.jpg',
    description: 'Polpo verace fresco pescato nei fondali del Mar Ligure. Carni morbide ed estremamente saporite.',
    cookingTip: 'Lessato a fuoco lento con alloro e condito tiepido con patate novelle ed olio EVPO ligure.',
    winePairing: 'Vermentino Riviera Ligure di Ponente DOC',
    isPopular: true,
  },
  {
    id: 'triglia',
    name: 'Triglia di Scoglio Nostrana',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale - Scogli di Finale Ligure',
    pricePerKg: 34.00,
    image: '/pesce/triglia.jpg',
    description: 'Triglia di scoglio del Mar Ligure. Icona della tradizione marinaresca con carni profumate ed inconfondibili.',
    cookingTip: 'In padella con aglio, un filo d\'olio EVPO, pomodorini freschi e prezzemolo o al cartoccio.',
    winePairing: 'Pigato Superiore Riviera Ligure DOC',
    isPopular: false,
  },
  {
    id: 'nasello',
    name: 'Nasello Fresco di Paranza',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale di paranza - Mar Ligure',
    pricePerKg: 38.00,
    image: '/pesce/nasello.jpg',
    description: 'Nasello di paranza del Mar Ligure. Carne bianca, finissima, altamente digeribile e delicata.',
    cookingTip: 'Cottura al vapore con gocce di limone bio ligure o al forno in foglia di limone.',
    winePairing: 'Lumassina IGT o Vermentino',
    isPopular: false,
  },
  {
    id: 'calamari',
    name: 'Calamari Veraci Nostrani',
    origin: 'Medit. Occ.',
    locationDetail: 'Mediterraneo Occidentale Selezionato',
    pricePerKg: 42.00,
    image: '/pesce/calamari.jpg',
    description: 'Calamari veraci freschissimi del Mediterraneo Occidentale. Polpa tenera e gusto dolce naturale.',
    cookingTip: 'Cottura rapida alla piastra 2 minuti per lato o ripieni con mollica aromatizzata e pinoli.',
    winePairing: 'Pigato Riviera Ligure di Ponente DOC',
    isPopular: true,
  },
  {
    id: 'branzino',
    name: 'Branzino Selvaggio del Golfo',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale - Mar Ligure',
    pricePerKg: 50.00,
    image: '/pesce/branzino.jpg',
    description: 'Branzino selvaggio pescato nel Mar Ligure. Carni nobili, compatte, magre e dal sapore straordinario.',
    cookingTip: 'In crosta di sale grosso ed erbe della macchia mediterranea al forno a 200°C per 25 min.',
    winePairing: 'Vermentino DOC Riviera Ligure di Ponente',
    isPopular: true,
  },
  {
    id: 'pesce-spada',
    name: 'Pesce Spada del Golfo',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale - Ponente Ligure',
    pricePerKg: 50.00,
    image: '/pesce/pesce_spada.jpg',
    description: 'Trance di pesce spada fresco del Mar Ligure. Carne compattissima, priva di spine, perfetta alla griglia.',
    cookingTip: 'Alla piastra 3 minuti per lato, condito con salmoriglio di olio ligure, limone, origano e capperi.',
    winePairing: 'Pigato DOC Riviera Ligure di Ponente',
    isPopular: true,
  },
  {
    id: 'orata',
    name: 'Orata di Mare Nostrana',
    origin: 'Mar Ligure',
    locationDetail: 'Pescato locale - Mar Ligure',
    pricePerKg: 56.00,
    image: '/pesce/orata.jpg',
    description: 'Orata di mare pescata nelle acque trasparenti del Mar Ligure. Carni sode, magre e delicate.',
    cookingTip: 'Al forno con patate a fette sottili, olive taggiasche, pinoli tostati e vino bianco Pigato.',
    winePairing: 'Pigato della Riviera Ligure DOC',
    isPopular: true,
  },
  {
    id: 'rombo',
    name: 'Rombo Chiodato del Mediterraneo',
    origin: 'Medit. Occ.',
    locationDetail: 'Mediterraneo Occidentale Selezionato',
    pricePerKg: 58.00,
    image: '/pesce/rombo.jpg',
    description: 'Rombo chiodato fresco del Mediterraneo Occidentale. Tra i pesci più pregiati per delicatezza e consistenza.',
    cookingTip: 'Al forno su letto di patate a specchio, timo fresco ed un goccio di vino bianco ligure.',
    winePairing: 'Vermentino Superiore DOC Riviera Ligure',
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
      style={{
        padding: '5.5rem 0',
        backgroundColor: '#F1F5F9', // Slate ice background
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(19, 64, 116, 0.04) 0%, transparent 75%)',
      }}
    >
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.825rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--color-ocean-medium)',
              backgroundColor: 'rgba(19, 64, 116, 0.08)',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              marginBottom: '1rem',
              border: '1px solid rgba(19, 64, 116, 0.15)',
            }}
          >
            <Waves size={16} color="var(--color-ocean-medium)" />
            <span>Selezione Artigianale Pessano • Finale Ligure</span>
          </div>

          <h2
            className="font-serif heading-dark-gradient"
            style={{
              fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
              fontWeight: 800,
              color: 'var(--color-ocean-dark)',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}
          >
            Banco del Pesce Fresco del Giorno
          </h2>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.08rem', lineHeight: 1.6 }}>
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
              Tutto il Pescato ({FISH_CATALOG.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveOrigin('Mar Ligure')}
              style={filterBtnStyle(activeOrigin === 'Mar Ligure')}
            >
              🌊 Mar Ligure (Pescato Locale)
            </button>
            <button
              type="button"
              onClick={() => setActiveOrigin('Medit. Occ.')}
              style={filterBtnStyle(activeOrigin === 'Medit. Occ.')}
            >
              ⛵ Mediterraneo Occidentale
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

                {/* Popularity Badge */}
                {item.isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(255, 107, 107, 0.9)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                      fontSize: '0.725rem',
                      fontWeight: 800,
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Top Pescato</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  {/* Visual Hierarchy Step 1: Nome del Pesce in evidenza */}
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--color-ocean-dark)',
                      marginBottom: '0.35rem',
                      lineHeight: 1.25,
                    }}
                  >
                    {item.name}
                  </h3>

                  {/* Location subtitle */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.85rem', fontWeight: 600 }}>
                    📍 {item.locationDetail}
                  </div>

                  {/* Short Description */}
                  <p
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      marginBottom: '1.25rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Card Footer: Visual Hierarchy Step 2 & 3: Prezzo al Kg & Badge pulizia */}
                <div
                  style={{
                    borderTop: '1px solid rgba(11, 37, 69, 0.08)',
                    paddingTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', display: 'block', fontWeight: 700 }}>
                      Prezzo al Kg
                    </span>
                    <span
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 900,
                        color: 'var(--color-ocean-dark)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      € {item.pricePerKg.toFixed(2).replace('.', ',')}
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-muted)', marginLeft: '3px' }}>
                        / Kg
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(19, 64, 116, 0.08)',
                      color: 'var(--color-ocean-dark)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.8rem',
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
            marginTop: '4rem',
            padding: '1.75rem 2rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-ocean-dark)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={26} color="var(--color-sea-blue)" />
            </div>
            <div>
              <h4 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.2rem', color: 'white' }}>
                Servizio di Pulizia & Sfilettatura Gratuito al Banco
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-sea-blue)', margin: 0 }}>
                Puliamo, sfilettiamo ed evisceriamo il tuo pesce senza alcun costo aggiuntivo. Praticità totale per la tua cucina.
              </p>
            </div>
          </div>

          <a
            href="/componi-poke"
            style={{
              padding: '0.75rem 1.4rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-coral)',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <span>Ordina Poke o Ritiro</span>
            <Sparkles size={16} />
          </a>
        </div>
      </div>

      {/* Item Detail Modal Dialog */}
      {selectedFish && (
        <div
          className="fish-modal-container"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(11, 37, 69, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setSelectedFish(null)}
        >
          <div
            className="fish-modal-content"
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image (Full Uncropped View) */}
            <div
              style={{
                position: 'relative',
                maxHeight: '380px',
                minHeight: '220px',
                backgroundColor: '#07162c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={selectedFish.image}
                alt={selectedFish.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '380px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedFish(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(11, 37, 69, 0.85)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <X size={20} />
              </button>

              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(11, 37, 69, 0.9)',
                  color: '#38BDF8',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                }}
              >
                <Waves size={14} />
                <span>{selectedFish.origin} — {selectedFish.locationDetail}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-ocean-dark)' }}>
                  {selectedFish.name}
                </h3>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-ocean-dark)' }}>
                    € {selectedFish.pricePerKg.toFixed(2).replace('.', ',')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    Prezzo al Kg
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {selectedFish.description}
              </p>

              {/* Cooking Tip */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FEF9C3',
                  border: '1px solid #FDE047',
                  marginBottom: '1rem',
                  display: 'flex',
                  gap: '0.75rem',
                }}
              >
                <ChefHat size={22} color="#854D0E" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#854D0E', marginBottom: '0.2rem' }}>
                    Consiglio dello Chef Pessano:
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#713F12', lineHeight: 1.45 }}>
                    {selectedFish.cookingTip}
                  </div>
                </div>
              </div>

              {/* Wine Pairing */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(19, 64, 116, 0.06)',
                  border: '1px solid rgba(19, 64, 116, 0.12)',
                  display: 'flex',
                  gap: '0.75rem',
                }}
              >
                <Wine size={22} color="var(--color-ocean-medium)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-ocean-dark)', marginBottom: '0.2rem' }}>
                    Abbinamento Vino Consigliato:
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-ocean-medium)', fontWeight: 700 }}>
                    {selectedFish.winePairing}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

function filterBtnStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '0.5rem 1.1rem',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    backgroundColor: isActive ? 'var(--color-ocean-dark)' : 'transparent',
    color: isActive ? 'white' : 'var(--color-text-muted)',
    fontWeight: isActive ? 800 : 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };
}
