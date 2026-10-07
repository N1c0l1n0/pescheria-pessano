import React, { useState } from 'react';
import { Sparkles, Phone, ShieldCheck, Flame, Utensils, Check, MessageCircle } from 'lucide-react';
import { FEATURES } from '../constants/features';

interface FormatInfo {
  name: string;
  price: string;
  badge?: string;
  description: string;
}

const POKE_FORMATS: FormatInfo[] = [
  {
    name: 'Formato Regular',
    price: '€ 10,00',
    description: '1 Base · 1 Proteina · 3 Ingredienti · 2 Salse · Semi di sesamo',
  },
  {
    name: 'Regular + 1 Proteina',
    price: '€ 12,00',
    badge: 'Più Scelta',
    description: '1 Base · 2 Proteine · 3 Ingredienti · 2 Salse · Semi di sesamo',
  },
  {
    name: 'Formato XL',
    price: '€ 15,00',
    badge: 'Ricco & Completo',
    description: '2 Basi · 3 Proteine · 5 Ingredienti · 4 Salse · Semi di sesamo',
  },
];

interface PokeBaseItem {
  id: string;
  name: string;
  tagline: string;
  desc: string;
}

const POKE_BASES: PokeBaseItem[] = [
  {
    id: 'riso-bianco',
    name: 'Riso Bianco per Sushi',
    tagline: 'Tradizionale al vapore',
    desc: 'Chicco tondo compatto, condito delicatamente con aceto di riso naturale.',
  },
  {
    id: 'riso-venere',
    name: 'Riso Venere Integrale',
    tagline: 'Aromatico & Ricco di fibre',
    desc: 'Pregiato riso nero italiano dal caratteristico aroma tostato e consistenza corposa.',
  },
  {
    id: 'insalata',
    name: 'Insalata Misticanza',
    tagline: 'Leggera & Croccante',
    desc: 'Selezione di foglie tenere e freschissime del giorno, per una base verde e dissetante.',
  },
  {
    id: 'meta-meta',
    name: 'Metà Riso e Metà Insalata',
    tagline: 'Equilibrio perfetto',
    desc: 'La freschezza delle foglie verdi unita alla morbidezza e alla pienezza del riso.',
  },
];

interface PokeProteinItem {
  name: string;
  extraPrice?: number;
  highlight?: boolean;
}

const POKE_PROTEINS: PokeProteinItem[] = [
  { name: 'Salmone Norvegese Crudo', highlight: true },
  { name: 'Salmone Scottato alla fiamma' },
  { name: 'Tonno Rosso Crudo', highlight: true },
  { name: 'Tonno Scottato alla fiamma' },
  { name: 'Gambero Cotto del Mediterraneo' },
  { name: 'Polpo Verace a vapore', extraPrice: 1 },
  { name: 'Gambero in Tempura dorata', extraPrice: 1 },
  { name: 'Salmone in Tempura', extraPrice: 2 },
  { name: 'Tonno in Tempura', extraPrice: 2 },
  { name: 'Pollo Grigliato alle erbe' },
  { name: 'Tofu naturale marinato' },
];

interface ToppingSubcategory {
  categoryName: string;
  subtitle: string;
  items: Array<{ name: string; extraPrice?: number; isLocal?: boolean }>;
}

const POKE_TOPPING_CATEGORIES: ToppingSubcategory[] = [
  {
    categoryName: 'Freschezza & Ortaggi del Giorno',
    subtitle: 'Verdure selezionate al mattino, croccanti, idratanti e ricche di vitamine',
    items: [
      { name: 'Avocado fresco a fette' },
      { name: 'Alghe Wakame marinate' },
      { name: 'Edamame al vapore' },
      { name: 'Pomodorini Datterini' },
      { name: 'Cetrioli a rondelle' },
      { name: 'Carote a julienne' },
      { name: 'Cipolla Rossa di Tropea' },
      { name: 'Mais dolce' },
      { name: 'Zucchine trifolate' },
      { name: 'Zenzero rosa marinato' },
      { name: 'Surimi sfilacciato' },
    ],
  },
  {
    categoryName: 'Croccanti, Semi & Frutta Secca',
    subtitle: 'Per dare consistenza, texture e una nota tostata irresistibile ad ogni boccone',
    items: [
      { name: 'Cipolla Crispy croccante' },
      { name: 'Granella di Nocciole' },
      { name: 'Mandorle tostate' },
      { name: 'Nachos artigianali' },
      { name: 'Semi di Girasole e Papavero' },
      { name: 'Scaglie di Cocco' },
    ],
  },
  {
    categoryName: 'Creme & Latticini',
    subtitle: 'Morbidezza e sapidità per avvolgere gli ingredienti con delicatezza',
    items: [
      { name: 'Philadelphia fresco' },
      { name: 'Mozzarelline fresche' },
      { name: 'Scaglie di Grana Padano DOP' },
    ],
  },
  {
    categoryName: 'I Nostri Extra Gourmet (+1,00€)',
    subtitle: 'Ingredienti speciali e tipicità del territorio per un tocco ricercato',
    items: [
      { name: 'Olive Taggiasche liguri', extraPrice: 1, isLocal: true },
      { name: 'Granella di Pistacchio', extraPrice: 1 },
      { name: 'Mango a cubetti fresco', extraPrice: 1 },
      { name: 'Feta greca DOP', extraPrice: 1 },
      { name: 'Cipolla Caramellata', extraPrice: 1 },
    ],
  },
];

