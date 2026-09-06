import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Check, AlertCircle, Sparkles, MessageCircle, Info, Trash2, PlusCircle, Edit3, RotateCcw, Waves, Anchor, Search, User, Phone, MapPin, Store, Bike, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalOrders, saveLocalOrder, subscribeToLocalOrders } from '../utils/orderStore';
import {
  mapLocalOrderToKdsOrder,
  mapSupabaseOrderToKdsOrder,
} from '../utils/orderMappers';
import { getDaySchedule, getQuickTimeOptionsForDate, isTimeInOpeningHours } from '../utils/openingHours';
import {
  MAX_POKE_PER_SLOT,
  buildSlotSummary,
  localDateKey,
  mergeCapacityOrders,
  occupancyBySlot,
  validatePokeSubmitSlot,
  findNextAvailableSlots,
  formatSlotFullError,
  type CapacityOrder,
} from '../utils/pokeSlotCapacity';
import { friedArrivalMessage } from '../utils/friedArrival';
import { AlarmTimePicker } from './AlarmTimePicker';
import { PokeSlotSummary } from './PokeSlotSummary';
import type { FishItem } from '../types/fishCatalog';
import { useFishCatalog } from '../hooks/useFishCatalog';
import { useCookieConsent } from '../context/CookieConsentContext';

type CategoryTabIconProps = {
  size?: number;
};

const categoryTabIconProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
});

/** Ciotola stilizzata per la poke. */
const PokeBowlIcon: React.FC<CategoryTabIconProps> = ({ size = 18 }) => (
  <svg {...categoryTabIconProps(size)}>
    <ellipse cx="12" cy="8" rx="9" ry="2.6" />
    <path d="M3 8c0 7 4 13 9 13s9-6 9-13" />
    <path d="M8 21h8" />
  </svg>
);

/** Cono stilizzato per i coni fritti. */
const FriedConeIcon: React.FC<CategoryTabIconProps> = ({ size = 18 }) => (
  <svg {...categoryTabIconProps(size)}>
    <ellipse cx="12" cy="6" rx="8" ry="2.5" />
    <path d="M4 6 12 22 20 6" />
  </svg>
);

interface FormatOption {
  id: string;
  name: string;
  price: number;
  maxBasi: number;
  maxProteine: number;
  maxSecondari: number;
  maxSalse: number;
}

const FORMATS: FormatOption[] = [
  {
    id: 'regular',
    name: 'Formato Regular',
    price: 10,
    maxBasi: 1,
    maxProteine: 1,
    maxSecondari: 3,
    maxSalse: 2,
  },
  {
    id: 'regularPlus',
    name: 'Formato Regular + 1 Proteina',
    price: 12,
    maxBasi: 1,
    maxProteine: 2,
    maxSecondari: 3,
    maxSalse: 2,
  },
  {
    id: 'xl',
    name: 'Formato XL',
    price: 15,
    maxBasi: 2,
    maxProteine: 3,
    maxSecondari: 5,
    maxSalse: 4,
  },
];

const BASI = [
  'Riso Bianco',
  'Riso Venere',
  'Insalata',
  'Metà Riso e Metà Insalata',
];

interface OptionItem {
  name: string;
  extraPrice: number;
}

const PROTEINE: OptionItem[] = [
  { name: 'Salmone Crudo', extraPrice: 0 },
  { name: 'Salmone Scottato', extraPrice: 0 },
  { name: 'Tonno Crudo', extraPrice: 0 },
  { name: 'Tonno Scottato', extraPrice: 0 },
  { name: 'Gambero Cotto', extraPrice: 0 },
  { name: 'Pollo Grigliato', extraPrice: 0 },
  { name: 'Tofu', extraPrice: 0 },
  { name: 'Gambero in Tempura', extraPrice: 1 },
  { name: 'Polpo', extraPrice: 1 },
  { name: 'Salmone in Tempura', extraPrice: 2 },
  { name: 'Tonno in Tempura', extraPrice: 2 },
];

const INGREDIENTI: OptionItem[] = [
  { name: 'Alghe Wakame', extraPrice: 0 },
  { name: 'Avocado', extraPrice: 0 },
  { name: 'Carota', extraPrice: 0 },
  { name: 'Cetriolo', extraPrice: 0 },
  { name: 'Cipolla Crispy', extraPrice: 0 },
  { name: 'Cipolla Rossa', extraPrice: 0 },
  { name: 'Edamame', extraPrice: 0 },
  { name: 'Granella di Nocciole', extraPrice: 0 },
  { name: 'Mais', extraPrice: 0 },
  { name: 'Mandorle', extraPrice: 0 },
  { name: 'Mozzarelline', extraPrice: 0 },
  { name: 'Nachos', extraPrice: 0 },
  { name: 'Philadelphia', extraPrice: 0 },
  { name: 'Pomodorini Datterini', extraPrice: 0 },
  { name: 'Scaglie di Cocco', extraPrice: 0 },
  { name: 'Scaglie di Grana', extraPrice: 0 },
  { name: 'Semi di Girasole', extraPrice: 0 },
  { name: 'Semi di Papavero', extraPrice: 0 },
  { name: 'Surimi', extraPrice: 0 },
  { name: 'Zenzero', extraPrice: 0 },
  { name: 'Zucchine Cotte', extraPrice: 0 },
  { name: 'Cipolla Caramellata', extraPrice: 1 },
  { name: 'Feta', extraPrice: 1 },
  { name: 'Granella di Pistacchio', extraPrice: 1 },
  { name: 'Mango', extraPrice: 1 },
  { name: 'Olive Taggiasche', extraPrice: 1 },
];

const SALSE: OptionItem[] = [
  { name: 'Glassa Balsamica', extraPrice: 0 },
  { name: 'Maionese', extraPrice: 0 },
  { name: 'Maio Spicy', extraPrice: 0 },
  { name: 'Maio Tabasco', extraPrice: 0 },
  { name: 'Miele', extraPrice: 0 },
  { name: 'Olio', extraPrice: 0 },
  { name: 'Olio Piccante', extraPrice: 0 },
  { name: 'Crema di Avocado', extraPrice: 0 },
  { name: 'Salsa Agrodolce', extraPrice: 0 },
  { name: 'Salsa Agropiccante', extraPrice: 0 },
  { name: 'Salsa Rosa', extraPrice: 0 },
  { name: 'Salsa Teryaki', extraPrice: 0 },
  { name: 'Salsa Yogurt', extraPrice: 0 },
  { name: 'Soia', extraPrice: 0 },
  { name: 'Spicy Mango', extraPrice: 0 },
  { name: 'Pesto', extraPrice: 1 },
];

export interface FriedProductOption {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  badge?: string;
}

export const FRIED_ITEMS: FriedProductOption[] = [
  {
    id: 'cono-calamari',
    name: 'Cono di Calamari',
    price: 12,
    description: 'Calamari veraci croccanti fritti al momento in olio ad alta temperatura.',
    image: '/fritti/cono_calamari.jpg',
    badge: 'I più richiesti',
  },
  {
    id: 'cono-misto',
    name: 'Cono Misto',
    price: 10,
    description: 'Calamari, paranza del giorno e gamberi dorati e croccanti.',
    image: '/fritti/cono_misto.jpg',
    badge: 'Classico Ligure',
  },
  {
    id: 'cono-acciughe',
    name: 'Cono di Acciughe',
    price: 7,
    description: 'Acciughe fresche del Mar Ligure aperte a libro e fritte dorate.',
    image: '/fritti/cono_acciughe.jpg',
    badge: 'Pescato Locale',
  },
];

export const FISH_PREPARATIONS = [
  { id: 'eviscerato', name: 'Eviscerato e desquamato', desc: 'Pronto per cottura al forno o alla griglia' },
  { id: 'sfilettato-pelle', name: 'Sfilettato (con pelle)', desc: 'Due filetti puliti ideali per padella o piastra' },
  { id: 'sfilettato-senza-pelle', name: 'Sfilettato (senza pelle)', desc: 'Filetti privi di pelle e lische' },
  { id: 'intero', name: 'Intero al naturale', desc: 'Pesce fresco intero non eviscerato' },
  { id: 'tranci', name: 'A tranci / fette', desc: 'Tagliato a tranci o fette pronte per la cottura' },
  { id: 'crudo', name: 'Pronto per crudo / tartare', desc: 'Abbattuto e pulito per consumo a crudo in sicurezza' },
];

export interface ConfiguredPoke {
  id: string;
  itemType?: 'poke';
  pokePersonName: string; // Name of person ordering this specific poke
  format: FormatOption;
  basi: string[];
  proteine: string[];
  ingredienti: string[];
  semiSesamo: boolean;
  salse: string[];
  notes?: string; // Special notes for this poke
  price: number;
}

