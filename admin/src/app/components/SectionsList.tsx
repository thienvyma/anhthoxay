import { motion } from 'framer-motion';
import { tokens } from '../../theme';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useResponsive } from '../../hooks/useResponsive';
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
  sectionType?: {
    kind: SectionKind;
    icon: string;
    label: string;
    description: string;
  };
  color: string;
  onEdit: () => void;
  onDelete: () => void;
  isMobile: boolean;
}

function SortableSectionItem({
  section,
  sectionType,
  color,
  onEdit,
  onDelete,
  isMobile,
}: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

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
          background: tokens.color.surfaceHover,
          borderColor: color + '40',
        }}
        style={{
          padding: isMobile ? 10 : 16,
          background: tokens.color.surfaceAlt,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? 8 : 12,
          transition: 'all 0.2s',
          cursor: isDragging ? 'grabbing' : 'default',
          gap: isMobile ? 10 : 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 10 : 16,
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              padding: isMobile ? '4px 2px' : '8px 4px',
              color: tokens.color.muted,
              fontSize: isMobile ? 16 : 20,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <i className="ri-draggable" />
          </div>

          {/* Icon */}
          <div
            style={{
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              borderRadius: tokens.radius.md,
              background: `${color}20`,
              border: `2px solid ${color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobile ? 16 : 20,
              color: color,
              flexShrink: 0,
            }}
          >
            <i className={sectionType?.icon || 'ri-layout-line'} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div
              style={{
                color: tokens.color.text,
                fontWeight: 600,
                fontSize: isMobile ? 13 : 15,
                marginBottom: isMobile ? 2 : 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {sectionType?.label || section.kind}
            </div>
            <div
              style={{
                color: tokens.color.muted,
                fontSize: isMobile ? 11 : 13,
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 6 : 12,
                overflow: 'hidden',
              }}
            >
              <span style={{ flexShrink: 0 }}>Order: {section.order}</span>
              {!isMobile && (
                <>
                  <span>•</span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sectionType?.description || 'Section'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexShrink: 0,
            justifyContent: isMobile ? 'flex-end' : 'flex-start',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            style={{
              padding: isMobile ? '6px 12px' : '10px 18px',
              background: tokens.color.surfaceHover,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              color: tokens.color.primary,
              cursor: 'pointer',
              fontSize: isMobile ? 12 : 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              minHeight: isMobile ? 32 : 40,
            }}
          >
            <i className="ri-edit-line" />
            {!isMobile && 'Edit'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            style={{
              padding: isMobile ? '6px 12px' : '10px 18px',
              background: tokens.color.errorBg,
              border: `1px solid ${tokens.color.error}40`,
              borderRadius: tokens.radius.md,
              color: tokens.color.error,
              cursor: 'pointer',
              fontSize: isMobile ? 12 : 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              minHeight: isMobile ? 32 : 40,
            }}
          >
            <i className="ri-delete-bin-line" />
            {!isMobile && 'Delete'}
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
  const { isMobile } = useResponsive();
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

  // Get category color for section - ATH Construction/Renovation categories
  function getCategoryColor(section: Section): string {
    switch (section.kind) {
      case 'HERO':
      case 'HERO_SIMPLE':
      case 'BANNER':
        return categoryColors['Hero & Banners'];
      case 'RICH_TEXT':
      case 'STATS':
      case 'FEATURES':
      case 'MISSION_VISION':
      case 'CORE_VALUES':
        return categoryColors['Content'];
      case 'TESTIMONIALS':
        return categoryColors['Social Proof'];
      case 'CTA':
      case 'CALL_TO_ACTION':
        return categoryColors['Call to Action'];
      case 'CONTACT_INFO':
      case 'SOCIAL_MEDIA':
      case 'FOOTER_SOCIAL':
      case 'QUICK_CONTACT':
        return categoryColors['Forms & Contact'];
      case 'FEATURED_BLOG_POSTS':
      case 'BLOG_LIST':
        return categoryColors['Blog'];
      case 'FAB_ACTIONS':
        return tokens.color.primary; // Gold color for floating actions
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
                isMobile={isMobile}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}

