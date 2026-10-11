export interface PokeFormatOption {
  id: string;
  name: string;
  price: number;
  maxBasi: number;
  maxProteine: number;
  maxSecondari: number;
  maxSalse: number;
  badge?: string;
  description?: string;
}

export interface PokeOptionItem {
  name: string;
  extraPrice: number;
  spicy?: boolean;
  highlight?: boolean;
}

export interface PokeBaseOption {
  id: string;
  name: string;
  desc?: string;
}

/**
 * Formati Poke ufficiali (Pescheria Pessano)
 */
export const POKE_FORMATS: PokeFormatOption[] = [
  {
    id: 'regular',
    name: 'Formato Regular',
    price: 10,
    maxBasi: 1,
    maxProteine: 1,
    maxSecondari: 3,
    maxSalse: 2,
    description: '1 Base · 1 Proteina · 3 Ingredienti · 2 Salse · Semi di sesamo',
  },
  {
    id: 'regularPlus',
    name: 'Formato Regular + 1 Proteina',
    price: 12,
    maxBasi: 1,
    maxProteine: 2,
    maxSecondari: 3,
    maxSalse: 2,
    badge: 'Più Scelta',
    description: '1 Base · 2 Proteine · 3 Ingredienti · 2 Salse · Semi di sesamo',
  },
  {
    id: 'xl',
    name: 'Formato XL',
    price: 15,
    maxBasi: 2,
    maxProteine: 3,
    maxSecondari: 5,
    maxSalse: 4,
    badge: 'Ricco & Completo',
    description: '2 Basi · 3 Proteine · 5 Ingredienti · 4 Salse · Semi di sesamo',
  },
];

/**
 * Alias per compatibilità con il PokeBuilder
 */
export const FORMATS: PokeFormatOption[] = POKE_FORMATS;

/**
 * Basi disponibili (Regular max 1, XL max 2)
 */
export const POKE_BASES: PokeBaseOption[] = [
  {
    id: 'riso-bianco',
    name: 'Riso Bianco',
    desc: 'Chicco tondo compatto, condito delicatamente con aceto di riso naturale.',
  },
  {
    id: 'riso-venere',
    name: 'Riso Venere',
    desc: 'Pregiato riso nero aromatico dalla consistenza piena e corposa.',
  },
  {
    id: 'insalata',
    name: 'Insalata',
    desc: 'Misticanza fresca e tenera selezionata ogni giorno per una base verde e leggera.',
  },
  {
    id: 'meta-riso-meta-insalata',
    name: 'Metà Riso Metà Insalata',
    desc: 'L\'unione ideale tra la morbidezza del riso e la freschezza croccante dell\'insalata.',
  },
];

/**
 * Nomi sintetici delle basi per il configuratore
 */
export const BASI: string[] = POKE_BASES.map((b) => b.name);

/**
 * Proteine ufficiali dal banco del pesce (Regular max 1, Regular+ max 2, XL max 3)
 */
export const POKE_PROTEINS: PokeOptionItem[] = [
  { name: 'Gambero Cotto', extraPrice: 0 },
  { name: 'Gambero in Tempura', extraPrice: 1 },
  { name: 'Salmone Crudo', extraPrice: 0, highlight: true },
  { name: 'Salmone Scottato', extraPrice: 0 },
  { name: 'Salmone in Tempura', extraPrice: 2 },
  { name: 'Polpo', extraPrice: 1 },
  { name: 'Tonno Crudo', extraPrice: 0, highlight: true },
  { name: 'Tonno in Tempura', extraPrice: 2 },
  { name: 'Tonno Scottato', extraPrice: 0 },
  { name: 'Pollo Grigliato', extraPrice: 0 },
  { name: 'Tofu', extraPrice: 0 },
];

/**
 * Alias per compatibilità con il PokeBuilder
 */
export const PROTEINE: PokeOptionItem[] = POKE_PROTEINS;

/**
 * Ingredienti Secondari ufficiali (Regular max 3, XL max 5)
 * Esattamente i 26 ingredienti del modulo cartaceo
 */
