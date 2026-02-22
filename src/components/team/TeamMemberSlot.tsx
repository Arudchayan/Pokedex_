import React, { memo } from 'react';
import { TeamMember } from '../../types';
import TypeBadge from '../charts/TypeBadge';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface TeamMemberSlotProps {
  member: TeamMember;
  theme: string;
  onRemove: (id: number) => void;
  onSelect: (id: number) => void;
  onEdit: (member: TeamMember) => void;
  index: number;

  // dnd-kit props
  wrapperRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isDragging?: boolean;
}

const TeamMemberSlot: React.FC<TeamMemberSlotProps> = ({
  member,
  theme,
  onRemove,
  onSelect,
  onEdit,
  index,
  wrapperRef,
  style,
  dragHandleProps,
  isDragging,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <article
      ref={wrapperRef}
      style={style}
      className={`group relative flex items-center gap-2 rounded-xl border p-2 pl-1 transition-all ${
        !prefersReducedMotion ? 'animate-[teamPop_0.3s_ease-out]' : ''
      } ${
        isDragging ? 'opacity-40 z-10' : 'opacity-100'
      } ${
        theme === 'dark'
            ? 'border-white/10 bg-white/5 hover:border-primary-400/60 hover:bg-primary-500/10'
            : 'border-slate-200 bg-slate-50 hover:border-primary-400/60 hover:bg-primary-300/10'
      }`}
    >
      {/* Reorder Handle */}
      <button
          type="button"
          {...dragHandleProps}
          className={`p-1.5 rounded cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200`}
          title="Drag to reorder"
          aria-label={`Reorder ${member.name}. Position ${index + 1}.`}
      >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
      </button>

      <div className="absolute right-2 top-2 flex gap-1 z-10">
        <button
          type="button"
          onClick={() => onEdit(member)}
          className={`p-1 rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            theme === 'dark' ? 'text-slate-400 hover:text-primary-300 hover:bg-white/10' : 'text-slate-400 hover:text-primary-600 hover:bg-slate-200'
          }`}
          title="Edit Moves & Stats"
          aria-label={`Edit ${member.name}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(member.id)}
          className={`p-1 rounded-md transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
            theme === 'dark' ? 'text-slate-400 hover:text-red-400 hover:bg-white/10' : 'text-slate-400 hover:text-red-600 hover:bg-slate-200'
          }`}
          title="Remove from Team"
          aria-label={`Remove ${member.name} from team`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onSelect(member.id)}
        className="flex items-center gap-3 text-left w-full pl-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <img
          src={member.imageUrl}
          alt={member.name}
          className={`h-14 w-14 flex-shrink-0 rounded-xl border object-contain p-2 drop-shadow ${
            theme === 'dark' ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        />
        <div>
          <p className={`text-sm font-semibold capitalize ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{member.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {member.types.map((type) => (
              <TypeBadge key={`${member.id}-${type}`} type={type} />
            ))}
          </div>
        </div>
      </button>
    </article>
  );
};

export default memo(TeamMemberSlot);
