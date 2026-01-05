import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tokens } from '../../theme';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            cursor: isDragging ? 'grabbing' : 'grab',
            color: tokens.color.muted,
            background: tokens.color.surfaceAlt,
            borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
            borderRight: `1px solid ${tokens.color.border}`,
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = tokens.color.primary;
            e.currentTarget.style.background = 'rgba(245,211,147,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = tokens.color.muted;
            e.currentTarget.style.background = tokens.color.surfaceAlt;
          }}
        >
          <i className="ri-draggable" style={{ fontSize: 16 }} />
        </div>
        {/* Content */}
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

interface SortableListProps<T> {
  items: T[];
  getItemId: (item: T, index: number) => string;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function SortableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item, i) => getItemId(item, i) === active.id);
        const newIndex = items.findIndex((item, i) => getItemId(item, i) === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        onReorder(newItems);
      }
    },
    [items, getItemId, onReorder]
  );

  const itemIds = items.map((item, index) => getItemId(item, index));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, index) => (
            <SortableItem key={getItemId(item, index)} id={getItemId(item, index)}>
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default SortableList;
