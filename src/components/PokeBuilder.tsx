import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Check, AlertCircle, Sparkles, MessageCircle, Info, Trash2, PlusCircle, Edit3, RotateCcw, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { saveLocalOrder } from '../utils/orderStore';
import { subscribeToOrderPush } from '../lib/onesignal';
import { AlarmTimePicker } from './AlarmTimePicker';

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

export interface ConfiguredPoke {
  id: string;
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

  // List of added Pokes for multi-poke ordering
  const [orderList, setOrderList] = useState<ConfiguredPoke[]>([]);

  // State for editing an existing poke
  const [editingPokeId, setEditingPokeId] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    const listTotal = orderList.reduce((acc, poke) => acc + poke.price, 0);
    return listTotal;
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
        `Poke di "${trimmedName}" aggiunta all'ordine! I campi sono stati azzerati: puoi ora comporre la Poke per un'altra persona oppure inviare l'ordine completo.`
      );

      // Smooth scroll to form step 1
      document.getElementById('customerNameInput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => setSuccessMsg(null), 6000);
    }
  };

  // Edit a Poke from order list
  const handleEditPoke = (poke: ConfiguredPoke) => {
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

  // Remove Poke from order list
  const handleRemovePoke = (id: string) => {
    if (editingPokeId === id) {
      handleCancelEdit();
    }
    const updated = orderList.filter((item) => item.id !== id);
    setOrderList(updated);
  };

  // Direct KDS Order Submission & Live Tracking Redirect
  const handleDirectOrderSubmit = async () => {
    let finalPokes: ConfiguredPoke[] = [...orderList];

    if (!customerPhone.trim()) {
      triggerValidationError('Inserisci il tuo Numero di Telefono prima di inviare l\'ordine!', 'customerPhoneInput');
      return;
    }

    if (orderType === 'Consegna' && !deliveryAddress.trim()) {
      triggerValidationError('Inserisci l\'indirizzo di consegna per procedere!', 'deliveryAddressInput');
      return;
    }

    // If orderList is empty but user configured current form, validate and auto add
    if (finalPokes.length === 0) {
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

      finalPokes.push({
        id: Date.now().toString(),
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
    }

    setValidationError(null);
    setIsSubmitting(true);

    const totalToPay = finalPokes.reduce((acc, p) => acc + p.price, 0);
    const effectiveTime = pickupTime || 'Prima possibile';
    const clientName = finalPokes[0]?.pokePersonName || 'Cliente';
    const combinedNotes = [
      `Orario: ${effectiveTime}`,
      generalOrderNotes.trim() ? `Note generali: ${generalOrderNotes.trim()}` : null,
    ].filter(Boolean).join(' — ');

    let insertedOrderId: string | null = null;
    const generatedFriendlyId = `#${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // 1. Insert parent order into Supabase 'orders' table (including friendly_id for NOT NULL constraint)
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

      // 2. Insert items into 'order_items' table if order ID exists (including uuid id for NOT NULL constraint)
      if (insertedOrderId) {
        const numericOrderId = !isNaN(Number(insertedOrderId)) ? Number(insertedOrderId) : insertedOrderId;
        const itemsPayload = finalPokes.map((poke) => ({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          order_id: numericOrderId,
          item_type: 'poke',
          name: `Poke ${poke.format.name} (${poke.pokePersonName})`,
          quantity: 1,
          unit_price: poke.price,
          details: {
            size: poke.format.name,
            bases: poke.basi,
            proteins: poke.proteine,
            toppings: poke.ingredienti,
            sauces: poke.salse,
            has_sesame: poke.semiSesamo,
            notes: poke.notes || '',
          },
        }));

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
      order_items: finalPokes.map((poke) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        item_name: `Poke ${poke.format.name} (${poke.pokePersonName})`,
        name: `Poke ${poke.format.name} (${poke.pokePersonName})`,
        size: poke.format.name,
        bases: poke.basi,
        proteins: poke.proteine,
        toppings: poke.ingredienti,
        sauces: poke.salse,
        has_sesame: poke.semiSesamo,
        notes: poke.notes || '',
        price: poke.price,
        unit_price: poke.price,
        quantity: 1,
        details: {
          size: poke.format.name,
          bases: poke.basi,
          proteins: poke.proteine,
          toppings: poke.ingredienti,
          sauces: poke.salse,
          has_sesame: poke.semiSesamo,
          notes: poke.notes || '',
        },
      })),
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
                  <strong>Gestione Nomi & Ordine:</strong> Il <strong>Numero di telefono è univoco</strong> per tutti i Poke nel carrello. Il <strong>nome della prima Poke</strong> definisce il referente dell'intero ordine.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Nome Persona */}
                <div>
                  <label htmlFor="customerNameInput" style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ocean-dark)', marginBottom: '0.4rem' }}>
                    {orderList.length === 0 ? (
                      <>
                        Nome referente prima Poke (Referente Ordine) <span style={{ color: 'var(--color-coral)' }}>*</span>
                      </>
                    ) : (
                      <>
                        Nome destinatario per questa Poke <span style={{ color: 'var(--color-coral)' }}>*</span>
                      </>
                    )}
                  </label>
                  <input
                    id="customerNameInput"
                    type="text"
                    placeholder="Es. Marco, Sara, Luca..."
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
                    {orderList.length === 0 ? (
                      <span>📌 Nome di questa Poke e referente principale dell'intero ordine.</span>
                    ) : (
                      <span>🏷️ Nome della persona a cui è destinata questa singola Poke.</span>
                    )}
                  </div>
                </div>

                {/* Numero di Telefono */}
                <div>
                  <label htmlFor="customerPhoneInput" style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-ocean-dark)', marginBottom: '0.4rem' }}>
                    Numero di Telefono <span style={{ color: 'var(--color-coral)' }}>*</span>
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
                    if (timeStr === 'Prima possibile' || timeStr.includes('ASAP')) {
                      setPickupTime(`Prima possibile (${day === 'oggi' ? 'Oggi' : 'Domani'})`);
                    } else {
                      setPickupTime(`${timeStr} (${day === 'oggi' ? 'Oggi' : 'Domani'})`);
                    }
                  }}
                />
              </div>
            </div>

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
                }}
              >
                {FORMATS.map((fmt) => {
                  const isSelected = selectedFormat.id === fmt.id;

                  return (
                    <div
                      key={fmt.id}
                      onClick={() => handleFormatChange(fmt)}
                      style={{
                        // FIX: flex-basis al posto di minmax(220px,1fr) della grid,
                        // maxWidth evita che la card si allarghi troppo da sola su una riga
                        flex: '1 1 220px',
                        maxWidth: '320px',
                        padding: '1.15rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--color-coral)' : '1px solid rgba(11, 37, 69, 0.12)',
                        backgroundColor: isSelected ? 'rgba(255, 107, 107, 0.05)' : 'var(--color-ice-blue)',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                        <strong style={{ fontSize: '0.975rem', color: 'var(--color-ocean-dark)', lineHeight: 1.25, flex: 1, wordBreak: 'break-word' }}>
                          {fmt.name}
                        </strong>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-coral)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          €{fmt.price}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                        • Max {fmt.maxBasi} Base <br />
                        • Max {fmt.maxProteine} Protein{fmt.maxProteine > 1 ? 'e' : 'a'} <br />
                        • Max {fmt.maxSecondari} Ingredienti <br />
                        • Max {fmt.maxSalse} Salse
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Basi */}
            <div
              className="glass-panel poke-card-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                  3. Basi <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedBasi.length}/{selectedFormat.maxBasi})</span>
                </h3>
              </div>

              {/* FIX: flexbox con wrap invece di grid, per centrare le chip anche
                  quando l'ultima riga non è completa */}
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
              className="glass-panel poke-card-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                  4. Proteine <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedProteine.length}/{selectedFormat.maxProteine})</span>
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
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                  5. Ingredienti Secondari (Topping) <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionati {selectedIngredienti.length}/{selectedFormat.maxSecondari})</span>
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
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                  6. Salse <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedSalse.length}/{selectedFormat.maxSalse})</span>
                </h3>
              </div>

              <div className="poke-options-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
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
            </div>

            {/* 7. Semi di Sesamo */}
            <div
              className="glass-panel poke-card-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-ice-blue)',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                    7. Semi di Sesamo
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Info size={15} color="var(--color-sea-blue)" />
                    <span>I nostri Poke hanno di default i semi di sesamo come topping.</span>
                  </div>
                </div>

                {/* Toggle Buttons */}
                <div style={{ display: 'flex', backgroundColor: 'white', padding: '0.25rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(11,37,69,0.1)' }}>
                  <button
                    type="button"
                    onClick={() => setSemiSesamo(true)}
                    style={{
                      padding: '0.45rem 1.25rem',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      backgroundColor: semiSesamo ? 'var(--color-ocean-dark)' : 'transparent',
                      color: semiSesamo ? 'white' : 'var(--color-text-muted)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    SI
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemiSesamo(false)}
                    style={{
                      padding: '0.45rem 1.25rem',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      backgroundColor: !semiSesamo ? 'var(--color-coral)' : 'transparent',
                      color: !semiSesamo ? 'white' : 'var(--color-text-muted)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    NO
                  </button>
                </div>
              </div>
            </div>

            {/* 8. Note per questa Poke */}
            <div
              className="glass-panel poke-card-panel"
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileText size={18} color="var(--color-ocean-dark)" />
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-ocean-dark)', margin: 0 }}>
                  8. Note o richieste particolari per questa Poke <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(opzionale)</span>
                </h4>
              </div>
              <textarea
                value={pokeNotes}
                onChange={(e) => setPokeNotes(e.target.value)}
                placeholder="Es. salsa a parte, riso poco condito, allergia alle noci, posate monouso..."
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
                  outline: 'none',
                }}
              />
            </div>

            {/* Add or Update Poke Action Button */}
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSavePokeToOrder}
                className="btn btn-ocean"
                style={{
                  flex: 1,
                  padding: '0.9rem 1.15rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  backgroundColor: editingPokeId ? 'var(--color-gold)' : 'var(--color-ocean-dark)',
                  color: editingPokeId ? 'var(--color-ocean-dark)' : 'white',
                  borderRadius: 'var(--radius-md)',
                  lineHeight: 1.35,
                  textAlign: 'center',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {editingPokeId ? <Edit3 size={22} /> : <PlusCircle size={22} color="var(--color-sea-blue)" />}
                <span>
                  {editingPokeId
                    ? 'Salva Modifiche Poke'
                    : `Aggiungi questa Poke all'Ordine (€${currentPokePrice.toFixed(2)})`}
                </span>
              </button>

              {editingPokeId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-outline-light"
                  style={{
                    padding: '1rem 1.5rem',
                    color: 'var(--color-ocean-dark)',
                    borderColor: 'rgba(11,37,69,0.3)',
                    backgroundColor: 'var(--color-ice-blue)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <RotateCcw size={18} />
                  <span>Annulla</span>
                </button>
              )}
            </div>

          </div>

          {/* Sticky Order Summary Sidebar / Bottom Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
            <div
              className="glass-panel poke-summary-card"
              style={{
                position: 'sticky',
                top: '6rem',
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-ocean-dark)',
                color: 'white',
                border: '1px solid rgba(141, 169, 196, 0.2)',
                boxShadow: 'var(--shadow-lg)',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
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
                  €{(orderList.length > 0 ? grandTotal : currentPokePrice).toFixed(2)}
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
                <div>👤 <strong>Referente Principale:</strong> {orderList[0]?.pokePersonName || pokePersonName.trim() || 'Prima Poke'}</div>
              </div>

              {/* Order List Display (If Pokes added) */}
              {orderList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-sea-blue)', fontWeight: 700 }}>
                    Poke aggiunte nell'ordine ({orderList.length}):
                  </div>

                  {orderList.map((poke) => (
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

                        {/* Action buttons: Modifica & Rimuovi */}
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
                            📝 Note: {poke.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Single Poke Current Config Preview */
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

                  <div style={summaryRowStyle}>
                    <span style={{ color: 'var(--color-sea-blue)' }}>Formato:</span>
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

                  {pokeNotes.trim() && (
                    <div style={summaryRowStyle}>
                      <span style={{ color: 'var(--color-sea-blue)' }}>Note Poke:</span>
                      <span style={{ color: '#FDE047', fontWeight: 600 }}>{pokeNotes.trim()}</span>
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
                  padding: '1.1rem 1rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
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
                      ? `Conferma e Invia ${orderList.length} Poke al Banco`
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
            bottom: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 2.5rem)',
            maxWidth: '520px',
            backgroundColor: '#0B2545',
            borderRadius: '16px',
            padding: '0.85rem 1.25rem',
            boxShadow: '0 12px 30px rgba(11, 37, 69, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            zIndex: 9999,
            border: '1px solid rgba(255, 255, 255, 0.15)',
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
                ({orderList.length} {orderList.length === 1 ? 'Poke' : 'Poke'})
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
