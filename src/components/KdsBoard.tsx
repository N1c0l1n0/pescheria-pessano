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
  PlusCircle,
  ShoppingBag,
  Truck,
  User,
  Phone,
  RefreshCw,
  Sparkles,
  ChefHat
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

export const KdsBoard: React.FC = () => {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'TUTTI' | 'RITIRO' | 'CONSEGNA'>('TUTTI');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Track checked ingredients per order and item (key: `${orderId}_${itemIdx}_${ingCategory}_${ingName}`)
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  // Audio Context for Beep sound notification
  const playAudioBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Play a double chime (High frequency beep for kitchen alert)
      const now = ctx.currentTime;
      
      // First beep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5 note
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.25); // D6 note
      gain2.gain.setValueAtTime(0.4, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.55);

    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }, []);

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

  // Initial Mock Orders fallback in case database is empty
  const getMockOrders = (): KdsOrder[] => [
    {
      id: '101',
      display_id: '#101',
      status: 'RICEVUTO',
      customer_name: 'Marco Rossi',
      phone: '334 1234567',
      order_type: 'Ritiro',
      total_price: 15.00,
      created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      notes: 'Salsa Teriyaki a parte per favore',
      order_items: [
        {
          item_name: 'Poke XL',
          size: 'XL',
          bases: ['Riso Sushi', 'Riso Venere'],
          proteins: ['Salmone', 'Tonno', 'Gamberi'],
          toppings: ['Avocado', 'Edamame', 'Mango', 'Alga Nori', 'Cetrioli'],
          sauces: ['Teriyaki', 'Maionese Spaziata'],
          has_sesame: true
        }
      ]
    },
    {
      id: '102',
      display_id: '#102',
      status: 'IN_PREPARAZIONE',
      customer_name: 'Sara Bianchi',
      phone: '347 9876543',
      order_type: 'Consegna',
      delivery_address: 'Via Garibaldi 14, Finale Ligure',
      total_price: 24.00,
      created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      notes: 'Citofonare Bianchi - 2° piano',
      order_items: [
        {
          item_name: 'Poke Regular + 1 Proteina',
          size: 'Regular',
          bases: ['Riso Sushi'],
          proteins: ['Salmone', 'Polpo'],
          toppings: ['Avocado', 'Wakame', 'Ananas'],
          sauces: ['Soy Sauce'],
          has_sesame: true
        },
        {
          item_name: 'Poke Regular',
          size: 'Regular',
          bases: ['Insalata Misticanza'],
          proteins: ['Tofu Bio'],
          toppings: ['Pomodorini', 'Mais', 'Carote'],
          sauces: ['Ponzu'],
          has_sesame: false
        }
      ]
    },
    {
      id: '103',
      display_id: '#103',
      status: 'PRONTO',
      customer_name: 'Luca Moretti',
      phone: '320 5554433',
      order_type: 'Ritiro',
      total_price: 12.00,
      created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      notes: '',
      order_items: [
        {
          item_name: 'Poke Regular + 1 Proteina',
          size: 'Regular',
          bases: ['Riso Venere'],
          proteins: ['Salmone', 'Gamberi'],
          toppings: ['Edamame', 'Cipolla Croccante', 'Philadelphia'],
          sauces: ['Maionese Spicy'],
          has_sesame: true
        }
      ]
    }
  ];

  // Fetch active orders from Supabase DB
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          customer_name,
          phone,
          order_type,
          delivery_address,
          total_price,
          created_at,
          notes,
          order_items (
            id,
            item_name,
            size,
            bases,
            proteins,
            toppings,
            sauces,
            has_sesame,
            notes,
            price,
            quantity
          )
        `)
        .neq('status', 'COMPLETATO')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetch error, fallback to mock state:', error.message);
        setOrders(getMockOrders());
      } else if (data && data.length > 0) {
        const formatted: KdsOrder[] = data.map((o: any) => ({
          id: String(o.id),
          display_id: `#${String(o.id).slice(-4).toUpperCase()}`,
          status: o.status || 'RICEVUTO',
          customer_name: o.customer_name || 'Cliente',
          phone: o.phone,
          order_type: o.order_type || 'Ritiro',
          delivery_address: o.delivery_address,
          total_price: Number(o.total_price || 0),
          created_at: o.created_at || new Date().toISOString(),
          notes: o.notes,
          order_items: Array.isArray(o.order_items) ? o.order_items : []
        }));
        setOrders(formatted);
      } else {
        // If DB is empty, provide demo orders so staff can test
        setOrders(getMockOrders());
      }
    } catch (e) {
      console.warn('DB connect exception, using demo orders:', e);
      setOrders(getMockOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  // Supabase Realtime Subscription
  useEffect(() => {
    fetchOrders();

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
            fetchOrders();
          } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, playAudioBeep]);

  // Update order status handler
  const handleUpdateStatus = async (orderId: string, newStatus: 'IN_PREPARAZIONE' | 'PRONTO' | 'COMPLETATO') => {
    // Optimistic UI update
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        .filter((o) => o.status !== 'COMPLETATO')
    );

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

  // Add Demo Order (For testing / demonstration)
  const handleAddDemoOrder = () => {
    const newId = String(Math.floor(100 + Math.random() * 900));
    const demoCustomerNames = ['Andrea Neri', 'Elena Conti', 'Giuseppe Verdi', 'Laura Riva', 'Matteo Costa'];
    const randomName = demoCustomerNames[Math.floor(Math.random() * demoCustomerNames.length)];
    const isDelivery = Math.random() > 0.5;

    const newOrder: KdsOrder = {
      id: newId,
      display_id: `#${newId}`,
      status: 'RICEVUTO',
      customer_name: randomName,
      phone: '333 ' + Math.floor(1000000 + Math.random() * 9000000),
      order_type: isDelivery ? 'Consegna' : 'Ritiro',
      delivery_address: isDelivery ? 'Corso Italia 45, Finale Ligure' : undefined,
      total_price: 15.00,
      created_at: new Date().toISOString(),
      notes: 'Torta di pesce o poke super fresca!',
      order_items: [
        {
          item_name: 'Poke XL',
          size: 'XL',
          bases: ['Riso Sushi'],
          proteins: ['Salmone', 'Tonno'],
          toppings: ['Avocado', 'Edamame', 'Wakame'],
          sauces: ['Teriyaki', 'Maionese Spaziata'],
          has_sesame: true
        }
      ]
    };

    setOrders((prev) => [newOrder, ...prev]);
    playAudioBeep();
  };

  // Toggle ingredient checklist item
  const toggleIngredient = (key: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculate dynamic elapsed time in minutes
  const getElapsedMinutes = (createdAtStr: string): number => {
    const created = new Date(createdAtStr).getTime();
    const now = Date.now();
    const diffMs = now - created;
    return Math.max(0, Math.floor(diffMs / (1000 * 60)));
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

          {/* Test Beep Sound Button */}
          <button
            type="button"
            onClick={playAudioBeep}
            title="Test Segnale Audio"
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#FACC15',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Volume2 size={18} />
          </button>

          {/* Add Demo Order Button */}
          <button
            type="button"
            onClick={handleAddDemoOrder}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              backgroundColor: '#10B981',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <PlusCircle size={16} /> + Ordine Demo
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
            <p style={{ color: '#94A3B8', maxWidth: '500px', margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>
              Tutti gli ordini in coda sono stati preparati e completati. Clicca "+ Ordine Demo" per simulare un nuovo ordine in entrata!
            </p>
            <button
              type="button"
              onClick={handleAddDemoOrder}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                backgroundColor: '#FF6B6B',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <PlusCircle size={20} /> Crea Ordine di Prova
            </button>
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
              const elapsedMin = getElapsedMinutes(ord.created_at);

              // Timer Color Coding
              // Verde < 5 min, Giallo 5-10 min, Rosso > 10 min
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

              const isDelivery = ord.order_type.toLowerCase().includes('consegna');

              return (
                <div
                  key={ord.id}
                  style={{
                    backgroundColor: '#1E293B',
                    borderRadius: '16px',
                    border: isUrgent
                      ? '2px solid #EF4444'
                      : ord.status === 'IN_PREPARAZIONE'
                      ? '2px solid #3B82F6'
                      : ord.status === 'PRONTO'
                      ? '2px solid #10B981'
                      : '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: isUrgent
                      ? '0 0 20px rgba(239, 68, 68, 0.3)'
                      : '0 8px 24px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* CARD HEADER */}
                  <div
                    style={{
                      padding: '1rem 1.15rem',
                      backgroundColor: '#0F172A',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '0.02em' }}>
                          {ord.display_id || `#${ord.id}`}
                        </span>
                        
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
                      </div>

                      {/* Customer Name & Phone */}
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F1F5F9', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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

                    {/* Dynamic Timer Badge */}
                    <div
                      style={{
                        backgroundColor: timerBg,
                        border: `1px solid ${timerBorder}`,
                        color: timerText,
                        padding: '0.4rem 0.75rem',
                        borderRadius: '10px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.95rem', fontWeight: 800 }}>
                        <Clock size={14} />
                        <span>{elapsedMin} min</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>
                        in attesa
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
                                        onClick={() => toggleIngredient(key)}
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
                                        onClick={() => toggleIngredient(key)}
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
                                        onClick={() => toggleIngredient(key)}
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
                                        onClick={() => toggleIngredient(key)}
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
                                      onClick={() => toggleIngredient(key)}
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
                        onClick={() => handleUpdateStatus(ord.id, 'IN_PREPARAZIONE')}
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
                        onClick={() => handleUpdateStatus(ord.id, 'PRONTO')}
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
                        onClick={() => handleUpdateStatus(ord.id, 'COMPLETATO')}
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
