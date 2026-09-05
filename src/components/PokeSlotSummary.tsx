import { AlertCircle, Check, Clock, Loader2 } from 'lucide-react';
import type { SlotSummary } from '../utils/pokeSlotCapacity';

const VARIANT_ICONS = {
  available: Check,
  low: Clock,
  full: AlertCircle,
  warning: AlertCircle,
  unavailable: AlertCircle,
  loading: Loader2,
} as const;

function remainingCopy(summary: SlotSummary): string | null {
  if (
    summary.variant === 'loading' ||
    summary.variant === 'unavailable' ||
    summary.variant === 'warning'
  ) {
    return null;
  }
  if (summary.variant === 'full') return 'Esaurito (10/10)';
  return summary.remaining === 1 ? '1 poke rimasta' : `${summary.remaining} poke rimaste`;
}

function statusDetail(summary: SlotSummary): string | null {
  if (summary.variant === 'warning') {
    const posti = summary.remaining === 1 ? '1 posto' : `${summary.remaining} posti`;
    const poke = summary.inCart === 1 ? '1 poke' : `${summary.inCart} poke`;
    return `Solo ${posti} · ${poke} nel carrello`;
  }
  if (summary.variant === 'full' && summary.inCart > 0) {
    return `${summary.inCart} nel carrello · potrebbe non andare a buon fine`;
  }
  return null;
}

export function PokeSlotSummary({ summary }: { summary: SlotSummary | null }) {
  if (!summary) return null;

  const Icon = VARIANT_ICONS[summary.variant];
  const remaining = remainingCopy(summary);
  const detail = statusDetail(summary);
  const hasTime = Boolean(summary.title && summary.slotStart && summary.slotEnd);

  return (
    <div
      className={`poke-slot-summary poke-slot-summary--${summary.variant}`}
      aria-live="polite"
      aria-label={summary.headline}
    >
      <span className="poke-slot-summary__icon" aria-hidden="true">
        <Icon
          size={18}
          style={
            summary.variant === 'loading'
              ? { animation: 'spin 1s linear infinite' }
              : undefined
          }
        />
      </span>

      {hasTime ? (
        <div className="poke-slot-summary__body">
          <div className="poke-slot-summary__copy">
            <span className="poke-slot-summary__kicker">{summary.title}</span>
            <span className="poke-slot-summary__time">
              {summary.slotStart}–{summary.slotEnd}
            </span>
            {detail ? <span className="poke-slot-summary__detail">{detail}</span> : null}
          </div>
          <div className="poke-slot-summary__meta">
            {remaining ? <span className="poke-slot-summary__pill">{remaining}</span> : null}
            {summary.variant === 'warning' ? (
              <span className="poke-slot-summary__pill">Attenzione</span>
            ) : null}
            {summary.inCart > 0 &&
            summary.variant !== 'warning' &&
            summary.variant !== 'full' ? (
              <span className="poke-slot-summary__cart">{summary.inCart} nel tuo ordine</span>
            ) : null}
          </div>
        </div>
      ) : (
        <span className="poke-slot-summary__headline">{summary.headline}</span>
      )}
    </div>
  );
}

export { remainingCopy };
