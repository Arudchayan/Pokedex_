import React from 'react';
import TypeBadge from '../charts/TypeBadge';
import DetailSection from './DetailSection';

interface TypeEffectiveness {
  [multiplier: string]: string[];
}

interface TypeDefenseSectionProps {
  theme: string;
  typeEffectiveness: TypeEffectiveness;
}

const TypeDefenseSection: React.FC<TypeDefenseSectionProps> = ({ theme, typeEffectiveness }) => (
  <DetailSection title="Type Defenses" theme={theme}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Weaknesses Column */}
      <div className="space-y-3">
        {typeEffectiveness['4'] && (
          <div className="bg-red-900/30 p-3 rounded-lg">
            <p className="font-bold text-red-300 mb-2">Extremely Weak to (x4)</p>
            <div className="flex flex-wrap gap-2">
              {typeEffectiveness['4'].map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        )}
        {typeEffectiveness['2'] && (
          <div className="bg-red-900/20 p-3 rounded-lg">
            <p className="font-bold text-red-400 mb-2">Weak to (x2)</p>
            <div className="flex flex-wrap gap-2">
              {typeEffectiveness['2'].map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Resistances & Immunities Column */}
      <div className="space-y-3">
        {typeEffectiveness['0.5'] && (
          <div className="bg-green-900/20 p-3 rounded-lg">
            <p className="font-bold text-green-400 mb-2">Resists (x0.5)</p>
            <div className="flex flex-wrap gap-2">
              {typeEffectiveness['0.5'].map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        )}
        {typeEffectiveness['0.25'] && (
          <div className="bg-green-900/30 p-3 rounded-lg">
            <p className="font-bold text-green-300 mb-2">Strongly Resists (x0.25)</p>
            <div className="flex flex-wrap gap-2">
              {typeEffectiveness['0.25'].map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        )}
        {typeEffectiveness['0'] && (
          <div className="bg-blue-900/20 p-3 rounded-lg">
            <p className="font-bold text-blue-400 mb-2">Immune to (x0)</p>
            <div className="flex flex-wrap gap-2">
              {typeEffectiveness['0'].map((type) => (
                <TypeBadge key={type} type={type} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </DetailSection>
);

export default TypeDefenseSection;
