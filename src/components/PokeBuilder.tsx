import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Check, AlertCircle, Sparkles, MessageCircle, Info, Trash2, PlusCircle, Edit3, RotateCcw, Waves, Anchor, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { saveLocalOrder } from '../utils/orderStore';
import { subscribeToOrderPush } from '../lib/onesignal';
import { AlarmTimePicker } from './AlarmTimePicker';
import { FISH_CATALOG, FishItem } from './FishMenuCatalog';

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

  // State for editing an existing poke
  const [editingPokeId, setEditingPokeId] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

    const effectiveTime = pickupTime || 'Prima possibile';

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
      // 1. Insert parent order into Supabase 'orders' table
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

      // 2. Insert items into 'order_items' table if order ID exists
      if (insertedOrderId) {
        const numericOrderId = !isNaN(Number(insertedOrderId)) ? Number(insertedOrderId) : insertedOrderId;
        const itemsPayload = finalItems.map((item) => {
          const itemUUID = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          if (item.itemType === 'fritto') {
            const displayName = item.personName ? `${item.name} (${item.personName})` : item.name;
            return {
              id: itemUUID,
              order_id: numericOrderId,
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
          } else if (item.itemType === 'pesce') {
            const weightLabel = item.weightGrams >= 1000 ? `${(item.weightGrams / 1000).toFixed(1)}kg` : `${item.weightGrams}g`;
            const displayName = `${item.name} [${weightLabel} - ${item.preparation}]`;
            return {
              id: itemUUID,
              order_id: numericOrderId,
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
          } else {
            return {
              id: itemUUID,
              order_id: numericOrderId,
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
        });

        const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
        if (itemsErr) {
          console.warn('Supabase order_items insert notice:', itemsErr.message || itemsErr);
        }
      }
    } catch (e) {
      console.error('Error submitting order to Supabase:', e);
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

    // Automatically register push notifications for this new order
    try {
      subscribeToOrderPush(String(finalOrderId)).catch((err) => {
        console.warn('Background push subscription on order submit error:', err);
      });
    } catch (e) {
      console.warn('Push subscription trigger error:', e);
    }

    setIsSubmitting(false);

    // Redirect immediately to Live Order Tracking page!
    navigate(`/ordine/${finalOrderId}`);
  };

  return (
    <section
      id="poke"
      style={{
        padding: '5rem 0',
        backgroundColor: 'white',
      }}
    >
      {/* Floating Sticky Top Validation Error Banner (Visible Immediately!) */}
      {validationError && (
        <div
          style={{
            position: 'fixed',
            top: '85px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            width: '92%',
            maxWidth: '650px',
            backgroundColor: '#FEF2F2',
            border: '2px solid #EF4444',
            borderRadius: 'var(--radius-md)',
            padding: '0.9rem 1.25rem',
            boxShadow: '0 12px 36px rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.925rem', color: '#991B1B', marginBottom: '0.1rem' }}>
                Campo Obbligatorio Mancante
              </div>
              <div style={{ fontSize: '0.875rem', color: '#B91C1C', fontWeight: 600, lineHeight: 1.35 }}>
                {validationError}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#991B1B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="container">

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2.5rem',
          }}
          className="poke-grid"
        >
          {/* Main Builder Form Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Success Toast Banner */}
            {successMsg && (
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '2px solid rgba(34, 197, 94, 0.5)',
                  boxShadow: '0 4px 15px rgba(34, 197, 94, 0.15)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Check size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#15803D', marginBottom: '0.25rem' }}>
                    Poke salvata con successo!
                  </div>
                  <div style={{ fontSize: '0.925rem', color: '#166534', lineHeight: 1.5, fontWeight: 500 }}>
                    {successMsg}
                  </div>
                </div>
              </div>
            )}

            {/* Editing Mode Banner */}
            {editingPokeId && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(229, 186, 66, 0.15)',
                  border: '1.5px solid var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Edit3 size={20} color="var(--color-ocean-dark)" />
                  <strong style={{ color: 'var(--color-ocean-dark)', fontSize: '0.95rem' }}>
                    Stai modificando la Poke di "{pokePersonName}"
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-outline-light"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-ocean-dark)',
                    borderColor: 'rgba(11,37,69,0.3)',
                    backgroundColor: 'white',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Annulla Modifica</span>
                </button>
              </div>
            )}

            {/* 1. Dati Cliente & Orario Ritiro/Consegna */}
            <div
              className="glass-panel poke-card-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.12)',
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: '0 0 0.85rem 0' }}>
                1. Dati Cliente & Orario di Ritiro/Consegna
              </h3>

              {/* Informative Banner for Unique Order Number vs Poke Names */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#0369A1',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Info size={20} style={{ flexShrink: 0, color: '#0284C7' }} />
                <span>
                  <strong>Gestione Ordine:</strong> Il <strong>numero di telefono è unico</strong> per l'intero ordine. Inserisci il nome del referente per identificare il tuo ritiro o la tua consegna.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem', alignItems: 'start' }}>
                {/* Nome Persona */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="customerNameInput" style={{ display: 'flex', alignItems: 'flex-end', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ocean-dark)', marginBottom: '0.4rem', minHeight: '2.85rem' }}>
                    <span>
                      Nome e Cognome (Referente Ordine) <span style={{ color: 'var(--color-coral)' }}>*</span>
                    </span>
                  </label>
                  <input
                    id="customerNameInput"
                    type="text"
                    placeholder="Es. Marco Rossi, Sara Bianchi..."
                    value={pokePersonName}
                    onChange={(e) => {
                      setPokePersonName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      display: 'block',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(11, 37, 69, 0.18)',
                      backgroundColor: '#F8FAFC',
                      fontSize: '16px',
                      outline: 'none',
                      color: 'var(--color-ocean-dark)',
                      WebkitAppearance: 'none',
                    }}
                  />
                  <div style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
                    <span>Nome del referente principale per il ritiro o la consegna dell'ordine.</span>
                  </div>
                </div>

                {/* Numero di Telefono */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="customerPhoneInput" style={{ display: 'flex', alignItems: 'flex-end', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ocean-dark)', marginBottom: '0.4rem', minHeight: '2.85rem' }}>
                    <span>
                      Numero di Telefono <span style={{ color: 'var(--color-coral)' }}>*</span>
                    </span>
                  </label>
                  <input
                    id="customerPhoneInput"
                    type="tel"
                    placeholder="Es. 334 1234567"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    style={{
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      display: 'block',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(11, 37, 69, 0.18)',
                      backgroundColor: '#F8FAFC',
                      fontSize: '16px',
                      outline: 'none',
                      color: 'var(--color-ocean-dark)',
                      WebkitAppearance: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Modalità Ordine */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ocean-dark)', marginBottom: '0.5rem' }}>
                  Modalità Ordine
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setOrderType('Ritiro')}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: orderType === 'Ritiro' ? '2px solid var(--color-coral)' : '1px solid rgba(11, 37, 69, 0.15)',
                      backgroundColor: orderType === 'Ritiro' ? 'rgba(255, 107, 107, 0.08)' : 'white',
                      fontWeight: 700,
                      color: 'var(--color-ocean-dark)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Ritiro al Banco
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('Consegna')}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: orderType === 'Consegna' ? '2px solid var(--color-coral)' : '1px solid rgba(11, 37, 69, 0.15)',
                      backgroundColor: orderType === 'Consegna' ? 'rgba(255, 107, 107, 0.08)' : 'white',
                      fontWeight: 700,
                      color: 'var(--color-ocean-dark)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Consegna a Domicilio
                  </button>
                </div>
              </div>

              {/* Indirizzo Consegna se Consegna */}
              {orderType === 'Consegna' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="deliveryAddressInput" style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ocean-dark)', marginBottom: '0.4rem' }}>
                    Indirizzo di Consegna <span style={{ color: 'var(--color-coral)' }}>*</span>
                  </label>
                  <input
                    id="deliveryAddressInput"
                    type="text"
                    placeholder="Es. Via Garibaldi 14, Finale Ligure (piano, citofono...)"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(11, 37, 69, 0.18)',
                      backgroundColor: '#F8FAFC',
                      fontSize: '16px',
                      color: 'var(--color-ocean-dark)',
                    }}
                  />
                </div>
              )}

              {/* Orario Desiderato con AlarmTimePicker */}
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ocean-dark)', marginBottom: '0.5rem' }}>
                  Orario di {orderType} desiderato
                </label>
                <AlarmTimePicker
                  orderType={orderType}
                  selectedTime={pickupTime}
                  selectedDay={selectedDay}
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
              </div>
            </div>

            {/* TAB NAVIGATION: POKE VS FRITTI ESPRESSO VS PESCE FRESCO */}
            <div className="poke-category-tabs" role="tablist" aria-label="Categorie ordine">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'poke'}
                className={`poke-category-tab${activeTab === 'poke' ? ' poke-category-tab--active' : ''}`}
                onClick={() => setActiveTab('poke')}
              >
                <span>1. Poke</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'fritti'}
                className={`poke-category-tab${activeTab === 'fritti' ? ' poke-category-tab--active' : ''}`}
                onClick={() => setActiveTab('fritti')}
              >
                <span>2. Coni Fritti</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pesce'}
                className={`poke-category-tab poke-category-tab--wide${activeTab === 'pesce' ? ' poke-category-tab--active' : ''}`}
                onClick={() => setActiveTab('pesce')}
              >
                <Waves size={16} />
                <span>3. Pesce Fresco</span>
              </button>
            </div>

            {/* TAB 1: COM PONI LA TUA POKE */}
            {activeTab === 'poke' && (
              <>
                {/* 2. Selezione Formato */}
                <div
                  className="glass-panel poke-card-panel"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                    border: '1px solid rgba(11, 37, 69, 0.08)',
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: '1.15rem',
                      color: 'var(--color-ocean-dark)',
                      marginBottom: '1rem',
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                    }}
                  >
                    2. Scegli il Formato
                  </h3>

                  {/* FIX: da grid a flexbox con wrap + justifyContent center per centrare
                  correttamente l'ultima riga incompleta (es. 3 card su 2 colonne) */}
                  <div
                    className="poke-format-grid"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {FORMATS.map((fmt) => {
                      const isSelected = selectedFormat.id === fmt.id;

                      return (
                        <div
                          key={fmt.id}
                          onClick={() => handleFormatChange(fmt)}
                          className="poke-format-card"
                          style={{
                            // FIX: flex-basis al posto di minmax(220px,1fr) della grid,
                            // maxWidth evita che la card si allarghi troppo da sola su una riga
                            flex: '1 1 200px',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            padding: '1.25rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? '2px solid var(--color-coral)' : '1px solid rgba(11, 37, 69, 0.12)',
                            backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.06)' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            textAlign: 'center',
                            boxShadow: isSelected ? '0 4px 12px rgba(255, 107, 107, 0.15)' : 'none',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-ocean-dark)', marginBottom: '0.25rem' }}>
                            {fmt.name}
                          </div>
                          <div style={{ color: 'var(--color-coral)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                            €{fmt.price}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                            {fmt.maxBasi} Base • {fmt.maxProteine} {fmt.maxProteine > 1 ? 'Proteine' : 'Proteina'} • {fmt.maxSecondari} Ingredienti • {fmt.maxSalse} Salse
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Basi */}
                <div
                  id="stepBasi"
                  className="glass-panel poke-card-panel"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                    border: '1px solid rgba(11, 37, 69, 0.08)',
                    marginTop: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                      3. Scegli le Basi <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedBasi.length}/{selectedFormat.maxBasi})</span>
                    </h3>
                  </div>

                  <div className="poke-options-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
                    {BASI.map((b) => {
                      const isChecked = selectedBasi.includes(b);
                      const isDisabled = !isChecked && selectedBasi.length >= selectedFormat.maxBasi;

                      return (
                        <label
                          key={b}
                          style={chipLabelStyle(isChecked, isDisabled)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(b, selectedBasi, setSelectedBasi, selectedFormat.maxBasi)}
                            style={{ display: 'none' }}
                          />
                          <div style={customCheckboxStyle(isChecked, isDisabled)}>
                            {isChecked && <Check size={14} color="white" />}
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: isChecked ? 700 : 500, color: isDisabled ? '#94A3B8' : 'var(--color-ocean-dark)', lineHeight: 1.3 }}>
                            {b}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Proteine */}
                <div
                  id="stepProteine"
                  className="glass-panel poke-card-panel"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                    border: '1px solid rgba(11, 37, 69, 0.08)',
                    marginTop: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                      4. Scegli le Proteine <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedProteine.length}/{selectedFormat.maxProteine})</span>
                    </h3>
                  </div>

                  <div className="poke-options-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
                    {PROTEINE.map((p) => {
                      const isChecked = selectedProteine.includes(p.name);
                      const isDisabled = !isChecked && selectedProteine.length >= selectedFormat.maxProteine;

                      return (
                        <label
                          key={p.name}
                          style={chipLabelStyle(isChecked, isDisabled)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(p.name, selectedProteine, setSelectedProteine, selectedFormat.maxProteine)}
                            style={{ display: 'none' }}
                          />
                          <div style={customCheckboxStyle(isChecked, isDisabled)}>
                            {isChecked && <Check size={14} color="white" />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 700 : 500, color: isDisabled ? '#94A3B8' : 'var(--color-ocean-dark)', lineHeight: 1.3 }}>
                              {p.name}
                            </span>
                            {p.extraPrice > 0 && (
                              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--color-coral)', backgroundColor: 'rgba(255, 107, 107, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                +{p.extraPrice}€
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Ingredienti Secondari (Topping) */}
                <div
                  className="glass-panel poke-card-panel"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                    border: '1px solid rgba(11, 37, 69, 0.08)',
                    marginTop: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                      5. Scegli gli Ingredienti / Topping <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionati {selectedIngredienti.length}/{selectedFormat.maxSecondari})</span>
                    </h3>
                  </div>

                  <div className="poke-options-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
                    {INGREDIENTI.map((ing) => {
                      const isChecked = selectedIngredienti.includes(ing.name);
                      const isDisabled = !isChecked && selectedIngredienti.length >= selectedFormat.maxSecondari;

                      return (
                        <label
                          key={ing.name}
                          style={chipLabelStyle(isChecked, isDisabled)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(ing.name, selectedIngredienti, setSelectedIngredienti, selectedFormat.maxSecondari)}
                            style={{ display: 'none' }}
                          />
                          <div style={customCheckboxStyle(isChecked, isDisabled)}>
                            {isChecked && <Check size={14} color="white" />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 700 : 500, color: isDisabled ? '#94A3B8' : 'var(--color-ocean-dark)', lineHeight: 1.3 }}>
                              {ing.name}
                            </span>
                            {ing.extraPrice > 0 && (
                              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--color-coral)', backgroundColor: 'rgba(255, 107, 107, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                +{ing.extraPrice}€
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Salse */}
                <div
                  className="glass-panel poke-card-panel"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                    border: '1px solid rgba(11, 37, 69, 0.08)',
                    marginTop: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                      6. Scegli le Salse & Condimenti <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedSalse.length}/{selectedFormat.maxSalse})</span>
                    </h3>
                  </div>

                  <div className="poke-options-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {SALSE.map((s) => {
                      const isChecked = selectedSalse.includes(s.name);
                      const isDisabled = !isChecked && selectedSalse.length >= selectedFormat.maxSalse;

                      return (
                        <label
                          key={s.name}
                          style={chipLabelStyle(isChecked, isDisabled)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleSelection(s.name, selectedSalse, setSelectedSalse, selectedFormat.maxSalse)}
                            style={{ display: 'none' }}
                          />
                          <div style={customCheckboxStyle(isChecked, isDisabled)}>
                            {isChecked && <Check size={14} color="white" />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 700 : 500, color: isDisabled ? '#94A3B8' : 'var(--color-ocean-dark)', lineHeight: 1.3 }}>
                              {s.name}
                            </span>
                            {s.extraPrice > 0 && (
                              <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--color-coral)', backgroundColor: 'rgba(255, 107, 107, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                +{s.extraPrice}€
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Semi di Sesamo Toggle */}
                  <div style={{ borderTop: '1px solid rgba(11, 37, 69, 0.08)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-ocean-dark)', fontSize: '0.95rem' }}>
                      Aggiungere Semi di Sesamo?
                    </span>
                    <button
                      type="button"
                      onClick={() => setSemiSesamo(!semiSesamo)}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 'var(--radius-full)',
                        border: semiSesamo ? '2px solid var(--color-sea-blue)' : '1.5px solid rgba(11, 37, 69, 0.2)',
                        backgroundColor: semiSesamo ? 'rgba(19, 64, 116, 0.1)' : 'transparent',
                        color: semiSesamo ? 'var(--color-sea-blue)' : 'var(--color-text-muted)',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {semiSesamo ? '✓ SI Sesamo' : '✗ NO Sesamo'}
                    </button>
                  </div>
                </div>

                {/* 7. Note Speciali per questa Poke */}
                <div
                  className="glass-panel poke-card-panel"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'white',
                    border: '1px solid rgba(11, 37, 69, 0.08)',
                    marginTop: '1.5rem',
                  }}
                >
                  <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', marginBottom: '0.75rem' }}>
                    7. Note o Richieste per questa Poke (Opzionale)
                  </h3>
                  <textarea
                    value={pokeNotes}
                    onChange={(e) => setPokeNotes(e.target.value)}
                    placeholder="Es. salsa a parte, senza glutine, allergie o preferenze particolari..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(11, 37, 69, 0.15)',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Add / Save Poke to Order List Button */}
                  <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleSavePokeToOrder}
                      className="btn btn-coral"
                      style={{
                        flex: '1 1 240px',
                        padding: '0.85rem 1.25rem',
                        fontSize: '1rem',
                        fontWeight: 800,
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                      }}
                    >
                      <PlusCircle size={20} />
                      <span>
                        {editingPokeId
                          ? `Salva Modifiche per ${pokePersonName.trim() || 'Poke'} (€${currentPokePrice})`
                          : pokePersonName.trim()
                            ? `Aggiungi Poke di "${pokePersonName.trim()}" all'Ordine (€${currentPokePrice})`
                            : `Aggiungi Questa Poke all'Ordine (€${currentPokePrice})`}
                      </span>
                    </button>

                    {editingPokeId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                          padding: '0.85rem 1.25rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(11, 37, 69, 0.2)',
                          backgroundColor: 'transparent',
                          color: 'var(--color-ocean-dark)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <RotateCcw size={16} />
                        Annulla Modifica
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: CONI FRITTI ESPRESSO */}
            {activeTab === 'fritti' && (
              <div
                className="glass-panel poke-card-panel"
                style={{
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'white',
                  border: '1px solid rgba(11, 37, 69, 0.12)',
                  padding: '1.75rem',
                }}
              >
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: 'rgba(255, 107, 107, 0.12)',
                      color: 'var(--color-coral)',
                      padding: '0.4rem 0.9rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>Frittura Croccante Espressa al Momento</span>
                  </span>
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'var(--color-ocean-dark)',
                      margin: '0.25rem 0 0.5rem 0',
                    }}
                  >
                    I Nostri Coni di Pesce Fritto
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, maxWidth: '600px', marginInline: 'auto' }}>
                    Tutti i nostri coni vengono dorati e serviti caldissimi in olio ad alta temperatura. Scegli il tuo cono d'asporto preferito!
                  </p>
                </div>

                {/* Fried Product Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem',
                  }}
                >
                  {FRIED_ITEMS.map((item) => {
                    const qty = cardQuantities[item.id] || 1;
                    const itemTotal = item.price * qty;

                    return (
                      <div
                        key={item.id}
                        style={{
                          borderRadius: 'var(--radius-md)',
                          border: '1.5px solid rgba(11, 37, 69, 0.12)',
                          backgroundColor: 'white',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.25s ease',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                        }}
                      >
                        {/* Card Image Container */}
                        <div style={{ position: 'relative', height: '170px', width: '100%', overflow: 'hidden', backgroundColor: '#0B2545' }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.4s ease',
                            }}
                          />
                          {item.badge && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: 'var(--color-coral)',
                                color: 'white',
                                padding: '0.25rem 0.65rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>

                        {/* Card Details */}
                        <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-ocean-dark)' }}>
                                {item.name}
                              </h4>
                              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-coral)' }}>
                                €{item.price}
                              </span>
                            </div>

                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                              {item.description}
                            </p>
                          </div>

                          {/* Card Interactive Footer */}
                          <div style={{ borderTop: '1px solid rgba(11, 37, 69, 0.08)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {/* In-Card Quantity Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-ocean-dark)' }}>
                                Quantità:
                              </span>
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#F1F5F9',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid rgba(11,37,69,0.12)',
                                  overflow: 'hidden',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => updateCardQty(item.id, -1)}
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    padding: '0.3rem 0.65rem',
                                    fontSize: '1rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    color: 'var(--color-ocean-dark)',
                                  }}
                                >
                                  -
                                </button>
                                <span style={{ padding: '0 0.5rem', fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-ocean-dark)' }}>
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCardQty(item.id, 1)}
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    padding: '0.3rem 0.65rem',
                                    fontSize: '1rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    color: 'var(--color-ocean-dark)',
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Direct Add to Cart Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddFriedCardDirectly(item);
                              }}
                              className="btn btn-coral"
                              style={{
                                width: '100%',
                                padding: '0.6rem 0.85rem',
                                fontSize: '0.875rem',
                                fontWeight: 800,
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.25)',
                              }}
                            >
                              <PlusCircle size={16} />
                              <span>Aggiungi • €{itemTotal.toFixed(2)}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PESCE FRESCO AL BANCO */}
            {activeTab === 'pesce' && (
              <div
                className="glass-panel poke-card-panel"
                style={{
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'white',
                  border: '1px solid rgba(11, 37, 69, 0.12)',
                  padding: '1.75rem',
                }}
              >
                {/* Header Banner */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: 'rgba(19, 64, 116, 0.1)',
                      color: 'var(--color-ocean-dark)',
                      padding: '0.4rem 0.9rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5rem',
                      border: '1px solid rgba(19, 64, 116, 0.2)',
                    }}
                  >
                    <Waves size={15} color="var(--color-sea-blue)" />
                    <span>Banco Pescheria • Pescato Fresco del Giorno</span>
                  </span>
                  <h3
                    className="font-serif"
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: 'var(--color-ocean-dark)',
                      margin: '0.25rem 0 0.5rem 0',
                    }}
                  >
                    Ordina Pesce Fresco al Banco
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0, maxWidth: '640px', marginInline: 'auto' }}>
                    Scegli la varietà di pesce, indica il peso desiderato e seleziona il tipo di lavorazione e pulizia su misura per la tua cucina.
                  </p>
                </div>

                {/* Filters & Search Bar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(11, 37, 69, 0.08)',
                  }}
                >
                  {/* Origin filter chips */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'Tutto il Pescato' },
                      { id: 'Mar Ligure', label: 'Mar Ligure' },
                      { id: 'Medit. Occ.', label: 'Mediterraneo' },
                    ].map((filt) => (
                      <button
                        type="button"
                        key={filt.id}
                        onClick={() => setFishOriginFilter(filt.id as any)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: 'var(--radius-full)',
                          border: fishOriginFilter === filt.id ? '2px solid var(--color-sea-blue)' : '1px solid rgba(11, 37, 69, 0.15)',
                          backgroundColor: fishOriginFilter === filt.id ? 'var(--color-sea-blue)' : 'white',
                          color: fishOriginFilter === filt.id ? 'white' : 'var(--color-ocean-dark)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>

                  {/* Search box */}
                  <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      value={fishSearchQuery}
                      onChange={(e) => setFishSearchQuery(e.target.value)}
                      placeholder="Cerca pesce (es. Orata, Tonno...)"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(11, 37, 69, 0.18)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                      }}
                    />
                  </div>
                </div>

                {/* Fresh Fish Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem',
                  }}
                >
                  {FISH_CATALOG
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
                        <div
                          key={item.id}
                          style={{
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid rgba(11, 37, 69, 0.12)',
                            backgroundColor: 'white',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.25s ease',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {/* Fish Image */}
                          <div style={{ position: 'relative', height: '160px', width: '100%', overflow: 'hidden', backgroundColor: '#0B2545' }}>
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.4s ease',
                              }}
                              onError={(e) => {
                                // Fallback image if specific fish photo is unavailable
                                (e.currentTarget as HTMLImageElement).src = '/pesce/pescatrice.jpg';
                              }}
                            />
                            {/* Origin Badge */}
                            <span
                              style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                backgroundColor: item.origin === 'Mar Ligure' ? 'rgba(11, 37, 69, 0.88)' : 'rgba(30, 41, 59, 0.85)',
                                color: item.origin === 'Mar Ligure' ? '#38BDF8' : '#F1F5F9',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.725rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                              }}
                            >
                              <Anchor size={11} /> {item.origin}
                            </span>

                            {item.isPopular && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '10px',
                                  right: '10px',
                                  backgroundColor: 'var(--color-coral)',
                                  color: 'white',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: '0.725rem',
                                  fontWeight: 800,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                }}
                              >
                                I più richiesti
                              </span>
                            )}
                          </div>

                          {/* Fish Details & Configuration */}
                          <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ocean-dark)', lineHeight: 1.3 }}>
                                  {item.name}
                                </h4>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-coral)' }}>
                                  €{item.pricePerKg.toFixed(2)}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                  / kg
                                </span>
                              </div>

                              {/* Weight Selection */}
                              <div style={{ marginBottom: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                  <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-ocean-dark)' }}>
                                    Peso desiderato:
                                  </label>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-sea-blue)' }}>
                                    {weight >= 1000 ? `${(weight / 1000).toFixed(2)} kg` : `${weight} g`}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                  {[250, 500, 750, 1000, 1500, 2000].map((presetGrams) => (
                                    <button
                                      type="button"
                                      key={presetGrams}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCardFishWeightValue(item.id, presetGrams);
                                      }}
                                      style={{
                                        flex: '1 1 auto',
                                        padding: '0.25rem 0.45rem',
                                        borderRadius: '6px',
                                        border: weight === presetGrams ? '1.5px solid var(--color-coral)' : '1px solid rgba(11, 37, 69, 0.15)',
                                        backgroundColor: weight === presetGrams ? 'rgba(255, 107, 107, 0.1)' : '#F8FAFC',
                                        color: weight === presetGrams ? 'var(--color-coral)' : 'var(--color-ocean-dark)',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {presetGrams >= 1000 ? `${presetGrams / 1000} kg` : `${presetGrams}g`}
                                    </button>
                                  ))}
                                </div>

                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    backgroundColor: '#F8FAFC',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(11, 37, 69, 0.15)',
                                    padding: '0.35rem 0.5rem',
                                  }}
                                >
                                  <button
                                    type="button"
                                    aria-label="Riduci peso"
                                    onClick={() => updateCardFishWeight(item.id, -50)}
                                    style={{
                                      border: 'none',
                                      background: 'white',
                                      borderRadius: '6px',
                                      width: '2rem',
                                      height: '2rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      color: 'var(--color-ocean-dark)',
                                      boxShadow: '0 1px 3px rgba(11, 37, 69, 0.12)',
                                    }}
                                  >
                                    −
                                  </button>
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
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                                    kg
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Aumenta peso"
                                    onClick={() => updateCardFishWeight(item.id, 50)}
                                    style={{
                                      border: 'none',
                                      background: 'white',
                                      borderRadius: '6px',
                                      width: '2rem',
                                      height: '2rem',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      color: 'var(--color-ocean-dark)',
                                      boxShadow: '0 1px 3px rgba(11, 37, 69, 0.12)',
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                                <p style={{ margin: '0.35rem 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                                  Inserisci il peso libero (min. 100 g, max 10 kg) o usa i tasti rapidi.
                                </p>
                              </div>

                              {/* Preparation / Cleaning Selection */}
                              <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--color-ocean-dark)', marginBottom: '0.35rem' }}>
                                  Tipo di Lavorazione / Pulizia:
                                </label>
                                <select
                                  value={prep}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => updateCardFishPrep(item.id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(11, 37, 69, 0.18)',
                                    backgroundColor: 'white',
                                    fontSize: '0.825rem',
                                    color: 'var(--color-ocean-dark)',
                                    fontWeight: 600,
                                    outline: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {FISH_PREPARATIONS.map((p) => (
                                    <option key={p.id} value={p.name}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Card Footer Action */}
                            <div style={{ borderTop: '1px solid rgba(11, 37, 69, 0.08)', paddingTop: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                  Stima per {weight >= 1000 ? `${(weight / 1000).toFixed(1)} kg` : `${weight}g`}:
                                </span>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--color-ocean-dark)' }}>
                                  ~€{estPrice}
                                </strong>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFishCardDirectly(item);
                                }}
                                className="btn btn-coral"
                                style={{
                                  width: '100%',
                                  padding: '0.6rem 0.85rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 800,
                                  justifyContent: 'center',
                                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.25)',
                                }}
                              >
                                <PlusCircle size={16} />
                                <span>Aggiungi al Carrello</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Additional Note & Custom Request Form Removed */}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar / Bottom Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div
              className="glass-panel poke-summary-card"
              style={{
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-ocean-dark)',
                color: 'white',
                border: '1.5px solid rgba(141, 169, 196, 0.35)',
                boxShadow: '0 12px 32px rgba(11, 37, 69, 0.25)',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <ShoppingBag size={22} color="var(--color-coral)" />
                  <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                    Riepilogo Ordine
                  </h3>
                </div>

                {/* Realtime Grand Total Price Badge */}
                <div
                  style={{
                    backgroundColor: 'var(--color-coral)',
                    color: 'white',
                    padding: '0.4rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  €{(orderList.length > 0 ? grandTotal : (activeTab === 'poke' ? currentPokePrice : 0)).toFixed(2)}
                </div>
              </div>

              {/* Order Reference Info Badge */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38BDF8',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div>
                  <strong>Referente Ordine:</strong>{' '}
                  {orderList.length > 0
                    ? orderList[0].itemType === 'fritto'
                      ? orderList[0].personName || pokePersonName.trim() || 'Cliente'
                      : orderList[0].itemType === 'pesce'
                        ? orderList[0].personName || pokePersonName.trim() || 'Cliente'
                        : orderList[0].pokePersonName || pokePersonName.trim() || 'Cliente'
                    : pokePersonName.trim() || 'Cliente'}
                </div>
              </div>

              {/* Order List Display (If items added) */}
              {orderList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-sea-blue)', fontWeight: 700 }}>
                    Articoli nell'ordine ({orderList.length}):
                  </div>

                  {orderList.map((item) => {
                    if (item.itemType === 'fritto') {
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            position: 'relative',
                          }}
                        >
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
                        <div
                          key={item.id}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(56, 189, 248, 0.08)',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            position: 'relative',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#38BDF8', fontSize: '1rem' }}>
                              🐟 {item.name} ({weightLabel})
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
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: poke.id === editingPokeId ? 'rgba(229, 186, 66, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                          border: poke.id === editingPokeId ? '1.5px solid var(--color-gold)' : '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--color-gold)', fontSize: '1rem', whiteSpace: 'nowrap' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-sea-blue)', fontWeight: 700 }}>
                    Configurazione in corso:
                  </div>

                  <div style={summaryRowStyle}>
                    <span style={{ color: 'var(--color-sea-blue)' }}>Cliente:</span>
                    <strong>{pokePersonName.trim() || 'Non inserito'}</strong>
                  </div>

                  <div style={summaryRowStyle}>
                    <span style={{ color: 'var(--color-sea-blue)' }}>Telefono:</span>
                    <strong>{customerPhone.trim() || 'Non inserito'}</strong>
                  </div>

                  <div style={summaryRowStyle}>
                    <span style={{ color: 'var(--color-sea-blue)' }}>Modalità & Orario:</span>
                    <strong style={{ color: 'var(--color-gold)' }}>
                      {orderType} - {pickupTime}
                    </strong>
                  </div>

                  {activeTab === 'poke' ? (
                    <>
                      <div style={summaryRowStyle}>
                        <span style={{ color: 'var(--color-sea-blue)' }}>Formato Poke:</span>
                        <strong>{selectedFormat.name} (€{selectedFormat.price})</strong>
                      </div>

                      <div style={summaryRowStyle}>
                        <span style={{ color: 'var(--color-sea-blue)' }}>Basi:</span>
                        <span>{selectedBasi.length > 0 ? selectedBasi.join(', ') : 'Nessuna selezionata'}</span>
                      </div>

                      <div style={summaryRowStyle}>
                        <span style={{ color: 'var(--color-sea-blue)' }}>Proteine:</span>
                        <span>{selectedProteine.length > 0 ? selectedProteine.join(', ') : 'Nessuna selezionata'}</span>
                      </div>

                      <div style={summaryRowStyle}>
                        <span style={{ color: 'var(--color-sea-blue)' }}>Ingredienti:</span>
                        <span>{selectedIngredienti.length > 0 ? selectedIngredienti.join(', ') : 'Nessuno selezionato'}</span>
                      </div>

                      <div style={summaryRowStyle}>
                        <span style={{ color: 'var(--color-sea-blue)' }}>Salse:</span>
                        <span>{selectedSalse.length > 0 ? selectedSalse.join(', ') : 'Nessuna selezionata'}</span>
                      </div>

                      <div style={summaryRowStyle}>
                        <span style={{ color: 'var(--color-sea-blue)' }}>Semi di Sesamo:</span>
                        <strong>{semiSesamo ? 'SI' : 'NO'}</strong>
                      </div>
                    </>
                  ) : activeTab === 'fritti' ? (
                    <div style={{ padding: '0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8' }}>
                      Nessun cono fritto nel carrello.<br />
                      <span style={{ color: '#FBBF24', fontWeight: 600 }}>Scegli dal menù e clicca su "Aggiungi"</span>
                    </div>
                  ) : (
                    <div style={{ padding: '0.85rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: '#94A3B8' }}>
                      Nessun pescato nel carrello.<br />
                      <span style={{ color: '#38BDF8', fontWeight: 600 }}>Scegli la varietà, indica peso e pulizia e clicca su "Aggiungi al Carrello"</span>
                    </div>
                  )}
                </div>
              )}

              {/* General Order Notes Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', color: 'var(--color-sea-blue)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Note generali per l'ordine (opzionale):
                </label>
                <textarea
                  value={generalOrderNotes}
                  onChange={(e) => setGeneralOrderNotes(e.target.value)}
                  placeholder="Es. citofonare Rossi al 2° piano, o richieste per la consegna..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Validation Warning Alert */}
              {validationError && (
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#FCA5A5',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Direct KDS Order Submit Button */}
              <button
                type="button"
                onClick={handleDirectOrderSubmit}
                disabled={isSubmitting}
                className="btn btn-coral"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  padding: '1rem 0.75rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  textAlign: 'center',
                  lineHeight: 1.35,
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <Sparkles size={20} />
                <span>
                  {isSubmitting
                    ? 'Invio Ordine al Banco in corso...'
                    : orderList.length > 1
                      ? `Conferma e Invia ${orderList.length} Articoli al Banco`
                      : 'Conferma e Invia Ordine al Banco'}
                </span>
              </button>

              {/* Box Assistenza Ordini WhatsApp */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(37, 211, 102, 0.12)',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  color: '#DCFCE7',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  lineHeight: 1.4,
                }}
              >
                <MessageCircle size={22} color="#25D366" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Serve aiuto o modifiche?</strong>
                  <div style={{ opacity: 0.9, marginTop: '0.15rem' }}>
                    Se ci sono problemi con l'ordine, contatta la Pescheria su WhatsApp al{' '}
                    <a
                      href="https://wa.me/393459485857"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#4ADE80', fontWeight: 800, textDecoration: 'underline' }}
                    >
                      345 9485857
                    </a>
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  marginTop: '0.85rem',
                }}
              >
                L'ordine verrà inviato al banco e potrai seguirne la preparazione in tempo reale.
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Floating Checkout Bar for Mobile/Desktop */}
      {orderList.length > 0 && (
        <div
          className="floating-checkout-bar"
          style={{
            position: 'fixed',
            bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 2rem)',
            maxWidth: '520px',
            backgroundColor: '#0B2545',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            boxShadow: '0 12px 30px rgba(11, 37, 69, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            zIndex: 9999,
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#8DA9C4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Totale Ordine
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FBBF24' }}>
              €{grandTotal.toFixed(2)}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#CBD5E1' }}>
                ({orderList.length} {orderList.length === 1 ? 'Articolo' : 'Articoli'})
              </span>
            </span>
          </div>

          <button
            type="button"
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
              backgroundColor: '#FF6B6B',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(255, 107, 107, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              minWidth: '140px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              transition: 'background-color 0.2s, opacity 0.2s',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <span style={{ display: 'inline-block', minWidth: '85px', textAlign: 'center' }}>
              {isSubmitting ? 'Invio...' : 'Invia Ordine'}
            </span>
          </button>
        </div>
      )}
    </section>
  );
};

// FIX: aggiunto flex-basis + maxWidth così anche le chip (Basi, Proteine,
// Ingredienti, Salse) si dispongono correttamente nel container flex e le
// righe incomplete restano centrate su mobile.
const chipLabelStyle = (isChecked: boolean, isDisabled: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  flex: '1 1 140px',
  maxWidth: '100%',
  boxSizing: 'border-box',
  padding: '0.75rem 0.9rem',
  borderRadius: 'var(--radius-sm)',
  border: isChecked
    ? '1.5px solid var(--color-coral)'
    : '1px solid rgba(11, 37, 69, 0.12)',
  backgroundColor: isChecked
    ? 'rgba(255, 107, 107, 0.08)'
    : isDisabled
      ? '#F8FAFC'
      : 'white',
  cursor: isDisabled ? 'not-allowed' : 'pointer',
  opacity: isDisabled ? 0.6 : 1,
  transition: 'all 0.2s ease',
  userSelect: 'none',
  wordBreak: 'break-word',
});

const customCheckboxStyle = (isChecked: boolean, isDisabled: boolean): React.CSSProperties => ({
  width: '18px',
  height: '18px',
  borderRadius: '4px',
  border: isChecked
    ? 'none'
    : isDisabled
      ? '1.5px solid #CBD5E1'
      : '1.5px solid rgba(11, 37, 69, 0.3)',
  backgroundColor: isChecked ? 'var(--color-coral)' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  paddingBottom: '0.6rem',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  wordBreak: 'break-word',
  maxWidth: '100%',
};
