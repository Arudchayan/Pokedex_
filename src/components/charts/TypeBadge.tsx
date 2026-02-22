import React, { memo } from 'react';
import { TYPE_COLORS, TYPE_COLORS_HEX } from '../../constants';

interface TypeBadgeProps {
  type: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type, iconOnly = false, size = 'md', className = '' }) => {
  const colorClass = TYPE_COLORS[type] || 'bg-gray-500 text-white';
  const hexColor = TYPE_COLORS_HEX[type] || '#666';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  if (iconOnly) {
    // For grid headers: Just a colored circle with first letter or icon
    // Using hex color for custom style if needed, or just utility classes
    const sizeDim = {
      sm: 'w-6 h-6 text-[10px]',
      md: 'w-8 h-8 text-xs',
      lg: 'w-10 h-10 text-sm'
    };

    return (
      <div
        className={`rounded-full flex items-center justify-center font-bold capitalize text-white shadow-sm ${sizeDim[size]} ${className}`}
        style={{ backgroundColor: hexColor }}
        title={type}
      >
        {type.substring(0, 3)}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center font-bold rounded-full capitalize shadow-sm min-w-[70px] ${colorClass} ${sizeClasses[size]} ${className}`}>
      {type}
    </span>
  );
};

export default memo(TypeBadge);
