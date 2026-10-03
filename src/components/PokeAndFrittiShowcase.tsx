import React, { useState } from 'react';
import { Sparkles, Phone, ShieldCheck, Flame, Utensils, Check } from 'lucide-react';
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

const INGREDIENT_GROUPS = [
  {
    title: 'Le Basi',
    subtitle: 'Scegli la base fresca',
    items: ['Riso Bianco per sushi', 'Riso Venere integrale', 'Insalata mista fresca', 'Metà Riso e Metà Insalata'],
  },
  {
    title: 'Le Proteine del Banco',
    subtitle: 'Pesce freschissimo e opzioni selezionate',
    items: [
      'Salmone Norvegese Crudo',
      'Salmone Scottato alla fiamma',
      'Tonno Rosso Crudo',
      'Tonno Scottato alla fiamma',
      'Gambero Cotto del Mediterraneo',
      'Polpo Verace cotto a vapore',
      'Gambero dorato in Tempura',
      'Salmone in Tempura croccante',
      'Tonno in Tempura',
      'Pollo Grigliato alle erbe',
      'Tofu naturale',
    ],
  },
  {
    title: 'Topping & Ingredienti Freschi',
    subtitle: 'Verdure, semi, frutta esotica e croccantezza',
    items: [
      'Avocado fresco a fette',
      'Alghe Wakame marinate',
      'Edamame al vapore',
      'Pomodorini Datterini',
      'Cetrioli a rondelle',
      'Carote a julienne',
      'Cipolla Crispy croccante',
      'Cipolla Rossa di Tropea',
      'Cipolla Caramellata',
      'Mais dolce',
      'Mandorle tostate',
      'Granella di Nocciole',
      'Granella di Pistacchio',
      'Nachos artigianali',
      'Philadelphia',
      'Mozzarelline fresche',
      'Scaglie di Grana Padano',
      'Scaglie di Cocco',
      'Semi di Girasole e Papavero',
      'Olive Taggiasche liguri',
      'Mango a cubetti',
      'Feta greca DOP',
      'Zenzero rosa marinato',
      'Zucchine trifolate',
    ],
  },
  {
    title: 'Salse Artigianali',
    subtitle: 'Per esaltare ogni combinazione di sapore',
    items: [
      'Salsa di Soia classica',
      'Glassa di Aceto Balsamico',
      'Crema di Avocado e lime',
      'Salsa Teriyaki giapponese',
      'Maionese classica',
      'Spicy Mayo piccante',
      'Maio Tabasco decisa',
      'Salsa Rosa delicata',
      'Salsa allo Yogurt fresco',
      'Spicy Mango agrodolce',
      'Pesto fresco alla Genovese',
      'Olio EVO ligure & Olio piccante',
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
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem',
              marginTop: '1.75rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              gap: '0.35rem',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('poke')}
              style={{
                padding: '0.65rem 1.45rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                backgroundColor: activeTab === 'poke' ? 'var(--color-coral)' : 'transparent',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Sparkles size={16} />
              <span>Poke Bowl Artigianale</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fritti')}
              style={{
                padding: '0.65rem 1.45rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                backgroundColor: activeTab === 'fritti' ? 'var(--color-coral)' : 'transparent',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                alignItems: 'center',
                backgroundColor: 'rgba(16, 44, 76, 0.65)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(232, 212, 154, 0.25)',
                padding: '2rem',
                backdropFilter: 'blur(10px)',
                marginBottom: '2.5rem',
              }}
            >
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <img
                  src="/poke/poke_bowl.jpg"
                  alt="Poke Bowl Fresca Pescheria Pessano"
                  style={{
                    width: '100%',
                    height: '340px',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: 'var(--radius-md)',
                  }}
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
                      style={{
                        padding: '1rem 1.15rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
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

            {/* List of Possible Ingredients (Non-clickable visual catalogue) */}
            <div style={{ marginTop: '3rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 className="font-serif" style={{ fontSize: '1.65rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Tutti gli Ingredienti Disponibili
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem' }}>
                  Una vasta selezione di ingredienti sempre freschi, preparati al mattino per offrirti qualità e gusto autentico.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {INGREDIENT_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    style={{
                      padding: '1.4rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(11, 37, 69, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
                      <h4 className="font-serif" style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--color-gold-soft)', margin: 0 }}>
                        {group.title}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', margin: '0.2rem 0 0 0' }}>
                        {group.subtitle}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {group.items.map((item) => (
                        <span
                          key={item}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                            border: '1px solid rgba(255, 255, 255, 0.14)',
                            fontSize: '0.82rem',
                            color: 'rgba(255, 255, 255, 0.92)',
                            cursor: 'default',
                            userSelect: 'none',
                          }}
                        >
                          <Check size={12} color="var(--color-gold-soft)" style={{ flexShrink: 0 }} />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Poke Call to action banner */}
            <div
              style={{
                marginTop: '3rem',
                padding: '1.4rem 1.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 44, 76, 0.85)',
                border: '1px solid rgba(232, 212, 154, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                gap: '2rem',
              }}
            >
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
            <div
              style={{
                marginTop: '3rem',
                padding: '1.5rem 2rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(16, 44, 76, 0.85)',
                border: '1px solid rgba(232, 212, 154, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div style={{ maxWidth: '620px' }}>
                <h4 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.3rem 0', color: 'white' }}>
                  Fritti sempre espressi: caldi e croccanti al momento
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.82)', lineHeight: 1.55 }}>
                  Per garantire la tipica fragranza del pescato ligure, friggiamo solo all'ordine. Puoi chiamarci al{' '}
                  <strong style={{ color: 'var(--color-gold-soft)' }}>019 692623</strong> pochi minuti prima del tuo arrivo per trovarli caldi e fumanti senza attendere!
                </p>
              </div>

              <a
                href={FEATURES.PHONE_TEL}
                className="btn btn-coral"
                style={{
                  padding: '0.8rem 1.6rem',
                  fontSize: '0.92rem',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
              >
                <Phone size={16} />
                <span>Chiama 019 692623</span>
              </a>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