export const POKE_TOPPINGS: PokeOptionItem[] = [
  { name: 'Alghe Wakame', extraPrice: 0 },
  { name: 'Avocado', extraPrice: 0 },
  { name: 'Carota', extraPrice: 0 },
  { name: 'Cetriolo', extraPrice: 0 },
  { name: 'Cipolla Caramellata', extraPrice: 1 },
  { name: 'Cipolla Crispy', extraPrice: 0 },
  { name: 'Cipolla Rossa', extraPrice: 0 },
  { name: 'Edamame', extraPrice: 0 },
  { name: 'Feta', extraPrice: 1 },
  { name: 'Granella di Pistacchio', extraPrice: 1 },
  { name: 'Granella di Nocciole', extraPrice: 0 },
  { name: 'Mais', extraPrice: 0 },
  { name: 'Mandorle', extraPrice: 0 },
  { name: 'Mango', extraPrice: 1 },
  { name: 'Mozzarelline', extraPrice: 0 },
  { name: 'Nachos', extraPrice: 0 },
  { name: 'Olive Taggiasche', extraPrice: 1 },
  { name: 'Philadelphia', extraPrice: 0 },
  { name: 'Pomodorini Datterini', extraPrice: 0 },
  { name: 'Scaglie di Cocco', extraPrice: 0 },
  { name: 'Scaglie di Grana', extraPrice: 0 },
  { name: 'Semi di Girasole', extraPrice: 0 },
  { name: 'Semi di Papavero', extraPrice: 0 },
  { name: 'Surimi', extraPrice: 0 },
  { name: 'Zenzero', extraPrice: 0 },
  { name: 'Zucchine Cotte', extraPrice: 0 },
];

/**
 * Alias per compatibilità con il PokeBuilder
 */
export const INGREDIENTI: PokeOptionItem[] = POKE_TOPPINGS;

/**
 * Sottocategorie tematiche per la vetrina / presentazione,
 * con i nomi rigorosamente identici al foglietto.
 */
export interface ToppingShowcaseCategory {
  categoryName: string;
  subtitle: string;
  items: PokeOptionItem[];
}

export const POKE_TOPPING_SHOWCASE_CATEGORIES: ToppingShowcaseCategory[] = [
  {
    categoryName: 'Freschezza & Ortaggi del Giorno',
    subtitle: 'Verdure selezionate al mattino, fresche e croccanti',
    items: [
      { name: 'Alghe Wakame', extraPrice: 0 },
      { name: 'Avocado', extraPrice: 0 },
      { name: 'Carota', extraPrice: 0 },
      { name: 'Cetriolo', extraPrice: 0 },
      { name: 'Cipolla Crispy', extraPrice: 0 },
      { name: 'Cipolla Rossa', extraPrice: 0 },
      { name: 'Edamame', extraPrice: 0 },
      { name: 'Mais', extraPrice: 0 },
      { name: 'Pomodorini Datterini', extraPrice: 0 },
      { name: 'Surimi', extraPrice: 0 },
      { name: 'Zenzero', extraPrice: 0 },
      { name: 'Zucchine Cotte', extraPrice: 0 },
    ],
  },
  {
    categoryName: 'Croccanti, Semi & Frutta Secca',
    subtitle: 'Per dare consistenza, texture e una nota tostata irresistibile',
    items: [
      { name: 'Granella di Nocciole', extraPrice: 0 },
      { name: 'Mandorle', extraPrice: 0 },
      { name: 'Nachos', extraPrice: 0 },
      { name: 'Scaglie di Cocco', extraPrice: 0 },
      { name: 'Semi di Girasole', extraPrice: 0 },
      { name: 'Semi di Papavero', extraPrice: 0 },
    ],
  },
  {
    categoryName: 'Creme & Latticini',
    subtitle: 'Morbidezza e sapidità per avvolgere gli ingredienti',
    items: [
      { name: 'Mozzarelline', extraPrice: 0 },
      { name: 'Philadelphia', extraPrice: 0 },
      { name: 'Scaglie di Grana', extraPrice: 0 },
    ],
  },
  {
    categoryName: 'I Nostri Extra Gourmet',
    subtitle: 'Ingredienti speciali e tipicità per un tocco ricercato',
    items: [
      { name: 'Cipolla Caramellata', extraPrice: 1 },
      { name: 'Feta', extraPrice: 1 },
      { name: 'Granella di Pistacchio', extraPrice: 1 },
      { name: 'Mango', extraPrice: 1 },
      { name: 'Olive Taggiasche', extraPrice: 1 },
    ],
  },
];

