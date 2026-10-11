import { FEATURES } from './features';

export const PRIVACY_CONTROLLER_NAME = 'Pescheria Pessano di Ciccione Emiliana';
export const PRIVACY_CONTROLLER_ADDRESS =
  'Via Avvocato Emanuele Rossi, 17, 17024 Finale Ligure (SV)';
export const COMPANY_VAT_NUMBER = '01454940097';
export const COMPANY_REA = 'SV-147743';
export const COMPANY_PEC = 'pescheriapessano@pec.net';
export const PRIVACY_CONTACT_PHONE = '019 692623';
export const PRIVACY_CONTACT_EMAIL = 'privacy@pescheriapessano.it';
export const PRIVACY_CONTACT_PEC = 'pescheriapessano@pec.net';

export const PRIVACY_RETENTION_ORDERS_ACTIVE =
  'I dati dell\'ordine sono conservati per 90 giorni dalla data di completamento per finalità organizzative e di gestione, salvo ulteriori obblighi contabili e fiscali di legge.';

export const PRIVACY_RETENTION_ORDERS_VETRINA =
  'Nessun dato di ordine viene raccolto o memorizzato tramite il sito web (funzionalità di cassa e checkout online disattivate per modalità sito vetrina).';

export const PRIVACY_RETENTION_ORDERS = FEATURES.ONLINE_ORDERING
  ? PRIVACY_RETENTION_ORDERS_ACTIVE
  : PRIVACY_RETENTION_ORDERS_VETRINA;

export const PRIVACY_RETENTION_CONSENT =
  'Le preferenze relative ai cookie tecnici e servizi terzi (Google Maps) sono conservate nel browser fino a revoca o cancellazione manuale.';
