import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  Play,
  Check,
  PackageCheck,
  Maximize2,
  Minimize2,
  Volume2,
  ShoppingBag,
  Truck,
  User,
  Phone,
  RefreshCw,
  Sparkles,
  ChefHat
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalOrders, updateLocalOrderStatus, subscribeToLocalOrders } from '../utils/orderStore';
import { sendOrderStatusNotification } from '../lib/onesignal';

export interface KdsOrderItem {
  id?: string;
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
}

export interface KdsOrder {
  id: string;
  display_id?: string;
  status: 'RICEVUTO' | 'IN_PREPARAZIONE' | 'PRONTO' | 'COMPLETATO' | string;
  customer_name: string;
  phone?: string;
  order_type: 'Ritiro' | 'Consegna' | string;
  delivery_address?: string;
  total_price: number;
  created_at: string;
  notes?: string;
  order_items: KdsOrderItem[];
}

// Helper to extract customer's requested time from order notes
export const extractRequestedTimeInfo = (notes?: string): { timeText: string; isAsap: boolean } => {
  if (!notes) return { timeText: 'ASAP', isAsap: true };

  const match = notes.match(/Orario:\s*([^—\n]+)/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    if (raw.toLowerCase().includes('asap') || raw.toLowerCase().includes('prima possibile')) {
      return { timeText: 'ASAP', isAsap: true };
    }
    return { timeText: raw, isAsap: false };
  }

  return { timeText: 'ASAP', isAsap: true };
};

// Helper to compute target timestamp in ms for sorting urgency (closest requested time first)
export const getOrderTargetMs = (o: KdsOrder): number => {
  const createdMs = new Date(o.created_at).getTime();
  const info = extractRequestedTimeInfo(o.notes);

  if (info.isAsap) {
    return createdMs;
  }

  const timeMatch = info.timeText.match(/(\d{1,2})[:.](\d{2})/);
  if (timeMatch) {
    const targetHour = parseInt(timeMatch[1], 10);
    const targetMin = parseInt(timeMatch[2], 10);

    const targetDate = new Date(createdMs);
    targetDate.setHours(targetHour, targetMin, 0, 0);
    let targetMs = targetDate.getTime();

    // If requested time is earlier than creation time minus 1 hour, assume next day
    if (targetMs < createdMs - 3600000) {
      targetMs += 86400000;
    }
    return targetMs;
  }

  return createdMs;
};

