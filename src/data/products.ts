export interface Product {
  id: string;
  name: string;
  category: 'fresco' | 'gastronomia';
  tag: string;
  price: string;
  unit: string;
  description: string;
  image: string;
  origin: string;
  recipeTip: string;
  winePairing: string;
  isPopular?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 'orata-nostrana',
    name: 'Orata Nostrana di Mare',
    category: 'fresco',
    tag: 'Pesce Fresco da Cucinare',
    price: '€ 34,00',
    unit: 'al kg',
    description: 'Orata pescata nelle acque del Mar Ligure. Carni sode, magre e squisite. Perfetta al forno con patate ed erbe aromatiche.',
    image: '/hero_pescheria.png',
    origin: 'Pescato Mar Ligure - Finale Ligure',
    recipeTip: 'Cottura al forno a 180°C per 25 minuti con un filo d\'olio EVPO ligure, olive taggiasche e patate novelle.',
    winePairing: 'Pigato della Riviera Ligure di Ponente Doc',
    isPopular: true,
  },
  {
    id: 'cappon-magro',
    name: 'Cappon Magro Tradizionale Ligure',
    category: 'gastronomia',
    tag: 'Pronto da Mangiare',
    price: '€ 28,00',
    unit: 'a porzione',
    description: 'Il re della gastronomia marinara ligure. Strati di galletta del marinaio, verdure lesse, pesce bianco, aragosta e la tipica salsa verde.',
    image: '/cappon_magro.png',
    origin: 'Preparazione Artigianale Pessano',
    recipeTip: 'Pronto da gustare. Servire a temperatura ambiente per esaltare il profumo della salsa verde ligure.',
    winePairing: 'Vermentino Riviera Ligure di Ponente Doc',
    isPopular: true,
  },
  {
    id: 'fritto-misto',
    name: 'Fritto Misto di Pesce e Calamari',
    category: 'gastronomia',
    tag: 'Pronto da Mangiare',
    price: '€ 18,00',
    unit: 'a porzione',
    description: 'Calamaretti dorati, gamberi dolci e acciughe fresche fritti al momento in olio d\'oliva ad alta temperatura per una croccantezza impeccabile.',
    image: '/fritto_misto.png',
    origin: 'Cucina della Pescheria Pessano',
    recipeTip: 'Servire caldissimo con qualche goccia di limone fresco e una spolverata di sale marino grezzo.',
    winePairing: 'Lumassina Frizzante IGT o Vermentino',
    isPopular: true,
  },
  {
    id: 'gamberi-rossi',
    name: 'Gamberi Rossi di Sanremo Premium',
    category: 'fresco',
    tag: 'Pesce Fresco da Cucinare',
    price: '€ 48,00',
    unit: 'al kg',
    description: 'Pregiatissimi gamberi rossi freschissimi dal colore brillante e dal gusto inimitabile. Ottimi crudi in tartare o scottati 1 minuto.',
    image: '/hero_pescheria.png',
    origin: 'Pescato Ponente Ligure (Sanremo/Finale)',
    recipeTip: 'Ideali crudi con gocce di limone ligure e sale di Cervia, oppure scottati in padella con brandy.',
    winePairing: 'Pigato Superiore Riviera Ligure',
    isPopular: true,
  },
  {
    id: 'spigola-nostrana',
    name: 'Spigola Selvaggia in Crosta di Sale',
    category: 'fresco',
    tag: 'Pesce Fresco da Cucinare',
    price: '€ 36,00',
    unit: 'al kg',
    description: 'Spigola locale dalla carne compattissima e delicata. Suggerita per la cottura in crosta di sale grosso ed erbe della macchia mediterranea.',
    image: '/hero_pescheria.png',
    origin: 'Mar Ligure - Finale Ligure',
    recipeTip: 'Ricoprire interamente di sale grosso infornare a 200°C per 30 minuti. Mantiene un\'umidità unica.',
    winePairing: 'Ciliegiolo Vinificato in Bianco o Vermentino',
    isPopular: false,
  },
  {
    id: 'insalata-di-mare',
    name: 'Insalata di Mare Gourmet Pessano',
    category: 'gastronomia',
    tag: 'Pronto da Mangiare',
    price: '€ 16,50',
    unit: 'a porzione',
    description: 'Polpo cotto a bassa temperatura, seppioline tenere, cozze spezzine e gamberetti marinati con olio EVPO Riviera dei Fiori e prezzemolo fresco.',
    image: '/cappon_magro.png',
    origin: 'Laboratorio Gastronomico Pessano',
    recipeTip: 'Pronto da servire. Condire con un filo d\'olio ligure a crudo.',
    winePairing: 'Vermentino di Cervo Doc',
    isPopular: false,
  },
  {
    id: 'trofie-frutti-di-mare',
    name: 'Trofie al Pesto di Prà e Frutti di Mare',
    category: 'gastronomia',
    tag: 'Pronto da Mangiare',
    price: '€ 14,00',
    unit: 'a porzione',
    description: 'Trofie fresche artigianali spadellate con pesto genovese di Prà DOP, gamberi freschi e calamari del nostro pescato.',
    image: '/fritto_misto.png',
    origin: 'Tradizione Ligure Pessano',
    recipeTip: 'Riscaldare 2 minuti in padella con un cucchiaio d\'acqua di cottura.',
    winePairing: 'Pigato Tradizionale',
    isPopular: false,
  },
  {
    id: 'acciughe-impanate',
    name: 'Acciughe Fritte Impanate del Golfo',
    category: 'gastronomia',
    tag: 'Pronto da Mangiare',
    price: '€ 12,00',
    unit: 'a porzione (250g)',
    description: 'Acciughe nostrane aperte a libro, impanate con pane grattugiato aromatico alla maggiorana e fritte dorate.',
    image: '/fritto_misto.png',
    origin: 'Pescato locale Finale Ligure',
    recipeTip: 'Scaldare in forno ventilato a 180°C per 4 minuti.',
    winePairing: 'Lumassina IGT Colline Savonesi',
    isPopular: true,
  }
];
