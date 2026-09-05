import { describe, expect, it } from 'vitest';
import {
  FRIED_ON_ARRIVAL_DELIVERY,
  FRIED_ON_ARRIVAL_KDS,
  FRIED_ON_ARRIVAL_PICKUP,
  friedArrivalMessage,
} from './friedArrival';

describe('friedArrivalMessage', () => {
  it('uses pickup copy for ritiro', () => {
    expect(FRIED_ON_ARRIVAL_PICKUP).toBe(
      'I coni fritti si preparano all\'arrivo: presentati al banco e li friggiamo al momento, caldi.'
    );
    expect(friedArrivalMessage('Ritiro')).toBe(
      'I coni fritti si preparano all\'arrivo: presentati al banco e li friggiamo al momento, caldi.'
    );
  });

  it('uses departure copy for consegna', () => {
    expect(FRIED_ON_ARRIVAL_DELIVERY).toBe(
      'I coni fritti si friggono al momento della partenza, così arrivano caldi.'
    );
    expect(friedArrivalMessage('Consegna')).toBe(
      'I coni fritti si friggono al momento della partenza, così arrivano caldi.'
    );
  });
});

describe('KDS badge', () => {
  it('is the kitchen short label', () => {
    expect(FRIED_ON_ARRIVAL_KDS).toBe('Friggere all\'arrivo');
  });
});
