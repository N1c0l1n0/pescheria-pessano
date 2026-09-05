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
  if (summary.variant === 'loading' || summary.variant === 'unavailable') return null;
  if (summary.variant === 'warning') return 'Attenzione';
  if (summary.variant === 'full') return 'Esaurito (10/10)';
  return summary.remaining === 1 ? '1 poke rimasta' : `${summary.remaining} poke rimaste`;
}

export function PokeSlotSummary({ summary }: { summary: SlotSummary | null }) {
  if (!summary) return null;

  const Icon = VARIANT_ICONS[summary.variant];
  const hasTime = Boolean(summary.slotStart && summary.slotEnd);
  const text =
    summary.variant === 'warning' && !hasTime ? summary.headline : summary.headline;

  return (
    <div
      className={`poke-slot-summary poke-slot-summary--${summary.variant}`}
      aria-live="polite"
    >
      <Icon
        size={16}
        style={
          summary.variant === 'loading'
            ? { animation: 'spin 1s linear infinite' }
            : undefined
        }
      />
      <span>{text}</span>
    </div>
  );
}

export { remainingCopy };
