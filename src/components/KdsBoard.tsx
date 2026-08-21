import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Focus,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalOrders, updateLocalOrderStatus, subscribeToLocalOrders } from '../utils/orderStore';
import {
  type KdsOrder,
  type KdsOrderItem,
  type HistoryPeriod,
  mapSupabaseOrderToKdsOrder,
  mapLocalOrderToKdsOrder,
  getHistoryDateRange,
  formatOrderDateTime,
  HISTORY_PAGE_SIZE,
} from '../utils/orderMappers';
import { sendOrderStatusNotification } from '../lib/onesignal';

export type { KdsOrder, KdsOrderItem };

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

const normalizePhoneForWhatsApp = (phone: string): string | null => {
  if (!phone?.trim()) return null;

  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.length === 10 && digits.startsWith('3')) {
    digits = `39${digits}`;
  } else if (digits.startsWith('0')) {
    digits = `39${digits.slice(1)}`;
  }

  return digits.length >= 9 ? digits : null;
};

const buildOrderReadyWhatsAppUrl = (order: KdsOrder): string | null => {
  const phone = normalizePhoneForWhatsApp(order.phone || '');
  if (!phone) return null;

  const displayId = order.display_id || `#${order.id}`;
  const isDelivery = order.order_type?.toLowerCase().includes('consegna');
  const message = isDelivery
    ? `Ciao ${order.customer_name}, il tuo ordine ${displayId} è pronto! Stiamo preparando la consegna. — Pescheria Pessano`
    : `Ciao ${order.customer_name}, il tuo ordine ${displayId} è pronto! Puoi passare a ritirarlo. — Pescheria Pessano`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const KdsBoard: React.FC = () => {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [boardView, setBoardView] = useState<'active' | 'history'>('active');
  const [activeFilter, setActiveFilter] = useState<'TUTTI' | 'RITIRO' | 'CONSEGNA'>('TUTTI');
  const [historyOrders, setHistoryOrders] = useState<KdsOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyPage, setHistoryPage] = useState<number>(0);
  const [historyHasMore, setHistoryHasMore] = useState<boolean>(false);
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>('7days');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const orderCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mainRef = useRef<HTMLElement | null>(null);

  const focusOrder = useCallback((orderId: string | null) => {
    setFocusedOrderId(orderId);
    if (orderId) {
      requestAnimationFrame(() => {
        const card = orderCardRefs.current[orderId];
        const main = mainRef.current;
        if (!card || !main) return;

        const cardRect = card.getBoundingClientRect();
        const mainRect = main.getBoundingClientRect();
        const targetTop = cardRect.top - mainRect.top + main.scrollTop - 16;
        main.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
      });
    }
  }, []);

  const clearFocus = useCallback(() => setFocusedOrderId(null), []);

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
        remoteOrders = data.map((o) => mapSupabaseOrderToKdsOrder(o as Record<string, unknown>));
      }

      // Combine with local orders (for instant offline / dev persistence)
      const localList = getLocalOrders()
        .filter((o) => o.status !== 'COMPLETATO')
        .map((o) => mapLocalOrderToKdsOrder(o));

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

  const fetchHistoryOrders = useCallback(async (page = 0, append = false) => {
    try {
      setHistoryLoading(true);
      const { start, end } = getHistoryDateRange(historyPeriod);
      const from = page * HISTORY_PAGE_SIZE;
      const to = from + HISTORY_PAGE_SIZE - 1;

      let query = supabase
        .from('orders')
        .select('*, order_items(*)', { count: 'exact' })
        .eq('status', 'COMPLETATO')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .range(from, to);

      const search = historySearch.trim();
      if (search) {
        const pattern = `%${search}%`;
        query = query.or(
          `customer_name.ilike.${pattern},customer_phone.ilike.${pattern},friendly_id.ilike.${pattern}`
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.warn('History fetch failed:', error.message);
        if (!append) setHistoryOrders([]);
        setHistoryHasMore(false);
        return;
      }

      const mapped = (data || []).map((o) => mapSupabaseOrderToKdsOrder(o as Record<string, unknown>));
      setHistoryOrders((prev) => (append ? [...prev, ...mapped] : mapped));
      setHistoryHasMore(count !== null ? from + mapped.length < count : mapped.length === HISTORY_PAGE_SIZE);
      setHistoryPage(page);
    } catch (e) {
      console.warn('History fetch exception:', e);
      if (!append) setHistoryOrders([]);
      setHistoryHasMore(false);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPeriod, historySearch]);

  // Supabase Realtime & Local Store Subscription (active board only)
  useEffect(() => {
    if (boardView !== 'active') return;

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
            const newOrder = payload.new as { status?: string };
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
  }, [fetchOrders, playAudioBeep, boardView]);

  // Load history on-demand when switching to history tab or changing filters
  useEffect(() => {
    if (boardView !== 'history') return;
    fetchHistoryOrders(0, false);
  }, [boardView, historyPeriod, historySearch, fetchHistoryOrders]);

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

    if (newStatus === 'COMPLETATO') {
      clearFocus();
      setCheckedIngredients((prev) => {
        const prefix = `${orderId}_`;
        return Object.fromEntries(Object.entries(prev).filter(([key]) => !key.startsWith(prefix)));
      });
    } else if (newStatus === 'IN_PREPARAZIONE') {
      focusOrder(orderId);
    }

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

  // Toggle ingredient checklist item (switches focus to that order if needed)
  const toggleIngredient = (orderId: string, key: string) => {
    if (focusedOrderId !== orderId) focusOrder(orderId);
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

  const filteredHistoryOrders = historyOrders.filter((o) => {
    if (activeFilter === 'RITIRO') return o.order_type.toLowerCase().includes('ritiro');
    if (activeFilter === 'CONSEGNA') return o.order_type.toLowerCase().includes('consegna');
    return true;
  });

  const toggleHistoryExpanded = (orderId: string) => {
    setExpandedHistoryIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const switchBoardView = (view: 'active' | 'history') => {
    setBoardView(view);
    if (view === 'active') {
      setExpandedHistoryIds({});
    } else {
      clearFocus();
    }
  };

  // Drop focus when the order disappears or is hidden by the active filter
  useEffect(() => {
    if (!focusedOrderId) return;
    const stillVisible = filteredOrders.some((o) => o.id === focusedOrderId);
    if (!stillVisible) setFocusedOrderId(null);
  }, [filteredOrders, focusedOrderId]);

  // Escape or click outside cards to clear focus
  useEffect(() => {
    if (!focusedOrderId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearFocus();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-kds-order-card]')) return;
      clearFocus();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [focusedOrderId, clearFocus]);

  // Counters
  const countRicevuto = orders.filter((o) => o.status === 'RICEVUTO').length;
  const countInPrep = orders.filter((o) => o.status === 'IN_PREPARAZIONE').length;
  const countPronto = orders.filter((o) => o.status === 'PRONTO').length;

  return (
    <div
      style={{
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
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
          flexDirection: 'column',
          gap: '0.75rem',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Row 1: branding + utilities (fixed, never wraps away from each other) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                }}
              >
                <img
                  src="/logo_pescheria.png"
                  alt="Pescheria Pessano Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em', color: 'white' }}>
                  PESCHERIA PESSANO
                </h1>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kitchen Display System (KDS)
                </span>
              </div>
            </div>

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
                flexShrink: 0,
              }}
            >
              <Clock size={18} />
              <span>{currentTime || '00:00:00'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                unlockAudio();
                playAudioBeep();
              }}
              title={audioUnlocked ? 'Suono Abilitato (Clicca per Test Audio)' : 'Audio in attesa di sblocco dal browser. Clicca per sbloccare!'}
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
              <span>{audioUnlocked ? 'Audio Attivo' : 'Attiva Audio'}</span>
            </button>

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
        </div>

        {/* Row 2: toolbar — view toggle, filters, counters/history (always together) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap',
            rowGap: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', backgroundColor: '#1E293B', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(148, 163, 184, 0.2)', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => switchBoardView('active')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: boardView === 'active' ? '#3B82F6' : 'transparent',
                color: boardView === 'active' ? 'white' : '#94A3B8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              Attivi
            </button>
            <button
              type="button"
              onClick={() => switchBoardView('history')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: boardView === 'history' ? '#8B5CF6' : 'transparent',
                color: boardView === 'history' ? 'white' : '#94A3B8',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <History size={14} />
              Storico
            </button>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#1E293B', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(148, 163, 184, 0.2)', flexShrink: 0 }}>
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
              }}
            >
              Tutti ({boardView === 'active' ? orders.length : filteredHistoryOrders.length})
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
              }}
            >
              Solo Consegne
            </button>
          </div>

          {boardView === 'active' ? (
            <>
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
                  flexShrink: 0,
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
                  flexShrink: 0,
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
                  flexShrink: 0,
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ADE80' }} />
                {countPronto} Pronti
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', backgroundColor: '#1E293B', borderRadius: '8px', padding: '0.25rem', border: '1px solid rgba(148, 163, 184, 0.2)', flexShrink: 0 }}>
                {(['today', '7days', '30days'] as HistoryPeriod[]).map((period) => {
                  const labels: Record<HistoryPeriod, string> = { today: 'Oggi', '7days': '7 giorni', '30days': '30 giorni' };
                  return (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setHistoryPeriod(period)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: historyPeriod === period ? '#8B5CF6' : 'transparent',
                        color: historyPeriod === period ? 'white' : '#94A3B8',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      {labels[period]}
                    </button>
                  );
                })}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 200px', minWidth: '180px', maxWidth: '320px' }}>
                <Search size={16} color="#64748B" style={{ position: 'absolute', left: '0.65rem', pointerEvents: 'none' }} />
                <input
                  type="search"
                  placeholder="Cerca cliente, telefono, ID..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.75rem 0.4rem 2rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    backgroundColor: '#1E293B',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </header>

      {/* KDS MAIN MONITOR CONTENT */}
      <main ref={mainRef} style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', minHeight: 0 }}>
        {boardView === 'history' ? (
          historyLoading && historyOrders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
              <RefreshCw size={36} className="animate-spin" color="#A78BFA" />
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94A3B8' }}>Caricamento storico ordini...</span>
            </div>
          ) : filteredHistoryOrders.length === 0 ? (
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
              <History size={56} color="#8B5CF6" style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                Nessun ordine completato
              </h2>
              <p style={{ color: '#94A3B8', maxWidth: '500px', margin: 0, fontSize: '0.95rem' }}>
                Non ci sono ordini archiviati nel periodo selezionato{historySearch.trim() ? ' per la ricerca inserita' : ''}.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredHistoryOrders.map((ord) => {
                  const isExpanded = !!expandedHistoryIds[ord.id];
                  const isDelivery = ord.order_type.toLowerCase().includes('consegna');
                  const itemSummary = ord.order_items
                    .map((item) => `${item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}${item.item_name}`)
                    .join(' · ');

                  return (
                    <div
                      key={ord.id}
                      style={{
                        backgroundColor: '#1E293B',
                        borderRadius: '14px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleHistoryExpanded(ord.id)}
                        style={{
                          width: '100%',
                          padding: '1rem 1.15rem',
                          backgroundColor: '#0F172A',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{ord.display_id || `#${ord.id}`}</span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                backgroundColor: isDelivery ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: isDelivery ? '#38BDF8' : '#FBBF24',
                              }}
                            >
                              {isDelivery ? <Truck size={11} /> : <ShoppingBag size={11} />}
                              {ord.order_type}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
                              {formatOrderDateTime(ord.created_at)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.95rem' }}>
                            <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <User size={14} color="#94A3B8" />
                              {ord.customer_name}
                            </span>
                            {ord.phone && (
                              <span style={{ color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Phone size={13} />
                                {ord.phone}
                              </span>
                            )}
                            <span style={{ color: '#4ADE80', fontWeight: 800 }}>
                              €{ord.total_price.toFixed(2)}
                            </span>
                          </div>
                          {!isExpanded && itemSummary && (
                            <p style={{ margin: '0.45rem 0 0', color: '#94A3B8', fontSize: '0.85rem', lineHeight: 1.4 }}>
                              {itemSummary}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <a
                            href={`/ordine/${ord.display_id || ord.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Apri tracking ordine"
                            style={{
                              padding: '0.4rem 0.65rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.35)',
                              color: '#60A5FA',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            <ExternalLink size={14} />
                            Tracking
                          </a>
                          {isExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div style={{ padding: '0.85rem 1.15rem 1.15rem', borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
                          {(ord.delivery_address || ord.notes) && (
                            <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {ord.delivery_address && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38BDF8' }}>
                                  <Truck size={13} />
                                  {ord.delivery_address}
                                </div>
                              )}
                              {ord.notes && <div style={{ color: '#FACC15', fontStyle: 'italic' }}>{ord.notes}</div>}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {ord.order_items.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                style={{
                                  padding: '0.65rem 0.85rem',
                                  borderRadius: '8px',
                                  backgroundColor: '#0F172A',
                                  border: '1px solid rgba(148, 163, 184, 0.12)',
                                  fontSize: '0.9rem',
                                }}
                              >
                                <div style={{ fontWeight: 800, color: '#F1F5F9', marginBottom: '0.25rem' }}>
                                  {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}
                                  {item.item_name}
                                  {item.price ? ` — €${(item.price * (item.quantity || 1)).toFixed(2)}` : ''}
                                </div>
                                {item.item_type === 'poke' && (
                                  <div style={{ color: '#94A3B8', fontSize: '0.8rem', lineHeight: 1.5 }}>
                                    {[item.bases?.length ? `Basi: ${item.bases.join(', ')}` : null,
                                      item.proteins?.length ? `Proteine: ${item.proteins.join(', ')}` : null,
                                      item.toppings?.length ? `Topping: ${item.toppings.join(', ')}` : null,
                                      item.sauces?.length ? `Salse: ${item.sauces.join(', ')}` : null]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </div>
                                )}
                                {item.item_type === 'pesce' && (item.preparation || item.weight_grams) && (
                                  <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                                    {[item.preparation, item.weight_grams ? `${item.weight_grams}g` : null].filter(Boolean).join(' · ')}
                                  </div>
                                )}
                                {item.notes && (
                                  <div style={{ marginTop: '0.25rem', color: '#FACC15', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                    {item.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  disabled={historyPage === 0 || historyLoading}
                  onClick={() => fetchHistoryOrders(historyPage - 1, false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    backgroundColor: historyPage === 0 ? 'rgba(30, 41, 59, 0.5)' : '#1E293B',
                    color: historyPage === 0 ? '#64748B' : 'white',
                    fontWeight: 700,
                    cursor: historyPage === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <ChevronLeft size={18} />
                  Precedente
                </button>
                <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.9rem' }}>
                  Pagina {historyPage + 1}
                </span>
                {historyHasMore && (
                  <button
                    type="button"
                    disabled={historyLoading}
                    onClick={() => fetchHistoryOrders(historyPage + 1, false)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      backgroundColor: '#1E293B',
                      color: 'white',
                      fontWeight: 700,
                      cursor: historyLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    Successiva
                    <ChevronRight size={18} />
                  </button>
                )}
                {historyHasMore && (
                  <button
                    type="button"
                    disabled={historyLoading}
                    onClick={() => fetchHistoryOrders(historyPage + 1, true)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      fontWeight: 700,
                      cursor: historyLoading ? 'wait' : 'pointer',
                    }}
                  >
                    Carica altri
                  </button>
                )}
              </div>
            </>
          )
        ) : loading ? (
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
              const isFocused = focusedOrderId === ord.id;
              const hasOtherFocus = focusedOrderId !== null && !isFocused;

              const statusBorder =
                timerInfo.isUrgent
                  ? '2px solid #EF4444'
                  : ord.status === 'IN_PREPARAZIONE'
                  ? '2px solid #3B82F6'
                  : ord.status === 'PRONTO'
                  ? '2px solid #10B981'
                  : '1px solid rgba(148, 163, 184, 0.2)';

              return (
                <div
                  key={ord.id}
                  ref={(el) => { orderCardRefs.current[ord.id] = el; }}
                  data-kds-order-card
                  data-focused={isFocused ? 'true' : 'false'}
                  className={[
                    isFocused ? 'kds-order-card--focused' : '',
                    hasOtherFocus ? 'kds-order-card--dimmed' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (!isFocused) focusOrder(ord.id);
                  }}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '16px',
                    border: statusBorder,
                    boxShadow: timerInfo.isUrgent
                      ? '0 0 20px rgba(239, 68, 68, 0.35)'
                      : '0 8px 24px rgba(0, 0, 0, 0.3)',
                    zIndex: isFocused ? 20 : 1,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    cursor: isFocused ? 'default' : 'pointer',
                  }}
                >
                  <div className="kds-order-card__inner">
                  {/* CARD HEADER — tap here to focus/unfocus */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={isFocused}
                    aria-label={isFocused ? `Ordine ${ord.display_id || ord.id} in lettura. Premi per uscire.` : `Metti ordine ${ord.display_id || ord.id} in lettura`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFocused) clearFocus();
                      else focusOrder(ord.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isFocused) clearFocus();
                        else focusOrder(ord.id);
                      }
                    }}
                    className={isFocused ? 'kds-order-header--focused' : undefined}
                    style={{
                      padding: '1rem 1.15rem',
                      backgroundColor: '#0F172A',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span
                          className={isFocused ? 'kds-order-id--focused' : undefined}
                          style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '0.02em' }}
                        >
                          {ord.display_id || `#${ord.id}`}
                        </span>

                        {/* Focus badge or hint */}
                        {isFocused ? (
                          <span className="kds-focus-badge">
                            <span className="kds-focus-badge__dot" aria-hidden="true" />
                            <Sparkles size={13} color="#0F172A" />
                            In lettura
                          </span>
                        ) : !focusedOrderId ? (
                          <span className="kds-focus-hint" title="Tocca per mettere in lettura">
                            <Focus size={11} />
                            Focus
                          </span>
                        ) : null}
                        
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
                          Note: {ord.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CARD BODY - INTERACTIVE CHECKLIST */}
                  <div style={{ padding: '1rem 1.15rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {ord.order_items.map((item, itemIdx) => {
                      const isFriedItem = item.item_type === 'fritto';
                      const isFishItem = item.item_type === 'pesce';
                      const isPokeItem = item.item_type === 'poke';

                      return (
                        <div
                          key={itemIdx}
                          style={{
                            backgroundColor: isFishItem ? 'rgba(14, 165, 233, 0.12)' : isFriedItem ? 'rgba(245, 158, 11, 0.12)' : '#0F172A',
                            borderRadius: '10px',
                            padding: '0.85rem',
                            border: isFishItem ? '1px solid rgba(14, 165, 233, 0.4)' : isFriedItem ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(148, 163, 184, 0.12)',
                          }}
                        >
                          {/* Item Title */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: isFishItem ? '#38BDF8' : isFriedItem ? '#FBBF24' : '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Sparkles size={16} />
                              {item.item_name || (isFishItem ? 'Pesce Fresco al Banco' : isFriedItem ? 'Cono Fritto Espresso' : 'Poke Custom')}
                            </span>
                            {item.quantity && item.quantity >= 1 && (
                              <span style={{ backgroundColor: isFishItem ? '#0284C7' : isFriedItem ? '#F59E0B' : '#EF4444', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                                x{item.quantity}
                              </span>
                            )}
                          </div>

                          {/* Ingredient Categories Checklist */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {/* PESCE FRESCO DETAILS CHECKLIST */}
                            {isFishItem && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                  {/* Preparation chip */}
                                  {(() => {
                                    const rawName = item.item_name || '';
                                    const prepName = item.preparation || (rawName.includes('-') ? rawName.split('-')[1]?.replace(']', '').replace(')', '').trim() : 'Eviscerato e desquamato');
                                    const key = `${ord.id}_${itemIdx}_prep_${prepName}`;
                                    const isChecked = !!checkedIngredients[key];
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleIngredient(ord.id, key);
                                        }}
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '6px',
                                          fontSize: '0.825rem',
                                          fontWeight: 700,
                                          border: isChecked ? '1px solid #059669' : '1px solid rgba(56, 189, 248, 0.4)',
                                          backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.25)' : 'rgba(56, 189, 248, 0.15)',
                                          color: isChecked ? '#6EE7B7' : '#38BDF8',
                                          textDecoration: isChecked ? 'line-through' : 'none',
                                          opacity: isChecked ? 0.5 : 1,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                        }}
                                      >
                                        <Check size={12} style={{ opacity: isChecked ? 1 : 0.4 }} />
                                        Pulizia: {prepName}
                                      </button>
                                    );
                                  })()}

                                  {/* Weight chip */}
                                  {(() => {
                                    const weightG = item.weight_grams;
                                    const weightLabel = weightG ? (weightG >= 1000 ? `${(weightG / 1000).toFixed(1)} kg` : `${weightG}g`) : null;
                                    if (!weightLabel) return null;
                                    const key = `${ord.id}_${itemIdx}_weight_${weightLabel}`;
                                    const isChecked = !!checkedIngredients[key];
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleIngredient(ord.id, key);
                                        }}
                                        style={{
                                          padding: '0.35rem 0.65rem',
                                          borderRadius: '6px',
                                          fontSize: '0.825rem',
                                          fontWeight: 700,
                                          border: isChecked ? '1px solid #059669' : '1px solid rgba(251, 191, 36, 0.4)',
                                          backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.25)' : 'rgba(251, 191, 36, 0.15)',
                                          color: isChecked ? '#6EE7B7' : '#FCD34D',
                                          textDecoration: isChecked ? 'line-through' : 'none',
                                          opacity: isChecked ? 0.5 : 1,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                        }}
                                      >
                                        <Check size={12} style={{ opacity: isChecked ? 1 : 0.4 }} />
                                        Peso: {weightLabel}
                                      </button>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* BASI */}
                            {isPokeItem && item.bases && item.bases.length > 0 && (
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
                                          toggleIngredient(ord.id, key);
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
                            {isPokeItem && item.proteins && item.proteins.length > 0 && (
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
                                          toggleIngredient(ord.id, key);
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
                            {isPokeItem && item.toppings && item.toppings.length > 0 && (
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
                                          toggleIngredient(ord.id, key);
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
                            {isPokeItem && item.sauces && item.sauces.length > 0 && (
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
                                          toggleIngredient(ord.id, key);
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

                            {/* SESAMO — solo per poke */}
                            {isPokeItem && item.has_sesame !== undefined && (
                              <div style={{ marginTop: '0.2rem' }}>
                                {(() => {
                                  const key = `${ord.id}_${itemIdx}_sesame`;
                                  const isChecked = !!checkedIngredients[key];
                                  return (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleIngredient(ord.id, key);
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
                                {isFishItem ? 'Nota Banco: ' : isFriedItem ? 'Nota Fritto: ' : 'Nota Poke: '}{item.notes}
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

                    {ord.status === 'PRONTO' && (() => {
                      const whatsappUrl = buildOrderReadyWhatsAppUrl(ord);

                      return (
                        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'stretch' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(ord.id, 'COMPLETATO');
                            }}
                            style={{
                              flex: 1,
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
                            ARCHIVIA
                          </button>

                          <a
                            href={whatsappUrl || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={whatsappUrl ? 'Avvisa il cliente su WhatsApp che l\'ordine è pronto' : 'Numero di telefono non disponibile'}
                            aria-label={whatsappUrl ? 'Avvisa il cliente su WhatsApp' : 'WhatsApp non disponibile: numero mancante'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!whatsappUrl) e.preventDefault();
                            }}
                            style={{
                              flexShrink: 0,
                              width: '54px',
                              minHeight: '54px',
                              borderRadius: '12px',
                              background: whatsappUrl
                                ? 'linear-gradient(145deg, #25D366 0%, #128C7E 100%)'
                                : 'rgba(148, 163, 184, 0.15)',
                              color: whatsappUrl ? 'white' : '#64748B',
                              border: whatsappUrl ? 'none' : '1px solid rgba(148, 163, 184, 0.25)',
                              cursor: whatsappUrl ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              boxShadow: whatsappUrl ? '0 4px 15px rgba(37, 211, 102, 0.45)' : 'none',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease',
                              opacity: whatsappUrl ? 1 : 0.55,
                            }}
                            onMouseEnter={(e) => {
                              if (!whatsappUrl) return;
                              e.currentTarget.style.transform = 'scale(1.04)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.55)';
                            }}
                            onMouseLeave={(e) => {
                              if (!whatsappUrl) return;
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.45)';
                            }}
                          >
                            <WhatsAppIcon size={26} />
                          </a>
                        </div>
                      );
                    })()}
                  </div>
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