interface SauceSubcategory {
  categoryName: string;
  subtitle: string;
  items: Array<{ name: string; spicy?: boolean; extraPrice?: number }>;
}

const POKE_SAUCE_CATEGORIES: SauceSubcategory[] = [
  {
    categoryName: 'Le Classiche & Delicate',
    subtitle: 'Equilibrate e pulite, studiate per rispettare il sapore autentico del pesce',
    items: [
      { name: 'Salsa di Soia classica' },
      { name: 'Olio EVO Riviera Ligure' },
      { name: 'Glassa di Aceto Balsamico' },
      { name: 'Maionese classica' },
      { name: 'Salsa Rosa delicata' },
      { name: 'Salsa allo Yogurt fresco' },
      { name: 'Miele millefiori' },
    ],
  },
  {
    categoryName: 'Esotiche & Fruttate',
    subtitle: 'Armonie agrodolci, agrumate e orientali',
    items: [
      { name: 'Crema di Avocado e lime' },
      { name: 'Salsa Teriyaki giapponese' },
      { name: 'Salsa Agrodolce' },
      { name: 'Spicy Mango agrodolce' },
    ],
  },
  {
    categoryName: 'Note Piccanti & Decise',
    subtitle: 'Sferzate di intensità calibrate per chi ama il gusto vivo',
    items: [
      { name: 'Spicy Mayo artigianale', spicy: true },
      { name: 'Maio Tabasco decisa', spicy: true },
      { name: 'Salsa Agropiccante', spicy: true },
      { name: 'Olio Piccante aromatizzato', spicy: true },
    ],
  },
  {
    categoryName: 'L’Eccellenza del Nostro Territorio',
    subtitle: 'Il profumo inconfondibile della Liguria nella tua poke bowl',
    items: [
      { name: 'Pesto fresco alla Genovese DOP', extraPrice: 1 },
    ],
  },
];


const FRITTI_ITEMS = [
  {
    id: 'cono-calamari',
    name: 'Cono di Calamari',
    price: '€ 12,00',
    description: 'Calamari veraci freschi, tagliati ad anelli e fritti dorati al momento in olio ad alta temperatura.',
    image: '/fritti/cono_calamari.jpg',
    badge: 'I più richiesti',
    highlight: 'Fritti espressi al momento',
  },
  {
    id: 'cono-misto',
    name: 'Cono Misto di Mare',
    price: '€ 10,00',
    description: 'Paranza del giorno selezionata nel Mar Ligure, calamari e gamberi dorati e croccanti serviti nel classico cono.',
    image: '/fritti/cono_misto.jpg',
    badge: 'Classico Ligure',
    highlight: 'Pescato locale e croccantezza',
  },
  {
    id: 'cono-acciughe',
    name: 'Cono di Acciughe del Golfo',
    price: '€ 7,00',
    description: 'Acciughe freschissime del Mar Ligure, aperte a libro a mano, infarinate e fritte dorate come da tradizione.',
    image: '/fritti/cono_acciughe.jpg',
    badge: 'Tradizione Marinara',
    highlight: 'Acciughe fresche del Mar Ligure',
  },
];

