import React from 'react';
import { Star, ExternalLink } from 'lucide-react';

const REVIEWS = [
  {
    quote: 'Fritto misto e acciughe fritte buonissime. La numero uno per me. Prezzi modici e soprattutto qualità e pesce fresco.',
    author: 'Daniele F.',
  },
  {
    quote: 'Abbiamo mangiato frittura di pesce e un poke semplicemente deliziosi! Croccante al punto giusto, leggero e per nulla unto, si sentiva tutta la freschezza del pesce. Porzioni abbondanti e servizio cortese e veloce. Si vede che qui il pesce è una cosa seria! Ottimo rapporto qualità-prezzo. Torneremo sicuramente, consigliatissimo!',
    author: 'Dalal E.',
  },
];

export const TrustSection: React.FC = () => {
  return (
    <section
      id="recensioni"
      className="section-wave-top"
      style={{
        padding: '5rem 0',
        backgroundColor: 'white',
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3rem auto' }}>
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
            Tradizione & Fiducia
          </div>

          <h2
            className="font-serif heading-dark-gradient"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            Pescheria di quartiere, qualità del mare
          </h2>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Da generazioni al banco di Finale Ligure: pescato selezionato ogni mattina, gastronomia preparata in laboratorio
            e un servizio che conosce i clienti per nome.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {REVIEWS.map((review) => (
            <blockquote key={review.author} className="trust-quote-card">
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.75rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="var(--color-gold)" color="var(--color-gold)" />
                ))}
              </div>
              <p
                style={{
                  color: 'var(--color-text-dark)',
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  margin: '0 0 0.85rem 0',
                  fontStyle: 'italic',
                }}
              >
                “{review.quote}”
              </p>
              <cite
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  fontStyle: 'normal',
                  fontWeight: 600,
                }}
              >
                — {review.author}
              </cite>
            </blockquote>
          ))}

          <div
            className="trust-quote-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              background: 'linear-gradient(145deg, var(--color-ocean-dark) 0%, var(--color-ocean-medium) 100%)',
              color: 'white',
              border: 'none',
            }}
          >
            <div style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--color-gold)', lineHeight: 1 }}>
              4.4
            </div>
            <div style={{ display: 'flex', gap: '0.2rem', margin: '0.5rem 0' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="var(--color-gold)" color="var(--color-gold)" />
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-sea-blue)', margin: '0 0 1rem 0' }}>
              197 recensioni su Google
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Pescheria+Pessano+Finale+Ligure"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-coral"
              style={{ fontSize: '0.85rem', padding: '0.65rem 1.1rem', textDecoration: 'none' }}
            >
              <ExternalLink size={15} />
              Leggi le recensioni
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
