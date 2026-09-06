import React from 'react';
import { MapPin, Phone, Clock, Star, MessageCircle, Anchor } from 'lucide-react';
import { WEEKLY_SCHEDULE, getStoreStatus } from '../utils/openingHours';
import { GoogleMapEmbed } from './GoogleMapEmbed';
import { MAPS_EMBED_URL, MAPS_EXTERNAL_URL } from '../constants/cookieConsent';

export const FooterAndHours: React.FC = () => {
  const currentStatus = getStoreStatus();
  const currentDayIndex = new Date().getDay();

  return (
    <footer
      id="orari"
      style={{
        backgroundColor: 'var(--color-ocean-dark)',
        color: 'white',
        paddingTop: '5rem',
        paddingBottom: '2rem',
        borderTop: '1px solid rgba(141, 169, 196, 0.2)',
      }}
    >
      <div className="container">
        
        {/* Main Grid: Hours Table, Contact Info & Map */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            marginBottom: '4rem',
          }}
        >
          {/* Column 1: Timetable Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Clock color="var(--color-sea-blue)" size={24} />
              <h3 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
                Orari di Apertura Completi
              </h3>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Gli orari possono subire variazioni durante le festività. Chiamaci per conferme sullo stato del mare e pescato del giorno.
            </p>

            {/* Weekly Timetable Table */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {WEEKLY_SCHEDULE.map((item) => {
                const isToday = item.dayIndex === currentDayIndex;

                return (
                  <div
                    key={item.dayName}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: isToday ? 'rgba(141, 169, 196, 0.2)' : 'transparent',
                      borderLeft: isToday ? '4px solid var(--color-coral)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: isToday ? 800 : 600, fontSize: '0.95rem', color: isToday ? 'white' : 'rgba(255,255,255,0.9)' }}>
                        {item.dayName}
                      </span>
                      {isToday && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            backgroundColor: 'var(--color-coral)',
                            color: 'white',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 700,
                          }}
                        >
                          OGGI
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: isToday ? 700 : 500 }}>
                      {item.isClosedAllDay ? (
                        <span style={{ color: '#EF4444', fontWeight: 700 }}>Chiuso</span>
                      ) : (
                        <span style={{ color: 'var(--color-sea-blue)' }}>
                          {item.slots.map((s) => `${s.open} – ${s.close}`).join('  |  ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Status Pill */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: currentStatus.isOpen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: currentStatus.isOpen ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: currentStatus.isOpen ? '#22C55E' : '#EF4444',
                  }}
                />
                <strong style={{ color: currentStatus.isOpen ? '#22C55E' : '#EF4444' }}>
                  {currentStatus.message}
                </strong>
              </div>
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                {currentStatus.nextEventText}
              </span>
            </div>

          </div>

          {/* Column 2: Address, Map & Contact */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <MapPin color="var(--color-sea-blue)" size={24} />
              <h3 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
                Dove Siamo & Contatti
              </h3>
            </div>

            <div style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'white' }}>
                Pescheria Pessano
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                Via Avvocato Emanuele Rossi, 17
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
                17024 Finale Ligure (SV) - Italia
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <a
                href="tel:019692623"
                className="btn btn-outline-light"
                style={{ justifyContent: 'flex-start', padding: '0.75rem 1.25rem' }}
              >
                <Phone size={18} color="var(--color-sea-blue)" />
                <span>Telefono Negozio: 019 692623</span>
              </a>

              <a
                href="https://wa.me/39019692623"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-coral"
                style={{ justifyContent: 'flex-start', padding: '0.75rem 1.25rem' }}
              >
                <MessageCircle size={18} />
                <span>WhatsApp Ordini: 019 692623</span>
              </a>
            </div>

            <GoogleMapEmbed embedUrl={MAPS_EMBED_URL} externalMapsUrl={MAPS_EXTERNAL_URL} />

          </div>

          {/* Column 3: Google Reviews & Local Excellence */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <Star color="var(--color-gold)" size={24} />
              <h3 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
                Recensioni Clienti
              </h3>
            </div>

            {/* Google Score Badge */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(229, 186, 66, 0.3)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-gold)', lineHeight: 1 }}>
                  4.4
                </div>
                <div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="#FBBF24" color="#FBBF24" />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                    Basato su <strong>197 recensioni Google</strong>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-sea-blue)', fontWeight: 600 }}>
                🏆 Pescheria e Gastronomia Storica di Finale Ligure
              </div>
            </div>

            {/* Customer Review Quote Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderLeft: '3px solid var(--color-coral)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                "Fritto misto e acciughe fritte buonissime. La numero uno per me. Prezzi modici e soprattutto qualità e pesce fresco."
                <div style={{ fontSize: '0.775rem', color: 'var(--color-sea-blue)', marginTop: '0.4rem', fontWeight: 600 }}>
                  — Daniele F. (Recensione Google)
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderLeft: '3px solid var(--color-sea-blue)',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                "Abbiamo mangiato frittura di pesce e un poke semplicemente deliziosi! Croccante al punto giusto, leggero e per nulla unto, si sentiva tutta la freschezza del pesce. Porzioni abbondanti e servizio cortese e veloce. Si vede che qui il pesce è una cosa seria! Ottimo rapporto qualità-prezzo. Torneremo sicuramente, consigliatissimo!"
                <div style={{ fontSize: '0.775rem', color: 'var(--color-sea-blue)', marginTop: '0.4rem', fontWeight: 600 }}>
                  — Dalal E. (Recensione Google)
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Sub-Footer Copyright */}
        <div
          style={{
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Anchor size={16} color="var(--color-sea-blue)" />
            <span>© {new Date().getFullYear()} Pescheria Pessano - Finale Ligure (SV). Tutti i diritti riservati.</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>P.IVA 019692623</span>
            <span>Privacy Policy</span>
            <span>Cookie Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
