import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { useCookieConsent } from '../context/CookieConsentContext';

type GoogleMapEmbedProps = {
  embedUrl: string;
  externalMapsUrl: string;
  title?: string;
};

export const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({
  embedUrl,
  externalMapsUrl,
  title = 'Mappa Pescheria Pessano Finale Ligure',
}) => {
  const { consent } = useCookieConsent();
  const mapsAllowed = consent?.maps === true;

  if (mapsAllowed) {
    return (
      <div className="map-embed map-embed--loaded">
        <iframe
          title={title}
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div className="map-embed map-placeholder">
      <div className="map-placeholder__pattern" aria-hidden="true" />
      <div className="map-placeholder__content">
        <div className="map-placeholder__icon">
          <MapPin size={24} color="white" />
        </div>
        <address className="map-placeholder__address">
          Via Avvocato Emanuele Rossi, 17
          <br />
          17024 Finale Ligure (SV)
        </address>
        <p className="map-placeholder__hint">Accetta i cookie per visualizzare la mappa interattiva</p>
        <a
          href={externalMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="map-placeholder__link"
        >
          <ExternalLink size={15} />
          Apri in Google Maps
        </a>
      </div>
    </div>
  );
};
