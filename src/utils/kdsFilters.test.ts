import { describe, expect, it } from 'vitest';
import { emptyWorkAreaCopy, matchesFulfillmentFilter } from './kdsFilters';

describe('matchesFulfillmentFilter', () => {
  it('passes ritiro orders when filter is RITIRO', () => {
    expect(matchesFulfillmentFilter('Ritiro', 'RITIRO')).toBe(true);
    expect(matchesFulfillmentFilter('Consegna', 'RITIRO')).toBe(false);
  });

  it('passes consegna orders when filter is CONSEGNA', () => {
    expect(matchesFulfillmentFilter('Consegna', 'CONSEGNA')).toBe(true);
    expect(matchesFulfillmentFilter('Ritiro', 'CONSEGNA')).toBe(false);
  });

  it('passes all orders when filter is TUTTI', () => {
    expect(matchesFulfillmentFilter('Ritiro', 'TUTTI')).toBe(true);
    expect(matchesFulfillmentFilter('Consegna', 'TUTTI')).toBe(true);
  });
});

describe('emptyWorkAreaCopy', () => {
  it('returns work-area empty copy', () => {
    expect(emptyWorkAreaCopy()).toEqual({
      title: 'Nessun ordine da preparare',
      body: 'Tutti gli ordini attivi sono pronti per il ritiro o in attesa di nuovi ordini.',
    });
  });
});
