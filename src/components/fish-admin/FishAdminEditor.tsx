import React, { useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import type { FishItem, FishOrigin } from '../../types/fishCatalog';
import { canSaveFishDraft, FISH_EDITOR_ORIGINS, isFishEditorDirty } from '../../utils/fishAdmin';

interface FishAdminEditorProps {
  draft: FishItem;
  original: FishItem | null;
  creating: boolean;
  busy: boolean;
  status: string | null;
  onChange: (patch: Partial<FishItem>) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onUpload: (file: File) => void;
}

export const FishAdminEditor: React.FC<FishAdminEditorProps> = ({
  draft,
  original,
  creating,
  busy,
  status,
  onChange,
  onSave,
  onDelete,
  onClose,
  onUpload,
}) => {
  const [showUrl, setShowUrl] = useState(false);
  const dirty = useMemo(() => isFishEditorDirty(draft, original), [draft, original]);
  const statusError = Boolean(status?.toLowerCase().includes('errore'));

  const requestClose = () => {
    if (dirty && !window.confirm('Chiudere senza salvare?')) return;
    onClose();
  };

  return (
    <section className="fish-admin-editor">
      <header className="fish-admin-editor__header">
        <button type="button" className="fish-admin-icon-btn" aria-label="Torna alla lista" onClick={requestClose}>
          <ArrowLeft size={20} />
        </button>
        <h2>{creating ? 'Nuovo pesce' : draft.name || 'Modifica'}</h2>
      </header>

      <div className="fish-admin-editor__body">
        <div className="fish-admin-photo">
          <img
            src={draft.image}
            alt={draft.name || 'Anteprima pesce'}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/hero_pescheria.jpg';
            }}
          />
          <label className="fish-admin-btn fish-admin-btn--ghost">
            <ImagePlus size={16} />
            Cambia foto
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
                event.target.value = '';
              }}
            />
          </label>
          <button type="button" className="fish-admin-text-btn" onClick={() => setShowUrl((open) => !open)}>
            {showUrl ? 'Nascondi link foto' : 'Incolla link foto'}
          </button>
          {showUrl ? (
            <label className="fish-admin-field">
              Link foto
              <input
                value={draft.image}
                onChange={(e) => onChange({ image: e.target.value })}
                placeholder="/pesce/branzino.jpg"
              />
            </label>
          ) : null}
        </div>

        <label className="fish-admin-field">
          Nome
          <input
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            autoComplete="off"
          />
        </label>

        <fieldset className="fish-admin-origins">
          <legend>Origine</legend>
          <div>
            {FISH_EDITOR_ORIGINS.map((origin) => (
              <button
                key={origin}
                type="button"
                className={`fish-admin-chip${draft.origin === origin ? ' fish-admin-chip--on' : ''}`}
                aria-pressed={draft.origin === origin}
                onClick={() => onChange({ origin: origin as FishOrigin })}
              >
                {origin}
              </button>
            ))}
          </div>
        </fieldset>

        {status ? (
          <p className={`fish-admin-status${statusError ? ' fish-admin-status--error' : ''}`}>{status}</p>
        ) : null}

        {!creating ? (
          <button
            type="button"
            className="fish-admin-btn fish-admin-btn--danger"
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 size={16} />
            Elimina
          </button>
        ) : null}
      </div>

      <div className="fish-admin-editor__bar">
        <button
          type="button"
          className="fish-admin-btn fish-admin-btn--primary"
          onClick={onSave}
          disabled={busy || !canSaveFishDraft(draft)}
        >
          Salva
        </button>
      </div>
    </section>
  );
};
