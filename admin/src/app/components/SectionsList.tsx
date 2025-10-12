import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Section, SectionKind } from '../types';

interface SectionsListProps {
  sections: Section[];
  sectionTypes: Array<{ kind: SectionKind; icon: string; label: string; description: string }>;
  categoryColors: Record<string, string>;
  onEdit: (section: Section) => void;
  onDelete: (sectionId: string) => void;
  onReorder: (sections: Section[]) => void;
}

interface SortableSectionItemProps {
  section: Section;
  sectionType?: { kind: SectionKind; icon: string; label: string; description: string };
  color: string;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableSectionItem({ section, sectionType, color, onEdit, onDelete }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{
          background: 'rgba(255,255,255,0.06)',
          borderColor: color + '40',
        }}
        style={{
          padding: 16,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          transition: 'all 0.2s',
          cursor: isDragging ? 'grabbing' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              padding: '8px 4px',
              color: tokens.color.muted,
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <i className="ri-draggable" />
          </div>

          {/* Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: tokens.radius.md,
              background: `${color}20`,
              border: `2px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: color,
            }}
          >
            <i className={sectionType?.icon || 'ri-layout-line'} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: tokens.color.text, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              {sectionType?.label || section.kind}
            </div>
            <div style={{ color: tokens.color.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>Order: {section.order}</span>
              <span>•</span>
              <span>{sectionType?.description || 'Section'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            style={{
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.primary,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-edit-line" />
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            style={{
              padding: '10px 18px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: `1px solid rgba(239, 68, 68, 0.3)`,
              borderRadius: tokens.radius.md,
              color: '#EF4444',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-delete-bin-line" />
            Delete
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export function SectionsList({
  sections,
  sectionTypes,
  categoryColors,
  onEdit,
  onDelete,
  onReorder,
}: SectionsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map((s, index) => ({
        ...s,
        order: index + 1,
      }));

      onReorder(reorderedSections);
    }
  }

  // Get category color for section
  function getCategoryColor(section: Section): string {
    switch (section.kind) {
      case 'HERO':
      case 'BANNER':
        return categoryColors['Hero & Banners'];
      case 'RICH_TEXT':
      case 'STATS':
      case 'FEATURES':
      case 'MISSION_VISION':
      case 'CORE_VALUES':
        return categoryColors['Content'];
      case 'GALLERY':
      case 'GALLERY_SLIDESHOW':
      case 'FEATURED_BLOG_POSTS':
        return categoryColors['Gallery & Media'];
      case 'TESTIMONIALS':
        return categoryColors['Social Proof'];
      case 'CTA':
        return categoryColors['Call to Action'];
      case 'RESERVATION_FORM':
      case 'CONTACT_INFO':
      case 'OPENING_HOURS':
      case 'SOCIAL_MEDIA':
      case 'FOOTER_SOCIAL':
      case 'QUICK_CONTACT':
        return categoryColors['Forms & Contact'];
      case 'FEATURED_MENU':
      case 'SPECIAL_OFFERS':
        return categoryColors['Menu & Offers'];
      case 'FAB_ACTIONS':
        return '#f5d393'; // Gold color for floating actions
      default:
        return tokens.color.primary;
    }
  }

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div>
          {sortedSections.map((section) => {
            const sectionType = sectionTypes.find((t) => t.kind === section.kind);
            const color = getCategoryColor(section);

            return (
              <SortableSectionItem
                key={section.id}
                section={section}
                sectionType={sectionType}
                color={color}
                onEdit={() => onEdit(section)}
                onDelete={() => onDelete(section.id)}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

