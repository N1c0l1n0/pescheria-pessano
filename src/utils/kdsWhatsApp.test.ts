import { describe, expect, it } from 'vitest';
import type { KdsOrder } from './orderMappers';
import {
  buildOrderReadyWhatsAppMessage,
  buildOrderReadyWhatsAppUrl,
  normalizePhoneForWhatsApp,
} from './kdsWhatsApp';

const baseOrder = (overrides: Partial<KdsOrder> = {}): KdsOrder => ({
  id: 'ord-1',
  display_id: '#42',
  status: 'IN_PREPARAZIONE',
  created_at: '2026-09-05T10:00:00.000Z',
  customer_name: 'Mario Rossi',
  phone: '333 1234567',
  order_type: 'Ritiro',
  total_price: 15,
  order_items: [],
  ...overrides,
});

describe('normalizePhoneForWhatsApp', () => {
  it('normalizes Italian mobile without country code', () => {
    expect(normalizePhoneForWhatsApp('333 1234567')).toBe('393331234567');
  });

  it('returns null for empty phone', () => {
    expect(normalizePhoneForWhatsApp('')).toBeNull();
    expect(normalizePhoneForWhatsApp('   ')).toBeNull();
  });

  it('returns null for too-short numbers', () => {
    expect(normalizePhoneForWhatsApp('123')).toBeNull();
  });
});

describe('buildOrderReadyWhatsAppMessage', () => {
  it('uses pickup copy for ritiro orders', () => {
    const msg = buildOrderReadyWhatsAppMessage(baseOrder({ order_type: 'Ritiro' }));
    expect(msg).toContain('Puoi passare a ritirarlo');
    expect(msg).toContain('Mario Rossi');
    expect(msg).toContain('#42');
  });

  it('uses delivery copy for consegna orders', () => {
    const msg = buildOrderReadyWhatsAppMessage(baseOrder({ order_type: 'Consegna a domicilio' }));
    expect(msg).toContain('Stiamo preparando la consegna');
  });
});

describe('buildOrderReadyWhatsAppUrl', () => {
  it('returns wa.me URL when phone is valid', () => {
    const url = buildOrderReadyWhatsAppUrl(baseOrder());
    expect(url).toMatch(/^https:\/\/wa\.me\/393331234567\?text=/);
  });

  it('returns null when phone is missing', () => {
    expect(buildOrderReadyWhatsAppUrl(baseOrder({ phone: undefined }))).toBeNull();
  });
});
