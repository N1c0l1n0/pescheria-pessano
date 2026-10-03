import React from 'react';
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
            <a
              href="#pesce-fresco"
              className="service-link"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Consulta il banco fresco
              <ArrowRight size={15} />
            </a>
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
              Poke Bowl su misura con pescato freschissimo tagliato al momento, riso, topping selezionati e salse artigianali.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Ingredienti freschi e salutari
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Pesce fresco tagliato al momento
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Basi, topping e salse a scelta
              </li>
            </ul>
            <a
              href="#poke-fritti"
              className="service-link"
              style={{ color: 'var(--color-coral)' }}
            >
              Scopri gli ingredienti poke
              <ArrowRight size={15} />
            </a>
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
              Gastronomia & Coni Fritti
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
              Coni fritti espressi caldi e croccanti e piatti pronti della tradizione marinara preparati quotidianamente nel nostro laboratorio.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Fritto Misto croccante espresso
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Coni di calamari e acciughe
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Specialità liguri pronte
              </li>
            </ul>
            <a
              href="#poke-fritti"
              className="service-link"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Scopri i coni fritti
              <ArrowRight size={15} />
            </a>
          </div>

          {/* Card 4: Prenotazioni al banco e telefoniche */}
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
              Prenotazioni & Asporto
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
              Ordina comodamente chiamando il nostro banco al 019 692623 per farti riservare il pescato del mattino o concordare il ritiro d'asporto.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84rem', color: 'var(--color-ocean-dark)', fontWeight: 600 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Ritiro rapido zero attese
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Prenotazioni telefoniche dirette
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#22C55E" style={{ flexShrink: 0 }} /> Confezionamento salvafreschezza
              </li>
            </ul>
            <a
              href="tel:019692623"
              className="service-link"
              style={{ color: 'var(--color-ocean-medium)' }}
            >
              Chiama il banco: 019 692623
              <ArrowRight size={15} />
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};
