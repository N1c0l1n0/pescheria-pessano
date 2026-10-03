/**
 * Feature Flags Configuration for Pescheria Pessano
 *
 * Modifica questa configurazione per attivare o disattivare funzionalità del sito.
 */

export const FEATURES = {
  /**
   * Se false: il sito si comporta in modalità VETRINA con menu illustrativo.
   * I clienti possono esplorare Poke, Fritti e Pesce fresco, ma il checkout online è
   * disattivato e sostituito da un invito a ordinare per telefono o WhatsApp.
   *
   * Se true: riattiva istantaneamente l'invio ordini al banco, il carrello online e il tracking.
   */
  ONLINE_ORDERING: false,

  /**
   * Mostra il badge/messaggio "Ordini online presto disponibili" nei menu e nel compositore
   */
  SHOW_COMING_SOON_NOTICE: true,

  /**
   * Recapiti telefonici e WhatsApp per le ordinazioni
   */
  PHONE_NUMBER: '019 692623',
  PHONE_TEL: 'tel:019692623',
  WHATSAPP_NUMBER: '39019692623',
  WHATSAPP_LINK: 'https://wa.me/39019692623?text=Ciao%20Pescheria%20Pessano,%20vorrei%20ordinare:',
};