export const KdsBoard: React.FC = () => {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'TUTTI' | 'RITIRO' | 'CONSEGNA'>('TUTTI');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  
  // Track checked ingredients per order and item (key: `${orderId}_${itemIdx}_${ingCategory}_${ingName}`)
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Lazy AudioContext initializer
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    }
    return audioContextRef.current;
  }, []);

  // Unlock AudioContext if suspended
  const unlockAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        setAudioUnlocked(true);
      }).catch((e) => {
        console.warn('Failed to resume AudioContext:', e);
      });
    } else if (ctx && ctx.state === 'running') {
      setAudioUnlocked(true);
    }
  }, [getAudioContext]);

  // Global user interaction listener to unlock audio policy
  useEffect(() => {
    const handleGesture = () => {
      unlockAudio();
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
    window.addEventListener('touchstart', handleGesture);

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, [unlockAudio]);

  // Audio Context for Beep sound notification
  const playAudioBeep = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.25);
      gain2.gain.setValueAtTime(0.4, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.55);

    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }, [getAudioContext]);

  // Update digital clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.warn);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.warn);
      }
    }
  };



  // Fetch active orders from Supabase DB & Local Storage Store
  const fetchOrders = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      let remoteOrders: KdsOrder[] = [];

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .neq('status', 'COMPLETATO')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        remoteOrders = data.map((o: any) => {
          const items: KdsOrderItem[] = Array.isArray(o.order_items)
            ? o.order_items.map((item: any) => {
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

          return {
            id: String(o.id),
            display_id: o.friendly_id || `#${String(o.id).slice(-4).toUpperCase()}`,
            status: o.status || 'RICEVUTO',
            customer_name: o.customer_name || 'Cliente',
            phone: o.customer_phone || o.phone || '',
            order_type: o.order_type || 'Ritiro',
            delivery_address: o.delivery_address || undefined,
            total_price: Number(o.total_amount || o.total_price || 0),
            created_at: o.created_at || new Date().toISOString(),
            notes: o.notes || '',
            order_items: items,
          };
        });
      }

      // Combine with local orders (for instant offline / dev persistence)
      const localList = getLocalOrders()
        .filter((o) => o.status !== 'COMPLETATO')
        .map((o) => ({
          id: String(o.id),
          display_id: o.display_id || `#${String(o.id).slice(-4).toUpperCase()}`,
          status: o.status || 'RICEVUTO',
          customer_name: o.customer_name || 'Cliente',
          phone: (o as any).customer_phone || o.phone || '',
          order_type: o.order_type || 'Ritiro',
          delivery_address: o.delivery_address,
          total_price: Number((o as any).total_amount || o.total_price || 0),
          created_at: o.created_at || new Date().toISOString(),
          notes: o.notes,
          order_items: (o.order_items || []).map((item: any) => {
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
          }),
        }));

      const orderMap = new Map<string, KdsOrder>();
      remoteOrders.forEach((o) => orderMap.set(o.id, o));
      localList.forEach((o) => orderMap.set(o.id, o));

      const finalCombined = Array.from(orderMap.values());
      finalCombined.sort((a, b) => {
        const targetA = getOrderTargetMs(a);
        const targetB = getOrderTargetMs(b);

        if (targetA !== targetB) {
          return targetA - targetB; // Temporalmente più vicino (più urgente) prima!
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setOrders(finalCombined);
    } catch (e) {
      console.warn('Order fetch exception, fallback to local store:', e);
      const local = getLocalOrders().filter((o) => o.status !== 'COMPLETATO');
      setOrders(local as KdsOrder[]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Supabase Realtime & Local Store Subscription
  useEffect(() => {
    fetchOrders(false);

    const unsubLocal = subscribeToLocalOrders(() => {
      fetchOrders(true);
    });

    const channel = supabase
      .channel('kds_realtime_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as any;
            if (newOrder.status === 'RICEVUTO') {
              playAudioBeep();
            }
            fetchOrders(true);
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchOrders(true);
          }
        }
      )
      .subscribe();

    return () => {
      unsubLocal();
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, playAudioBeep]);

  // Update order status handler
  const handleUpdateStatus = async (orderId: string, newStatus: 'IN_PREPARAZIONE' | 'PRONTO' | 'COMPLETATO') => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const customerName = targetOrder?.customer_name || 'Cliente';

    // Send Web Push Notification to subscriber of order
    sendOrderStatusNotification({
      orderId,
      customerName,
      newStatus,
    }).then((sent) => {
      console.log(`[KDS] Esito notifica push per ordine #${orderId} (${newStatus}):`, sent);
    }).catch((err) => {
      console.warn(`[KDS] Errore notifica push per ordine #${orderId}:`, err);
    });

    // Optimistic UI update
    setOrders((prev) => {
      const updated = prev
        .map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        .filter((o) => o.status !== 'COMPLETATO');

      return updated.sort((a, b) => {
        const targetA = getOrderTargetMs(a);
        const targetB = getOrderTargetMs(b);
        if (targetA !== targetB) return targetA - targetB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });

    // Update local store
    updateLocalOrderStatus(orderId, newStatus);

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.warn('Status DB update failed:', error.message);
      }
    } catch (e) {
      console.warn('Status DB update exception:', e);
    }
  };

  // Helper to compute timer status relative to requested time or order creation
  const calculateOrderTimer = (createdAtStr: string, requestedTimeText: string, isAsap: boolean) => {
    const createdMs = new Date(createdAtStr).getTime();
    const nowMs = Date.now();
    const elapsedMin = Math.max(0, Math.floor((nowMs - createdMs) / 60000));

    if (isAsap) {
      let timerBg = 'rgba(34, 197, 94, 0.2)';
      let timerText = '#4ADE80';
      let timerBorder = 'rgba(34, 197, 94, 0.5)';
      let isUrgent = false;

      if (elapsedMin >= 5 && elapsedMin <= 10) {
        timerBg = 'rgba(234, 179, 8, 0.2)';
        timerText = '#FACC15';
        timerBorder = 'rgba(234, 179, 8, 0.5)';
      } else if (elapsedMin > 10) {
        timerBg = 'rgba(239, 68, 68, 0.25)';
        timerText = '#FCA5A5';
        timerBorder = 'rgba(239, 68, 68, 0.6)';
        isUrgent = true;
      }

      return {
        timerLabel: `${elapsedMin} min`,
        subLabel: 'in attesa',
        timerBg,
        timerText,
        timerBorder,
        isUrgent,
      };
    }

    // Fixed Time requested (e.g. "12:30", "19:30")
    const timeMatch = requestedTimeText.match(/(\d{1,2})[:.](\d{2})/);
    if (timeMatch) {
      const targetHour = parseInt(timeMatch[1], 10);
      const targetMin = parseInt(timeMatch[2], 10);

      const targetDate = new Date(createdMs);
      targetDate.setHours(targetHour, targetMin, 0, 0);
      let targetMs = targetDate.getTime();

      if (targetMs < createdMs - 3600000) {
        targetMs += 86400000;
      }

      const diffMs = targetMs - nowMs;
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 0) {
        const overdueMin = Math.abs(diffMin);
        return {
          timerLabel: `+${overdueMin} min`,
          subLabel: 'RITARDO!',
          timerBg: 'rgba(239, 68, 68, 0.35)',
          timerText: '#EF4444',
          timerBorder: 'rgba(239, 68, 68, 0.8)',
          isUrgent: true,
        };
      } else if (diffMin <= 15) {
        return {
          timerLabel: `-${diffMin} min`,
          subLabel: `scade a ${requestedTimeText}`,
          timerBg: 'rgba(234, 179, 8, 0.25)',
          timerText: '#FACC15',
          timerBorder: 'rgba(234, 179, 8, 0.6)',
          isUrgent: diffMin <= 5,
        };
      } else {
        return {
          timerLabel: `-${diffMin} min`,
          subLabel: `per le ${requestedTimeText}`,
          timerBg: 'rgba(34, 197, 94, 0.2)',
          timerText: '#4ADE80',
          timerBorder: 'rgba(34, 197, 94, 0.5)',
          isUrgent: false,
        };
      }
    }

    return {
      timerLabel: `${elapsedMin} min`,
      subLabel: `richiesto ${requestedTimeText}`,
      timerBg: 'rgba(56, 189, 248, 0.2)',
      timerText: '#38BDF8',
      timerBorder: 'rgba(56, 189, 248, 0.5)',
      isUrgent: false,
    };
  };

  // Toggle ingredient checklist item
  const toggleIngredient = (key: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter active orders
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'RITIRO') return o.order_type.toLowerCase().includes('ritiro');
    if (activeFilter === 'CONSEGNA') return o.order_type.toLowerCase().includes('consegna');
    return true;
  });

  // Counters
  const countRicevuto = orders.filter((o) => o.status === 'RICEVUTO').length;
  const countInPrep = orders.filter((o) => o.status === 'IN_PREPARAZIONE').length;
  const countPronto = orders.filter((o) => o.status === 'PRONTO').length;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* KDS HEADER BAR */}
      <header
        style={{
          backgroundColor: '#070F1E',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Title & Live Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#FF6B6B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255, 107, 107, 0.4)',
              }}
            >
              <ChefHat size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em', color: 'white' }}>
                PESCHERIA PESSANO
              </h1>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kitchen Display System (KDS)
              </span>
            </div>
          </div>

          {/* Digital Clock */}
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#38BDF8',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.05em',
            }}
          >
            <Clock size={18} />
            <span>{currentTime || '00:00:00'}</span>
          </div>
        </div>

        {/* Status Counters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              color: '#FACC15',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FACC15' }} />
            {countRicevuto} In Attesa
          </div>

          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60A5FA',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60A5FA' }} />
            {countInPrep} In Prep
          </div>

          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              color: '#4ADE80',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
            {countPronto} Pronti
          </div>
        </div>

        {/* Quick Filter Tabs & Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: '#1E293B', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('TUTTI')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFilter === 'TUTTI' ? '#3B82F6' : 'transparent',
                color: activeFilter === 'TUTTI' ? 'white' : '#94A3B8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Tutti ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('RITIRO')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFilter === 'RITIRO' ? '#F59E0B' : 'transparent',
                color: activeFilter === 'RITIRO' ? 'white' : '#94A3B8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Solo Ritiro
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CONSEGNA')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeFilter === 'CONSEGNA' ? '#06B6D4' : 'transparent',
                color: activeFilter === 'CONSEGNA' ? 'white' : '#94A3B8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Solo Consegne
            </button>
          </div>

          {/* Test Beep Sound Button / Audio Unlock Button */}
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              playAudioBeep();
            }}
            title={audioUnlocked ? "Suono Abilitato (Clicca per Test Audio)" : "Audio in attesa di sblocco dal browser. Clicca per sbloccare!"}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: audioUnlocked ? '#1E293B' : '#7F1D1D',
              border: audioUnlocked ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #EF4444',
              color: audioUnlocked ? '#FACC15' : '#FCA5A5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: audioUnlocked ? 'none' : '0 0 10px rgba(239, 68, 68, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <Volume2 size={18} />
            <span>{audioUnlocked ? "Audio Attivo" : "Attiva Audio"}</span>
          </button>



          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      {/* KDS MAIN MONITOR CONTENT */}
      <main style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
            <RefreshCw size={36} className="animate-spin" color="#38BDF8" />
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94A3B8' }}>Caricamento monitor ordini in corso...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              border: '2px dashed rgba(148, 163, 184, 0.2)',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={56} color="#10B981" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
              Nessun Ordine Attivo al Momento!
            </h2>
            <p style={{ color: '#94A3B8', maxWidth: '500px', margin: '0', fontSize: '0.95rem' }}>
              Tutti gli ordini in coda sono stati preparati e completati. In attesa di nuovi ordini in arrivo dai clienti.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
              alignItems: 'start',
            }}
          >
            {filteredOrders.map((ord) => {
              const { timeText, isAsap } = extractRequestedTimeInfo(ord.notes);
              const timerInfo = calculateOrderTimer(ord.created_at, timeText, isAsap);
              const isDelivery = ord.order_type.toLowerCase().includes('consegna');
              const isSelected = selectedOrderId === ord.id;

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(isSelected ? null : ord.id)}
                  style={{
                    backgroundColor: isSelected ? '#0F172A' : '#1E293B',
                    borderRadius: '16px',
                    border: isSelected
                      ? '3px solid #FBBF24'
                      : timerInfo.isUrgent
                      ? '2px solid #EF4444'
                      : ord.status === 'IN_PREPARAZIONE'
                      ? '2px solid #3B82F6'
                      : ord.status === 'PRONTO'
                      ? '2px solid #10B981'
                      : '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: isSelected
                      ? '0 0 35px rgba(251, 191, 36, 0.75), 0 12px 35px rgba(0, 0, 0, 0.6)'
                      : timerInfo.isUrgent
                      ? '0 0 20px rgba(239, 68, 68, 0.35)'
                      : '0 8px 24px rgba(0, 0, 0, 0.3)',
                    transform: isSelected ? 'scale(1.025)' : 'scale(1)',
                    opacity: selectedOrderId && !isSelected ? 0.65 : 1,
                    zIndex: isSelected ? 20 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* CARD HEADER */}
                  <div
                    style={{
                      padding: '1rem 1.15rem',
                      backgroundColor: isSelected ? '#1E293B' : '#0F172A',
                      borderBottom: isSelected ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(148, 163, 184, 0.15)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '0.02em' }}>
                          {ord.display_id || `#${ord.id}`}
                        </span>

                        {/* Selected Highlighting Badge */}
                        {isSelected && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              backgroundColor: '#FBBF24',
                              color: '#0F172A',
                              boxShadow: '0 2px 8px rgba(251, 191, 36, 0.6)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            <Sparkles size={13} color="#0F172A" />
                            IN LETTURA
                          </span>
                        )}
                        
                        {/* Delivery Type Badge */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            backgroundColor: isDelivery ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isDelivery ? '#38BDF8' : '#FBBF24',
                            border: isDelivery ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isDelivery ? <Truck size={12} /> : <ShoppingBag size={12} />}
                          {ord.order_type}
                        </span>

                        {/* Customer Requested Time Badge */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            backgroundColor: isAsap ? 'rgba(239, 68, 68, 0.18)' : 'rgba(168, 85, 247, 0.2)',
                            color: isAsap ? '#FCA5A5' : '#E9D5FF',
                            border: isAsap ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
                          }}
                        >
                          <Clock size={12} />
                          <span>ORARIO: {timeText}</span>
                        </span>
                      </div>

                      {/* Customer Name & Phone */}
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={15} color="#94A3B8" />
                          <span>{ord.customer_name}</span>
                        </div>
                        {ord.phone && (
                          <div style={{ fontSize: '0.85rem', color: '#38BDF8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={13} />
                            <span>{ord.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Timer / Countdown Badge */}
                    <div
                      style={{
                        backgroundColor: timerInfo.timerBg,
                        border: `1px solid ${timerInfo.timerBorder}`,
                        color: timerInfo.timerText,
                        padding: '0.45rem 0.75rem',
                        borderRadius: '10px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        minWidth: '85px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '1rem', fontWeight: 900 }}>
                        <Clock size={15} />
                        <span>{timerInfo.timerLabel}</span>
                      </div>
                      <span style={{ fontSize: '0.625rem', fontWeight: 800, opacity: 0.9, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {timerInfo.subLabel}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Address / Pickup Time / Notes */}
                  {(ord.delivery_address || ord.notes) && (
                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        padding: '0.6rem 1.15rem',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        fontSize: '0.85rem',
                        color: '#CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.3rem',
                      }}
                    >
                      {ord.notes && ord.notes.includes('Orario:') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#FACC15', fontWeight: 800 }}>
                          <Clock size={14} />
                          <span>{ord.notes}</span>
                        </div>
                      )}
                      {ord.delivery_address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38BDF8', fontWeight: 600 }}>
                          <Truck size={13} />
                          <span>{ord.delivery_address}</span>
                        </div>
                      )}
                      {ord.notes && !ord.notes.includes('Orario:') && (
                        <div style={{ color: '#FACC15', fontStyle: 'italic', fontWeight: 600 }}>
                          ⚠️ Note: {ord.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CARD BODY - INTERACTIVE CHECKLIST */}
                  <div style={{ padding: '1rem 1.15rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {ord.order_items.map((item, itemIdx) => {
                      return (
                        <div
                          key={itemIdx}
                          style={{
                            backgroundColor: '#0F172A',
                            borderRadius: '10px',
                            padding: '0.85rem',
                            border: '1px solid rgba(148, 163, 184, 0.12)',
                          }}
                        >
                          {/* Item Title */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Sparkles size={16} />
                              {item.item_name || 'Poke Custom'}
                            </span>
                            {item.quantity && item.quantity > 1 && (
                              <span style={{ backgroundColor: '#EF4444', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                                x{item.quantity}
                              </span>
                            )}
                          </div>

                          {/* Ingredient Categories Checklist */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {/* BASI */}
                            {item.bases && item.bases.length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                  Basi
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {item.bases.map((base) => {
                                    const key = `${ord.id}_${itemIdx}_base_${base}`;
                                    const isChecked = !!checkedIngredients[key];
                                    return (
                                      <button
                                        type="button"
                                        key={base}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleIngredient(key);
                                        }}
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '6px',
                                          fontSize: '0.825rem',
                                          fontWeight: 700,
                                          border: isChecked ? '1px solid #059669' : '1px solid rgba(56, 189, 248, 0.3)',
                                          backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.25)' : 'rgba(56, 189, 248, 0.12)',
                                          color: isChecked ? '#6EE7B7' : '#E0F2FE',
                                          textDecoration: isChecked ? 'line-through' : 'none',
                                          opacity: isChecked ? 0.5 : 1,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <Check size={12} style={{ opacity: isChecked ? 1 : 0.4 }} />
                                        {base}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* PROTEINE */}
                            {item.proteins && item.proteins.length > 0 && (
                              <div style={{ marginTop: '0.2rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                  Proteine
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {item.proteins.map((prot) => {
                                    const key = `${ord.id}_${itemIdx}_prot_${prot}`;
                                    const isChecked = !!checkedIngredients[key];
                                    return (
                                      <button
                                        type="button"
                                        key={prot}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleIngredient(key);
                                        }}
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '6px',
                                          fontSize: '0.825rem',
                                          fontWeight: 700,
                                          border: isChecked ? '1px solid #059669' : '1px solid rgba(255, 107, 107, 0.35)',
                                          backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.25)' : 'rgba(255, 107, 107, 0.15)',
                                          color: isChecked ? '#6EE7B7' : '#FFD1D1',
                                          textDecoration: isChecked ? 'line-through' : 'none',
                                          opacity: isChecked ? 0.5 : 1,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <Check size={12} style={{ opacity: isChecked ? 1 : 0.4 }} />
                                        {prot}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* TOPPING / INGREDIENTI */}
                            {item.toppings && item.toppings.length > 0 && (
                              <div style={{ marginTop: '0.2rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                  Topping / Ingredienti
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {item.toppings.map((top) => {
                                    const key = `${ord.id}_${itemIdx}_top_${top}`;
                                    const isChecked = !!checkedIngredients[key];
                                    return (
                                      <button
                                        type="button"
                                        key={top}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleIngredient(key);
                                        }}
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '6px',
                                          fontSize: '0.825rem',
                                          fontWeight: 700,
                                          border: isChecked ? '1px solid #059669' : '1px solid rgba(168, 85, 247, 0.35)',
                                          backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.25)' : 'rgba(168, 85, 247, 0.15)',
                                          color: isChecked ? '#6EE7B7' : '#E9D5FF',
                                          textDecoration: isChecked ? 'line-through' : 'none',
                                          opacity: isChecked ? 0.5 : 1,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <Check size={12} style={{ opacity: isChecked ? 1 : 0.4 }} />
                                        {top}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* SALSE */}
                            {item.sauces && item.sauces.length > 0 && (
                              <div style={{ marginTop: '0.2rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                  Salse
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {item.sauces.map((sauce) => {
                                    const key = `${ord.id}_${itemIdx}_sauce_${sauce}`;
                                    const isChecked = !!checkedIngredients[key];
                                    return (
                                      <button
                                        type="button"
                                        key={sauce}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleIngredient(key);
                                        }}
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '6px',
                                          fontSize: '0.825rem',
                                          fontWeight: 700,
                                          border: isChecked ? '1px solid #059669' : '1px solid rgba(234, 179, 8, 0.35)',
                                          backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.25)' : 'rgba(234, 179, 8, 0.15)',
                                          color: isChecked ? '#6EE7B7' : '#FEF08A',
                                          textDecoration: isChecked ? 'line-through' : 'none',
                                          opacity: isChecked ? 0.5 : 1,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <Check size={12} style={{ opacity: isChecked ? 1 : 0.4 }} />
                                        {sauce}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* SESAMO */}
                            {item.has_sesame !== undefined && (
                              <div style={{ marginTop: '0.2rem' }}>
                                {(() => {
                                  const key = `${ord.id}_${itemIdx}_sesame`;
                                  const isChecked = !!checkedIngredients[key];
                                  return (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleIngredient(key);
                                      }}
                                      style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        border: isChecked ? '1px solid #059669' : '1px solid rgba(148, 163, 184, 0.3)',
                                        backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.25)' : 'rgba(148, 163, 184, 0.1)',
                                        color: isChecked ? '#6EE7B7' : '#CBD5E1',
                                        textDecoration: isChecked ? 'line-through' : 'none',
                                        opacity: isChecked ? 0.5 : 1,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                      }}
                                    >
                                      <Check size={12} style={{ opacity: isChecked ? 1 : 0.4 }} />
                                      Semi di Sesamo: {item.has_sesame ? 'SI' : 'NO'}
                                    </button>
                                  );
                                })()}
                              </div>
                            )}

                            {/* NOTE ITEM */}
                            {item.notes && (
                              <div style={{ marginTop: '0.45rem', padding: '0.4rem 0.65rem', borderRadius: '6px', backgroundColor: 'rgba(234, 179, 8, 0.2)', border: '1px solid rgba(234, 179, 8, 0.5)', color: '#FDE047', fontSize: '0.825rem', fontWeight: 700 }}>
                                📝 Nota Poke: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* FOOTER CARD - GIANT TOUCH ACTION BUTTONS */}
                  <div style={{ padding: '0.85rem 1.15rem 1.15rem 1.15rem', borderTop: '1px solid rgba(148, 163, 184, 0.12)', backgroundColor: '#0F172A' }}>
                    {ord.status === 'RICEVUTO' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(ord.id, 'IN_PREPARAZIONE');
                        }}
                        style={{
                          width: '100%',
                          minHeight: '54px',
                          borderRadius: '12px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Play size={22} fill="white" />
                        INIZIA PREPARAZIONE
                      </button>
                    )}

                    {ord.status === 'IN_PREPARAZIONE' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(ord.id, 'PRONTO');
                        }}
                        style={{
                          width: '100%',
                          minHeight: '54px',
                          borderRadius: '12px',
                          backgroundColor: '#10B981',
                          color: 'white',
                          border: 'none',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <CheckCircle2 size={22} />
                        SEGNALA PRONTO
                      </button>
                    )}

                    {ord.status === 'PRONTO' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(ord.id, 'COMPLETATO');
                        }}
                        style={{
                          width: '100%',
                          minHeight: '54px',
                          borderRadius: '12px',
                          backgroundColor: '#8B5CF6',
                          color: 'white',
                          border: 'none',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <PackageCheck size={22} />
                        COMPLETA / ARCHIVIA
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KdsBoard;
