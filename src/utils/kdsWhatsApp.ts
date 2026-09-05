import type { KdsOrder } from './orderMappers';

export const normalizePhoneForWhatsApp = (phone: string): string | null => {
  if (!phone?.trim()) return null;

  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('39')) {
    let national = digits.slice(2);
    if (national.startsWith('0')) national = national.slice(1);
    if (national.length >= 8 && national.length <= 11) return `39${national}`;
    return digits.length >= 11 ? digits : null;
  }

  if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length >= 8 && digits.length <= 11) return `39${digits}`;

  return digits.length >= 9 ? digits : null;
};

export const buildOrderReadyWhatsAppMessage = (order: KdsOrder): string => {
  const displayId = order.display_id || `#${order.id}`;
  const isDelivery = order.order_type?.toLowerCase().includes('consegna');
  return isDelivery
    ? `Ciao ${order.customer_name}, il tuo ordine ${displayId} è pronto! Stiamo preparando la consegna. — Pescheria Pessano`
    : `Ciao ${order.customer_name}, il tuo ordine ${displayId} è pronto! Puoi passare a ritirarlo. — Pescheria Pessano`;
};

export const buildOrderReadyWhatsAppUrl = (order: KdsOrder): string | null => {
  const phone = normalizePhoneForWhatsApp(order.phone || '');
  if (!phone) return null;

  const message = buildOrderReadyWhatsAppMessage(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

export const openOrderReadyWhatsApp = (order: KdsOrder): void => {
  const url = buildOrderReadyWhatsAppUrl(order);
  if (!url) return;

  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => undefined);
  }

  const popup = window.open(url, '_blank');
  if (popup) {
    try {
      popup.opener = null;
    } catch {
      // ignore: some browsers block touching opener across origins
    }
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
