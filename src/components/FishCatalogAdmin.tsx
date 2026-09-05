import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { FishItem } from '../types/fishCatalog';
import { useFishCatalog } from '../hooks/useFishCatalog';
import {
  deleteFishItem,
  isAdminAuthenticated,
  logoutAdmin,
  seedFishCatalogFromDefaults,
  slugifyFishId,
  updateFishSortOrders,
  uploadFishImage,
  upsertFishItem,
} from '../utils/fishCatalog';
import {
  EMPTY_FISH_ITEM,
  canSaveFishDraft,
  changedSortOrders,
  patchFishItem,
  reorderFishItems,
  stepFishPrice,
} from '../utils/fishAdmin';
import { FishAdminEditor } from './fish-admin/FishAdminEditor';
import { FishAdminHeader } from './fish-admin/FishAdminHeader';
import { FishAdminLogin } from './fish-admin/FishAdminLogin';

const FishAdminSortableList = lazy(() =>
  import('./fish-admin/FishAdminSortableList').then((module) => ({
    default: module.FishAdminSortableList,
  }))
);

const PRICE_SAVE_MS = 400;
const STATUS_CLEAR_MS = 2200;

export const FishCatalogAdmin: React.FC = () => {
  const [authed, setAuthed] = useState(isAdminAuthenticated());
  const { items, loading, error, reload, replaceItem, replaceAll, removeItem } = useFishCatalog({
    includeInactive: true,
  });
  const [screen, setScreen] = useState<'list' | 'edit'>('list');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<FishItem>(EMPTY_FISH_ITEM);
  const [original, setOriginal] = useState<FishItem | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [rowStatus, setRowStatus] = useState<Record<string, string | null>>({});
  const [editorStatus, setEditorStatus] = useState<string | null>(null);
  const [editorBusy, setEditorBusy] = useState(false);
  const [menuBusy, setMenuBusy] = useState(false);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const priceTimers = useRef<Record<string, number>>({});
  const statusTimers = useRef<Record<string, number>>({});
  const saveGeneration = useRef<Record<string, number>>({});
  const reorderGeneration = useRef(0);

  useEffect(() => {
    const priceMap = priceTimers.current;
    const statusMap = statusTimers.current;
    return () => {
      Object.values(priceMap).forEach((id) => window.clearTimeout(id));
      Object.values(statusMap).forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const flashRowStatus = useCallback((id: string, message: string) => {
    setRowStatus((prev) => ({ ...prev, [id]: message }));
    window.clearTimeout(statusTimers.current[id]);
    statusTimers.current[id] = window.setTimeout(() => {
      setRowStatus((prev) => ({ ...prev, [id]: null }));
    }, STATUS_CLEAR_MS);
  }, []);

  const setRowBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => ({ ...prev, [id]: busy }));
  };

  const persistRow = useCallback(
    async (next: FishItem) => {
      const generation = (saveGeneration.current[next.id] ?? 0) + 1;
      saveGeneration.current[next.id] = generation;
      setRowBusy(next.id, true);
      try {
        const latest = itemsRef.current.find((item) => item.id === next.id) ?? next;
        const saved = await upsertFishItem(latest);
        if (saveGeneration.current[next.id] !== generation) return;
        const live = itemsRef.current.find((item) => item.id === saved.id);
        const liveSort = live?.sortOrder ?? saved.sortOrder;
        if ((saved.sortOrder ?? 0) !== (liveSort ?? 0) && live) {
          await updateFishSortOrders([{ id: saved.id, sortOrder: liveSort ?? 0 }]);
        }
        const merged = { ...saved, sortOrder: liveSort };
        itemsRef.current = itemsRef.current.map((item) => (item.id === merged.id ? merged : item));
        replaceItem(merged);
        flashRowStatus(next.id, 'Salvato.');
      } catch (err) {
        if (saveGeneration.current[next.id] !== generation) return;
        await reload({ silent: true });
        flashRowStatus(next.id, err instanceof Error ? err.message : 'Errore durante il salvataggio.');
      } finally {
        if (saveGeneration.current[next.id] === generation) {
          setRowBusy(next.id, false);
        }
      }
    },
    [flashRowStatus, reload, replaceItem]
  );

  const commitLocal = (next: FishItem) => {
    itemsRef.current = itemsRef.current.map((item) => (item.id === next.id ? next : item));
    replaceItem(next);
  };

  const schedulePriceSave = (next: FishItem) => {
    commitLocal(next);
    window.clearTimeout(priceTimers.current[next.id]);
    priceTimers.current[next.id] = window.setTimeout(() => {
      void persistRow(next);
    }, PRICE_SAVE_MS);
  };

  const handleStep = (id: string, direction: 1 | -1) => {
    const current = itemsRef.current.find((item) => item.id === id);
    if (!current) return;
    schedulePriceSave(patchFishItem(current, { pricePerKg: stepFishPrice(current.pricePerKg, direction) }));
  };

  const handlePriceCommit = (id: string, price: number) => {
    const current = itemsRef.current.find((item) => item.id === id);
    if (!current || current.pricePerKg === price) return;
    schedulePriceSave(patchFishItem(current, { pricePerKg: price }));
  };

  const handleToggle = (id: string) => {
    const current = itemsRef.current.find((item) => item.id === id);
    if (!current) return;
    const next = patchFishItem(current, { isActive: current.isActive === false });
    commitLocal(next);
    void persistRow(next);
  };

  const handleReorder = (activeId: string, overId: string) => {
    const current = itemsRef.current;
    const next = reorderFishItems(current, activeId, overId);
    if (next === current) return;

    const generation = reorderGeneration.current + 1;
    reorderGeneration.current = generation;
    itemsRef.current = next;
    replaceAll(next);

    const updates = changedSortOrders(current, next);
    void (async () => {
      try {
        await updateFishSortOrders(updates);
        if (reorderGeneration.current !== generation) return;
        flashRowStatus(activeId, 'Salvato.');
      } catch (err) {
        if (reorderGeneration.current !== generation) return;
        await reload({ silent: true });
        flashRowStatus(
          activeId,
          err instanceof Error ? err.message : 'Errore durante il salvataggio.'
        );
      }
    })();
  };

  const startCreate = () => {
    setCreating(true);
    setOriginal(null);
    setDraft({ ...EMPTY_FISH_ITEM, sortOrder: itemsRef.current.length });
    setEditorStatus(null);
    setScreen('edit');
  };

  const startEdit = (item: FishItem) => {
    setCreating(false);
    setOriginal({ ...item });
    setDraft({ ...item });
    setEditorStatus(null);
    setScreen('edit');
  };

  const closeEditor = () => {
    setScreen('list');
    setCreating(false);
    setDraft(EMPTY_FISH_ITEM);
    setOriginal(null);
    setEditorStatus(null);
  };

  const handleEditorSave = async () => {
    if (!canSaveFishDraft(draft)) {
      setEditorStatus('Inserisci il nome del pesce.');
      return;
    }

    const id = creating ? slugifyFishId(draft.name) : draft.id;
    if (!id) {
      setEditorStatus('Impossibile generare un ID valido.');
      return;
    }

    setEditorBusy(true);
    setEditorStatus(null);
    try {
      const saved = await upsertFishItem({
        ...draft,
        id,
        name: draft.name.trim(),
      });
      replaceItem(saved);
      setEditorStatus('Salvato.');
      setScreen('list');
      setCreating(false);
      flashRowStatus(saved.id, 'Salvato.');
    } catch (err) {
      setEditorStatus(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      setEditorBusy(false);
    }
  };

  const handleEditorDelete = async () => {
    if (!draft.id || creating) return;
    if (!window.confirm(`Eliminare "${draft.name}" dal catalogo?`)) return;

    setEditorBusy(true);
    setEditorStatus(null);
    try {
      await deleteFishItem(draft.id);
      removeItem(draft.id);
      closeEditor();
    } catch (err) {
      setEditorStatus(err instanceof Error ? err.message : 'Errore durante l\'eliminazione.');
    } finally {
      setEditorBusy(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const fishId = draft.id || slugifyFishId(draft.name) || 'nuovo';
    setEditorBusy(true);
    setEditorStatus(null);
    try {
      const publicUrl = await uploadFishImage(fishId, file);
      setDraft((prev) => ({ ...prev, image: publicUrl }));
      setEditorStatus('Foto caricata.');
    } catch (err) {
      setEditorStatus(err instanceof Error ? err.message : 'Errore upload foto.');
    } finally {
      setEditorBusy(false);
    }
  };

  const handleImport = async () => {
    if (!window.confirm('Importare il catalogo predefinito? I prodotti con lo stesso nome verranno sovrascritti.')) {
      return;
    }

    setMenuBusy(true);
    try {
      const count = await seedFishCatalogFromDefaults();
      await reload({ silent: true });
      flashRowStatus('_catalog', `Importati ${count} prodotti predefiniti.`);
    } catch (err) {
      flashRowStatus('_catalog', err instanceof Error ? err.message : 'Errore import catalogo.');
    } finally {
      setMenuBusy(false);
    }
  };

  if (!authed) {
    return <FishAdminLogin onSuccess={() => setAuthed(true)} />;
  }

  if (screen === 'edit') {
    return (
      <div className="fish-admin-shell">
        <div className="fish-admin-workspace">
          <FishAdminEditor
            draft={draft}
            original={original}
            creating={creating}
            busy={editorBusy}
            status={editorStatus}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
            onSave={() => void handleEditorSave()}
            onDelete={() => void handleEditorDelete()}
            onClose={closeEditor}
            onUpload={(file) => void handleImageUpload(file)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fish-admin-shell">
      <div className="fish-admin-workspace">
        <FishAdminHeader
          count={items.length}
          busy={loading || menuBusy}
          onRefresh={() => void reload()}
          onImport={() => void handleImport()}
          onLogout={() => {
            logoutAdmin();
            setAuthed(false);
          }}
          onCreate={startCreate}
        />

        <main className="fish-admin-list">
          {loading ? <p className="fish-admin-note">Caricamento…</p> : null}
          {error ? <p className="fish-admin-status fish-admin-status--error">{error}</p> : null}
          {rowStatus._catalog ? (
            <p
              className={`fish-admin-status${rowStatus._catalog.toLowerCase().includes('errore') ? ' fish-admin-status--error' : ''}`}
            >
              {rowStatus._catalog}
            </p>
          ) : null}

          {!loading && items.length === 0 ? (
            <p className="fish-admin-empty">Nessun pesce. Tocca + per aggiungerne uno.</p>
          ) : null}

          {items.length > 0 ? (
            <Suspense fallback={<p className="fish-admin-note">Caricamento…</p>}>
              <FishAdminSortableList
                items={items}
                busyIds={busyIds}
                rowStatus={rowStatus}
                onStep={handleStep}
                onPriceCommit={handlePriceCommit}
                onToggleActive={handleToggle}
                onEdit={startEdit}
                onReorder={handleReorder}
              />
            </Suspense>
          ) : null}
        </main>
      </div>
    </div>
  );
};
