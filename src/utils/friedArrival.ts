export const FRIED_ON_ARRIVAL_PICKUP =
  "I coni fritti si preparano all'arrivo: presentati al banco e li friggiamo al momento, caldi.";

export const FRIED_ON_ARRIVAL_DELIVERY =
  'I coni fritti si friggono al momento della partenza, così arrivano caldi.';

export const FRIED_ON_ARRIVAL_KDS = "Friggere all'arrivo";

export function friedArrivalMessage(orderType: string): string {
  return orderType.toLowerCase().includes('consegna')
    ? FRIED_ON_ARRIVAL_DELIVERY
    : FRIED_ON_ARRIVAL_PICKUP;
}
