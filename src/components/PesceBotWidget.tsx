import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { getStoreStatus } from '../utils/openingHours';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

interface PesceBotWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const PesceBotWidget: React.FC<PesceBotWidgetProps> = ({ isOpen, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Ciao! 👋 Sono PesceBot, l\'esperto digitale della Pescheria Pessano di Finale Ligure. Vuoi sapere qual è il pesce più fresco di oggi, verificare gli orari di consegna o cercare una ricetta ligure?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate Bot Intelligence Response
    setTimeout(() => {
      const botResponseText = generateBotAnswer(userText);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  const generateBotAnswer = (query: string): string => {
    const q = query.toLowerCase();
    const status = getStoreStatus();

    if (q.includes('orari') || q.includes('aperto') || q.includes('chiuso') || q.includes('apertura')) {
      return `📅 Orari Pescheria Pessano:\n• Martedì - Giovedì: 08:30 – 14:30\n• Venerdì & Sabato: 08:30 – 14:45 e 17:45 – 20:30\n• Domenica: 09:00 – 14:45 e 17:45 – 20:30\n• Lunedì: Chiuso.\n\nStato Attuale: ${status.message} (${status.nextEventText}).`;
    }

    if (q.includes('consegna') || q.includes('domicilio') || q.includes('spedizione') || q.includes('portate')) {
      return `🚚 Consegniamo a domicilio a Finale Ligure (Marina, Pia, Borgo), Varigotti, Borgio Verezzi, Pietra Ligure e Calice Ligure!\n\nI pesci arrivano in box isotermici refrigerati. Consegna gratuita a Finale Ligure per ordini superiori a € 30! Puoi ordinare via WhatsApp al numero 019 692623.`;
    }

    if (q.includes('fresco') || q.includes('pescato') || q.includes('oggi') || q.includes('orate') || q.includes('spigole')) {
      return `🐟 Oggi la nostra flotta ligure ha portato splendide Orate Nostrane di Mare (€34/kg), Spigole Selvaggio del Golfo (€36/kg) e imperdibili Gamberi Rossi di Sanremo (€48/kg). Tutto pulito e sfilettato gratis per te!`;
    }

    if (q.includes('cappon magro') || q.includes('gastronomia') || q.includes('fritto')) {
      return `🍤 La nostra Gastronomia Pronta vanta il celebre Cappon Magro Tradizionale Ligure con aragosta, pesce bianco e salsa verde artigianale (€28 a porzione) e il Fritto Misto croccante (€18 a porzione). Pronti subito da gustare!`;
    }

    if (q.includes('vino') || q.includes('ricetta') || q.includes('abbinamento') || q.includes('cucinare')) {
      return `🍷 Per i pesci al forno (Orata o Spigola) ti consiglio vivamente un Pigato della Riviera Ligure di Ponente DOC! Se scegli il Fritto Misto o le Acciughe, prova la Lumassina Frizzante delle colline savonesi!`;
    }

    if (q.includes('dove') || q.includes('indirizzo') || q.includes('trovate') || q.includes('telefono')) {
      return `📍 Ci trovi a Finale Ligure in Via Avvocato Emanuele Rossi, 17 (17024 SV).\nTelefono: 019 692623.\nValutazione clienti: 4.4 su 5 stelle con 197 recensioni Google!`;
    }

    return `Grazie per la domanda! Alla Pescheria Pessano selezioniamo solo il miglior pesce fresco del Mar Ligure e piatti di gastronomia pronti. Puoi contattarci direttamente via telefono allo 019 692623 o scriverci su WhatsApp per ordinare subito!`;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.9rem 1.4rem',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-ocean-dark)',
          color: 'white',
          border: '2px solid var(--color-sea-blue)',
          boxShadow: '0 10px 30px rgba(11, 37, 69, 0.4), var(--shadow-glow)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label="Apri PesceBot Chatbot"
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bot size={24} color="var(--color-coral)" />
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
            }}
          />
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>PesceBot</span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '5.5rem',
            right: '2rem',
            width: '90vw',
            maxWidth: '390px',
            height: '520px',
            zIndex: 1600,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'white',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(11, 37, 69, 0.15)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--color-ocean-dark)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(141, 169, 196, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={20} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>
                  PesceBot - Pessano
                </div>
                <div style={{ fontSize: '0.75rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }}></span>
                  Esperto Locale Attivo
                </div>
              </div>
            </div>

            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--color-ice-blue)',
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                    backgroundColor: msg.sender === 'user' ? 'var(--color-ocean-dark)' : 'white',
                    color: msg.sender === 'user' ? 'white' : 'var(--color-text-dark)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '0.25rem',
                    textAlign: msg.sender === 'user' ? 'right' : 'left',
                  }}
                >
                  {msg.timestamp}
                </div>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.75rem 1rem',
                  borderRadius: '18px 18px 18px 2px',
                  backgroundColor: 'white',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={14} color="var(--color-coral)" />
                <span>PesceBot sta scrivendo...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: '0.65rem 1rem',
              backgroundColor: 'white',
              borderTop: '1px solid rgba(11, 37, 69, 0.08)',
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <button
              onClick={() => handleSend('Qual è il pesce più fresco di oggi?')}
              style={quickPromptStyle}
            >
              🐟 Pescato Oggi
            </button>
            <button
              onClick={() => handleSend('Quali sono gli orari di apertura e chiusura?')}
              style={quickPromptStyle}
            >
              📅 Orari Shop
            </button>
            <button
              onClick={() => handleSend('Come funziona la consegna a domicilio?')}
              style={quickPromptStyle}
            >
              🚚 Consegna
            </button>
            <button
              onClick={() => handleSend('Consigliami un abbinamento con il vino ligure')}
              style={quickPromptStyle}
            >
              🍷 Vino & Ricetta
            </button>
          </div>

          {/* Text Input Area */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'white',
              borderTop: '1px solid rgba(11, 37, 69, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Scrivi a PesceBot..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(11, 37, 69, 0.15)',
                outline: 'none',
                fontSize: '0.875rem',
              }}
            />

            <button
              onClick={() => handleSend(inputValue)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-coral)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Invia messaggio"
            >
              <Send size={18} />
            </button>
          </div>

        </div>
      )}
    </>
  );
};

const quickPromptStyle: React.CSSProperties = {
  padding: '0.35rem 0.75rem',
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--color-ice-blue)',
  border: '1px solid rgba(11, 37, 69, 0.1)',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-ocean-dark)',
  cursor: 'pointer',
};
