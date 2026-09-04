import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  Phone,
  Receipt,
  User,
  MessageCircle,
  Calendar,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalOrderById, subscribeToLocalOrders } from '../utils/orderStore';
import { friedArrivalMessage } from '../utils/friedArrival';
import { mapKdsOrderItem } from '../utils/orderMappers';

export interface OrderItem {
  id?: string;
  order_id?: string;
  item_name?: string;
  item_type?: 'poke' | 'fritto' | 'pesce' | string;
  size?: string;
  bases?: string[];
  proteins?: string[];
  toppings?: string[];
  sauces?: string[];
  has_sesame?: boolean;
  notes?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
  // Fallbacks
  name?: string;
  details?: any;
}

export interface Order {
  id: string | number;
  display_id?: string;
  status: 'RICEVUTO' | 'IN_PREPARAZIONE' | 'PRONTO' | string;
  customer_name: string;
  phone?: string;
  order_type: 'Ritiro' | 'Consegna' | string;
  delivery_address?: string;
  total_price: number;
  created_at?: string;
  estimated_time?: string;
  notes?: string;
  order_items?: OrderItem[];
  items?: OrderItem[];
}

interface TrackerSchedule {
  clockHours: string | null;
  clockMinutes: string | null;
  dayLabel: 'Oggi' | 'Domani' | null;
  isAsap: boolean;
  hasTime: boolean;
  remainingNotes: string;
  rawTime: string;
}

const parseTrackerSchedule = (notes?: string): TrackerSchedule => {
  const raw = (notes || '').trim();
  const match = raw.match(/Orario:\s*([^—\n]+)/i);
  const timeText = match?.[1]?.trim() || '';
  const hasTime = Boolean(timeText);

  const remainingNotes = raw
    .replace(/Orario:\s*[^—\n]+/i, '')
    .replace(/^\s*—\s*/, '')
    .replace(/^Note generali:\s*/i, '')
    .trim();

  const isAsap = hasTime && /asap|prima possibile/i.test(timeText);
  const dayMatch = timeText.match(/\((Oggi|Domani)\)/i);
  const dayRaw = dayMatch?.[1];
  const dayLabel: TrackerSchedule['dayLabel'] = dayRaw
    ? (dayRaw.charAt(0).toUpperCase() + dayRaw.slice(1).toLowerCase()) as 'Oggi' | 'Domani'
    : null;

  const clockMatch = timeText.match(/(\d{1,2})[:.](\d{2})/);

  return {
    clockHours: clockMatch ? clockMatch[1].padStart(2, '0') : null,
    clockMinutes: clockMatch ? clockMatch[2] : null,
    dayLabel,
    isAsap,
    hasTime,
    remainingNotes,
    rawTime: timeText.replace(/\s*\((Oggi|Domani)\)/gi, '').trim(),
  };
};

