import { describe, expect, it } from 'vitest';
import {
  emptyStatusListCopy,
  matchesFulfillmentFilter,
  matchesStatusFilter,
  nextStatusFilter,
} from './kdsFilters';

describe('nextStatusFilter', () => {
  it('selects the clicked status when none is active', () => {
    expect(nextStatusFilter('ALL', 'RICEVUTO')).toBe('RICEVUTO');
  });

  it('clears when the same status is clicked again', () => {
    expect(nextStatusFilter('RICEVUTO', 'RICEVUTO')).toBe('ALL');
  });

  it('replaces when a different status is clicked', () => {
    expect(nextStatusFilter('RICEVUTO', 'PRONTO')).toBe('PRONTO');
  });
});

describe('matchesStatusFilter', () => {
  it('passes every status when filter is ALL', () => {
    expect(matchesStatusFilter('RICEVUTO', 'ALL')).toBe(true);
    expect(matchesStatusFilter('PRONTO', 'ALL')).toBe(true);
  });

  it('matches only the selected status', () => {
    expect(matchesStatusFilter('RICEVUTO', 'RICEVUTO')).toBe(true);
    expect(matchesStatusFilter('IN_PREPARAZIONE', 'RICEVUTO')).toBe(false);
  });
});

describe('matchesFulfillmentFilter', () => {
  it('ANDs with ritiro', () => {
    expect(matchesFulfillmentFilter('Ritiro', 'RITIRO')).toBe(true);
    expect(matchesFulfillmentFilter('Consegna', 'RITIRO')).toBe(false);
  });
});

describe('emptyStatusListCopy', () => {
  it('uses the generic empty copy for ALL', () => {
    expect(emptyStatusListCopy('ALL').title).toBe('Nessun Ordine Attivo al Momento!');
  });

  it('uses status-specific titles', () => {
    expect(emptyStatusListCopy('RICEVUTO').title).toBe('Nessun ordine in attesa');
    expect(emptyStatusListCopy('IN_PREPARAZIONE').title).toBe('Nessun ordine in preparazione');
    expect(emptyStatusListCopy('PRONTO').title).toBe('Nessun ordine pronto');
  });
});
