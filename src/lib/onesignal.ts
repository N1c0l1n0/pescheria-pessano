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
export let oneSignalInitError: string | null = null;

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
 * Helper to ensure OneSignal SDK is loaded and ready
 */
export const ensureOneSignalReady = async (): Promise<any> => {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID non configurata nelle variabili di ambiente.');
    return null;
  }

  await loadOneSignalScript();

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      if (!isInitialized) {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            autoRegister: false,
            autoPrompt: false,
          });
          isInitialized = true;
          oneSignalInitError = null;
          console.log('[OneSignal] SDK Inizializzato con successo. App ID:', ONESIGNAL_APP_ID);
        } catch (err: any) {
          console.warn('[OneSignal] Avviso/Errore durante init:', err);
          if (err?.message?.includes('App not configured for web push') || String(err).includes('App not configured for web push')) {
            oneSignalInitError = 'La piattaforma Web Push non è attiva sulla Dashboard OneSignal per questo App ID.';
          } else {
            oneSignalInitError = err?.message || String(err);
          }
          isInitialized = true;
        }
      }
      resolve(OneSignal);
    });
  });
};

/**
 * Initialize OneSignal Web SDK
 */
export const initOneSignal = async (
  onShowVerificationModal?: (show: boolean) => void
): Promise<boolean> => {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID assente nelle variabili d\'ambiente.');
    return false;
  }

  try {
    const OneSignal = await ensureOneSignalReady();
    if (!OneSignal) return false;

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

      const currentSubId = OneSignal.User.PushSubscription.id;
      maybeShowDialog(currentSubId);
    }

    return true;
  } catch (err) {
    console.error('[OneSignal] Errore inizializzazione SDK:', err);
    return false;
  }
};

/**
 * Request Push Permission on tap (supports OneSignal & native Notification API fallback)
 */
export const requestPushPermission = async (): Promise<boolean> => {
  try {
    const OneSignal = await ensureOneSignalReady();
    if (OneSignal?.Notifications) {
      try {
        await OneSignal.Notifications.requestPermission();
        console.log('[OneSignal] Richiesta permessi completata.');
      } catch (err) {
        console.warn('[OneSignal] Permessi avviso:', err);
      }
    }
  } catch (err) {
    console.warn('[OneSignal] Impostazione permessi OneSignal fallita:', err);
  }

  // Fallback API di notifica nativa del browser
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const result = await Notification.requestPermission();
      console.log('[Native Notification] Stato permessi:', result);
      return result === 'granted';
    } catch (err) {
      console.warn('[Native Notification] Errore richiesta permessi:', err);
    }
  }

  return true;
};

/**
 * Tag device for specific order status updates (e.g. order_16 -> 'subscribed')
 */
export const subscribeToOrderPush = async (orderId: string): Promise<boolean> => {
  const cleanId = String(orderId).replace(/^#/, '');

  const runSubscriptionWork = async () => {
    try {
      const OneSignal = await ensureOneSignalReady();

      // 1. Richiedi permesso notifiche browser
      await requestPushPermission();

      // 2. Assicurati che l'utente sia opt-in in OneSignal
      if (OneSignal?.User?.PushSubscription) {
        try {
          await OneSignal.User.PushSubscription.optIn();
        } catch (optErr) {
          console.warn('[OneSignal] OptIn avviso:', optErr);
        }
      }

      // 3. Attesa rapida per l'ID di sottoscrizione (massimo 1.5s)
      let attempts = 0;
      while (!OneSignal?.User?.PushSubscription?.id && attempts < 3) {
        await new Promise((res) => setTimeout(res, 500));
        attempts++;
      }

      // 4. Applica il Tag per l'ordine specifico
      if (OneSignal?.User) {
        try {
          await OneSignal.User.addTag(`order_${cleanId}`, 'subscribed');
          console.log(`[OneSignal] Dispositivo iscritto al tag order_${cleanId}. Sub ID:`, OneSignal.User.PushSubscription?.id || 'pending');
        } catch (tagErr) {
          console.warn('[OneSignal] Errore nell\'aggiunta del tag:', tagErr);
        }
      }

      // Salva stato solo se il permesso è granted o la sottoscrizione esiste
      if (typeof window !== 'undefined') {
        localStorage.setItem(`push_sub_${cleanId}`, 'true');
      }
    } catch (err) {
      console.warn('[OneSignal] Errore durante la sottoscrizione push ordine:', err);
    }
  };

  // Esegui la richiesta con timeout di sicurezza di 2.5 secondi per non bloccare l'interfaccia mobile
  return Promise.race([
    runSubscriptionWork().then(() => true),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 2500))
  ]);
};

/**
 * Tag current device for KDS Kitchen Staff
 */
export const tagAsKdsStaff = async (): Promise<boolean> => {
  await requestPushPermission();
  try {
    const OneSignal = await ensureOneSignalReady();
    if (OneSignal?.User) {
      await OneSignal.User.addTag('role', 'kds');
      console.log('[OneSignal] Dispositivo registrato come KDS Kitchen Staff');
      return true;
    }
  } catch (err) {
    console.error('[OneSignal] Errore tagging KDS:', err);
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
    console.warn('[OneSignal] Impossibile inviare notifica push: App ID o REST API Key mancanti.');
    return false;
  }

  const cleanId = String(payload.orderId).replace(/^#/, '');

  let title = '🍱 Aggiornamento Ordine Pescheria Pessano';
  let message = `Il tuo ordine #${cleanId} ha cambiato stato in: ${payload.newStatus}`;

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

  const authHeader = apiKey.startsWith('os_v2_') ? `Key ${apiKey}` : `Basic ${apiKey}`;
  const origin = typeof window !== 'undefined' && window.location.origin.startsWith('http')
    ? window.location.origin
    : 'https://pescheria-pessano.n-crespi7.workers.dev';
  const iconUrl = `${origin}/notification_icon.jpg`;

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { it: title, en: title },
        contents: { it: message, en: message },
        url: `${origin}/ordine/${cleanId}`,
        web_url: `${origin}/ordine/${cleanId}`,
        filters: [
          { field: 'tag', key: `order_${cleanId}`, relation: '=', value: 'subscribed' }
        ],
        target_channel: 'push',
        priority: 10,            // Massima priorità per risvegliare il dispositivo in standby
        ttl: 86400,              // Validità di 24 ore
        content_available: true, // Risveglio in background per dispositivi mobile
        icon: iconUrl,
        chrome_web_icon: iconUrl,
        firefox_icon: iconUrl,
        large_icon: iconUrl,
        small_icon: iconUrl,
      }),
    });

    const data = await response.json();
    console.log('[OneSignal] Risultato Push API:', data);

    if (data.errors && data.errors.length > 0) {
      console.warn('[OneSignal] Avviso invio push:', data.errors);
      return false;
    }

    return Boolean(data.id);
  } catch (err) {
    console.error('[OneSignal] Errore Push Notification API:', err);
    return false;
  }
};

/**
 * Helper to send a test push notification immediately to the subscribed device
 */
export const sendTestPushNotification = async (orderId: string): Promise<boolean> => {
  return sendOrderStatusNotification({
    orderId,
    customerName: 'Test Cliente',
    newStatus: 'PRONTO',
  });
};

