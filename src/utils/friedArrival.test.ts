import { describe, expect, it } from 'vitest';
import {
  FRIED_ON_ARRIVAL_DELIVERY,
  FRIED_ON_ARRIVAL_KDS,
  FRIED_ON_ARRIVAL_PICKUP,
  friedArrivalMessage,
} from './friedArrival';

describe('friedArrivalMessage', () => {
  it('uses pickup copy for ritiro', () => {
    expect(friedArrivalMessage('Ritiro')).toBe(FRIED_ON_ARRIVAL_PICKUP);
  });

  it('uses departure copy for consegna', () => {
    expect(friedArrivalMessage('Consegna')).toBe(FRIED_ON_ARRIVAL_DELIVERY);
  });
});

describe('KDS badge', () => {
  it('is the kitchen short label', () => {
    expect(FRIED_ON_ARRIVAL_KDS).toBe('Friggere all\'arrivo');
  });
});
