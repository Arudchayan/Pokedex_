import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TeamMemberSlot from './TeamMemberSlot';
import { TeamMember } from '../../types';

interface SortableTeamMemberSlotProps {
  member: TeamMember;
  theme: string;
  onRemove: (id: number) => void;
  onSelect: (id: number) => void;
  onEdit: (member: TeamMember) => void;
  index: number;
}

export const SortableTeamMemberSlot: React.FC<SortableTeamMemberSlotProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.member.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    touchAction: 'none',
  };

  return (
    <TeamMemberSlot
      {...props}
      wrapperRef={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
    />
  );
};
