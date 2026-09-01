import React from 'react';
import { Clock, MapPin, Phone, Star } from 'lucide-react';
import { WEEKLY_SCHEDULE, getStoreStatus } from '../utils/openingHours';

export const HoursAndLocation: React.FC = () => {
  const currentStatus = getStoreStatus();
  const currentDayIndex = new Date().getDay();

  return (
    <section
      id="orari"
      style={{
        padding: '5.25rem 0 5.5rem',
        backgroundColor: 'var(--color-cream)',
      }}
    >
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header">
          <div className="section-kicker">Vienici a Trovare</div>
          <div className="hairline-gold" />
          <h2 className="section-title">
            Orari di Apertura e Dove Siamo
          </h2>
          <p className="section-lede">
            Ci trovi nel cuore di Finale Ligure. Consulta gli orari di apertura aggiornati o contattaci telefonicamente.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Column 1: Opening Hours Table */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-sand)',
              border: '1px solid rgba(10, 35, 66, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                    backgroundColor: 'var(--color-ocean-dark)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 1px rgba(201, 162, 39, 0.35)',
                }}
              >
                <Clock size={20} color="var(--color-sea-blue)" />
              </div>
              <div>
                <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--color-ocean-dark)' }}>
                  Orari Settimanali
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Pescheria Pessano - Finale Ligure
                </span>
              </div>
            </div>

            {/* Weekly Timetable Grid */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid rgba(11, 37, 69, 0.08)',
                marginBottom: '1.25rem',
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
                      borderBottom: '1px solid rgba(11, 37, 69, 0.06)',
                      backgroundColor: isToday ? 'rgba(232, 93, 82, 0.08)' : 'var(--color-cream)',
                      borderLeft: isToday ? '4px solid var(--color-coral)' : '4px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: isToday ? 800 : 600, fontSize: '0.925rem', color: 'var(--color-ocean-dark)' }}>
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

                    <div style={{ fontSize: '0.875rem', fontWeight: isToday ? 700 : 500 }}>
                      {item.isClosedAllDay ? (
                        <span style={{ color: '#EF4444', fontWeight: 700 }}>Chiuso</span>
                      ) : (
                        <span style={{ color: 'var(--color-ocean-medium)' }}>
                          {item.slots.map((s) => `${s.open} – ${s.close}`).join('  |  ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Realtime Status Pill */}
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: currentStatus.isOpen ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
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
                <strong style={{ color: currentStatus.isOpen ? '#15803D' : '#B91C1C', fontSize: '0.95rem' }}>
                  {currentStatus.message}
                </strong>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {currentStatus.nextEventText}
              </span>
            </div>

          </div>

          {/* Column 2: Address, Map & Google Rating */}
          <div id="contatti">
            <div
              className="glass-panel"
              style={{
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-coral)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={20} color="white" />
                </div>
                <div>
                  <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--color-ocean-dark)' }}>
                    Contatti e Posizione
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Finale Ligure (SV)
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-ocean-dark)' }}>
                  Pescheria Pessano
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  Via Avvocato Emanuele Rossi, 17
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  17024 Finale Ligure (SV) - Italia
                </div>
              </div>

              {/* Call CTA */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <a
                  href="tel:019692623"
                  className="btn btn-coral"
                  style={{ flex: 1, padding: '0.85rem 1.25rem', fontSize: '0.95rem' }}
                >
                  <Phone size={18} />
                  <span>Chiama: 019 692623</span>
                </a>
              </div>

              {/* Google Reviews Box */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-sand)',
                  border: '1px solid rgba(10, 35, 66, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-ocean-dark)' }}>
                    4.4
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} fill="#FBBF24" color="#FBBF24" />
                      ))}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                      197 Recensioni Google
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-ocean-medium)' }}>
                  Valutazione Altissima
                </span>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="map-embed">
              <iframe
                title="Mappa Pescheria Pessano Finale Ligure"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2864.578684074211!2d8.3414!3d44.1685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12d31705e608034d%3A0xb35a0cfb2e652d5!2sVia%20Avvocato%20Emanuele%20Rossi%2C%2017%2C%2017024%20Finale%20Ligure%20SV!5e0!3m2!1sit!2sit!4v1700000000000!5m2!1sit!2sit"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