export const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProntoAlertOpen, setIsProntoAlertOpen] = useState<boolean>(false);

  // Trigger sound, vibration & native notification for 'PRONTO' status
  const triggerProntoAlert = useCallback(() => {
    setIsProntoAlertOpen(true);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🎉 La tua Poke è Pronta!', {
          body: 'La tua Poke è PRONTA! Puoi passare al banco di Pescheria Pessano per il ritiro.',
          icon: '/pesce/tonno_pinna_gialla.jpg',
          tag: 'poke_pronta_notification',
        });
      } catch (e) {
        console.warn('Native Notification trigger error:', e);
      }
    }

    // Vibration
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 400]);
      } catch (e) {
        console.warn('Vibration API blocked or unavailable:', e);
      }
    }

    // Audio chime using Web Audio API synth
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        // Play ascending victory arpeggio C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          
          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.38);
        });
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }, []);

  // Fetch initial order details
  const fetchOrder = useCallback(async (isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      // Primary fetch joining orders + order_items
      const numericId = !isNaN(Number(id)) ? Number(id) : id;
      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.eq.${numericId},friendly_id.eq.${id}`)
        .maybeSingle();

      if (!fetchErr && data) {
        const raw = data as any;
        const items = Array.isArray(raw.order_items)
          ? raw.order_items.map((item: Record<string, unknown>) => mapKdsOrderItem(item))
          : [];

        const normalizedOrder: Order = {
          id: String(raw.id),
          display_id: raw.friendly_id || `#${String(raw.id).slice(-4).toUpperCase()}`,
          status: raw.status || 'RICEVUTO',
          customer_name: raw.customer_name || 'Cliente',
          phone: raw.customer_phone || raw.phone || '',
          order_type: raw.order_type || 'Ritiro',
          delivery_address: raw.delivery_address || undefined,
          total_price: Number(raw.total_amount || raw.total_price || 0),
          created_at: raw.created_at || new Date().toISOString(),
          notes: raw.notes || '',
          order_items: items,
        };

        setOrder((prev) => {
          if (prev?.status !== 'PRONTO' && normalizedOrder.status === 'PRONTO') {
            triggerProntoAlert();
          }
          return normalizedOrder;
        });
        return;
      }

      // Local store fallback
      const local = getLocalOrderById(id);
      if (local) {
        const normalizedLocalItems = (local.order_items || (local as any).items || []).map((item) =>
          mapKdsOrderItem(item)
        );

        const normalizedLocal: Order = {
          ...local,
          id: String(local.id),
          display_id: local.display_id || `#${String(local.id).slice(-4).toUpperCase()}`,
          customer_name: local.customer_name || 'Cliente',
          phone: (local as any).customer_phone || local.phone || '',
          total_price: Number((local as any).total_amount || local.total_price || 0),
          order_items: normalizedLocalItems,
        };

        setOrder((prev) => {
          if (prev?.status !== 'PRONTO' && normalizedLocal.status === 'PRONTO') {
            triggerProntoAlert();
          }
          return normalizedLocal;
        });
        return;
      }

      // Fallback demo mock order for testing if ID doesn't exist
      const mockOrder: Order = {
        id: id,
        status: 'IN_PREPARAZIONE',
        customer_name: 'Cliente Pessano',
        phone: '+39 333 1234567',
        order_type: 'Ritiro',
        delivery_address: 'Via Avvocato Emanuele Rossi 17, Finale Ligure',
        total_price: 14.50,
        created_at: new Date().toISOString(),
        estimated_time: '15-20 min',
        order_items: [
          {
            id: 'item-1',
            item_name: 'Poke Regular Pescheria',
            size: 'Regular',
            bases: ['Riso Venere'],
            proteins: ['Salmone Fresco'],
            toppings: ['Avocado', 'Edamame', 'Alghe Wakame'],
            sauces: ['Salsa Ponzu Speciale'],
            has_sesame: true,
            price: 14.50,
            quantity: 1
          }
        ]
      };
      setOrder(mockOrder);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      const local = getLocalOrderById(id);
      if (local) {
        setOrder({
          ...local,
          id: String(local.id),
          display_id: local.display_id || `#${String(local.id).slice(-4).toUpperCase()}`,
          customer_name: local.customer_name || 'Cliente',
          phone: (local as any).customer_phone || local.phone || '',
          total_price: Number((local as any).total_amount || local.total_price || 0),
          order_items: (local.order_items || []).map((item) => mapKdsOrderItem(item)),
        } as Order);
      } else {
        setError(err.message || 'Impossibile recuperare i dettagli dell\'ordine.');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id, triggerProntoAlert]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime Supabase, Auto Polling (5s) & Tab Focus / Visibility Change Listener
  useEffect(() => {
    if (!id) return;

    // 1. Instant silent refetch on tab focus or visibility change (when customer returns to page)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchOrder(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    // 2. Poll every 5 seconds silently in case WebSockets were suspended in background
    const intervalId = setInterval(() => {
      fetchOrder(true);
    }, 5000);

    // 3. Local store listener
    const unsubLocal = subscribeToLocalOrders(() => {
      fetchOrder(true);
    });

    // 4. Supabase Realtime channel listener
    const channel = supabase
      .channel(`order_tracking_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        () => {
          fetchOrder(true);
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      clearInterval(intervalId);
      unsubLocal();
      supabase.removeChannel(channel);
    };
  }, [id, fetchOrder]);

  // Determine active step index (0: RICEVUTO, 1: IN_PREPARAZIONE, 2: PRONTO)
  const getStepIndex = (status: string | undefined): number => {
    if (!status) return 0;
    const norm = status.toUpperCase();
    if (norm === 'PRONTO' || norm === 'COMPLETATO') return 2;
    if (norm === 'IN_PREPARAZIONE' || norm === 'IN PREPARAZIONE' || norm === 'PREPARAZIONE') return 1;
    return 0; // RICEVUTO
  };

  const currentStep = getStepIndex(order?.status);
  const schedule = parseTrackerSchedule(order?.notes);
  const isDelivery = (order?.order_type || '').toLowerCase().includes('consegna');
  const hasScheduledTime = schedule.hasTime;
  const hasFried = (order?.order_items || order?.items || []).some((item) => {
    const itemName = (item.item_name || item.name || '').toLowerCase();
    return item.item_type === 'fritto' || itemName.includes('cono') || itemName.includes('fritt');
  });

  const displayId = order?.display_id || (order?.id ? `#${String(order.id).slice(-4).toUpperCase()}` : (id ? `#${String(id).slice(-4).toUpperCase()}` : '#0000'));

  return (
    <div
      className="tracker-page"
      style={{
        minHeight: '100vh',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* TOP BAR BRAND HEADER */}
      <header
        style={{
          backgroundColor: 'rgba(4, 18, 33, 0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.2)',
          padding: '0.85rem 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'white',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/logo_pescheria.png"
                alt="Pescheria Pessano Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Pescheria Pessano
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gold-soft)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                Finale Ligure (SV)
              </div>
            </div>
          </Link>

          {/* Highlighted Order Badge Matching KDS */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background:
                'linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, rgba(201, 162, 39, 0.12) 100%)',
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid rgba(201, 162, 39, 0.32)',
            }}
          >
            <Receipt size={16} color="#38BDF8" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38BDF8' }}>
              ORDINE {displayId}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="tracker-main-container">
        {/* Back Link */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#8DA9C4',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft size={15} /> Torna al menu principale
          </Link>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div
            className="tracker-card"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <RefreshCw
              size={36}
              color="#38BDF8"
              style={{ animation: 'spin 1.2s linear infinite', marginBottom: '0.85rem' }}
            />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', color: 'white' }}>
              Caricamento stato ordine in corso...
            </h2>
            <p style={{ color: '#8DA9C4', fontSize: '0.85rem' }}>
              Connessione in tempo reale a Pescheria Pessano
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div
            className="tracker-card"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={40} color="#EF4444" style={{ marginBottom: '0.75rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F87171', marginBottom: '0.35rem' }}>
              Ordine non trovato
            </h2>
            <p style={{ color: '#FECACA', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {error}
            </p>
            <button
              onClick={() => fetchOrder()}
              style={{
                backgroundColor: '#134074',
                color: 'white',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Riprova
            </button>
          </div>
        )}

        {/* MAIN ORDER LIVE TRACKING CONTENT */}
        {!loading && !error && order && (
          <div className="tracker-grid-layout">
            
            {/* LEFT COLUMN: REALTIME STATUS, PRONTO ALERT & ASSISTANCE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

              {/* COMPACT & MODERN PRONTO TRIGGER BANNER */}
              {(order.status === 'PRONTO' || isProntoAlertOpen) && (
                <div
                  style={{
                    backgroundColor: '#059669',
                    backgroundImage: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                    borderRadius: '1rem',
                    padding: '1.35rem 1.25rem',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)',
                    border: '2px solid #6EE7B7',
                    animation: 'pulseGlow 2s infinite alternate',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <CheckCircle2 size={26} color="#FFFFFF" />
                  </div>
                  <h2
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 900,
                      margin: '0 0 0.25rem 0',
                      letterSpacing: '-0.01em',
                      textTransform: 'uppercase',
                    }}
                  >
                    🎉 IL TUO ORDINE È PRONTO!
                  </h2>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      margin: '0 0 0.85rem 0',
                      color: '#ECFDF5',
                    }}
                  >
                    Mostra questo schermo al banco per il ritiro immediato
                  </p>
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#FFFFFF',
                      color: '#065F46',
                      padding: '0.45rem 1.25rem',
                      borderRadius: '999px',
                      fontWeight: 900,
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    ORDINE {displayId}
                  </div>
                </div>
              )}

              {/* REALTIME STATUS TRACKER CARD */}
              <div className="tracker-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.15rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#8DA9C4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Stato Ordine in Tempo Reale
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.15rem 0 0 0', color: '#FFFFFF' }}>
                      {currentStep === 0 && '🕒 Preso in carico'}
                      {currentStep === 1 && '👨‍🍳 In preparazione!'}
                      {currentStep === 2 && '✅ Pronto per il ritiro!'}
                    </h2>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38BDF8',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#38BDF8',
                        boxShadow: '0 0 8px #38BDF8',
                        display: 'inline-block',
                      }}
                    />
                    LIVE
                  </div>
                </div>

                {/* 3-PHASE VISUAL PROGRESS BAR */}
                <div style={{ margin: '1.25rem 0 0.5rem 0' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      position: 'relative',
                      gap: '0.35rem',
                    }}
                  >
                    {/* Phase 1: RICEVUTO */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                      <div
                        className="tracker-stepper-circle"
                        style={{
                          backgroundColor: currentStep >= 0 ? '#134074' : 'rgba(255, 255, 255, 0.05)',
                          border: currentStep >= 0 ? '2.5px solid #38BDF8' : '2px solid rgba(255, 255, 255, 0.2)',
                          color: currentStep >= 0 ? '#38BDF8' : '#64748B',
                          boxShadow: currentStep >= 0 ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
                        }}
                      >
                        <Clock size={20} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.825rem', color: currentStep >= 0 ? '#F0F9FF' : '#64748B' }}>
                        RICEVUTO
                      </div>
                      <div style={{ fontSize: '0.7rem', color: currentStep >= 0 ? '#8DA9C4' : '#475569', marginTop: '0.15rem' }}>
                        In coda
                      </div>
                    </div>

                    {/* Phase 2: IN PREPARAZIONE */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                      <div
                        className="tracker-stepper-circle"
                        style={{
                          backgroundColor: currentStep >= 1 ? '#D97706' : 'rgba(255, 255, 255, 0.05)',
                          border: currentStep >= 1 ? '2.5px solid #FBBF24' : '2px solid rgba(255, 255, 255, 0.2)',
                          color: currentStep >= 1 ? '#FBBF24' : '#64748B',
                          boxShadow: currentStep >= 1 ? '0 0 16px rgba(251, 191, 36, 0.45)' : 'none',
                        }}
                      >
                        <ChefHat size={20} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.825rem', color: currentStep >= 1 ? '#F0F9FF' : '#64748B' }}>
                        PREPARAZIONE
                      </div>
                      <div style={{ fontSize: '0.7rem', color: currentStep >= 1 ? '#FCD34D' : '#475569', marginTop: '0.15rem' }}>
                        In lavorazione
                      </div>
                    </div>

                    {/* Phase 3: PRONTO */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                      <div
                        className="tracker-stepper-circle"
                        style={{
                          backgroundColor: currentStep >= 2 ? '#059669' : 'rgba(255, 255, 255, 0.05)',
                          border: currentStep >= 2 ? '2.5px solid #34D399' : '2px solid rgba(255, 255, 255, 0.2)',
                          color: currentStep >= 2 ? '#34D399' : '#64748B',
                          boxShadow: currentStep >= 2 ? '0 0 20px rgba(52, 211, 153, 0.5)' : 'none',
                        }}
                      >
                        <CheckCircle2 size={22} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.825rem', color: currentStep >= 2 ? '#34D399' : '#64748B' }}>
                        PRONTO
                      </div>
                      <div style={{ fontSize: '0.7rem', color: currentStep >= 2 ? '#A7F3D0' : '#475569', marginTop: '0.15rem' }}>
                        Al banco!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PICKUP / DELIVERY TIME — dedicated schedule card, not a note */}
              {hasScheduledTime && (
                <div className={`tracker-schedule ${schedule.isAsap ? 'tracker-schedule--asap' : 'tracker-schedule--timed'}`}>
                  <div className="tracker-schedule-icon" aria-hidden="true">
                    {schedule.isAsap ? <Zap size={24} /> : <Clock size={24} />}
                  </div>
                  <div className="tracker-schedule-body">
                    <div className="tracker-schedule-kicker">
                      <span>
                        {isDelivery ? 'Orario di consegna' : 'Orario di ritiro'}
                      </span>
                      {schedule.dayLabel && (
                        <span className={`tracker-schedule-day tracker-schedule-day--${schedule.dayLabel.toLowerCase()}`}>
                          <Calendar size={11} />
                          {schedule.dayLabel}
                        </span>
                      )}
                    </div>

                    {schedule.isAsap ? (
                      <div className="tracker-schedule-asap-label">Prima possibile</div>
                    ) : schedule.clockHours && schedule.clockMinutes ? (
                      <div className="tracker-schedule-clock" aria-label={`${schedule.clockHours}:${schedule.clockMinutes}`}>
                        <span>{schedule.clockHours}</span>
                        <span className="tracker-schedule-colon">:</span>
                        <span>{schedule.clockMinutes}</span>
                      </div>
                    ) : (
                      <div className="tracker-schedule-asap-label">{schedule.rawTime}</div>
                    )}

                    <div className="tracker-schedule-hint">
                      {schedule.isAsap
                        ? (isDelivery
                          ? 'Partiamo appena l\'ordine è pronto'
                          : 'Passa al banco appena ricevi l\'avviso')
                        : (isDelivery
                          ? 'Consegna prevista a quest\'ora'
                          : 'Presentati al banco a quest\'ora')}
                    </div>
                  </div>
                </div>
              )}

              {hasFried && (
                <div
                  style={{
                    padding: '0.65rem 0.8rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '0.5rem',
                    color: '#FCD34D',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '1.15rem',
                  }}
                >
                  {friedArrivalMessage(order.order_type || 'Ritiro')}
                </div>
              )}

              {/* NEED HELP / WHATSAPP STORE CONTACT */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '0.85rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.9rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F0F9FF' }}>
                    Serve aiuto per il tuo ordine?
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#8DA9C4', marginTop: '0.1rem' }}>
                    Scrivi alla Pescheria specificando l'ordine <strong style={{ color: '#38BDF8' }}>{displayId}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <a
                    href="https://wa.me/393459485857"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: '#25D366',
                      color: '#040E1B',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                    }}
                  >
                    <MessageCircle size={15} color="#040E1B" /> WhatsApp
                  </a>

                  <a
                    href="tel:019692623"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#8DA9C4',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.775rem',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <Phone size={13} /> 019 692623
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY & ITEMS BREAKDOWN */}
            <div className="tracker-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F0F9FF' }}>
                <ShoppingBag size={20} color="#38BDF8" />
                Riepilogo Ordine
              </h3>

              {/* Customer Info & Order Type Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '0.65rem',
                  marginBottom: '1.15rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.725rem', color: '#8DA9C4', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}>
                    <User size={13} /> Nome Cliente
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#F0F9FF' }}>
                    {order.customer_name || 'Cliente'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.725rem', color: '#8DA9C4', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}>
                    <MapPin size={13} /> Modalità
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#38BDF8' }}>
                    {order.order_type || 'Ritiro'}
                  </div>
                  {order.delivery_address && (
                    <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                      {order.delivery_address}
                    </div>
                  )}
                </div>
              </div>

              {/* Order notes — only real customer notes, never the pickup time */}
              {schedule.remainingNotes && (
                <div
                  style={{
                    padding: '0.6rem 0.8rem',
                    backgroundColor: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    borderRadius: '0.5rem',
                    color: '#FDE047',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Receipt size={15} style={{ flexShrink: 0 }} />
                  <span>Nota: {schedule.remainingNotes}</span>
                </div>
              )}

              {/* INGREDIENTS / ITEMS LIST */}
              <div style={{ marginBottom: '1.15rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {(order.order_items || order.items || []).map((item, idx) => {
                  const isFried =
                    item.item_type === 'fritto' ||
                    (item.item_name || '').toLowerCase().includes('cono') ||
                    (item.item_name || '').toLowerCase().includes('fritt');

                  const isFish =
                    item.item_type === 'pesce' ||
                    (item.item_name || '').startsWith('🐟') ||
                    (item.item_name || '').toLowerCase().includes('kg');

                  const itemPrice = item.price
                    ? item.price
                    : item.unit_price && item.quantity
                      ? item.unit_price * item.quantity
                      : order.total_price;

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '0.9rem 1rem',
                        backgroundColor: isFish ? 'rgba(14, 165, 233, 0.08)' : isFried ? 'rgba(245, 158, 11, 0.08)' : 'rgba(7, 21, 39, 0.6)',
                        borderRadius: '0.65rem',
                        border: isFish ? '1px solid rgba(14, 165, 233, 0.35)' : isFried ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(141, 169, 196, 0.15)',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isFish ? '#38BDF8' : isFried ? '#FBBF24' : '#F0F9FF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{item.item_name || item.name || (isFish ? 'Pesce Fresco al Banco' : 'Articolo Pessano')}</span>
                          {item.quantity && item.quantity > 1 && (
                            <span style={{ fontSize: '0.75rem', backgroundColor: isFish ? '#0284C7' : isFried ? '#F59E0B' : '#0284C7', color: 'white', padding: '0.1rem 0.45rem', borderRadius: '999px', fontWeight: 800 }}>
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '0.95rem' }}>
                          € {itemPrice.toFixed(2)}
                        </div>
                      </div>

                      {item.size && (
                        <div style={{ fontSize: '0.775rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
                          Formato: <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{item.size}</span>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
                        {item.bases && item.bases.length > 0 && (
                          <div>
                            <span style={{ color: '#8DA9C4', fontWeight: 600 }}>Basi:</span>{' '}
                            <span style={{ color: '#E2E8F0' }}>{item.bases.join(', ')}</span>
                          </div>
                        )}

                        {item.proteins && item.proteins.length > 0 && (
                          <div>
                            <span style={{ color: '#8DA9C4', fontWeight: 600 }}>Proteine:</span>{' '}
                            <span style={{ color: '#E2E8F0' }}>{item.proteins.join(', ')}</span>
                          </div>
                        )}

                        {item.toppings && item.toppings.length > 0 && (
                          <div>
                            <span style={{ color: '#8DA9C4', fontWeight: 600 }}>Topping:</span>{' '}
                            <span style={{ color: '#E2E8F0' }}>{item.toppings.join(', ')}</span>
                          </div>
                        )}

                        {item.sauces && item.sauces.length > 0 && (
                          <div>
                            <span style={{ color: '#8DA9C4', fontWeight: 600 }}>Salse:</span>{' '}
                            <span style={{ color: '#E2E8F0' }}>{item.sauces.join(', ')}</span>
                          </div>
                        )}

                        {!isFried && !isFish && item.has_sesame !== undefined && (
                          <div>
                            <span style={{ color: '#8DA9C4', fontWeight: 600 }}>Sesamo:</span>{' '}
                            <span style={{ color: item.has_sesame ? '#34D399' : '#F87171', fontWeight: 700 }}>
                              {item.has_sesame ? 'SÌ' : 'NO'}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <div
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'rgba(234, 179, 8, 0.15)',
                            border: '1px solid rgba(234, 179, 8, 0.35)',
                            color: '#FDE047',
                            fontSize: '0.775rem',
                            fontWeight: 700,
                          }}
                        >
                          📝 Nota: {item.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* TOTAL PRICE TO PAY */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  backgroundColor: 'rgba(19, 64, 116, 0.6)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#8DA9C4', fontWeight: 600 }}>
                    Totale da pagare
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#CBD5E1' }}>
                    Iva inclusa • Al banco / consegna
                  </div>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38BDF8' }}>
                  € {order.total_price ? order.total_price.toFixed(2) : '14.50'}
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* FOOTER MINI */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748B',
          backgroundColor: '#040E1B',
        }}
      >
        <div>Pescheria Pessano - Via Avvocato Emanuele Rossi, 17 - Finale Ligure (SV)</div>
        <div style={{ marginTop: '0.25rem' }}>© {new Date().getFullYear()} Pescheria Pessano. Tutti i diritti riservati.</div>
      </footer>
    </div>
  );
};

export default OrderTracking;
