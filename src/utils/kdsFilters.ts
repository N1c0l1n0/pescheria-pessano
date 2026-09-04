export type FulfillmentFilter = 'TUTTI' | 'RITIRO' | 'CONSEGNA';
export type StatusFilter = 'ALL' | 'RICEVUTO' | 'IN_PREPARAZIONE' | 'PRONTO';

export function nextStatusFilter(
  current: StatusFilter,
  clicked: Exclude<StatusFilter, 'ALL'>
): StatusFilter {
  return current === clicked ? 'ALL' : clicked;
}

export function matchesStatusFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'ALL') return true;
  return status === filter;
}

export function matchesFulfillmentFilter(
  orderType: string,
  filter: FulfillmentFilter
): boolean {
  const type = orderType.toLowerCase();
  if (filter === 'RITIRO') return type.includes('ritiro');
  if (filter === 'CONSEGNA') return type.includes('consegna');
  return true;
}

export function emptyStatusListCopy(filter: StatusFilter): { title: string; body: string } {
  if (filter === 'RICEVUTO') {
    return {
      title: 'Nessun ordine in attesa',
      body: 'Non ci sono ordini ricevuti da preparare.',
    };
  }
  if (filter === 'IN_PREPARAZIONE') {
    return {
      title: 'Nessun ordine in preparazione',
      body: 'Nessun ordine è attualmente in preparazione.',
    };
  }
  if (filter === 'PRONTO') {
    return {
      title: 'Nessun ordine pronto',
      body: 'Nessun ordine è pronto per il ritiro o la consegna.',
    };
  }
  return {
    title: 'Nessun Ordine Attivo al Momento!',
    body: 'Tutti gli ordini in coda sono stati preparati e completati. In attesa di nuovi ordini in arrivo dai clienti.',
  };
}
