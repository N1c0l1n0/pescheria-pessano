import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatFishPrice, parseFishPrice } from '../../utils/fishAdmin';

interface FishPriceStepperProps {
  price: number;
  disabled?: boolean;
  onStep: (direction: 1 | -1) => void;
  onCommit: (price: number) => void;
}

export const FishPriceStepper: React.FC<FishPriceStepperProps> = ({
  price,
  disabled = false,
  onStep,
  onCommit,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatFishPrice(price));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(formatFishPrice(price));
  }, [editing, price]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitDraft = () => {
    onCommit(parseFishPrice(draft));
    setEditing(false);
  };

  return (
    <div className="fish-price-stepper">
      <button
        type="button"
        className="fish-price-stepper__btn"
        aria-label="Diminuisci prezzo di 50 centesimi"
        disabled={disabled || price <= 0}
        onClick={() => onStep(-1)}
      >
        <Minus size={18} />
      </button>
      {editing ? (
        <input
          ref={inputRef}
          className="fish-price-stepper__input"
          inputMode="decimal"
          enterKeyHint="done"
          aria-label="Prezzo al chilo"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === 'Escape') {
              setDraft(formatFishPrice(price));
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="fish-price-stepper__value"
          disabled={disabled}
          onClick={() => setEditing(true)}
        >
          <span>{formatFishPrice(price)}</span>
          <small>€/kg</small>
        </button>
      )}
      <button
        type="button"
        className="fish-price-stepper__btn"
        aria-label="Aumenta prezzo di 50 centesimi"
        disabled={disabled}
        onClick={() => onStep(1)}
      >
        <Plus size={18} />
      </button>
    </div>
  );
};
