import React, { useState } from 'react';
import { Wine, ChefHat, Truck, CheckCircle2, Sparkles, MessageCircle } from 'lucide-react';

export const AiAgentsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sommelier' | 'delivery'>('sommelier');

  // Sommelier State
  const [selectedFish, setSelectedFish] = useState('Orata Nostrana');
  const [cookingType, setCookingType] = useState('Al Forno con Patate e Olive');
  const [pairingResult, setPairingResult] = useState<any>(null);

  // Delivery State
  const [selectedCity, setSelectedCity] = useState('Finale Ligure (17024)');
  const [deliverySlot, setDeliverySlot] = useState('Fascia Serale (18:30 - 20:15)');
  const [deliveryResult, setDeliveryResult] = useState<any>(null);

  const handleGenerateSommelier = () => {
    let wine = '';
    let notes = '';
    let chefSecret = '';

    if (selectedFish.includes('Orata') || selectedFish.includes('Spigola')) {
      wine = 'Pigato della Riviera Ligure di Ponente DOC';
      notes = 'Vino bianco ligure di gran corpo, dal colore giallo paglierino con sfumature dorate. Al naso regala profumi di macchia mediterranea, pino marittimo e pesca gialla. Perfetta sapidità marittima.';
      chefSecret = 'Aggiungere al fondo di cottura mezzo bicchiere di Pigato e olive taggiasche snocciolate. Cuocere a 180°C per 25 minuti max per mantenere la carne morbidissima.';
    } else if (selectedFish.includes('Gamberi')) {
      wine = 'Vermentino della Riviera Ligure di Ponente DOC';
      notes = 'Freschissimo, minerale e fruttato, pulisce perfettamente il palato dal gusto dolce e intenso dei Gamberi Rossi di Sanremo.';
      chefSecret = 'Se serviti crudi in tartare, aggiungere solo sale grigio di Guérande, un goccio di limone nostrano e olio EVPO ligure monocultivar Taggiasca.';
    } else if (selectedFish.includes('Fritto') || selectedFish.includes('Acciughe')) {
      wine = 'Lumassina Frizzante IGT Colline Savonesi';
      notes = 'Vino autoctono savonese leggermente mosso, con spiccata acidità e freschezza agraria che sgrassa magnificamente la fragranza del fritto.';
      chefSecret = 'Friggere le acciughe e i calamari in abbondante olio a 180°C per non più di 2 minuti. Salare solo immediatamente prima di servire in tavola.';
    } else {
      wine = 'Ciliegiolo Vinificato in Bianco o Vermentino';
      notes = 'Un abbinamento raffinato, capace di bilanciare la struttura complessa delle verdure e la ricchezza del pesce bollito ligure.';
      chefSecret = 'Servire il Cappon Magro a temperatura ambiente (non freddo di frigo) per esaltare la balsamicità della salsa verde artigianale.';
    }

    setPairingResult({
      wine,
      notes,
      chefSecret,
      fish: selectedFish,
      prep: cookingType,
    });
  };

  const handleCheckDelivery = () => {
    let fee = 'GRATUITA (per ordini > € 40,00)';
    let minOrder = '€ 25,00';
    let timeWindow = 'Consegna garantita in 45-60 minuti';
    let zoneAvailable = true;

    if (selectedCity.includes('Finale Ligure')) {
      fee = 'GRATUITA (per ordini > € 30,00)';
      minOrder = '€ 20,00';
      timeWindow = '30 - 45 minuti';
    } else if (selectedCity.includes('Varigotti') || selectedCity.includes('Borgio')) {
      fee = '€ 3,00 (Gratuita sopra € 45,00)';
      minOrder = '€ 25,00';
      timeWindow = '40 - 50 minuti';
    } else if (selectedCity.includes('Pietra Ligure')) {
      fee = '€ 4,00 (Gratuita sopra € 55,00)';
      minOrder = '€ 30,00';
      timeWindow = '45 - 60 minuti';
    }

    setDeliveryResult({
      city: selectedCity,
      slot: deliverySlot,
      fee,
      minOrder,
      timeWindow,
      zoneAvailable,
    });
  };

  return (
    <section
      id="ai-intelligence"
      style={{
        padding: '5rem 0',
        background: 'linear-gradient(180deg, #0B2545 0%, #134074 100%)',
        color: 'white',
      }}
    >
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 107, 107, 0.15)',
              color: 'var(--color-coral)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '1rem',
              border: '1px solid rgba(255, 107, 107, 0.3)',
            }}
          >
            <Sparkles size={16} />
            <span>AI Intelligence Pessano</span>
          </div>

          <h2
            className="font-serif heading-gradient"
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 3rem)',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            Assistenza Intelligente & Abbinamenti Gourmet
          </h2>

          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.05rem' }}>
            Sfrutta le schede intelligenti per scoprire il vino ligure ideale per il tuo pesce fresco e verificare la disponibilità della consegna a domicilio.
          </p>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setActiveTab('sommelier')}
            style={{
              padding: '0.9rem 1.8rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              transition: 'all 0.3s ease',
              border: activeTab === 'sommelier' ? '2px solid var(--color-coral)' : '1px solid rgba(255,255,255,0.2)',
              backgroundColor: activeTab === 'sommelier' ? 'var(--color-coral)' : 'rgba(255,255,255,0.08)',
              color: 'white',
              boxShadow: activeTab === 'sommelier' ? '0 8px 20px rgba(255,107,107,0.35)' : 'none',
            }}
          >
            <Wine size={20} />
            <span>Sommelier del Pesce & Ricette</span>
          </button>

          <button
            onClick={() => setActiveTab('delivery')}
            style={{
              padding: '0.9rem 1.8rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              transition: 'all 0.3s ease',
              border: activeTab === 'delivery' ? '2px solid var(--color-sea-blue)' : '1px solid rgba(255,255,255,0.2)',
              backgroundColor: activeTab === 'delivery' ? 'var(--color-sea-blue)' : 'rgba(255,255,255,0.08)',
              color: activeTab === 'delivery' ? 'var(--color-ocean-dark)' : 'white',
              boxShadow: activeTab === 'delivery' ? '0 8px 20px rgba(141,169,196,0.35)' : 'none',
            }}
          >
            <Truck size={20} />
            <span>Assistente Ordini & Consegne</span>
          </button>
        </div>

        {/* Tab 1: Sommelier del Pesce */}
        {activeTab === 'sommelier' && (
          <div
            className="glass-panel-dark"
            style={{
              padding: '2.5rem',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem',
              }}
            >
              {/* Select Fish */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--color-sea-blue)' }}>
                  1. Scegli il Pesce o la Gastronomia:
                </label>
                <select
                  value={selectedFish}
                  onChange={(e) => setSelectedFish(e.target.value)}
                  style={selectInputStyle}
                >
                  <option value="Orata Nostrana">Orata Nostrana di Mare</option>
                  <option value="Spigola Selvaggia">Spigola Selvaggia del Golfo</option>
                  <option value="Gamberi Rossi di Sanremo">Gamberi Rossi di Sanremo Premium</option>
                  <option value="Fritto Misto alla Ligure">Fritto Misto di Pesce e Calamari</option>
                  <option value="Cappon Magro Tradizionale">Cappon Magro Ligure</option>
                  <option value="Acciughe Impanate">Acciughe Impanate del Golfo</option>
                </select>
              </div>

              {/* Select Preparation */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--color-sea-blue)' }}>
                  2. Tipo di Cottura / Preparazione:
                </label>
                <select
                  value={cookingType}
                  onChange={(e) => setCookingType(e.target.value)}
                  style={selectInputStyle}
                >
                  <option value="Al Forno con Patate e Olive">Al Forno con Patate novelle & Olive Taggiasche</option>
                  <option value="In Crosta di Sale Grosso">In Crosta di Sale Grosso ed Erbe Liguri</option>
                  <option value="Alla Griglia / Piastra">Alla Griglia con Salmoriglio d'Olio EVPO</option>
                  <option value="Crudo / Tartare Marinata">Crudo / Tartare marinata al Limone</option>
                  <option value="Pronto da Mangiare (Gastronomia)">Pronto da Mangiare (Temperatura Ambiente)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateSommelier}
              className="btn btn-coral"
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: 700 }}
            >
              <ChefHat size={22} />
              <span>Genera Consiglio Sommelier & Segreto dello Chef</span>
            </button>

            {/* Sommelier Result */}
            {pairingResult && (
              <div
                style={{
                  marginTop: '2.5rem',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(229, 186, 66, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Wine color="var(--color-gold)" size={24} />
                  <h4 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--color-gold)', margin: 0 }}>
                    Abbinamento Perfetto: {pairingResult.wine}
                  </h4>
                </div>

                <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  {pairingResult.notes}
                </p>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(141, 169, 196, 0.12)',
                    borderLeft: '4px solid var(--color-sea-blue)',
                    display: 'flex',
                    gap: '0.85rem',
                  }}
                >
                  <ChefHat color="var(--color-sea-blue)" size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-sea-blue)', fontSize: '0.9rem' }}>
                      Segreto dello Chef Pessano per {pairingResult.fish}:
                    </div>
                    <div style={{ fontSize: '0.925rem', color: 'white', marginTop: '0.25rem' }}>
                      {pairingResult.chefSecret}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Assistente Ordini & Consegne */}
        {activeTab === 'delivery' && (
          <div
            className="glass-panel-dark"
            style={{
              padding: '2.5rem',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem',
              }}
            >
              {/* Select City */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--color-sea-blue)' }}>
                  1. Seleziona il tuo Comune / Località:
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={selectInputStyle}
                >
                  <option value="Finale Ligure (17024)">Finale Ligure (Centro, Marina, Borgo) - 17024</option>
                  <option value="Varigotti (17024)">Varigotti - 17024</option>
                  <option value="Borgio Verezzi (17028)">Borgio Verezzi - 17028</option>
                  <option value="Pietra Ligure (17027)">Pietra Ligure - 17027</option>
                  <option value="Calice Ligure (17020)">Calice Ligure - 17020</option>
                </select>
              </div>

              {/* Select Delivery Slot */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--color-sea-blue)' }}>
                  2. Fascia Oraria di Consegna Preferita:
                </label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  style={selectInputStyle}
                >
                  <option value="Fascia Mattino (11:30 - 13:30)">Mattina: 11:30 – 13:30</option>
                  <option value="Fascia Serale (18:30 - 20:15)">Sera: 18:30 – 20:15 (Ven/Sab/Dom)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCheckDelivery}
              className="btn btn-ocean"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                backgroundColor: 'var(--color-sea-blue)',
                color: 'var(--color-ocean-dark)',
              }}
            >
              <Truck size={22} />
              <span>Verifica Copertura & Orari di Spedizione</span>
            </button>

            {/* Delivery Result */}
            {deliveryResult && (
              <div
                style={{
                  marginTop: '2.5rem',
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <CheckCircle2 color="#22C55E" size={26} />
                  <div>
                    <h4 className="font-serif" style={{ fontSize: '1.3rem', color: '#22C55E', margin: 0 }}>
                      Servizio Attivo per {deliveryResult.city}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                      Fascia selezionata: {deliveryResult.slot}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={resultBoxStyle}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-sea-blue)' }}>Costo Consegna</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{deliveryResult.fee}</div>
                  </div>

                  <div style={resultBoxStyle}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-sea-blue)' }}>Ordine Minimo</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{deliveryResult.minOrder}</div>
                  </div>

                  <div style={resultBoxStyle}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-sea-blue)' }}>Tempo Stimato</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{deliveryResult.timeWindow}</div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/39019692623?text=Ciao%20Pescheria%20Pessano,%20vorrei%20prenotare%20una%20consegna%20a%20domicilio%20per%20${encodeURIComponent(deliveryResult.city)}%20nella%20${encodeURIComponent(deliveryResult.slot)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-coral"
                  style={{ width: '100%', padding: '0.9rem' }}
                >
                  <MessageCircle size={20} />
                  <span>Ordina Subito via WhatsApp per {deliveryResult.city}</span>
                </a>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};

const selectInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem 1rem',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(11, 37, 69, 0.9)',
  border: '1px solid rgba(141, 169, 196, 0.4)',
  color: 'white',
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
};

const resultBoxStyle: React.CSSProperties = {
  padding: '0.85rem',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};
