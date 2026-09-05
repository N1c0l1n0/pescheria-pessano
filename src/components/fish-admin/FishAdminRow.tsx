import React from 'react';
import { GripVertical, Pencil } from 'lucide-react';
import type { FishItem } from '../../types/fishCatalog';
import { FishPriceStepper } from './FishPriceStepper';

export type FishAdminDragHandle = {
  attributes: React.HTMLAttributes<HTMLButtonElement>;
  listeners?: React.HTMLAttributes<HTMLButtonElement>;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

interface FishAdminRowProps {
  item: FishItem;
  busy: boolean;
  status: string | null;
  onStep: (direction: 1 | -1) => void;
  onPriceCommit: (price: number) => void;
  onToggleActive: () => void;
  onEdit: () => void;
  dragHandle?: FishAdminDragHandle;
}

export const FishAdminRow: React.FC<FishAdminRowProps> = ({
  item,
  busy,
  status,
  onStep,
  onPriceCommit,
  onToggleActive,
  onEdit,
  dragHandle,
}) => {
  const hidden = item.isActive === false;
  const statusError = Boolean(status?.toLowerCase().includes('errore'));

  return (
    <article className={`fish-admin-row${hidden ? ' fish-admin-row--hidden' : ''}`}>
      <button
        type="button"
        className="fish-admin-row__handle"
        aria-label={`Riordina ${item.name}`}
        ref={dragHandle?.setActivatorNodeRef}
        {...dragHandle?.attributes}
        {...dragHandle?.listeners}
      >
        <GripVertical size={18} />
      </button>

      <button type="button" className="fish-admin-row__photo" onClick={onEdit} aria-label={`Modifica ${item.name}`}>
        <img
          src={item.image}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/hero_pescheria.jpg';
          }}
        />
      </button>

      <div className="fish-admin-row__body">
        <div className="fish-admin-row__top">
          <button type="button" className="fish-admin-row__name" onClick={onEdit}>
            {item.name}
          </button>
          <button
            type="button"
            className="fish-admin-icon-btn fish-admin-icon-btn--quiet"
            aria-label={`Scheda ${item.name}`}
            onClick={onEdit}
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="fish-admin-row__controls">
          <FishPriceStepper
            price={item.pricePerKg}
            disabled={busy}
            onStep={onStep}
            onCommit={onPriceCommit}
          />
          <button
            type="button"
            className={`fish-admin-switch${hidden ? '' : ' fish-admin-switch--on'}`}
            role="switch"
            aria-checked={!hidden}
            aria-label={hidden ? `Mostra ${item.name}` : `Nascondi ${item.name}`}
            disabled={busy}
            onClick={onToggleActive}
          />
        </div>

        {status ? (
          <p className={`fish-admin-status${statusError ? ' fish-admin-status--error' : ''}`}>{status}</p>
        ) : null}
      </div>
    </article>
  );
};
