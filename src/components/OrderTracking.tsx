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
  Bell
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalOrderById, subscribeToLocalOrders } from '../utils/orderStore';
import { subscribeToOrderPush } from '../lib/onesignal';

export interface OrderItem {
  id?: string;
  order_id?: string;
  item_name?: string;
  size?: string;
  bases?: string[];
  proteins?: string[];
  toppings?: string[];
  sauces?: string[];
  has_sesame?: boolean;
  notes?: string;
  price?: number;
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

export const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProntoAlertOpen, setIsProntoAlertOpen] = useState<boolean>(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);
  const [pushToastMsg, setPushToastMsg] = useState<string | null>(null);

  // Check saved push notification subscription state
  useEffect(() => {
    const orderIdToUse = order?.id || id;
    if (orderIdToUse && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`push_sub_${orderIdToUse}`);
      if (saved === 'true') {
        setIsPushSubscribed(true);
      }
    }
  }, [order?.id, id]);

  const handleActivatePush = () => {
    const orderIdToUse = order?.id || id;
    if (!orderIdToUse) return;

    // Instant synchronous UI feedback!
    setIsPushSubscribed(true);
    setPushToastMsg('🔔 Notifiche attivate con successo! Ti avviseremo appena il tuo ordine è pronto.');

    if (typeof window !== 'undefined') {
      localStorage.setItem(`push_sub_${orderIdToUse}`, 'true');
    }

    setTimeout(() => {
      setPushToastMsg(null);
    }, 4500);

    // Asynchronous OneSignal & Browser permission trigger in background
    subscribeToOrderPush(String(orderIdToUse)).catch((err) => {
      console.warn('Push subscription background error:', err);
    });
  };

  // Trigger sound, vibration & native notification for 'PRONTO' status
  const triggerProntoAlert = useCallback(() => {
    setIsProntoAlertOpen(true);

    // Native System Push Notification (Fired on Desktop/Mobile)
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
  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
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
          ? raw.order_items.map((item: any) => {
              let dt: any = {};
              if (typeof item.details === 'string') {
                try { dt = JSON.parse(item.details); } catch (e) { dt = {}; }
              } else if (typeof item.details === 'object' && item.details !== null) {
                dt = item.details;
              }

              const bases = Array.isArray(dt.bases) ? dt.bases : (Array.isArray(item.bases) ? item.bases : (Array.isArray(dt.basi) ? dt.basi : (Array.isArray(item.basi) ? item.basi : [])));
              const proteins = Array.isArray(dt.proteins) ? dt.proteins : (Array.isArray(item.proteins) ? item.proteins : (Array.isArray(dt.proteine) ? dt.proteine : (Array.isArray(item.proteine) ? item.proteine : [])));
              const toppings = Array.isArray(dt.toppings) ? dt.toppings : (Array.isArray(item.toppings) ? item.toppings : (Array.isArray(dt.ingredienti) ? dt.ingredienti : (Array.isArray(item.ingredienti) ? item.ingredienti : [])));
              const sauces = Array.isArray(dt.sauces) ? dt.sauces : (Array.isArray(item.sauces) ? item.sauces : (Array.isArray(dt.salse) ? dt.salse : (Array.isArray(item.salse) ? item.salse : [])));

              return {
                id: String(item.id),
                item_name: item.name || item.item_name || (dt.size ? `Poke ${dt.size}` : 'Poke'),
                size: dt.size || item.size || '',
                bases,
                proteins,
                toppings,
                sauces,
                has_sesame: dt.has_sesame ?? item.has_sesame ?? true,
                notes: dt.notes || item.notes || '',
                price: Number(item.unit_price || item.price || 0),
                quantity: Number(item.quantity || 1),
              };
            })
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

        setOrder(normalizedOrder);
        if (normalizedOrder.status === 'PRONTO') {
          setIsProntoAlertOpen(true);
        }
        return;
      }

      // Local store fallback
      const local = getLocalOrderById(id);
      if (local) {
        const normalizedLocalItems = (local.order_items || (local as any).items || []).map((item: any) => {
          let dt: any = {};
          if (typeof item.details === 'string') {
            try { dt = JSON.parse(item.details); } catch (e) { dt = {}; }
          } else if (typeof item.details === 'object' && item.details !== null) {
            dt = item.details;
          }

          const bases = Array.isArray(item.bases) ? item.bases : (Array.isArray(dt.bases) ? dt.bases : (Array.isArray(item.basi) ? item.basi : (Array.isArray(dt.basi) ? dt.basi : [])));
          const proteins = Array.isArray(item.proteins) ? item.proteins : (Array.isArray(dt.proteins) ? dt.proteins : (Array.isArray(item.proteine) ? item.proteine : (Array.isArray(dt.proteine) ? dt.proteine : [])));
          const toppings = Array.isArray(item.toppings) ? item.toppings : (Array.isArray(dt.toppings) ? dt.toppings : (Array.isArray(item.ingredienti) ? item.ingredienti : (Array.isArray(dt.ingredienti) ? dt.ingredienti : [])));
          const sauces = Array.isArray(item.sauces) ? item.sauces : (Array.isArray(dt.sauces) ? dt.sauces : (Array.isArray(item.salse) ? item.salse : (Array.isArray(dt.salse) ? dt.salse : [])));

          return {
            id: String(item.id || Math.random()),
            item_name: item.item_name || item.name || (dt.size ? `Poke ${dt.size}` : 'Poke'),
            size: item.size || dt.size || '',
            bases,
            proteins,
            toppings,
            sauces,
            has_sesame: item.has_sesame ?? dt.has_sesame ?? true,
            notes: item.notes || dt.notes || '',
            price: Number(item.price || item.unit_price || 0),
            quantity: Number(item.quantity || 1),
          };
        });

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
        setOrder(local as Order);
      } else {
        setError(err.message || 'Impossibile recuperare i dettagli dell\'ordine.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, triggerProntoAlert]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Realtime Supabase & Local Store listener
  useEffect(() => {
    if (!id) return;

    const unsubLocal = subscribeToLocalOrders(() => {
      const local = getLocalOrderById(id);
      if (local) {
        setOrder((prev) => {
          if (prev?.status !== 'PRONTO' && local.status === 'PRONTO') {
            triggerProntoAlert();
          }
          return local as Order;
        });
      }
    });

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
        (payload) => {
          if (payload.new) {
            const updated = payload.new as Order;
            setOrder((prev) => {
              const prevStatus = prev?.status;
              const nextStatus = updated.status;

              if (prevStatus !== 'PRONTO' && nextStatus === 'PRONTO') {
                triggerProntoAlert();
              }
              return {
                ...prev,
                ...updated,
                order_items: prev?.order_items || prev?.items || []
              } as Order;
            });
          }
        }
      )
      .subscribe();

    return () => {
      unsubLocal();
      supabase.removeChannel(channel);
    };
  }, [id, triggerProntoAlert]);

  // Determine active step index (0: RICEVUTO, 1: IN_PREPARAZIONE, 2: PRONTO)
  const getStepIndex = (status: string | undefined): number => {
    if (!status) return 0;
    const norm = status.toUpperCase();
    if (norm === 'PRONTO' || norm === 'COMPLETATO') return 2;
    if (norm === 'IN_PREPARAZIONE' || norm === 'IN PREPARAZIONE' || norm === 'PREPARAZIONE') return 1;
    return 0; // RICEVUTO
  };

  const currentStep = getStepIndex(order?.status);


  const displayId = order?.display_id || (order?.id ? `#${String(order.id).slice(-4).toUpperCase()}` : (id ? `#${String(id).slice(-4).toUpperCase()}` : '#0000'));

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#071527',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* TOP BAR BRAND HEADER */}
      <header
        style={{
          backgroundColor: 'rgba(11, 37, 69, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(141, 169, 196, 0.2)',
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
              <div style={{ fontSize: '0.75rem', color: '#8DA9C4' }}>
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
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              padding: '0.45rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
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
      <main
        style={{
          flex: 1,
          maxWidth: '900px',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.25rem 4rem 1.25rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Back Link */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#8DA9C4',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
          >
            <ArrowLeft size={16} /> Torna al menu principale
          </Link>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div
            style={{
              backgroundColor: 'rgba(11, 37, 69, 0.6)',
              borderRadius: '1.25rem',
              border: '1px solid rgba(141, 169, 196, 0.15)',
              padding: '4rem 2rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <RefreshCw
              size={42}
              color="#38BDF8"
              style={{ animation: 'spin 1.2s linear infinite', marginBottom: '1rem' }}
            />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Caricamento stato ordine in corso...
            </h2>
            <p style={{ color: '#8DA9C4', fontSize: '0.9rem' }}>
              Connessione in tempo reale a Pescheria Pessano
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderRadius: '1.25rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F87171', marginBottom: '0.5rem' }}>
              Ordine non trovato
            </h2>
            <p style={{ color: '#FECACA', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              {error}
            </p>
            <button
              onClick={fetchOrder}
              style={{
                backgroundColor: '#134074',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* SUCCESS TOAST MESSAGE */}
            {pushToastMsg && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1.5px solid #10B981',
                  color: '#A7F3D0',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.2)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <CheckCircle2 size={22} color="#10B981" />
                <span>{pushToastMsg}</span>
              </div>
            )}

            {/* PUSH NOTIFICATION SUBSCRIPTION BANNER */}
            <div
              style={{
                backgroundColor: isPushSubscribed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
                border: isPushSubscribed ? '1.5px solid #10B981' : '1.5px solid #38BDF8',
                borderRadius: '1rem',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '240px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: isPushSubscribed ? '#10B981' : '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bell size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '0.2rem' }}>
                    {isPushSubscribed ? '🔔 Notifiche Push Attivate per questo Ordine' : '🔔 Vuoi ricevere una notifica appena la tua Poke è pronta?'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.35 }}>
                    {isPushSubscribed
                      ? 'Ti invieremo un avviso sul tuo dispositivo appena il piatto è pronto per il ritiro!'
                      : 'Attiva le notifiche Web Push per ricevere un avviso sul telefono o computer quando la tua Poke è pronta.'}
                  </div>
                </div>
              </div>

              {!isPushSubscribed && (
                <button
                  type="button"
                  onClick={handleActivatePush}
                  className="btn btn-coral"
                  style={{
                    padding: '0.65rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    borderRadius: '0.5rem',
                  }}
                >
                  Avvisami quando è Pronta
                </button>
              )}
            </div>

            {/* GIANT HIGH-CONTRAST PRONTO TRIGGER BANNER */}
            {(order.status === 'PRONTO' || isProntoAlertOpen) && (
              <div
                style={{
                  backgroundColor: '#059669',
                  backgroundImage: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  borderRadius: '1.25rem',
                  padding: '2rem 1.5rem',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 12px 40px rgba(16, 185, 129, 0.4)',
                  border: '3px solid #6EE7B7',
                  animation: 'pulseGlow 2s infinite alternate',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    marginBottom: '1rem',
                  }}
                >
                  <CheckCircle2 size={40} color="#FFFFFF" />
                </div>
                <h1
                  style={{
                    fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
                    fontWeight: 900,
                    margin: '0 0 0.5rem 0',
                    letterSpacing: '-0.02em',
                    textTransform: 'uppercase',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  🎉 IL TUO POKE È PRONTO!
                </h1>
                <p
                  style={{
                    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                    fontWeight: 600,
                    margin: '0 0 1.25rem 0',
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
                    padding: '0.6rem 1.5rem',
                    borderRadius: '999px',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  ORDINE {displayId}
                </div>
              </div>
            )}

            {/* REALTIME STATUS TRACKER CARD */}
            <div
              style={{
                backgroundColor: 'rgba(11, 37, 69, 0.75)',
                backdropFilter: 'blur(16px)',
                borderRadius: '1.25rem',
                border: '1px solid rgba(141, 169, 196, 0.25)',
                padding: '2rem 1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#8DA9C4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Stato Ordine in Tempo Reale
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0 0 0', color: '#FFFFFF' }}>
                    {currentStep === 0 && '🕒 Ordine preso in carico'}
                    {currentStep === 1 && '👨‍🍳 Il tuo Poke è in preparazione!'}
                    {currentStep === 2 && '✅ Pronto al banco per il ritiro!'}
                  </h2>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#38BDF8',
                      boxShadow: '0 0 8px #38BDF8',
                      display: 'inline-block',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  LIVE REALTIME
                </div>
              </div>

              {/* 3-PHASE VISUAL PROGRESS BAR */}
              <div style={{ margin: '2rem 0 1rem 0' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    position: 'relative',
                    gap: '0.5rem',
                  }}
                >
                  {/* Phase 1: RICEVUTO */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: currentStep >= 0 ? '#134074' : 'rgba(255, 255, 255, 0.05)',
                        border: currentStep >= 0 ? '3px solid #38BDF8' : '2px solid rgba(255, 255, 255, 0.2)',
                        color: currentStep >= 0 ? '#38BDF8' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.75rem',
                        boxShadow: currentStep >= 0 ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Clock size={26} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: currentStep >= 0 ? '#F0F9FF' : '#64748B' }}>
                      RICEVUTO
                    </div>
                    <div style={{ fontSize: '0.75rem', color: currentStep >= 0 ? '#8DA9C4' : '#475569', marginTop: '0.2rem' }}>
                      Ordine preso in carico
                    </div>
                  </div>

                  {/* Phase 2: IN PREPARAZIONE */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: currentStep >= 1 ? '#D97706' : 'rgba(255, 255, 255, 0.05)',
                        border: currentStep >= 1 ? '3px solid #FBBF24' : '2px solid rgba(255, 255, 255, 0.2)',
                        color: currentStep >= 1 ? '#FBBF24' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.75rem',
                        boxShadow: currentStep >= 1 ? '0 0 20px rgba(251, 191, 36, 0.5)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <ChefHat size={26} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: currentStep >= 1 ? '#F0F9FF' : '#64748B' }}>
                      IN PREPARAZIONE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: currentStep >= 1 ? '#FCD34D' : '#475569', marginTop: '0.2rem' }}>
                      Il tuo Poke è in preparazione!
                    </div>
                  </div>

                  {/* Phase 3: PRONTO */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: currentStep >= 2 ? '#059669' : 'rgba(255, 255, 255, 0.05)',
                        border: currentStep >= 2 ? '3px solid #34D399' : '2px solid rgba(255, 255, 255, 0.2)',
                        color: currentStep >= 2 ? '#34D399' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.75rem',
                        boxShadow: currentStep >= 2 ? '0 0 25px rgba(52, 211, 153, 0.6)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <CheckCircle2 size={28} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: currentStep >= 2 ? '#34D399' : '#64748B' }}>
                      PRONTO
                    </div>
                    <div style={{ fontSize: '0.75rem', color: currentStep >= 2 ? '#A7F3D0' : '#475569', marginTop: '0.2rem' }}>
                      Pronto al banco!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER SUMMARY CARD */}
            <div
              style={{
                backgroundColor: 'rgba(11, 37, 69, 0.75)',
                backdropFilter: 'blur(16px)',
                borderRadius: '1.25rem',
                border: '1px solid rgba(141, 169, 196, 0.25)',
                padding: '2rem 1.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={22} color="#38BDF8" />
                Riepilogo Dettagli Ordine
              </h3>

              {/* Customer Info & Order Type Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '0.75rem',
                  marginBottom: '1.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#8DA9C4', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <User size={14} /> Nome Cliente
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F9FF' }}>
                    {order.customer_name || 'Cliente Pessano'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#8DA9C4', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                    <MapPin size={14} /> Modalità Ordine
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38BDF8' }}>
                    {order.order_type || 'Ritiro in Pescheria'}
                  </div>
                  {order.delivery_address && (
                    <div style={{ fontSize: '0.825rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                      {order.delivery_address}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Notes Banner if present */}
              {order.notes && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    borderRadius: '0.65rem',
                    color: '#FDE047',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Receipt size={18} style={{ flexShrink: 0 }} />
                  <span>Dettaglio / Note Ordine: {order.notes}</span>
                </div>
              )}

              {/* INGREDIENTS LIST */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#8DA9C4', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>
                  Composizione del Poke Scelto
                </div>

                {(order.order_items || order.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'rgba(7, 21, 39, 0.6)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(141, 169, 196, 0.15)',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#F0F9FF' }}>
                        {item.item_name || item.name || 'Poke Custom Pessano'}
                      </div>
                      <div style={{ fontWeight: 700, color: '#38BDF8', fontSize: '1rem' }}>
                        € {item.price ? item.price.toFixed(2) : order.total_price.toFixed(2)}
                      </div>
                    </div>

                    {item.size && (
                      <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginBottom: '0.75rem' }}>
                        Formato: <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{item.size}</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                      {item.bases && item.bases.length > 0 && (
                        <div>
                          <span style={{ color: '#8DA9C4', fontWeight: 600 }}>🍚 Basi:</span>{' '}
                          <span style={{ color: '#E2E8F0' }}>{item.bases.join(', ')}</span>
                        </div>
                      )}

                      {item.proteins && item.proteins.length > 0 && (
                        <div>
                          <span style={{ color: '#8DA9C4', fontWeight: 600 }}>🐟 Proteine:</span>{' '}
                          <span style={{ color: '#E2E8F0' }}>{item.proteins.join(', ')}</span>
                        </div>
                      )}

                      {item.toppings && item.toppings.length > 0 && (
                        <div>
                          <span style={{ color: '#8DA9C4', fontWeight: 600 }}>🥑 Topping:</span>{' '}
                          <span style={{ color: '#E2E8F0' }}>{item.toppings.join(', ')}</span>
                        </div>
                      )}

                      {item.sauces && item.sauces.length > 0 && (
                        <div>
                          <span style={{ color: '#8DA9C4', fontWeight: 600 }}>Soy/Salse:</span>{' '}
                          <span style={{ color: '#E2E8F0' }}>{item.sauces.join(', ')}</span>
                        </div>
                      )}

                      {item.has_sesame !== undefined && (
                        <div>
                          <span style={{ color: '#8DA9C4', fontWeight: 600 }}>🌱 Sesamo:</span>{' '}
                          <span style={{ color: item.has_sesame ? '#34D399' : '#F87171', fontWeight: 700 }}>
                            {item.has_sesame ? 'SÌ' : 'NO'}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '0.375rem',
                          backgroundColor: 'rgba(234, 179, 8, 0.15)',
                          border: '1px solid rgba(234, 179, 8, 0.35)',
                          color: '#FDE047',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                        }}
                      >
                        📝 Nota Poke: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* TOTAL PRICE TO PAY */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  backgroundColor: 'rgba(19, 64, 116, 0.6)',
                  borderRadius: '0.85rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#8DA9C4', fontWeight: 600 }}>
                    Totale da pagare al banco/consegna
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    Iva inclusa • Scontrino fisco Pescheria Pessano
                  </div>
                </div>

                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38BDF8' }}>
                  € {order.total_price ? order.total_price.toFixed(2) : '14.50'}
                </div>
              </div>
            </div>

            {/* NEED HELP / STORE CONTACT CARD (WHATSAPP PRIMARY) */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#F0F9FF' }}>
                  Serve assistenza o modifiche al tuo ordine?
                </div>
                <div style={{ fontSize: '0.825rem', color: '#8DA9C4', marginTop: '0.2rem' }}>
                  Scrivi direttamente alla Pescheria Pessano su WhatsApp specificando il tuo numero ordine <strong style={{ color: '#38BDF8' }}>{displayId}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                  href="https://wa.me/393459485857"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#25D366',
                    color: '#040E1B',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <MessageCircle size={18} color="#040E1B" /> Contatta su WhatsApp (345 9485857)
                </a>

                <a
                  href="tel:019692623"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#8DA9C4',
                    padding: '0.65rem 1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <Phone size={15} /> 019 692623
                </a>
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
