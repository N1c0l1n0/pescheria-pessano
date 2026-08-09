import React from 'react';
import { Truck, ShieldCheck, ThermometerSnowflake, Clock, MapPin, PhoneCall } from 'lucide-react';

export const DeliveryInfoSection: React.FC = () => {
  return (
    <section
      id="consegna"
      style={{
        padding: '5rem 0',
        backgroundColor: 'white',
        borderTop: '1px solid rgba(11, 37, 69, 0.06)',
        borderBottom: '1px solid rgba(11, 37, 69, 0.06)',
      }}
    >
      <div className="container">
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '3.5rem',
            alignItems: 'center',
          }}
        >
          {/* Left info */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(141, 169, 196, 0.15)',
                color: 'var(--color-ocean-medium)',
                fontWeight: 700,
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <Truck size={16} />
              <span>Servizio Espresso Pescheria Pessano</span>
            </div>

            <h2
              className="font-serif heading-dark-gradient"
              style={{
                fontSize: 'clamp(2.2rem, 3.5vw, 3rem)',
                fontWeight: 800,
                marginBottom: '1.25rem',
                lineHeight: 1.25,
              }}
            >
              Il Pesce Fresco del Golfo, Consegnato Direttamente a Casa Tua
            </h2>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Vuoi gustare la cena senza fare la coda o desideri pesce già pulito e sfilettato pronto da cucinare? Il nostro servizio di consegna a domicilio opera tutti i giorni di apertura su tutto il territorio di Finale Ligure e comuni limitrofi.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={iconBoxStyle}>
                  <ThermometerSnowflake size={22} color="var(--color-ocean-medium)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ocean-dark)' }}>
                    Box Termici Refrigerati
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Garantiamo la catena del freddo costante con contenitori isotermici e ghiaccio alimentare speciale.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={iconBoxStyle}>
                  <ShieldCheck size={22} color="var(--color-coral)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ocean-dark)' }}>
                    Pesce Pulito e Sfilettato Gratis
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Su richiesta al momento dell'ordine, squamiamo, svisceriamo o sfilettiamo tutto il tuo pesce senza costi aggiuntivi.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={iconBoxStyle}>
                  <Clock size={22} color="var(--color-gold)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-ocean-dark)' }}>
                    Fasce Orarie Puntuali
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Consegne a pranzo (11:30 - 13:30) e a cena nei giorni di apertura serale (18:30 - 20:15).
                  </p>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="https://wa.me/39019692623?text=Ciao%20Pescheria%20Pessano,%20vorrei%20prenotare%20una%20consegna%20a%20domicilio"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-coral"
                style={{ padding: '0.9rem 1.75rem' }}
              >
                <span>Ordina a Domicilio via WhatsApp</span>
              </a>

              <a
                href="tel:019692623"
                className="btn btn-ocean"
                style={{ padding: '0.9rem 1.75rem' }}
              >
                <PhoneCall size={18} />
                <span>Chiama 019 692623</span>
              </a>
            </div>

          </div>

          {/* Right Map/Zones Card */}
          <div
            className="glass-panel"
            style={{
              padding: '2.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-ice-blue)',
              border: '1px solid rgba(11, 37, 69, 0.1)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-ocean-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <MapPin size={28} color="var(--color-sea-blue)" />
              </div>
              <h3 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-ocean-dark)' }}>
                Zone Servite a Domicilio
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Finale Ligure e Riviera Ponente
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={zoneRowStyle}>
                <span>📍 Finale Ligure (Centro, Marina, Pia, Borgo)</span>
                <strong style={{ color: '#15803D' }}>Consegna Gratis &gt; € 30</strong>
              </div>

              <div style={zoneRowStyle}>
                <span>📍 Varigotti (Capo Noli)</span>
                <strong style={{ color: '#15803D' }}>Consegna Gratis &gt; € 45</strong>
              </div>

              <div style={zoneRowStyle}>
                <span>📍 Borgio Verezzi</span>
                <strong style={{ color: '#15803D' }}>Consegna Gratis &gt; € 45</strong>
              </div>

              <div style={zoneRowStyle}>
                <span>📍 Pietra Ligure</span>
                <strong style={{ color: '#15803D' }}>Consegna Gratis &gt; € 55</strong>
              </div>

              <div style={zoneRowStyle}>
                <span>📍 Calice Ligure / Entroterra</span>
                <strong style={{ color: '#15803D' }}>Consegna Gratis &gt; € 55</strong>
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--color-ocean-dark)',
                fontWeight: 600,
              }}
            >
              💡 Ordina entro le ore 11:30 per il pranzo o entro le 18:00 per la cena!
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

const iconBoxStyle: React.CSSProperties = {
  width: '46px',
  height: '46px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--color-ice-blue)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const zoneRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1rem',
  backgroundColor: 'white',
  borderRadius: 'var(--radius-sm)',
  fontSize: '0.875rem',
  fontWeight: 500,
  border: '1px solid rgba(11, 37, 69, 0.05)',
};