/**
 * Salse artigianali ufficiali (Regular max 2, XL max 4)
 * Esattamente le 16 salse del modulo cartaceo
 */
export const POKE_SAUCES: PokeOptionItem[] = [
  { name: 'Glassa Balsamica', extraPrice: 0 },
  { name: 'Maionese', extraPrice: 0 },
  { name: 'Maio Spicy', extraPrice: 0, spicy: true },
  { name: 'Maio Tabasco', extraPrice: 0, spicy: true },
  { name: 'Miele', extraPrice: 0 },
  { name: 'Olio', extraPrice: 0 },
  { name: 'Olio Piccante', extraPrice: 0, spicy: true },
  { name: 'Crema di Avocado', extraPrice: 0 },
  { name: 'Pesto', extraPrice: 1 },
  { name: 'Salsa Agrodolce', extraPrice: 0 },
  { name: 'Salsa Agropiccante', extraPrice: 0, spicy: true },
  { name: 'Salsa Rosa', extraPrice: 0 },
  { name: 'Salsa Teryaki', extraPrice: 0 },
  { name: 'Salsa Yogurt', extraPrice: 0 },
  { name: 'Soia', extraPrice: 0 },
  { name: 'Spicy Mango', extraPrice: 0 },
];

/**
 * Alias per compatibilità con il PokeBuilder
 */
export const SALSE: PokeOptionItem[] = POKE_SAUCES;

export interface SauceShowcaseCategory {
  categoryName: string;
  subtitle: string;
  items: PokeOptionItem[];
}

export const POKE_SAUCE_SHOWCASE_CATEGORIES: SauceShowcaseCategory[] = [
  {
    categoryName: 'Le Classiche & Delicate',
    subtitle: 'Equilibrate e pulite, studiate per rispettare il sapore autentico del pesce',
    items: [
      { name: 'Glassa Balsamica', extraPrice: 0 },
      { name: 'Maionese', extraPrice: 0 },
      { name: 'Miele', extraPrice: 0 },
      { name: 'Olio', extraPrice: 0 },
      { name: 'Salsa Rosa', extraPrice: 0 },
      { name: 'Salsa Yogurt', extraPrice: 0 },
      { name: 'Soia', extraPrice: 0 },
    ],
  },
  {
    categoryName: 'Esotiche & Fruttate',
    subtitle: 'Armonie agrodolci, cremose e orientali',
    items: [
      { name: 'Crema di Avocado', extraPrice: 0 },
      { name: 'Salsa Agrodolce', extraPrice: 0 },
      { name: 'Salsa Teryaki', extraPrice: 0 },
      { name: 'Spicy Mango', extraPrice: 0 },
    ],
  },
  {
    categoryName: 'Note Piccanti & Decise',
    subtitle: 'Sferzate di intensità calibrate per chi ama il gusto vivo',
    items: [
      { name: 'Maio Spicy', extraPrice: 0, spicy: true },
      { name: 'Maio Tabasco', extraPrice: 0, spicy: true },
      { name: 'Olio Piccante', extraPrice: 0, spicy: true },
      { name: 'Salsa Agropiccante', extraPrice: 0, spicy: true },
    ],
  },
  {
    categoryName: 'L’Eccellenza del Nostro Territorio (+1,00€)',
    subtitle: 'Il profumo inconfondibile della tradizione ligure',
    items: [
      { name: 'Pesto', extraPrice: 1 },
    ],
  },
];

export const POKE_SESAME_NOTE =
  'Informiamo la gentile clientela che i nostri poke hanno come topping preimpostato i semi di sesamo (SI / NO).';
