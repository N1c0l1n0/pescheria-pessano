import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Utensils, ShoppingBag, Anchor, Sparkles, ArrowRight } from 'lucide-react';

export const InfoSection: React.FC = () => {
  return (
    <section
      id="servizi"
      style={{
        padding: '5.25rem 0',
        backgroundColor: 'var(--color-sand)',
      }}
    >
      <div className="container">

        {/* Section Header */}
        <div className="section-header">
          <div className="section-kicker">Pescheria & Gastronomia Storica</div>
          <div className="hairline-gold" />
          <h2 className="section-title">
            I Nostri Servizi Principali
          </h2>
          <p className="section-lede">
            Dal pesce fresco del nostro mare alla preparazione di Poke personalizzate e piatti pronti della tradizione: scopri tutti i servizi della Pescheria Pessano.
          </p>
        </div>

        {/* 4 Minimalist Service Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Card 1: Pesce Fresco */}
          <div
            className="glass-panel service-card"
          >
            <div
              className="service-icon"
              style={{ backgroundColor: 'rgba(10, 35, 66, 0.08)' }}
            >
              <Anchor size={26} color="var(--color-ocean-dark)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
                minHeight: '3.2rem',
                display: 'flex',
                alignItems: 'flex-start',
                lineHeight: 1.25,
              }}
            >
              Pesce Fresco del Giorno
            </h3>

            <p
              style={{
                color: 'var(--color-text-muted)',
                lineHeight: 1.55,
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                minHeight: '4.5rem',
              }}
            >
              Pescato locale selezionato ogni mattina: Acciughe del Golfo, Orate, Branzini selvaggi, Gamberi Rossi e Calamari nostrani.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Svisceratura e pulizia gratuita
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Sfilettatura su richiesta
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Filiera corta e pescato locale
              </li>
            </ul>
            <Link
              to="/componi-poke?tab=pesce"
              className="service-link"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Ordina pesce fresco
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Card 2: Poke Bowl Artigianali */}
          <div
            className="glass-panel service-card"
          >
            <div
              className="service-icon"
              style={{ backgroundColor: 'rgba(232, 93, 82, 0.12)' }}
            >
              <Sparkles size={26} color="var(--color-coral)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
                minHeight: '3.2rem',
                display: 'flex',
                alignItems: 'flex-start',
                lineHeight: 1.25,
              }}
            >
              Poke Bowl Artigianali
            </h3>

            <p
              style={{
                color: 'var(--color-text-muted)',
                lineHeight: 1.55,
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                minHeight: '4.5rem',
              }}
            >
              Componi online la tua Poke Bowl personalizzata con pesce fresco a cubetti, riso, topping selezionati e salse artigianali.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Composizione online su misura
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Pesce fresco tagliato al momento
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Basi, topping e salse a scelta
              </li>
            </ul>
            <Link
              to="/componi-poke"
              className="service-link"
              style={{ color: 'var(--color-coral)' }}
            >
              Componi la tua poke
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Card 3: Gastronomia Pronta */}
          <div
            className="glass-panel service-card"
          >
            <div
              className="service-icon"
              style={{ backgroundColor: 'rgba(22, 74, 124, 0.12)' }}
            >
              <Utensils size={26} color="var(--color-ocean-medium)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
                minHeight: '3.2rem',
                display: 'flex',
                alignItems: 'flex-start',
                lineHeight: 1.25,
              }}
            >
              Gastronomia Pronta
            </h3>

            <p
              style={{
                color: 'var(--color-text-muted)',
                lineHeight: 1.55,
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                minHeight: '4.5rem',
              }}
            >
              Piatti pronti della tradizione marinara ligure preparati quotidianamente nel nostro laboratorio artigianale con ingredienti freschissimi.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Fritto Misto croccante di Mare
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Insalata di mare e primi piatti
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Specialità liguri preparate oggi
              </li>
            </ul>
            <Link
              to="/componi-poke?tab=fritti"
              className="service-link"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Scopri i fritti d'asporto
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Card 4: Ordini Online & Tracciamento */}
          <div
            className="glass-panel service-card"
          >
            <div
              className="service-icon"
              style={{ backgroundColor: 'rgba(143, 182, 204, 0.22)' }}
            >
              <ShoppingBag size={26} color="var(--color-ocean-medium)" />
            </div>

            <h3
              className="font-serif"
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'var(--color-ocean-dark)',
                marginBottom: '0.75rem',
                minHeight: '3.2rem',
                display: 'flex',
                alignItems: 'flex-start',
                lineHeight: 1.25,
              }}
            >
              Ordini Online & Asporto
            </h3>

            <p
              style={{
                color: 'var(--color-text-muted)',
                lineHeight: 1.55,
                fontSize: '0.9rem',
                marginBottom: '1.5rem',
                minHeight: '4.5rem',
              }}
            >
              Ordina facilmente dal sito per un ritiro rapido senza attese. Segui lo stato di preparazione in tempo reale con notifiche dedicate.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Ritiro rapido zero attese
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Tracciamento ordine dal vivo
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Confezionamento salvafreschezza
              </li>
            </ul>
            <Link
              to="/componi-poke"
              className="service-link"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Inizia un ordine
              <ArrowRight size={15} />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