export const PokeAndFrittiShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'poke' | 'fritti'>('poke');

  return (
    <section
      id="poke-fritti"
      style={{
        padding: '5.5rem 0',
        backgroundColor: '#07182C',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(201, 162, 39, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(232, 93, 82, 0.08) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>

        {/* Section Header */}
        <div className="section-header" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem auto' }}>
          <div
            className="section-kicker"
            style={{
              backgroundColor: 'rgba(232, 212, 154, 0.12)',
              border: '1px solid rgba(232, 212, 154, 0.28)',
              color: 'var(--color-gold-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <Utensils size={15} />
            <span>Gastronomia di Mare & Asporto · Finale Ligure</span>
          </div>
          <div className="hairline-gold" style={{ margin: '1rem auto' }} />
          <h2 className="section-title" style={{ color: 'white' }}>
            Poke Bowl su Misura & Coni Fritti Espressi
          </h2>
          <p className="section-lede" style={{ color: 'rgba(255, 255, 255, 0.82)' }}>
            Dalla creatività del nostro banco nascono le Poke Bowl personalizzate con pesce freschissimo tagliato al momento
            e i celebri coni fritti di mare dorati e croccanti. Consulta gli ingredienti e ordina al banco o telefonicamente.
          </p>

          {/* Tab Switcher */}
          <div className="poke-showcase-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('poke')}
              className={`poke-showcase-tab${activeTab === 'poke' ? ' poke-showcase-tab--active' : ''}`}
            >
              <Sparkles size={16} />
              <span>Poke Bowl Artigianale</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fritti')}
              className={`poke-showcase-tab${activeTab === 'fritti' ? ' poke-showcase-tab--active' : ''}`}
            >
              <Flame size={16} />
              <span>I Coni Fritti d'Asporto</span>
            </button>
          </div>
        </div>

        {/* TAB 1: POKE BOWL SHOWCASE */}
        {activeTab === 'poke' && (
          <div>
            {/* Top Poke Hero & Formats Card */}
            <div className="poke-hero-card">
              <div className="poke-hero-image-wrap">
                <img
                  src="/poke/poke_bowl.jpg"
                  alt="Poke Bowl Fresca Pescheria Pessano"
                  className="poke-hero-image"
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    backgroundColor: 'rgba(7, 24, 44, 0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(201, 162, 39, 0.4)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.78rem',
                    color: 'var(--color-gold-soft)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Pesce fresco tagliato al momento
                </div>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'var(--color-gold-soft)',
                    fontWeight: 800,
                  }}
                >
                  Formati Disponibili
                </span>
                <h3 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, margin: '0.4rem 0 1rem 0' }}>
                  Componi la Tua Ciotola Ideale
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Scegli il formato, seleziona la base e unisci il pesce freschissimo del nostro banco ai tuoi topping preferiti,
                  con salse artigianali preparate quotidianamente.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {POKE_FORMATS.map((fmt) => (
                    <div
                      key={fmt.name}
                      className="poke-format-item"
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'white' }}>{fmt.name}</strong>
                          {fmt.badge && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(201, 162, 39, 0.22)',
                                border: '1px solid rgba(201, 162, 39, 0.5)',
                                color: 'var(--color-gold-soft)',
                                fontWeight: 700,
                              }}
                            >
                              {fmt.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '0.2rem' }}>
                          {fmt.description}
                        </div>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-gold-soft)' }}>
                        {fmt.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* List of Possible Ingredients (Sequential step-by-step showcase) */}
            <div style={{ marginTop: '3.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-gold-soft)',
                    fontWeight: 800,
                  }}
                >
                  Architettura del Gusto
                </span>
                <h3 className="font-serif" style={{ fontSize: '1.9rem', fontWeight: 700, margin: '0.4rem 0 0.5rem 0', color: 'white' }}>
                  Guida agli Ingredienti della Poke
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.78)', fontSize: '0.94rem', maxWidth: '38rem', margin: '0 auto' }}>
                  Dalla base ai condimenti d'autore: esplora le opzioni fresche del nostro banco preparate ogni mattina a Finale Ligure.
                </p>
              </div>

              {/* SEZIONE 01: LE BASI */}
              <div className="poke-section-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(232, 212, 154, 0.12)',
                      border: '1px solid rgba(232, 212, 154, 0.3)',
                      color: 'var(--color-gold-soft)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    01 / LE BASI
                  </span>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--color-gold-soft)',
                      fontWeight: 600,
                    }}
                  >
                    1 base per Regular · Fino a 2 per XL
                  </span>
                </div>

                <div className="poke-subgrid-bases">
                  {POKE_BASES.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '1.2rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gold-soft)', fontWeight: 700 }}>
                          {b.tagline}
                        </span>
                        <Check size={14} color="var(--color-gold-soft)" />
                      </div>
                      <strong style={{ fontSize: '1.05rem', color: 'white' }}>{b.name}</strong>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.45 }}>
                        {b.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEZIONE 02: LE PROTEINE */}
              <div className="poke-section-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(232, 212, 154, 0.12)',
                      border: '1px solid rgba(232, 212, 154, 0.3)',
                      color: 'var(--color-gold-soft)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    02 / LE PROTEINE DEL BANCO
                  </span>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--color-gold-soft)',
                      fontWeight: 600,
                    }}
                  >
                    1 proteina per Regular · 2 per Regular+ · 3 per XL
                  </span>
                </div>

                <div className="poke-subgrid-proteins">
                  {POKE_PROTEINS.map((p) => (
                    <div
                      key={p.name}
                      style={{
                        padding: '1rem 1.15rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: p.highlight ? '1px solid rgba(232, 212, 154, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <strong style={{ fontSize: '0.98rem', color: 'white', lineHeight: 1.35 }}>{p.name}</strong>
                      {p.extraPrice ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(201, 162, 39, 0.22)',
                            border: '1px solid rgba(201, 162, 39, 0.5)',
                            color: 'var(--color-gold-soft)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          +{p.extraPrice.toFixed(2)}€
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* SEZIONE 03: I TOPPING */}
              <div className="poke-section-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(232, 212, 154, 0.12)',
                      border: '1px solid rgba(232, 212, 154, 0.3)',
                      color: 'var(--color-gold-soft)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    03 / I TOPPING & LE FRESCHEZZE
                  </span>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--color-gold-soft)',
                      fontWeight: 600,
                    }}
                  >
                    3 topping per Regular · 5 topping per XL
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {POKE_TOPPING_CATEGORIES.map((cat, idx) => (
                    <div
                      key={cat.categoryName}
                      style={{
                        padding: '1.35rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: idx === 3 ? 'rgba(201, 162, 39, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: idx === 3 ? '1px solid rgba(201, 162, 39, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div>
                          <h5 style={{ fontSize: '1.02rem', fontWeight: 700, color: idx === 3 ? 'var(--color-gold-soft)' : 'white', margin: 0 }}>
                            {cat.categoryName}
                          </h5>
                          <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', margin: '0.15rem 0 0 0' }}>
                            {cat.subtitle}
                          </p>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.55)', fontWeight: 600 }}>
                          {cat.items.length} opzioni
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                        {cat.items.map((item) => (
                          <span
                            key={item.name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: item.extraPrice ? 'rgba(201, 162, 39, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                              border: item.extraPrice ? '1px solid rgba(201, 162, 39, 0.45)' : '1px solid rgba(255, 255, 255, 0.12)',
                              fontSize: '0.85rem',
                              color: 'rgba(255, 255, 255, 0.95)',
                            }}
                          >
                            <Check size={12} color={item.extraPrice ? 'var(--color-gold-soft)' : 'var(--color-sea-blue)'} style={{ flexShrink: 0 }} />
                            <span>{item.name}</span>
                            {item.extraPrice && (
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-gold-soft)' }}>
                                +{item.extraPrice.toFixed(2)}€
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEZIONE 04: LE SALSE */}
              <div className="poke-section-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(232, 212, 154, 0.12)',
                      border: '1px solid rgba(232, 212, 154, 0.3)',
                      color: 'var(--color-gold-soft)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    04 / LE SALSE ARTIGIANALI
                  </span>

                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--color-gold-soft)',
                      fontWeight: 600,
                    }}
                  >
                    2 salse per Regular · Fino a 4 per XL
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  {POKE_SAUCE_CATEGORIES.map((cat, idx) => (
                    <div
                      key={cat.categoryName}
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: idx === 3 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: idx === 3 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div style={{ marginBottom: '0.85rem' }}>
                        <h5 style={{ fontSize: '0.98rem', fontWeight: 700, color: idx === 3 ? '#86efac' : 'white', margin: 0 }}>
                          {cat.categoryName}
                        </h5>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', margin: '0.15rem 0 0 0' }}>
                          {cat.subtitle}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
                        {cat.items.map((item) => (
                          <span
                            key={item.name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              padding: '0.42rem 0.85rem',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: item.spicy
                                ? 'rgba(239, 68, 68, 0.14)'
                                : item.extraPrice
                                ? 'rgba(201, 162, 39, 0.16)'
                                : 'rgba(255, 255, 255, 0.06)',
                              border: item.spicy
                                ? '1px solid rgba(239, 68, 68, 0.35)'
                                : item.extraPrice
                                ? '1px solid rgba(201, 162, 39, 0.45)'
                                : '1px solid rgba(255, 255, 255, 0.12)',
                              fontSize: '0.85rem',
                              color: 'rgba(255, 255, 255, 0.95)',
                            }}
                          >
                            {item.spicy && <Flame size={13} color="#f87171" style={{ flexShrink: 0 }} />}
                            {!item.spicy && <Check size={12} color="var(--color-gold-soft)" style={{ flexShrink: 0 }} />}
                            <span>{item.name}</span>
                            {item.extraPrice && (
                              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-gold-soft)' }}>
                                +{item.extraPrice.toFixed(2)}€
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Sesamo Footnote Bar */}
                  <div
                    style={{
                      padding: '1.1rem 1.35rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(232, 212, 154, 0.08)',
                      border: '1px dashed rgba(232, 212, 154, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <Sparkles size={18} color="var(--color-gold-soft)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--color-gold-soft)' }}>Tocco finale: Semi di Sesamo Tostato</strong> — Sempre disponibili su richiesta: aggiungiamo una spolverata di sesamo tostato per completare il sapore e l’estetica della tua poke bowl.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Poke Call to action banner */}
            <div className="poke-cta-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(232, 93, 82, 0.2)',
                    border: '1px solid rgba(232, 93, 82, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={22} color="var(--color-coral)" />
                </div>
                <div>
                  <h4 className="font-serif" style={{ fontSize: '1.12rem', fontWeight: 700, margin: 0, color: 'white' }}>
                    Vuoi prenotare la tua Poke personalizzata?
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.78)' }}>
                    Chiamaci al mattino per indicare i tuoi ingredienti preferiti: la troverai pronta e freschissima al tuo arrivo.
                  </p>
                </div>
              </div>

              <a
                href={FEATURES.PHONE_TEL}
                className="btn btn-coral"
                style={{
                  padding: '0.75rem 1.45rem',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
              >
                <Phone size={16} />
                <span>Chiama {FEATURES.PHONE_NUMBER}</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: CONI FRITTI SHOWCASE */}
        {activeTab === 'fritti' && (
          <div>
            <div className="fritti-grid">
              {FRITTI_ITEMS.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(16, 44, 76, 0.65)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
                    transition: 'transform 0.25s ease, border-color 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(201, 162, 39, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.9rem',
                        left: '0.9rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(7, 24, 44, 0.88)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(201, 162, 39, 0.4)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--color-gold-soft)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.badge}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.9rem',
                        right: '0.9rem',
                        padding: '0.35rem 0.9rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--color-coral)',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      {item.price}
                    </div>
                  </div>

                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 className="font-serif" style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>
                      {item.name}
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                      {item.description}
                    </p>

                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '0.95rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        color: 'var(--color-gold-soft)',
                        fontWeight: 600,
                      }}
                    >
                      <span>{item.highlight}</span>
                      <span style={{ color: 'white', opacity: 0.7 }}>Asporto espresso</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fritti Callout */}
            <div className="poke-cta-card">
              <div style={{ maxWidth: '620px' }}>
                <h4 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.3rem 0', color: 'white' }}>
                  Fritti sempre espressi: caldi e croccanti al momento
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.55 }}>
                  Per garantire la tipica fragranza del pescato ligure, friggiamo solo all'ordine. Puoi inviarci un messaggio WhatsApp al{' '}
                  <strong style={{ color: 'var(--color-gold-soft)' }}>{FEATURES.WHATSAPP_DISPLAY}</strong> pochi minuti prima del tuo arrivo per trovarli caldi e fumanti senza attendere!
                </p>
              </div>

              <a
                href={`https://wa.me/${FEATURES.WHATSAPP_NUMBER}?text=${encodeURIComponent('Ciao Pescheria Pessano, vorrei prenotare dei coni fritti d\'asporto:')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                style={{
                  padding: '0.8rem 1.6rem',
                  fontSize: '0.92rem',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
              >
                <MessageCircle size={16} />
                <span>Prenota su WhatsApp ({FEATURES.WHATSAPP_DISPLAY})</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
