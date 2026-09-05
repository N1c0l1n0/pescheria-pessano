import { AlertCircle, Check, Clock, Loader2 } from 'lucide-react';
import type { SlotSummary } from '../utils/pokeSlotCapacity';

const VARIANT_STYLES: Record<
  SlotSummary['variant'],
  { bg: string; border: string; color: string; Icon: typeof Check }
> = {
  available: {
    bg: '#DCFCE7',
    border: '#86EFAC',
    color: '#15803D',
    Icon: Check,
  },
  low: {
    bg: '#FFEDD5',
    border: '#FDBA74',
    color: '#C2410C',
    Icon: Clock,
  },
  full: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    color: '#B91C1C',
    Icon: AlertCircle,
  },
  overbooked: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    color: '#B91C1C',
    Icon: AlertCircle,
  },
  unavailable: {
    bg: '#FEE2E2',
    border: '#FCA5A5',
    color: '#B91C1C',
    Icon: AlertCircle,
  },
  loading: {
    bg: 'rgba(19, 64, 116, 0.06)',
    border: 'rgba(19, 64, 116, 0.12)',
    color: 'var(--color-ocean-dark)',
    Icon: Loader2,
  },
};

export function PokeSlotSummary({ summary }: { summary: SlotSummary | null }) {
  if (!summary) return null;

  const style = VARIANT_STYLES[summary.variant];
  const Icon = style.Icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.75rem',
        padding: '0.65rem 0.85rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: '0.825rem',
        fontWeight: 600,
      }}
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
      <span>{summary.headline}</span>
    </div>
  );
}