export interface ConfiguredFriedItem {
  id: string;
  itemType: 'fritto';
  friedProductId: string;
  name: string;
  price: number; // Unit price
  quantity: number;
  personName?: string;
  notes?: string;
}

export interface ConfiguredFishItem {
  id: string;
  itemType: 'pesce';
  fishId: string;
  name: string;
  origin: string;
  pricePerKg: number;
  weightGrams: number;
  preparation: string;
  price: number; // Estimated total = pricePerKg * (weightGrams / 1000)
  personName?: string;
  notes?: string;
}

export type OrderCartItem = ConfiguredPoke | ConfiguredFriedItem | ConfiguredFishItem;

type SupabaseOrderItemPayload = {
  id: string;
  item_type: string;
  name: string;
  quantity: number;
  unit_price: number;
  details: Record<string, unknown>;
};

function generateOrderItemUUID(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSupabaseOrderItemPayload(item: OrderCartItem): SupabaseOrderItemPayload {
  const itemUUID = generateOrderItemUUID();
  if (item.itemType === 'fritto') {
    const displayName = item.personName ? `${item.name} (${item.personName})` : item.name;
    return {
      id: itemUUID,
      item_type: 'fritto',
      name: displayName,
      quantity: item.quantity,
      unit_price: item.price,
      details: {
        fried_product_id: item.friedProductId,
        person_name: item.personName || '',
        notes: item.notes || '',
      },
    };
  }
  if (item.itemType === 'pesce') {
    const weightLabel = item.weightGrams >= 1000 ? `${(item.weightGrams / 1000).toFixed(1)}kg` : `${item.weightGrams}g`;
    const displayName = `${item.name} [${weightLabel} - ${item.preparation}]`;
    return {
      id: itemUUID,
      item_type: 'pesce',
      name: displayName,
      quantity: 1,
      unit_price: item.price,
      details: {
        fish_id: item.fishId,
        origin: item.origin,
        price_per_kg: item.pricePerKg,
        weight_grams: item.weightGrams,
        preparation: item.preparation,
        person_name: item.personName || '',
        notes: item.notes || '',
      },
    };
  }
  return {
    id: itemUUID,
    item_type: 'poke',
    name: `Poke ${item.format.name} (${item.pokePersonName})`,
    quantity: 1,
    unit_price: item.price,
    details: {
      size: item.format.name,
      bases: item.basi,
      proteins: item.proteine,
      toppings: item.ingredienti,
      sauces: item.salse,
      has_sesame: item.semiSesamo,
      notes: item.notes || '',
    },
  };
}

const OrderStepHeader: React.FC<{
  step: number;
  title: string;
  subtitle?: string;
  count?: string;
}> = ({ step, title, subtitle, count }) => (
  <div className="order-step-header">
    <span className="order-step-num" aria-hidden>{step}</span>
    <div className="order-step-copy">
      <h3 className="order-step-title">{title}</h3>
      {subtitle ? <p className="order-step-sub">{subtitle}</p> : null}
    </div>
    {count ? <span className="order-count-pill">{count}</span> : null}
  </div>
);

export const PokeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pokePersonName, setPokePersonName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'Ritiro' | 'Consegna'>('Ritiro');
  const [pickupTime, setPickupTime] = useState('Prima possibile');
  const [selectedDay, setSelectedDay] = useState<'oggi' | 'domani'>('oggi');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>(FORMATS[0]);
  const [selectedBasi, setSelectedBasi] = useState<string[]>([]);
  const [selectedProteine, setSelectedProteine] = useState<string[]>([]);
  const [selectedIngredienti, setSelectedIngredienti] = useState<string[]>([]);
  const [semiSesamo, setSemiSesamo] = useState<boolean>(true);
  const [selectedSalse, setSelectedSalse] = useState<string[]>([]);
  const [pokeNotes, setPokeNotes] = useState<string>('');
  const [generalOrderNotes, setGeneralOrderNotes] = useState<string>('');

  const location = useLocation();
  const { items: fishCatalog, loading: fishCatalogLoading } = useFishCatalog();

  // Navigation Tab State: Poke vs Fritti Espresso vs Pesce Fresco
  const getInitialTab = (): 'poke' | 'fritti' | 'pesce' => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'pesce' || tabParam === 'fritti' || tabParam === 'poke') {
      return tabParam;
    }
    if (location.hash === '#pesce') return 'pesce';
    if (location.hash === '#fritti') return 'fritti';
    return 'poke';
  };

  const [activeTab, setActiveTab] = useState<'poke' | 'fritti' | 'pesce'>(getInitialTab);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'pesce' || tabParam === 'fritti' || tabParam === 'poke') {
      setActiveTab(tabParam);
    } else if (location.hash === '#pesce') {
      setActiveTab('pesce');
    } else if (location.hash === '#fritti') {
      setActiveTab('fritti');
    }
  }, [location.search, location.hash]);

  // Fried Item Selection Form State
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({
    'cono-calamari': 1,
    'cono-misto': 1,
    'cono-acciughe': 1,
  });

  // Fresh Fish Selection State
  const [cardFishWeights, setCardFishWeights] = useState<Record<string, number>>({
    'acciughe': 500,
    'tonno-pinna-gialla': 400,
    'pescatrice': 600,
    'polpo': 800,
    'triglia': 500,
    'nasello': 500,
    'calamari': 500,
    'branzino': 500,
    'pesce-spada': 400,
    'orata': 500,
    'rombo': 600,
  });
  const [cardFishPreps, setCardFishPreps] = useState<Record<string, string>>({});
  const [fishOriginFilter, setFishOriginFilter] = useState<'all' | 'Mar Ligure' | 'Medit. Occ.'>('all');
  const [fishSearchQuery, setFishSearchQuery] = useState<string>('');

  // List of added items (Pokes, Fritti & Pesce) for multi-item ordering
  const [orderList, setOrderList] = useState<OrderCartItem[]>([]);
  const [slotOccupancy, setSlotOccupancy] = useState<Record<string, number>>({});
  const [occupancyLoaded, setOccupancyLoaded] = useState(false);
  const cartPokeCount = orderList.filter((item) => item.itemType === 'poke').length;

  const occupancyDate = selectedDay === 'oggi'
    ? new Date()
    : (() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
      })();
  const occupancyDateKey = localDateKey(occupancyDate);

  // State for editing an existing poke
  const [editingPokeId, setEditingPokeId] = useState<string | null>(null);
  const isNextPokeName = cartPokeCount > 0 && editingPokeId === null;

  const slotSummary = useMemo(() => {
    const schedule = getDaySchedule(occupancyDate);
    const slotStarts = getQuickTimeOptionsForDate(occupancyDate);
    const rawTime = pickupTime.replace(/\s*\((Oggi|Domani|oggi|domani)\)/gi, '').trim();
    const isAsap = /prima possibile|asap/i.test(rawTime);
    const isClockTime = /^\d{1,2}:\d{2}$/.test(rawTime);
    const isCustomTime = !isAsap && isClockTime;

    return buildSlotSummary({
      pickupTime,
      selectedDay,
      dateKey: occupancyDateKey,
      slotStarts,
      slotOccupancy,
      cartPokeCount,
      occupancyLoaded,
      isDayClosed: schedule.isClosedAllDay,
      isCustomTime,
      customTimeValid: isCustomTime
        ? isTimeInOpeningHours(rawTime, occupancyDate)
        : undefined,
    });
  }, [
    occupancyDate,
    pickupTime,
    selectedDay,
    occupancyDateKey,
    slotOccupancy,
    cartPokeCount,
    occupancyLoaded,
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const { openPrivacyPolicy } = useCookieConsent();

  // Client-side best effort: concurrent submits can still overbook; durable enforcement needs a server check.
  const loadOccupancy = useCallback(async (): Promise<Record<string, number>> => {
    setOccupancyLoaded(false);
    let remote: CapacityOrder[] = [];
    const oldestOccupancyDate = new Date();
    oldestOccupancyDate.setHours(0, 0, 0, 0);
    oldestOccupancyDate.setDate(oldestOccupancyDate.getDate() - 2);
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, created_at, notes, order_items(item_type, quantity)')
      .gte('created_at', oldestOccupancyDate.toISOString())
      .limit(500);

    if (!error && data) {
      remote = data.map((order) =>
        mapSupabaseOrderToKdsOrder(order as Record<string, unknown>)
      );
    }

    const local = getLocalOrders()
      .map((order) => mapLocalOrderToKdsOrder(order));

    const occupancy = occupancyBySlot(mergeCapacityOrders(remote, local));
    setSlotOccupancy(occupancy);
    setOccupancyLoaded(true);
    return occupancy;
  }, []);

  useEffect(() => {
    void loadOccupancy();
  }, [loadOccupancy, selectedDay]);

  const occupancyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleOccupancyReload = useCallback(() => {
    if (occupancyDebounceRef.current) {
      clearTimeout(occupancyDebounceRef.current);
    }
    occupancyDebounceRef.current = setTimeout(() => {
      void loadOccupancy();
    }, 300);
  }, [loadOccupancy]);

  useEffect(() => {
    const unsubLocal = subscribeToLocalOrders(() => {
      scheduleOccupancyReload();
    });

    const channel = supabase
      .channel('poke_occupancy_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          scheduleOccupancyReload();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          scheduleOccupancyReload();
        }
      )
      .subscribe();

    return () => {
      unsubLocal();
      if (occupancyDebounceRef.current) {
        clearTimeout(occupancyDebounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [scheduleOccupancyReload]);

  const updateCardQty = (id: string, delta: number) => {
    setCardQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const updateCardFishWeight = (id: string, deltaGrams: number) => {
    setCardFishWeights((prev) => {
      const current = prev[id] || 500;
      const next = Math.min(10000, Math.max(100, current + deltaGrams));
      return { ...prev, [id]: next };
    });
  };

  const setCardFishWeightValue = (id: string, grams: number) => {
    const clamped = Math.min(10000, Math.max(100, Math.round(grams)));
    setCardFishWeights((prev) => ({ ...prev, [id]: clamped }));
  };

  const updateCardFishPrep = (id: string, prep: string) => {
    setCardFishPreps((prev) => ({ ...prev, [id]: prep }));
  };

  const handleAddFriedCardDirectly = (item: FriedProductOption) => {
    if (!customerPhone.trim()) {
      triggerValidationError('Inserisci il tuo Numero di Telefono prima di proseguire!', 'customerPhoneInput');
      return;
    }

    setValidationError(null);
    const qty = cardQuantities[item.id] || 1;

    const newFriedItem: ConfiguredFriedItem = {
      id: Date.now().toString(),
      itemType: 'fritto',
      friedProductId: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
    };

    setOrderList((prev) => [...prev, newFriedItem]);
    setSuccessMsg(`${item.name} (x${qty}) aggiunto all'ordine con successo!`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleAddFishCardDirectly = (item: FishItem) => {
    if (!customerPhone.trim()) {
      triggerValidationError('Inserisci il tuo Numero di Telefono prima di proseguire!', 'customerPhoneInput');
      return;
    }

    setValidationError(null);
    const weight = cardFishWeights[item.id] || 500;
    const prep = cardFishPreps[item.id] || FISH_PREPARATIONS[0].name;
    const estimatedPrice = Number(((item.pricePerKg * weight) / 1000).toFixed(2));

    const newFishItem: ConfiguredFishItem = {
      id: Date.now().toString(),
      itemType: 'pesce',
      fishId: item.id,
      name: item.name,
      origin: item.origin,
      pricePerKg: item.pricePerKg,
      weightGrams: weight,
      preparation: prep,
      price: estimatedPrice,
    };

    setOrderList((prev) => [...prev, newFishItem]);
    const weightLabel = weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight}g`;
    setSuccessMsg(`${item.name} (${weightLabel} - ${prep}) aggiunto al carrello!`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Handle format change and trim overflow selections
  const handleFormatChange = (fmt: FormatOption) => {
    setSelectedFormat(fmt);
    if (selectedBasi.length > fmt.maxBasi) setSelectedBasi(selectedBasi.slice(0, fmt.maxBasi));
    if (selectedProteine.length > fmt.maxProteine) setSelectedProteine(selectedProteine.slice(0, fmt.maxProteine));
    if (selectedIngredienti.length > fmt.maxSecondari) setSelectedIngredienti(selectedIngredienti.slice(0, fmt.maxSecondari));
    if (selectedSalse.length > fmt.maxSalse) setSelectedSalse(selectedSalse.slice(0, fmt.maxSalse));
  };

  // Toggle selection helpers
  const toggleSelection = (
    item: string,
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    maxLimit: number
  ) => {
    if (currentList.includes(item)) {
      setList(currentList.filter((i) => i !== item));
    } else {
      if (currentList.length < maxLimit) {
        setList([...currentList, item]);
      }
    }
  };

  // Calculate current single poke price
  const calculateCurrentPokePrice = (): number => {
    let total = selectedFormat.price;

    selectedProteine.forEach((pName) => {
      const found = PROTEINE.find((p) => p.name === pName);
      if (found) total += found.extraPrice;
    });

    selectedIngredienti.forEach((iName) => {
      const found = INGREDIENTI.find((i) => i.name === iName);
      if (found) total += found.extraPrice;
    });

    selectedSalse.forEach((sName) => {
      const found = SALSE.find((s) => s.name === sName);
      if (found) total += found.extraPrice;
    });

    return total;
  };

  const currentPokePrice = calculateCurrentPokePrice();

  const calculateGrandTotal = (): number => {
    return orderList.reduce((acc, item) => {
      if (item.itemType === 'fritto') {
        return acc + item.price * item.quantity;
      }
      return acc + item.price;
    }, 0);
  };

  const grandTotal = calculateGrandTotal();

  // Helper to show validation error, focus, and smooth scroll directly to missing field
  const triggerValidationError = (message: string, elementId?: string) => {
    setValidationError(message);
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus?.();
        }
      }, 50);
    }
  };

  // Add or Update configured Poke in order list
  const handleSavePokeToOrder = () => {
    const trimmedName = pokePersonName.trim();
    if (!trimmedName) {
      triggerValidationError('Inserisci il nome della persona per questa Poke!', 'customerNameInput');
      return;
    }
    if (!customerPhone.trim()) {
      triggerValidationError('Inserisci il tuo Numero di Telefono prima di proseguire!', 'customerPhoneInput');
      return;
    }
    if (selectedBasi.length === 0) {
      triggerValidationError(`Seleziona almeno 1 Base per la Poke di "${trimmedName}"!`, 'stepBasi');
      return;
    }
    if (selectedProteine.length === 0) {
      triggerValidationError(`Seleziona almeno 1 Proteina per la Poke di "${trimmedName}"!`, 'stepProteine');
      return;
    }
    if (!editingPokeId && cartPokeCount >= MAX_POKE_PER_SLOT) {
      triggerValidationError(
        'Massimo 10 poke per fascia di 20 minuti. Scegli un altro orario o invia questo ordine prima.',
        'ordine-invia'
      );
      return;
    }

    setValidationError(null);

    if (editingPokeId) {
      // Update existing Poke
      const updatedList = orderList.map((item) => {
        if (item.id === editingPokeId) {
          return {
            ...item,
            pokePersonName: trimmedName,
            format: selectedFormat,
            basi: [...selectedBasi],
            proteine: [...selectedProteine],
            ingredienti: [...selectedIngredienti],
            semiSesamo,
            salse: [...selectedSalse],
            notes: pokeNotes.trim() || undefined,
            price: currentPokePrice,
          };
        }
        return item;
      });

      setOrderList(updatedList);
      setEditingPokeId(null);

      // Reset form
      setPokePersonName('');
      setSelectedBasi([]);
      setSelectedProteine([]);
      setSelectedIngredienti([]);
      setSelectedSalse([]);
      setSemiSesamo(true);
      setPokeNotes('');

      setSuccessMsg(`Modifica per la Poke di "${trimmedName}" salvata con successo!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      // Add new Poke
      const newPoke: ConfiguredPoke = {
        id: Date.now().toString(),
        itemType: 'poke',
        pokePersonName: trimmedName,
        format: selectedFormat,
        basi: [...selectedBasi],
        proteine: [...selectedProteine],
        ingredienti: [...selectedIngredienti],
        semiSesamo,
        salse: [...selectedSalse],
        notes: pokeNotes.trim() || undefined,
        price: currentPokePrice,
      };

      setOrderList([...orderList, newPoke]);

      // Reset selections for next poke creation
      setPokePersonName('');
      setSelectedBasi([]);
      setSelectedProteine([]);
      setSelectedIngredienti([]);
      setSelectedSalse([]);
      setSemiSesamo(true);
      setPokeNotes('');

      setSuccessMsg(
        `Poke di "${trimmedName}" aggiunta all'ordine! I campi sono stati azzerati: puoi ora comporre un'altra Poke, aggiungere un cono fritto o inviare l'ordine completo.`
      );

      // Smooth scroll to form step 1
      document.getElementById('customerNameInput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => setSuccessMsg(null), 6000);
    }
  };



  // Edit a Poke from order list
  const handleEditPoke = (poke: ConfiguredPoke) => {
    setActiveTab('poke');
    setEditingPokeId(poke.id);
    setPokePersonName(poke.pokePersonName);
    setSelectedFormat(poke.format);
    setSelectedBasi([...poke.basi]);
    setSelectedProteine([...poke.proteine]);
    setSelectedIngredienti([...poke.ingredienti]);
    setSelectedSalse([...poke.salse]);
    setSemiSesamo(poke.semiSesamo);
    setPokeNotes(poke.notes || '');

    // Smooth scroll to top of configurator
    document.getElementById('customerNameInput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingPokeId(null);
    setPokePersonName('');
    setSelectedBasi([]);
    setSelectedProteine([]);
    setSelectedIngredienti([]);
    setSelectedSalse([]);
    setSemiSesamo(true);
    setPokeNotes('');
    setValidationError(null);
  };

  // Remove item from order list
  const handleRemovePoke = (id: string) => {
    if (editingPokeId === id) {
      handleCancelEdit();
    }
    const updated = orderList.filter((item) => item.id !== id);
    setOrderList(updated);
  };

  // Direct KDS Order Submission & Live Tracking Redirect
  const handleDirectOrderSubmit = async () => {
    let finalItems: OrderCartItem[] = [...orderList];

    if (!privacyAccepted) {
      triggerValidationError(
        'Devi confermare di aver letto l\'informativa privacy prima di inviare l\'ordine.',
        'privacyAcceptCheckbox',
      );
      return;
    }

    if (!customerPhone.trim()) {
      triggerValidationError('Inserisci il tuo Numero di Telefono prima di inviare l\'ordine!', 'customerPhoneInput');
      return;
    }

    if (orderType === 'Consegna' && !deliveryAddress.trim()) {
      triggerValidationError('Inserisci l\'indirizzo di consegna per procedere!', 'deliveryAddressInput');
      return;
    }

    // If orderList is empty but user configured current form, validate and auto add
    if (finalItems.length === 0) {
      if (activeTab === 'poke') {
        const trimmedName = pokePersonName.trim();
        if (!trimmedName) {
          triggerValidationError('Inserisci il nome referente per la Poke prima di procedere!', 'customerNameInput');
          return;
        }
        if (selectedBasi.length === 0) {
          triggerValidationError(`Seleziona almeno 1 Base per la Poke di "${trimmedName}"!`, 'stepBasi');
          return;
        }
        if (selectedProteine.length === 0) {
          triggerValidationError(`Seleziona almeno 1 Proteina per la Poke di "${trimmedName}"!`, 'stepProteine');
          return;
        }

        finalItems.push({
          id: Date.now().toString(),
          itemType: 'poke',
          pokePersonName: trimmedName,
          format: selectedFormat,
          basi: [...selectedBasi],
          proteine: [...selectedProteine],
          ingredienti: [...selectedIngredienti],
          semiSesamo,
          salse: [...selectedSalse],
          notes: pokeNotes.trim() || undefined,
          price: currentPokePrice,
        });
      } else {
        triggerValidationError(
          activeTab === 'fritti'
            ? 'Aggiungi almeno un cono fritto all\'ordine prima di inviare!'
            : 'Aggiungi almeno un articolo di pesce fresco all\'ordine prima di inviare!'
        );
        return;
      }
    }

    setValidationError(null);
    setIsSubmitting(true);

    const totalToPay = finalItems.reduce((acc, item) => {
      if (item.itemType === 'fritto') {
        return acc + item.price * item.quantity;
      }
      return acc + item.price;
    }, 0);

    const pokeCount = finalItems.filter((item) => item.itemType === 'poke').length;
    const latestOccupancy = await loadOccupancy();
    const slotStarts = getQuickTimeOptionsForDate(occupancyDate);
    let effectiveTime = pickupTime || 'Prima possibile';
    if (pokeCount > 0) {
      const validated = validatePokeSubmitSlot({
        pickupTime: effectiveTime,
        selectedDay,
        slotStarts,
        occupancy: latestOccupancy,
        dateKey: occupancyDateKey,
        cartPokeCount: pokeCount,
      });
      if (!validated.ok) {
        setIsSubmitting(false);
        triggerValidationError(validated.error, 'ordine-dati');
        return;
      }
      const formattedDay = selectedDay === 'oggi' ? 'Oggi' : 'Domani';
      effectiveTime = `${validated.time} (${formattedDay})`;
      setPickupTime(effectiveTime);
    }

    const firstItem = finalItems[0];
    let clientName = 'Cliente';
    if (firstItem.itemType === 'fritto' && firstItem.personName) {
      clientName = firstItem.personName;
    } else if (firstItem.itemType === 'pesce' && firstItem.personName) {
      clientName = firstItem.personName;
    } else if (firstItem.itemType === 'poke' && firstItem.pokePersonName) {
      clientName = firstItem.pokePersonName;
    } else if (pokePersonName.trim()) {
      clientName = pokePersonName.trim();
    }

    const combinedNotes = [
      `Orario: ${effectiveTime}`,
      generalOrderNotes.trim() ? `Note generali: ${generalOrderNotes.trim()}` : null,
    ].filter(Boolean).join(' — ');

    let insertedOrderId: string | null = null;
    const generatedFriendlyId = `#${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      if (pokeCount > 0) {
        const itemsPayload = finalItems.map(buildSupabaseOrderItemPayload);

        const { data: rpcResult, error: rpcErr } = await supabase.rpc('submit_poke_order', {
          p_friendly_id: generatedFriendlyId,
          p_customer_name: clientName,
          p_customer_phone: customerPhone.trim(),
          p_order_type: orderType,
          p_status: 'RICEVUTO',
          p_total_price: totalToPay,
          p_notes: combinedNotes,
          p_delivery_address: orderType === 'Consegna' ? deliveryAddress.trim() : null,
          p_poke_count: pokeCount,
          p_items: itemsPayload,
        });

        if (rpcErr) {
          console.error('submit_poke_order RPC error:', rpcErr);
          setIsSubmitting(false);
          triggerValidationError(
            'Impossibile inviare l\'ordine. Riprova tra qualche secondo.',
            'ordine-invia'
          );
          return;
        }

        const result = rpcResult as {
          ok: boolean;
          code?: string;
          order_id?: string;
          friendly_id?: string;
          slot?: string;
          slot_end?: string;
          requested?: number;
        };

        if (!result?.ok) {
          setIsSubmitting(false);
          if (result.code === 'SLOT_FULL') {
            const slotEnd = result.slot_end || '';
            const alternatives = findNextAvailableSlots({
              slotStarts,
              occupancy: latestOccupancy,
              dateKey: occupancyDateKey,
              minSeats: pokeCount,
              afterSlot: result.slot,
              limit: 3,
            });
            triggerValidationError(
              formatSlotFullError({
                slotStart: result.slot || '',
                slotEnd,
                cartPokeCount: pokeCount,
                alternatives,
              }),
              'ordine-dati'
            );
          } else {
            triggerValidationError(
              'Impossibile inviare l\'ordine. Riprova tra qualche secondo.',
              'ordine-invia'
            );
          }
          return;
        }

        insertedOrderId = result.order_id ? String(result.order_id) : null;
      } else {
        const { data: insertedOrder, error: orderErr } = await supabase
          .from('orders')
          .insert([
            {
              friendly_id: generatedFriendlyId,
              status: 'RICEVUTO',
              customer_name: clientName,
              customer_phone: customerPhone.trim(),
              order_type: orderType,
              delivery_address: orderType === 'Consegna' ? deliveryAddress.trim() : null,
              total_amount: totalToPay,
              notes: combinedNotes,
            },
          ])
          .select()
          .single();

        if (orderErr) {
          console.warn('Supabase orders insert notice:', orderErr.message || orderErr);
        } else if (insertedOrder && insertedOrder.id !== undefined && insertedOrder.id !== null) {
          insertedOrderId = String(insertedOrder.id);
        }

        if (insertedOrderId) {
          const numericOrderId = !isNaN(Number(insertedOrderId)) ? Number(insertedOrderId) : insertedOrderId;
          const itemsPayload = finalItems.map((item) => ({
            ...buildSupabaseOrderItemPayload(item),
            order_id: numericOrderId,
          }));

          const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
          if (itemsErr) {
            console.warn('Supabase order_items insert notice:', itemsErr.message || itemsErr);
          }
        }
      }
    } catch (e) {
      console.error('Error submitting order to Supabase:', e);
      if (pokeCount > 0) {
        setIsSubmitting(false);
        triggerValidationError(
          'Impossibile inviare l\'ordine. Riprova tra qualche secondo.',
          'ordine-invia'
        );
        return;
      }
    }

    // 3. Fallback / Synchronize to local orderStore so KDS & OrderTracking ALWAYS work 100%
    const finalOrderId = insertedOrderId || `PESS-${Date.now().toString().slice(-6)}`;

    saveLocalOrder({
      id: finalOrderId,
      display_id: `#${finalOrderId.slice(-4).toUpperCase()}`,
      status: 'RICEVUTO',
      customer_name: clientName,
      phone: customerPhone.trim(),
      order_type: orderType,
      delivery_address: orderType === 'Consegna' ? deliveryAddress.trim() : undefined,
      total_price: totalToPay,
      created_at: new Date().toISOString(),
      notes: combinedNotes,
      order_items: finalItems.map((item) => {
        const itemUUID = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        if (item.itemType === 'fritto') {
          const displayName = item.personName ? `${item.name} (${item.personName})` : item.name;
          return {
            id: itemUUID,
            item_name: displayName,
            name: displayName,
            quantity: item.quantity,
            unit_price: item.price,
            price: item.price * item.quantity,
            notes: item.notes || '',
            details: {
              item_type: 'fritto',
              notes: item.notes || '',
              person_name: item.personName || '',
            },
          };
        } else if (item.itemType === 'pesce') {
          const weightLabel = item.weightGrams >= 1000 ? `${(item.weightGrams / 1000).toFixed(1)}kg` : `${item.weightGrams}g`;
          const displayName = `${item.name} (${weightLabel} - ${item.preparation})`;
          return {
            id: itemUUID,
            item_name: displayName,
            name: displayName,
            quantity: 1,
            unit_price: item.price,
            price: item.price,
            notes: item.notes || '',
            details: {
              item_type: 'pesce',
              origin: item.origin,
              weight_grams: item.weightGrams,
              preparation: item.preparation,
              price_per_kg: item.pricePerKg,
              person_name: item.personName || '',
              notes: item.notes || '',
            },
          };
        } else {
          const displayName = `Poke ${item.format.name} (${item.pokePersonName})`;
          return {
            id: itemUUID,
            item_name: displayName,
            name: displayName,
            size: item.format.name,
            bases: item.basi,
            proteins: item.proteine,
            toppings: item.ingredienti,
            sauces: item.salse,
            has_sesame: item.semiSesamo,
            notes: item.notes || '',
            price: item.price,
            unit_price: item.price,
            quantity: 1,
            details: {
              size: item.format.name,
              bases: item.basi,
              proteins: item.proteine,
              toppings: item.ingredienti,
              sauces: item.salse,
              has_sesame: item.semiSesamo,
              notes: item.notes || '',
            },
          };
        }
      }),
    });

    setIsSubmitting(false);

    // Redirect immediately to Live Order Tracking page!
    navigate(`/ordine/${finalOrderId}`);
  };

  return (
    <section id="poke" className="order-section">
      {validationError && (
        <div className="order-toast order-toast--error" role="alert">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div className="order-toast-icon" style={{ backgroundColor: 'var(--color-coral)' }}>
              <AlertCircle size={18} color="white" />
            </div>
            <div>
              <div className="order-toast-title" style={{ color: '#991B1B' }}>
                Completa i campi obbligatori
              </div>
              <div className="order-toast-body" style={{ color: '#B91C1C' }}>
                {validationError}
              </div>
            </div>
          </div>
          <button type="button" className="order-toast-close" onClick={() => setValidationError(null)} aria-label="Chiudi avviso">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="container">
        <div className="poke-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>

            {successMsg && (
              <div className="order-toast order-toast--success">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div className="order-toast-icon" style={{ backgroundColor: '#16A34A' }}>
                    <Check size={18} color="white" />
                  </div>
                  <div>
                    <div className="order-toast-title" style={{ color: '#166534' }}>
                      Aggiunto all'ordine
                    </div>
                    <div className="order-toast-body" style={{ color: '#166534' }}>
                      {successMsg}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editingPokeId && (
              <div className="order-toast order-toast--edit">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Edit3 size={18} color="var(--color-ocean-dark)" />
                  <strong style={{ color: 'var(--color-ocean-dark)', fontSize: '0.92rem' }}>
                    Stai modificando la poke di {pokePersonName}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn"
                  style={{
                    padding: '0.42rem 0.9rem',
                    fontSize: '0.78rem',
                    color: 'var(--color-ocean-dark)',
                    border: '1px solid rgba(10, 35, 66, 0.16)',
                    backgroundColor: 'white',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Annulla</span>
                </button>
              </div>
            )}

            <div id="ordine-dati" className="glass-panel poke-card-panel order-card">
              <OrderStepHeader
                step={1}
                title="I tuoi dati"
                subtitle="Servono per identificare l'ordine al banco e aggiornarti sullo stato."
              />

              <div className="order-callout">
                <Info size={18} />
                <span>
                  Il telefono è unico per tutto l'ordine. Il nome identifica il referente al ritiro o in consegna.
                </span>
              </div>

              <div className="order-fields">
                <div className="order-field">
                  <label htmlFor="customerNameInput" className="order-label">
                    {isNextPokeName ? 'Nome per questa poke' : 'Nome e cognome'}{' '}
                    <span className="req">*</span>
                  </label>
                  <div className="order-input-wrap">
                    <User size={16} />
                    <input
                      id="customerNameInput"
                      className="order-input"
                      type="text"
                      placeholder="Es. Marco Rossi"
                      value={pokePersonName}
                      onChange={(e) => {
                        setPokePersonName(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                    />
                  </div>
                  <p className={isNextPokeName ? 'order-hint order-hint--next-poke' : 'order-hint'}>
                    {isNextPokeName
                      ? 'Inserisci un nome diverso per distinguere la poke successiva.'
                      : 'Referente principale per il ritiro o la consegna.'}
                  </p>
                </div>

                <div className="order-field">
                  <label htmlFor="customerPhoneInput" className="order-label">
                    Telefono <span className="req">*</span>
                  </label>
                  <div className="order-input-wrap">
                    <Phone size={16} />
                    <input
                      id="customerPhoneInput"
                      className="order-input"
                      type="tel"
                      placeholder="Es. 334 1234567"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                    />
                  </div>
                </div>

                <div className="order-field order-privacy-notice">
                  <p className="order-hint" style={{ marginBottom: '0.65rem' }}>
                    I dati richiesti servono esclusivamente a gestire il tuo ordine (identificazione al banco, aggiornamento stato e
                    comunicazioni di ritiro/consegna). Base giuridica: esecuzione del contratto (Art. 6(1)(b) GDPR).
                  </p>
                  <label htmlFor="privacyAcceptCheckbox" className="order-privacy-label">
                    <input
                      id="privacyAcceptCheckbox"
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => {
                        setPrivacyAccepted(e.target.checked);
                        if (validationError) setValidationError(null);
                      }}
                    />
                    <span>
                      Ho letto l&apos;{' '}
                      <button type="button" className="order-privacy-link" onClick={openPrivacyPolicy}>
                        Informativa sulla Privacy
                      </button>
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="order-label">Modalità</label>
                <div className="order-segmented">
                  <button
                    type="button"
                    onClick={() => setOrderType('Ritiro')}
                    className={`order-segment${orderType === 'Ritiro' ? ' order-segment--active' : ''}`}
                  >
                    <Store size={16} />
                    Ritiro al banco
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('Consegna')}
                    className={`order-segment${orderType === 'Consegna' ? ' order-segment--active' : ''}`}
                  >
                    <Bike size={16} />
                    Consegna a domicilio
                  </button>
                </div>
              </div>

              {orderType === 'Consegna' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="deliveryAddressInput" className="order-label">
                    Indirizzo di consegna <span className="req">*</span>
                  </label>
                  <div className="order-input-wrap">
                    <MapPin size={16} />
                    <input
                      id="deliveryAddressInput"
                      className="order-input"
                      type="text"
                      placeholder="Via, numero civico, piano, citofono"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="order-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} />
                  Orario di {orderType.toLowerCase()}
                </label>
                <div className="order-slot-section">
                  <AlarmTimePicker
                    orderType={orderType}
                    selectedTime={pickupTime}
                    selectedDay={selectedDay}
                    slotOccupancy={slotOccupancy}
                    dateKey={occupancyDateKey}
                    occupancyLoaded={occupancyLoaded}
                    onTimeChange={(timeStr, day) => {
                      setSelectedDay(day);
                      const clean = (timeStr || '').replace(/\s*\((Oggi|Domani|oggi|domani)\)/gi, '').trim();
                      const formattedDay = day === 'oggi' ? 'Oggi' : 'Domani';

                      if (clean === 'Prima possibile' || clean.includes('ASAP')) {
                        setPickupTime(`Prima possibile (${formattedDay})`);
                      } else {
                        setPickupTime(`${clean} (${formattedDay})`);
                      }
                    }}
                  />
                  <PokeSlotSummary summary={slotSummary} />
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION: POKE VS FRITTI ESPRESSO VS PESCE FRESCO */}
            <div id="ordine-componi" className="poke-category-tabs" role="tablist" aria-label="Categorie ordine">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'poke'}
                className={`poke-category-tab${activeTab === 'poke' ? ' poke-category-tab--active' : ''}`}
                onClick={() => setActiveTab('poke')}
              >
                <PokeBowlIcon size={18} />
                <span>Poke</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'fritti'}
                className={`poke-category-tab${activeTab === 'fritti' ? ' poke-category-tab--active' : ''}`}
                onClick={() => setActiveTab('fritti')}
              >
                <FriedConeIcon size={18} />
                <span>Coni fritti</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pesce'}
                className={`poke-category-tab poke-category-tab--wide${activeTab === 'pesce' ? ' poke-category-tab--active' : ''}`}
                onClick={() => setActiveTab('pesce')}
              >
                <Waves size={18} />
                <span>Pesce fresco</span>
              </button>
            </div>

            {/* TAB 1: COM PONI LA TUA POKE */}
            {activeTab === 'poke' && (
              <>
                {/* 2. Selezione Formato */}
                <div className="glass-panel poke-card-panel order-card">
                  <OrderStepHeader
                    step={2}
                    title="Formato"
                    subtitle="Scegli la dimensione della ciotola. Gli extra si aggiungono dopo."
                  />

                  <div className="order-format-grid">
                    {FORMATS.map((fmt) => {
                      const isSelected = selectedFormat.id === fmt.id;

                      return (
                        <div
                          key={fmt.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleFormatChange(fmt)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleFormatChange(fmt);
                            }
                          }}
                          className={`order-format-card${isSelected ? ' order-format-card--selected' : ''}`}
                        >
                          <div className="order-format-check">
                            {isSelected ? <Check size={12} color="white" /> : null}
                          </div>
                          <div className="order-format-name">{fmt.name.replace('Formato ', '')}</div>
                          <div className="order-format-price">€{fmt.price}</div>
                          <ul className="order-format-meta">
                            <li>{fmt.maxBasi} {fmt.maxBasi > 1 ? 'basi' : 'base'}</li>
                            <li>{fmt.maxProteine} {fmt.maxProteine > 1 ? 'proteine' : 'proteina'}</li>
                            <li>{fmt.maxSecondari} topping</li>
                            <li>{fmt.maxSalse} {fmt.maxSalse > 1 ? 'salse' : 'salsa'}</li>
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Basi */}
                <div id="stepBasi" className="glass-panel poke-card-panel order-card">
                  <OrderStepHeader
                    step={3}
                    title="Basi"
                    subtitle="Il fondo della ciotola."
                    count={`${selectedBasi.length}/${selectedFormat.maxBasi}`}
                  />

                  <div className="poke-options-grid">
                    {BASI.map((b) => {
                      const isChecked = selectedBasi.includes(b);
                      const isDisabled = !isChecked && selectedBasi.length >= selectedFormat.maxBasi;

                      return (
                        <label
                          key={b}
                          className={`order-chip${isChecked ? ' order-chip--selected' : ''}${isDisabled ? ' order-chip--disabled' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(b, selectedBasi, setSelectedBasi, selectedFormat.maxBasi)}
                            style={{ display: 'none' }}
                          />
                          <div className="order-chip-check">
                            {isChecked && <Check size={11} />}
                          </div>
                          <span className="order-chip-name">{b}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Proteine */}
                <div id="stepProteine" className="glass-panel poke-card-panel order-card">
                  <OrderStepHeader
                    step={4}
                    title="Proteine"
                    subtitle="Il cuore della poke. Alcune hanno un extra."
                    count={`${selectedProteine.length}/${selectedFormat.maxProteine}`}
                  />

                  <div className="poke-options-grid">
                    {PROTEINE.map((p) => {
                      const isChecked = selectedProteine.includes(p.name);
                      const isDisabled = !isChecked && selectedProteine.length >= selectedFormat.maxProteine;

                      return (
                        <label
                          key={p.name}
                          className={`order-chip${isChecked ? ' order-chip--selected' : ''}${isDisabled ? ' order-chip--disabled' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(p.name, selectedProteine, setSelectedProteine, selectedFormat.maxProteine)}
                            style={{ display: 'none' }}
                          />
                          <div className="order-chip-check">
                            {isChecked && <Check size={11} />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', gap: '0.35rem' }}>
                            <span className="order-chip-name">{p.name}</span>
                            {p.extraPrice > 0 && <span className="order-extra">+{p.extraPrice}€</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Ingredienti Secondari (Topping) */}
                <div className="glass-panel poke-card-panel order-card">
                  <OrderStepHeader
                    step={5}
                    title="Topping"
                    subtitle="Verdure, croccanti e extra a piacere."
                    count={`${selectedIngredienti.length}/${selectedFormat.maxSecondari}`}
                  />

                  <div className="poke-options-grid">
                    {INGREDIENTI.map((ing) => {
                      const isChecked = selectedIngredienti.includes(ing.name);
                      const isDisabled = !isChecked && selectedIngredienti.length >= selectedFormat.maxSecondari;

                      return (
                        <label
                          key={ing.name}
                          className={`order-chip${isChecked ? ' order-chip--selected' : ''}${isDisabled ? ' order-chip--disabled' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(ing.name, selectedIngredienti, setSelectedIngredienti, selectedFormat.maxSecondari)}
                            style={{ display: 'none' }}
                          />
                          <div className="order-chip-check">
                            {isChecked && <Check size={11} />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', gap: '0.35rem' }}>
                            <span className="order-chip-name">{ing.name}</span>
                            {ing.extraPrice > 0 && <span className="order-extra">+{ing.extraPrice}€</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Salse */}
                <div className="glass-panel poke-card-panel order-card">
                  <OrderStepHeader
                    step={6}
                    title="Salse e condimenti"
                    subtitle="Puoi chiedere la salsa a parte nelle note."
                    count={`${selectedSalse.length}/${selectedFormat.maxSalse}`}
                  />

                  <div className="poke-options-grid" style={{ marginBottom: '1.1rem' }}>
                    {SALSE.map((s) => {
                      const isChecked = selectedSalse.includes(s.name);
                      const isDisabled = !isChecked && selectedSalse.length >= selectedFormat.maxSalse;

                      return (
                        <label
                          key={s.name}
                          className={`order-chip${isChecked ? ' order-chip--selected' : ''}${isDisabled ? ' order-chip--disabled' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(s.name, selectedSalse, setSelectedSalse, selectedFormat.maxSalse)}
                            style={{ display: 'none' }}
                          />
                          <div className="order-chip-check">
                            {isChecked && <Check size={11} />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', gap: '0.35rem' }}>
                            <span className="order-chip-name">{s.name}</span>
                            {s.extraPrice > 0 && <span className="order-extra">+{s.extraPrice}€</span>}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="order-toggle">
                    <span style={{ fontWeight: 700, color: 'var(--color-ocean-dark)', fontSize: '0.92rem' }}>
                      Semi di sesamo
                    </span>
                    <button
                      type="button"
                      onClick={() => setSemiSesamo(!semiSesamo)}
                      className={`order-toggle-btn${semiSesamo ? ' order-toggle-btn--on' : ''}`}
                    >
                      {semiSesamo ? 'Sì' : 'No'}
                    </button>
                  </div>
                </div>

                {/* 7. Note Speciali per questa Poke */}
                <div className="glass-panel poke-card-panel order-card">
                  <OrderStepHeader
                    step={7}
                    title="Note per questa poke"
                    subtitle="Allergie, salsa a parte o preferenze di preparazione."
                  />
                  <textarea
                    className="order-textarea"
                    value={pokeNotes}
                    onChange={(e) => setPokeNotes(e.target.value)}
                    placeholder="Es. salsa a parte, senza glutine, allergie..."
                    rows={2}
                  />

                  <div style={{ marginTop: '1.2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleSavePokeToOrder}
                      className="btn btn-coral"
                      style={{
                        flex: '1 1 240px',
                        padding: '0.9rem 1.25rem',
                        fontSize: '0.95rem',
                        justifyContent: 'center',
                      }}
                    >
                      <PlusCircle size={18} />
                      <span>
                        {editingPokeId
                          ? `Salva modifiche · €${currentPokePrice}`
                          : pokePersonName.trim()
                            ? `Aggiungi poke di ${pokePersonName.trim()} · €${currentPokePrice}`
                            : `Aggiungi questa poke · €${currentPokePrice}`}
                      </span>
                    </button>

                    {editingPokeId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn"
                        style={{
                          padding: '0.85rem 1.15rem',
                          border: '1px solid rgba(10, 35, 66, 0.14)',
                          backgroundColor: 'transparent',
                          color: 'var(--color-ocean-dark)',
                        }}
                      >
                        <RotateCcw size={16} />
                        Annulla
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: CONI FRITTI ESPRESSO */}
            {activeTab === 'fritti' && (
              <div className="glass-panel poke-card-panel order-card">
                <div className="order-catalog-intro">
                  <span className="section-kicker" style={{ marginBottom: '0.7rem' }}>Frittura espressa</span>
                  <h3 className="order-step-title" style={{ fontSize: '1.7rem' }}>
                    Coni di pesce fritto
                  </h3>
                  <p className="order-step-sub" style={{ maxWidth: '36rem', marginInline: 'auto' }}>
                    Dorati al momento in olio ad alta temperatura, serviti caldi da asporto.
                  </p>
                  <p className="order-step-sub" style={{ maxWidth: '36rem', marginInline: 'auto', marginTop: '0.65rem', fontWeight: 700, color: 'var(--color-coral)' }}>
                    {friedArrivalMessage(orderType)}
                  </p>
                </div>

                <div className="order-product-grid">
                  {FRIED_ITEMS.map((item) => {
                    const qty = cardQuantities[item.id] || 1;
                    const itemTotal = item.price * qty;

                    return (
                      <div key={item.id} className="order-product-card">
                        <div className="order-product-media">
                          <img src={item.image} alt={item.name} />
                          {item.badge && <span className="order-badge order-badge--coral">{item.badge}</span>}
                        </div>

                        <div className="order-product-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.4rem' }}>
                            <h4 className="order-product-title">{item.name}</h4>
                            <span className="order-product-price">€{item.price}</span>
                          </div>
                          <p style={{ margin: '0 0 1rem 0', fontSize: '0.86rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                            {item.description}
                          </p>

                          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(10, 35, 66, 0.08)', paddingTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-ocean-dark)' }}>Quantità</span>
                              <div className="order-qty" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => updateCardQty(item.id, -1)} aria-label="Diminuisci">−</button>
                                <span>{qty}</span>
                                <button type="button" onClick={() => updateCardQty(item.id, 1)} aria-label="Aumenta">+</button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddFriedCardDirectly(item);
                              }}
                              className="btn btn-coral"
                              style={{ width: '100%', padding: '0.7rem 0.85rem', fontSize: '0.86rem', justifyContent: 'center' }}
                            >
                              <PlusCircle size={16} />
                              <span>Aggiungi · €{itemTotal.toFixed(2)}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'pesce' && (
              <div className="glass-panel poke-card-panel order-card">
                <div className="order-catalog-intro">
                  <span className="section-kicker" style={{ marginBottom: '0.7rem' }}>
                    <Waves size={13} /> Banco pescheria
                  </span>
                  <h3 className="order-step-title" style={{ fontSize: '1.7rem' }}>
                    Pesce fresco del giorno
                  </h3>
                  <p className="order-step-sub" style={{ maxWidth: '38rem', marginInline: 'auto' }}>
                    Scegli varietà, peso e lavorazione. Pulizia e sfilettatura sono comprese.
                  </p>
                </div>

                <div className="order-filter-bar">
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'Tutto il pescato' },
                      { id: 'Mar Ligure', label: 'Mar Ligure' },
                      { id: 'Medit. Occ.', label: 'Mediterraneo' },
                    ].map((filt) => (
                      <button
                        type="button"
                        key={filt.id}
                        onClick={() => setFishOriginFilter(filt.id as 'all' | 'Mar Ligure' | 'Medit. Occ.')}
                        className={`order-filter-chip${fishOriginFilter === filt.id ? ' order-filter-chip--active' : ''}`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>

                  <div className="order-search">
                    <Search size={16} />
                    <input
                      type="text"
                      value={fishSearchQuery}
                      onChange={(e) => setFishSearchQuery(e.target.value)}
                      placeholder="Cerca (es. Orata, Tonno...)"
                    />
                  </div>
                </div>

                <div className="order-product-grid">
                  {fishCatalogLoading && (
                    <p className="order-hint" style={{ gridColumn: '1 / -1' }}>Caricamento selezione pesce...</p>
                  )}
                  {fishCatalog
                    .filter((item) => {
                      const matchOrigin = fishOriginFilter === 'all' ? true : item.origin === fishOriginFilter;
                      const matchSearch = item.name.toLowerCase().includes(fishSearchQuery.toLowerCase());
                      return matchOrigin && matchSearch;
                    })
                    .map((item) => {
                      const weight = cardFishWeights[item.id] || 500;
                      const prep = cardFishPreps[item.id] || FISH_PREPARATIONS[0].name;
                      const estPrice = ((item.pricePerKg * weight) / 1000).toFixed(2);

                      return (
                        <div key={item.id} className="order-product-card">
                          <div className="order-product-media">
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/pesce/pescatrice.jpg';
                              }}
                            />
                            <span className="order-badge order-badge--origin">
                              <Anchor size={11} /> {item.origin}
                            </span>
                            {item.isPopular && (
                              <span className="order-badge order-badge--coral">I più richiesti</span>
                            )}
                          </div>

                          <div className="order-product-body">
                            <h4 className="order-product-title" style={{ marginBottom: '0.35rem' }}>{item.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.9rem' }}>
                              <span className="order-product-price">€{item.pricePerKg.toFixed(2)}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>/ kg</span>
                            </div>

                            <div style={{ marginBottom: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <label className="order-label" style={{ marginBottom: 0 }}>Peso</label>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-ocean-medium)' }}>
                                  {weight >= 1000 ? `${(weight / 1000).toFixed(2)} kg` : `${weight} g`}
                                </span>
                              </div>

                              <div className="order-weight-presets">
                                {[250, 500, 750, 1000, 1500, 2000].map((presetGrams) => (
                                  <button
                                    type="button"
                                    key={presetGrams}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCardFishWeightValue(item.id, presetGrams);
                                    }}
                                    className={`order-weight-preset${weight === presetGrams ? ' order-weight-preset--on' : ''}`}
                                  >
                                    {presetGrams >= 1000 ? `${presetGrams / 1000} kg` : `${presetGrams}g`}
                                  </button>
                                ))}
                              </div>

                              <div className="order-weight-stepper" onClick={(e) => e.stopPropagation()}>
                                <button type="button" aria-label="Riduci peso" onClick={() => updateCardFishWeight(item.id, -50)}>−</button>
                                <input
                                  type="number"
                                  min={0.1}
                                  max={10}
                                  step={0.05}
                                  value={Number((weight / 1000).toFixed(2))}
                                  onChange={(e) => {
                                    const kg = parseFloat(e.target.value);
                                    if (!Number.isNaN(kg)) {
                                      setCardFishWeightValue(item.id, Math.round(kg * 1000));
                                    }
                                  }}
                                  aria-label={`Peso in kg per ${item.name}`}
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    border: 'none',
                                    background: 'transparent',
                                    textAlign: 'center',
                                    fontSize: '0.95rem',
                                    fontWeight: 800,
                                    color: 'var(--color-ocean-dark)',
                                    outline: 'none',
                                  }}
                                />
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', flexShrink: 0 }}>kg</span>
                                <button type="button" aria-label="Aumenta peso" onClick={() => updateCardFishWeight(item.id, 50)}>+</button>
                              </div>
                              <p className="order-hint">Da 100 g a 10 kg. Usa i tasti rapidi o inserisci il peso.</p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                              <label className="order-label">Lavorazione</label>
                              <select
                                className="order-select"
                                value={prep}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateCardFishPrep(item.id, e.target.value)}
                              >
                                {FISH_PREPARATIONS.map((p) => (
                                  <option key={p.id} value={p.name}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(10, 35, 66, 0.08)', paddingTop: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  Stima {weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight}g`}
                                </span>
                                <strong className="order-product-price" style={{ fontSize: '1.15rem' }}>~€{estPrice}</strong>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFishCardDirectly(item);
                                }}
                                className="btn btn-coral"
                                style={{ width: '100%', padding: '0.7rem 0.85rem', fontSize: '0.86rem', justifyContent: 'center' }}
                              >
                                <PlusCircle size={16} />
                                <span>Aggiungi al carrello</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar / Bottom Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div id="ordine-invia" className="glass-panel poke-summary-card order-cart">
              <div className="order-cart-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <ShoppingBag size={20} color="var(--color-gold-soft)" />
                  <h3 className="font-serif" style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                    Il tuo ordine
                  </h3>
                </div>
                <div className="order-cart-total">
                  €{(orderList.length > 0 ? grandTotal : (activeTab === 'poke' ? currentPokePrice : 0)).toFixed(2)}
                </div>
              </div>

              <div className="order-ref">
                Referente:{' '}
                <strong style={{ color: 'white' }}>
                  {orderList.length > 0
                    ? orderList[0].itemType === 'fritto'
                      ? orderList[0].personName || pokePersonName.trim() || 'Da inserire'
                      : orderList[0].itemType === 'pesce'
                        ? orderList[0].personName || pokePersonName.trim() || 'Da inserire'
                        : orderList[0].pokePersonName || pokePersonName.trim() || 'Da inserire'
                    : pokePersonName.trim() || 'Da inserire'}
                </strong>
                {pickupTime ? <span style={{ display: 'block', marginTop: '0.2rem', color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>{orderType} · {pickupTime}</span> : null}
              </div>

              {/* Order List Display (If items added) */}
              {orderList.length > 0 ? (
                <div className="order-cart-list">
                  <div className="order-cart-kicker">
                    Articoli ({orderList.length})
                  </div>

                  {orderList.some((i) => i.itemType === 'fritto') && (
                    <p className="order-hint" style={{ marginTop: '0.65rem', color: '#FDE047', fontWeight: 700 }}>
                      {friedArrivalMessage(orderType)}
                    </p>
                  )}

                  {orderList.map((item) => {
                    if (item.itemType === 'fritto') {
                      return (
                        <div key={item.id} className="order-cart-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#FCD34D', fontSize: '1rem' }}>
                              {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                            </strong>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap' }}>
                                €{(item.price * item.quantity).toFixed(2)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemovePoke(item.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#FCA5A5',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                                title="Rimuovi dal carrello"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                            {item.personName && <div><strong>Destinato a:</strong> {item.personName}</div>}
                            {item.notes && (
                              <div style={{ color: '#FDE047', fontWeight: 600, marginTop: '0.15rem' }}>
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    if (item.itemType === 'pesce') {
                      const weightLabel = item.weightGrams >= 1000 ? `${(item.weightGrams / 1000).toFixed(1)} kg` : `${item.weightGrams}g`;
                      return (
                        <div key={item.id} className="order-cart-item order-cart-item--pesce">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--color-sea-blue)', fontSize: '0.95rem' }}>
                              {item.name} ({weightLabel})
                            </strong>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap' }}>
                                ~€{item.price.toFixed(2)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemovePoke(item.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#FCA5A5',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                                title="Rimuovi dal carrello"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                            <div><strong>Pulizia:</strong> {item.preparation}</div>
                            <div><strong>Origine:</strong> {item.origin} (€{item.pricePerKg.toFixed(2)}/kg)</div>
                            {item.notes && (
                              <div style={{ color: '#FDE047', fontWeight: 600, marginTop: '0.15rem' }}>
                                Note banco: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    const poke = item as ConfiguredPoke;
                    return (
                      <div
                        key={poke.id}
                        className={`order-cart-item${poke.id === editingPokeId ? ' order-cart-item--editing' : ''}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--color-gold-soft)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                            Poke di {poke.pokePersonName}
                          </strong>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap' }}>
                              €{poke.price.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleEditPoke(poke)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-sea-blue)',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Modifica questa Poke"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemovePoke(poke.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#FCA5A5',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Rimuovi dal carrello"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                          <div><strong>Formato:</strong> {poke.format.name}</div>
                          <div><strong>Basi:</strong> {poke.basi.join(', ')}</div>
                          <div><strong>Proteine:</strong> {poke.proteine.join(', ')}</div>
                          {poke.ingredienti.length > 0 && <div><strong>Topping:</strong> {poke.ingredienti.join(', ')}</div>}
                          {poke.salse.length > 0 && <div><strong>Salse:</strong> {poke.salse.join(', ')}</div>}
                          <div><strong>Sesamo:</strong> {poke.semiSesamo ? 'SI' : 'NO'}</div>
                          {poke.notes && (
                            <div style={{ color: '#FDE047', fontWeight: 600, marginTop: '0.25rem' }}>
                              Note: {poke.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Current Config Preview (Single item in progress) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.9rem', marginBottom: '1.4rem' }}>
                  <div className="order-cart-kicker">In composizione</div>

                  <div className="order-summary-row">
                    <span style={{ color: 'var(--color-sea-blue)' }}>Cliente:</span>
                    <strong>{pokePersonName.trim() || 'Non inserito'}</strong>
                  </div>

                  <div className="order-summary-row">
                    <span style={{ color: 'var(--color-sea-blue)' }}>Telefono:</span>
                    <strong>{customerPhone.trim() || 'Non inserito'}</strong>
                  </div>

                  <div className="order-summary-row">
                    <span style={{ color: 'var(--color-sea-blue)' }}>Modalità & Orario:</span>
                    <strong style={{ color: 'var(--color-gold)' }}>
                      {orderType} - {pickupTime}
                    </strong>
                  </div>

                  {activeTab === 'poke' ? (
                    <>
                      <div className="order-summary-row">
                        <span style={{ color: 'var(--color-sea-blue)' }}>Formato Poke:</span>
                        <strong>{selectedFormat.name} (€{selectedFormat.price})</strong>
                      </div>

                      <div className="order-summary-row">
                        <span style={{ color: 'var(--color-sea-blue)' }}>Basi:</span>
                        <span>{selectedBasi.length > 0 ? selectedBasi.join(', ') : 'Nessuna selezionata'}</span>
                      </div>

                      <div className="order-summary-row">
                        <span style={{ color: 'var(--color-sea-blue)' }}>Proteine:</span>
                        <span>{selectedProteine.length > 0 ? selectedProteine.join(', ') : 'Nessuna selezionata'}</span>
                      </div>

                      <div className="order-summary-row">
                        <span style={{ color: 'var(--color-sea-blue)' }}>Ingredienti:</span>
                        <span>{selectedIngredienti.length > 0 ? selectedIngredienti.join(', ') : 'Nessuno selezionato'}</span>
                      </div>

                      <div className="order-summary-row">
                        <span style={{ color: 'var(--color-sea-blue)' }}>Salse:</span>
                        <span>{selectedSalse.length > 0 ? selectedSalse.join(', ') : 'Nessuna selezionata'}</span>
                      </div>

                      <div className="order-summary-row">
                        <span style={{ color: 'var(--color-sea-blue)' }}>Semi di Sesamo:</span>
                        <strong>{semiSesamo ? 'SI' : 'NO'}</strong>
                      </div>
                    </>
                  ) : activeTab === 'fritti' ? (
                    <div className="order-empty">
                      Nessun cono nel carrello.<br />
                      <span style={{ color: 'var(--color-gold-soft)', fontWeight: 600 }}>Scegli dal menù e aggiungi.</span>
                    </div>
                  ) : (
                    <div className="order-empty">
                      Nessun pescato nel carrello.<br />
                      <span style={{ color: 'var(--color-sea-blue)', fontWeight: 600 }}>Scegli varietà, peso e lavorazione, poi aggiungi.</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '1.15rem' }}>
                <label className="order-notes-label">Note per il banco</label>
                <textarea
                  className="order-notes"
                  value={generalOrderNotes}
                  onChange={(e) => setGeneralOrderNotes(e.target.value)}
                  placeholder="Citofono, piano, allergie o richieste per la consegna..."
                  rows={2}
                />
              </div>

              {validationError && (
                <div
                  style={{
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.16)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#FCA5A5',
                    fontSize: '0.82rem',
                    marginBottom: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleDirectOrderSubmit}
                disabled={isSubmitting}
                className="btn btn-coral"
                style={{
                  width: '100%',
                  padding: '1rem 0.75rem',
                  fontSize: '0.95rem',
                  justifyContent: 'center',
                  textAlign: 'center',
                  lineHeight: 1.35,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <Sparkles size={18} />
                <span>
                  {isSubmitting
                    ? 'Invio in corso...'
                    : orderList.length > 1
                      ? `Invia ${orderList.length} articoli al banco`
                      : 'Invia ordine al banco'}
                </span>
              </button>

              <div className="order-help">
                <MessageCircle size={20} color="#25D366" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Serve una mano?</strong>
                  <div style={{ opacity: 0.9, marginTop: '0.15rem' }}>
                    WhatsApp Pescheria:{' '}
                    <a
                      href="https://wa.me/393459485857"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#4ADE80', fontWeight: 800 }}
                    >
                      345 9485857
                    </a>
                  </div>
                </div>
              </div>

              <p className="order-fineprint">
                Paghi al ritiro o in consegna. Dopo l'invio puoi seguire la preparazione in tempo reale.
              </p>

            </div>
          </div>

        </div>

      </div>

      {/* Floating Checkout Bar for Mobile/Desktop */}
      {orderList.length > 0 && (
        <div className="floating-checkout-bar">
          <div style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-gold-soft)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Totale
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              €{grandTotal.toFixed(2)}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(203,213,225,0.8)' }}>
                · {orderList.length} {orderList.length === 1 ? 'articolo' : 'articoli'}
              </span>
            </span>
          </div>

          <button
            type="button"
            className="btn btn-coral"
            disabled={isSubmitting}
            onClick={() => {
              if (!customerPhone.trim()) {
                const el = document.getElementById('customerPhoneInput');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.focus();
                }
                setValidationError('Inserisci il tuo Numero di Telefono prima di inviare l\'ordine!');
              } else {
                handleDirectOrderSubmit();
              }
            }}
            style={{
              padding: '0.72rem 1.15rem',
              fontSize: '0.88rem',
              minWidth: '132px',
              flexShrink: 0,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            <Sparkles size={15} />
            <span>{isSubmitting ? 'Invio...' : 'Invia'}</span>
          </button>
        </div>
      )}
    </section>
  );
};
