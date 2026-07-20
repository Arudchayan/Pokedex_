import { TYPE_RELATIONS } from './typeRelations';

export { TYPE_RELATIONS } from './typeRelations';

export interface TypeEffectiveness {
  [multiplier: string]: string[];
}

/**
 * Groups defending types by incoming damage multiplier for a Pokémon's type(s).
 * e.g. `{ "2": ["water", "ground"], "0.5": ["grass"], "0": ["electric"] }`
 */
export const calculateTypeEffectiveness = (types: string[]): TypeEffectiveness => {
  const effectiveness: { [type: string]: number } = {};
  const allTypes = Object.keys(TYPE_RELATIONS);

  allTypes.forEach((attackType) => {
    let multiplier = 1;
    types.forEach((defenseType) => {
      multiplier *= TYPE_RELATIONS[attackType][defenseType] ?? 1;
    });
    effectiveness[attackType] = multiplier;
  });

  const grouped: TypeEffectiveness = {};
  Object.entries(effectiveness).forEach(([type, multiplier]) => {
    const key = multiplier.toString();
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(type);
  });
  return grouped;
};
