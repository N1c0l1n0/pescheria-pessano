import React from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FishItem } from '../../types/fishCatalog';
import { FishAdminRow } from './FishAdminRow';

interface FishAdminSortableListProps {
  items: FishItem[];
  busyIds: Record<string, boolean>;
  rowStatus: Record<string, string | null>;
  onStep: (id: string, direction: 1 | -1) => void;
  onPriceCommit: (id: string, price: number) => void;
  onToggleActive: (id: string) => void;
  onEdit: (item: FishItem) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function FishAdminSortableList({
  items,
  busyIds,
  rowStatus,
  onStep,
  onPriceCommit,
  onToggleActive,
  onEdit,
  onReorder,
}: FishAdminSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;
    if (overId == null) return;
    onReorder(String(event.active.id), String(overId));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <FishAdminSortableRow
            key={item.id}
            item={item}
            busy={Boolean(busyIds[item.id])}
            status={rowStatus[item.id] ?? null}
            onStep={onStep}
            onPriceCommit={onPriceCommit}
            onToggleActive={onToggleActive}
            onEdit={onEdit}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function FishAdminSortableRow({
  item,
  busy,
  status,
  onStep,
  onPriceCommit,
  onToggleActive,
  onEdit,
}: {
  item: FishItem;
  busy: boolean;
  status: string | null;
  onStep: (id: string, direction: 1 | -1) => void;
  onPriceCommit: (id: string, price: number) => void;
  onToggleActive: (id: string) => void;
  onEdit: (item: FishItem) => void;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : undefined,
        boxShadow: isDragging ? '0 12px 28px rgba(26, 36, 40, 0.16)' : undefined,
      }}
    >
      <FishAdminRow
        item={item}
        busy={busy}
        status={status}
        onStep={(direction) => onStep(item.id, direction)}
        onPriceCommit={(price) => onPriceCommit(item.id, price)}
        onToggleActive={() => onToggleActive(item.id)}
        onEdit={() => onEdit(item)}
        dragHandle={{
          attributes: attributes as React.HTMLAttributes<HTMLButtonElement>,
          listeners: listeners as React.HTMLAttributes<HTMLButtonElement> | undefined,
          setActivatorNodeRef,
        }}
      />
    </div>
  );
}
