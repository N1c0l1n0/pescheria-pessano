/// <reference types="vite/client" />
// Centralized OneSignal Web SDK Module for Pescheria Pessano

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export const ONESIGNAL_APP_ID = ((import.meta as any).env?.VITE_ONESIGNAL_APP_ID as string) || '';
export const ONESIGNAL_REST_API_KEY = ((import.meta as any).env?.VITE_ONESIGNAL_REST_API_KEY as string) || '';

let isInitialized = false;
let dialogShown = false;

// Check if subscription ID is server-assigned (non-empty & not starting with 'local-')
export const isRegisteredSubscription = (subscriptionId: string | null | undefined): boolean => {
  return Boolean(subscriptionId && !subscriptionId.startsWith('local-'));
};

/**
 * Loads OneSignal Web SDK script dynamically
 */
const loadOneSignalScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.getElementById('onesignal-sdk-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'onesignal-sdk-script';
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

/**
 * Initialize OneSignal Web SDK
 */
export const initOneSignal = async (
  onShowVerificationModal?: (show: boolean) => void
): Promise<boolean> => {
  if (isInitialized) return true;
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID missing in environment variables.');
    return false;
  }

  try {
    await loadOneSignalScript();

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
      });

      isInitialized = true;
      console.log('[OneSignal] Initialized successfully with App ID:', ONESIGNAL_APP_ID);

      // Register Push Subscription Observer (Required Step)
      const maybeShowDialog = (subId: string | null | undefined) => {
        if (isRegisteredSubscription(subId) && !dialogShown) {
          dialogShown = true;
          if (onShowVerificationModal) {
            onShowVerificationModal(true);
          }
        }
      };

      // Listen for subscription changes
      if (OneSignal.User?.PushSubscription) {
        OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
          maybeShowDialog(event?.current?.id);
        });

        // Evaluate immediately on registration
        const currentSubId = OneSignal.User.PushSubscription.id;
        maybeShowDialog(currentSubId);
      }
    });

    return true;
  } catch (err) {
    console.error('[OneSignal] SDK Load/Initialization failed:', err);
    return false;
  }
};

/**
 * Request Push Permission on tap
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (!window.OneSignal) {
    console.warn('[OneSignal] SDK not ready');
    return false;
  }
  try {
    const granted = await window.OneSignal.Notifications.requestPermission();
    console.log('[OneSignal] Permission granted:', granted);
    return Boolean(granted);
  } catch (err) {
    console.error('[OneSignal] Request permission error:', err);
    return false;
  }
};

/**
 * Tag device for specific order status updates (e.g. order_16 -> 'subscribed')
 */
export const subscribeToOrderPush = async (orderId: string): Promise<boolean> => {
  const perm = await requestPushPermission();
  if (!perm && window.OneSignal?.Notifications?.permission !== true) {
    console.warn('[OneSignal] Notification permission not granted');
  }

  if (window.OneSignal?.User) {
    try {
      await window.OneSignal.User.addTag(`order_${orderId}`, 'subscribed');
      console.log(`[OneSignal] Tagged device for Order #${orderId}`);
      return true;
    } catch (err) {
      console.error('[OneSignal] Error adding order tag:', err);
    }
  }
  return false;
};

/**
 * Tag current device for KDS Kitchen Staff
 */
export const tagAsKdsStaff = async (): Promise<boolean> => {
  await requestPushPermission();
  if (window.OneSignal?.User) {
    try {
      await window.OneSignal.User.addTag('role', 'kds');
      console.log('[OneSignal] Tagged device as KDS Kitchen Staff');
      return true;
    } catch (err) {
      console.error('[OneSignal] Error tagging KDS:', err);
    }
  }
  return false;
};

/**
 * Send Order Status Push Notification via OneSignal REST API
 */
export const sendOrderStatusNotification = async (payload: {
  orderId: string;
  customerName: string;
  newStatus: string; // 'IN_PREPARAZIONE' | 'PRONTO' | 'COMPLETATO'
  customApiKey?: string;
}): Promise<boolean> => {
  const apiKey = payload.customApiKey || ONESIGNAL_REST_API_KEY;
  if (!ONESIGNAL_APP_ID || !apiKey) {
    console.warn('[OneSignal] Cannot send push notification: missing App ID or REST API Key.');
    return false;
  }

  let title = '🍱 Aggiornamento Ordine Pescheria Pessano';
  let message = `Il tuo ordine #${payload.orderId} ha cambiato stato in: ${payload.newStatus}`;

  if (payload.newStatus === 'IN_PREPARAZIONE') {
    title = '🔥 Poke in Preparazione!';
    message = `Ciao ${payload.customerName}, la tua Poke è in fase di preparazione da Pescheria Pessano!`;
  } else if (payload.newStatus === 'PRONTO') {
    title = '🎉 La tua Poke è Pronta!';
    message = `Ciao ${payload.customerName}, la tua Poke è PRONTA! Puoi passare a ritirarla.`;
  } else if (payload.newStatus === 'COMPLETATO') {
    title = '✅ Ordine Completato';
    message = `Grazie per aver scelto Pescheria Pessano, ${payload.customerName}!`;
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { it: title, en: title },
        contents: { it: message, en: message },
        url: `${window.location.origin}/ordine/${payload.orderId}`,
        filters: [
          { field: 'tag', key: `order_${payload.orderId}`, relation: '=', value: 'subscribed' }
        ],
      }),
    });

    const data = await response.json();
    console.log('[OneSignal] Push Notification API Result:', data);
    return response.ok;
  } catch (err) {
    console.error('[OneSignal] Push Notification API Error:', err);
    return false;
  }
};
