export type FulfillmentFilter = 'TUTTI' | 'RITIRO' | 'CONSEGNA';

export function matchesFulfillmentFilter(
  orderType: string,
  filter: FulfillmentFilter
): boolean {
  const type = orderType.toLowerCase();
  if (filter === 'RITIRO') return type.includes('ritiro');
  if (filter === 'CONSEGNA') return type.includes('consegna');
  return true;
}

export function emptyWorkAreaCopy(): { title: string; body: string } {
  return {
    title: 'Nessun ordine da preparare',
    body: 'Tutti gli ordini attivi sono pronti per il ritiro o in attesa di nuovi ordini.',
  };
}
