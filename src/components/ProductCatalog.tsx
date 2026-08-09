import React, { useState } from 'react';
import { PRODUCTS, Product } from '../data/products';
import { Search, Wine, ChefHat, MessageCircle, Info, X } from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'fresco' | 'gastronomia'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesFilter =
      activeFilter === 'all' ? true : product.category === activeFilter;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.origin.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <section
      id="prodotti"
      style={{
        padding: '5rem 0',
        backgroundColor: 'var(--color-ice-blue)',
      }}
    >
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3rem auto' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-ocean-medium)',
              marginBottom: '0.5rem',
            }}
          >
            Dal Mar Ligure alla tua Tavola
          </div>

          <h2
            className="font-serif heading-dark-gradient"
            style={{
              fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            Pescato del Giorno & Gastronomia Pronta
          </h2>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
            Selezioniamo ogni mattina il miglior pesce fresco dai nostri pescatori di fiducia. Scopri anche le nostre specialità liguri già pronte da gustare.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            marginBottom: '3rem',
            alignItems: 'center',
          }}
        >
          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: 'white',
              padding: '0.4rem',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid rgba(11, 37, 69, 0.08)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => setActiveFilter('all')}
              style={filterTabStyle(activeFilter === 'all')}
            >
              Tutti i Prodotti ({PRODUCTS.length})
            </button>
            <button
              onClick={() => setActiveFilter('fresco')}
              style={filterTabStyle(activeFilter === 'fresco')}
            >
              🐟 Pesce Fresco da Cucinare
            </button>
            <button
              onClick={() => setActiveFilter('gastronomia')}
              style={filterTabStyle(activeFilter === 'gastronomia')}
            >
              🍤 Pronto da Mangiare (Gastronomia)
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '450px',
            }}
          >
            <Search
              size={18}
              color="var(--color-text-muted)"
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Cerca orata, fritto misto, gamberi, pesto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
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

        {/* Product Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '2rem',
          }}
        >
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="glass-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* Product Image Container */}
              <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                
                {/* Tag Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '0.85rem',
                    left: '0.85rem',
                    backgroundColor: product.category === 'fresco' ? 'var(--color-ocean-dark)' : 'var(--color-coral)',
                    color: 'white',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {product.tag}
                </div>

                {product.isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.85rem',
                      right: '0.85rem',
                      backgroundColor: 'var(--color-gold)',
                      color: 'var(--color-ocean-dark)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.725rem',
                      fontWeight: 800,
                    }}
                  >
                    ⭐ Più Richiesto
                  </div>
                )}
              </div>

              {/* Product Info Content */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                
                <div style={{ fontSize: '0.8rem', color: 'var(--color-ocean-medium)', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {product.origin}
                </div>

                <h3
                  className="font-serif"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    color: 'var(--color-ocean-dark)',
                  }}
                >
                  {product.name}
                </h3>

                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '1.25rem',
                    flexGrow: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {product.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(11, 37, 69, 0.08)',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-ocean-dark)' }}>
                      {product.price}
                    </span>
                    <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginLeft: '0.25rem' }}>
                      {product.unit}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="btn btn-outline-light"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(11, 37, 69, 0.05)',
                      color: 'var(--color-ocean-dark)',
                      borderColor: 'rgba(11, 37, 69, 0.15)',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Info size={16} />
                    <span>Dettagli</span>
                  </button>

                  <a
                    href={`https://wa.me/39019692623?text=Ciao%20Pescheria%20Pessano,%20vorrei%20ordinare:%20${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-coral"
                    style={{
                      padding: '0.65rem 1rem',
                      fontSize: '0.85rem',
                    }}
                    title="Ordina su WhatsApp"
                  >
                    <MessageCircle size={16} />
                    <span>Ordina</span>
                  </a>
                </div>

              </div>

            </div>
          ))}
        </div>

        {/* Modal View for Product Details */}
        {selectedProduct && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(11, 37, 69, 0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
            }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '650px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <X size={20} />
              </button>

              <div style={{ height: '260px', position: 'relative' }}>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '2rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-ocean-medium)', fontWeight: 700 }}>
                  {selectedProduct.origin}
                </div>

                <h3 className="font-serif" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-ocean-dark)', marginBottom: '0.75rem' }}>
                  {selectedProduct.name}
                </h3>

                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {selectedProduct.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    marginBottom: '1.75rem',
                    padding: '1rem',
                    backgroundColor: 'var(--color-ice-blue)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <ChefHat color="var(--color-ocean-medium)" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--color-ocean-dark)' }}>Consiglio di Cottura:</strong>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedProduct.recipeTip}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <Wine color="var(--color-coral)" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--color-ocean-dark)' }}>Vino Ligure Consigliato:</strong>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selectedProduct.winePairing}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-ocean-dark)' }}>
                      {selectedProduct.price}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginLeft: '0.3rem' }}>
                      {selectedProduct.unit}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/39019692623?text=Ciao%20Pescheria%20Pessano,%20vorrei%20ordinare:%20${encodeURIComponent(selectedProduct.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-coral"
                    style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem' }}
                  >
                    <MessageCircle size={18} />
                    <span>Ordina su WhatsApp</span>
                  </a>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
};

const filterTabStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '0.65rem 1.25rem',
  borderRadius: 'var(--radius-full)',
  fontWeight: 700,
  fontSize: '0.875rem',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: isActive ? 'var(--color-ocean-dark)' : 'transparent',
  color: isActive ? 'white' : 'var(--color-text-muted)',
  transition: 'all 0.25s ease',
});
