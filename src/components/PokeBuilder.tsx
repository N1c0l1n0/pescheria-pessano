import React, { useState } from 'react';
import { ShoppingBag, Check, AlertCircle, Sparkles, MessageCircle, Info, Trash2, PlusCircle, Edit3, RotateCcw } from 'lucide-react';

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
  price: number;
}

export const PokeBuilder: React.FC = () => {
  const [pokePersonName, setPokePersonName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>(FORMATS[0]);
  const [selectedBasi, setSelectedBasi] = useState<string[]>([]);
  const [selectedProteine, setSelectedProteine] = useState<string[]>([]);
  const [selectedIngredienti, setSelectedIngredienti] = useState<string[]>([]);
  const [semiSesamo, setSemiSesamo] = useState<boolean>(true);
  const [selectedSalse, setSelectedSalse] = useState<string[]>([]);
  
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

  // Grand Total calculation for all pokes in orderList
  const calculateGrandTotal = (): number => {
    const listTotal = orderList.reduce((acc, poke) => acc + poke.price, 0);
    return listTotal;
  };

  const grandTotal = calculateGrandTotal();

  // Add or Update configured Poke in order list
  const handleSavePokeToOrder = () => {
    const trimmedName = pokePersonName.trim();
    if (!trimmedName) {
      setValidationError('Inserisci il nome della persona per questa Poke!');
      return;
    }
    if (selectedBasi.length === 0) {
      setValidationError(`Seleziona almeno 1 Base per la Poke di ${trimmedName}!`);
      return;
    }
    if (selectedProteine.length === 0) {
      setValidationError(`Seleziona almeno 1 Proteina per la Poke di ${trimmedName}!`);
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

  // WhatsApp Multi-Poke Order Link Generator
  const handleWhatsAppOrder = () => {
    // Determine final list of pokes to send
    let finalPokes: ConfiguredPoke[] = [...orderList];

    // If orderList is empty but user configured current form, validate and auto add
    if (finalPokes.length === 0) {
      const trimmedName = pokePersonName.trim();
      if (!trimmedName) {
        setValidationError('Inserisci il nome di chi ordina la Poke prima di procedere!');
        return;
      }
      if (selectedBasi.length === 0) {
        setValidationError(`Seleziona almeno 1 Base per la Poke di ${trimmedName}!`);
        return;
      }
      if (selectedProteine.length === 0) {
        setValidationError(`Seleziona almeno 1 Proteina per la Poke di ${trimmedName}!`);
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
        price: currentPokePrice,
      });
    }

    setValidationError(null);

    const totalToPay = finalPokes.reduce((acc, p) => acc + p.price, 0);

    let text = `*NUOVO ORDINE POKE - PESCHERIA PESSANO*
--------------------------------
📊 *Totale Poke Ordinate:* ${finalPokes.length}
`;

    finalPokes.forEach((poke) => {
      text += `
📦 *POKE DI ${poke.pokePersonName.toUpperCase()}* (${poke.format.name} - €${poke.price.toFixed(2)})
🍚 *Basi:* ${poke.basi.length > 0 ? poke.basi.join(', ') : 'Nessuna'}
🐟 *Proteine:* ${poke.proteine.length > 0 ? poke.proteine.join(', ') : 'Nessuna'}
🥗 *Ingredienti:* ${poke.ingredienti.length > 0 ? poke.ingredienti.join(', ') : 'Nessuno'}
🍯 *Salse:* ${poke.salse.length > 0 ? poke.salse.join(', ') : 'Nessuna'}
🌱 *Semi di Sesamo:* ${poke.semiSesamo ? 'SI' : 'NO'}
`;
    });

    text += `--------------------------------
💰 *GRAN TOTALE ORDINE:* €${totalToPay.toFixed(2)}`;

    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/393459485857?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section
      id="poke"
      style={{
        padding: '5rem 0',
        backgroundColor: 'white',
      }}
    >
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 107, 107, 0.12)',
              color: 'var(--color-coral)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '1rem',
              border: '1px solid rgba(255, 107, 107, 0.3)',
            }}
          >
            <Sparkles size={16} />
            <span>Configuratore Multidose Interattivo</span>
          </div>

          <h2
            className="font-serif heading-dark-gradient"
            style={{
              fontSize: 'clamp(2.2rem, 3.5vw, 3.2rem)',
              fontWeight: 800,
              marginBottom: '1rem',
            }}
          >
            Componi la tua poke
          </h2>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Crea la tua poke o quelle per i tuoi amici e colleghi! Assegna ciascuna Poke alla persona che la desidera, modifica o aggiungi più formule e invia l'ordine completo su WhatsApp!
          </p>
        </div>

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

            {/* 1. Nome Persona per la Poke */}
            <div
              className="glass-panel"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-ice-blue)',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <label
                htmlFor="customerNameInput"
                style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--color-ocean-dark)',
                  marginBottom: '0.65rem',
                }}
              >
                1. Nome persona per questa Poke <span style={{ color: 'var(--color-coral)' }}>*</span>
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
                  backgroundColor: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  color: 'var(--color-ocean-dark)',
                  WebkitAppearance: 'none',
                }}
              />
            </div>

            {/* 2. Selezione Formato */}
            <div
              className="glass-panel"
              style={{
                padding: '1.75rem',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                2. Scegli il Formato {pokePersonName.trim() ? `(per ${pokePersonName.trim()})` : ''}
              </h3>

              <div
                className="poke-format-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
              className="glass-panel"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)' }}>
                  3. Basi <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedBasi.length}/{selectedFormat.maxBasi})</span>
                </h3>
              </div>

              <div className="poke-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
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
              className="glass-panel"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)' }}>
                  4. Proteine <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedProteine.length}/{selectedFormat.maxProteine})</span>
                </h3>
              </div>

              <div className="poke-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
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
              className="glass-panel"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)' }}>
                  5. Ingredienti Secondari (Topping) <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionati {selectedIngredienti.length}/{selectedFormat.maxSecondari})</span>
                </h3>
              </div>

              <div className="poke-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
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
              className="glass-panel"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                border: '1px solid rgba(11, 37, 69, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--color-ocean-dark)' }}>
                  6. Salse <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>(Selezionate {selectedSalse.length}/{selectedFormat.maxSalse})</span>
                </h3>
              </div>

              <div className="poke-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
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
              className="glass-panel"
              style={{
                padding: '1.5rem 1.75rem',
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
                    ? `Salva Modifiche Poke di "${pokePersonName.trim() || '...'}"`
                    : `Aggiungi Poke ${pokePersonName.trim() ? `di "${pokePersonName.trim()}"` : ''} all'Ordine (€${currentPokePrice.toFixed(2)})`}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
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
                    <span style={{ color: 'var(--color-sea-blue)' }}>Poke di:</span>
                    <strong>{pokePersonName.trim() || 'Non inserito'}</strong>
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
                </div>
              )}

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

              {/* WhatsApp Order Button */}
              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="btn btn-coral"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                <MessageCircle size={20} />
                <span>
                  {orderList.length > 1
                    ? `Invia Ordine ${orderList.length} Poke su WhatsApp`
                    : 'Invia Ordine Poke su WhatsApp'}
                </span>
              </button>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                  marginTop: '0.85rem',
                }}
              >
                Invia l'ordine completo su WhatsApp al numero: <strong>3459485857</strong>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

const chipLabelStyle = (isChecked: boolean, isDisabled: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
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
