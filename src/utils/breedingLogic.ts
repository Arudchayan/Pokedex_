import { PokemonDetails, Evolution } from '../types';

export type Gender = 'male' | 'female' | 'genderless';

export interface BreedingParent {
  pokemon: PokemonDetails;
  gender: Gender;
}

export interface BreedingResult {
  isCompatible: boolean;
  offspringId: number | null;
  offspringName: string | null;
  message: string;
}

export const getPossibleGenders = (genderRate: number): Gender[] => {
  if (genderRate === -1) return ['genderless'];
  if (genderRate === 0) return ['male'];
  if (genderRate === 8) return ['female'];
  return ['male', 'female'];
};

export const findBaseEvolution = (chain: Evolution[]): Evolution | null => {
  if (!chain || chain.length === 0) return null;
  // Usually the first item in the list is the base (order-wise or simply root)
  // But strictly, it's the one with evolvesFromId === null
  const root = chain.find(e => !e.evolvesFromId);
  return root || chain[0]; // Fallback
};

export const calculateBreedingCompatibility = (
  parentA: BreedingParent,
  parentB: BreedingParent
): BreedingResult => {
    const pA = parentA.pokemon;
    const pB = parentB.pokemon;

    // Check Egg Groups
    const groupA = pA.eggGroups.map(g => g.toLowerCase());
    const groupB = pB.eggGroups.map(g => g.toLowerCase());

    if (groupA.includes('no-eggs') || groupA.includes('undiscovered')) {
        return { isCompatible: false, offspringId: null, offspringName: null, message: `${pA.name} cannot breed (Undiscovered Group).` };
    }
    if (groupB.includes('no-eggs') || groupB.includes('undiscovered')) {
        return { isCompatible: false, offspringId: null, offspringName: null, message: `${pB.name} cannot breed (Undiscovered Group).` };
    }

    const isDittoA = pA.name.toLowerCase() === 'ditto';
    const isDittoB = pB.name.toLowerCase() === 'ditto';

    if (isDittoA && isDittoB) {
        return { isCompatible: false, offspringId: null, offspringName: null, message: 'Two Dittos cannot breed.' };
    }

    // Ditto Breeding
    if (isDittoA) {
        const base = findBaseEvolution(pB.evolutionChain);
        return {
            isCompatible: true,
            offspringId: base?.id || pB.id,
            offspringName: base?.name || pB.name,
            message: 'Compatible (Ditto Breeding)!'
        };
    }
    if (isDittoB) {
        const base = findBaseEvolution(pA.evolutionChain);
        return {
            isCompatible: true,
            offspringId: base?.id || pA.id,
            offspringName: base?.name || pA.name,
            message: 'Compatible (Ditto Breeding)!'
        };
    }

    // Non-Ditto Breeding
    // Must share egg group
    const shareGroup = groupA.some(g => groupB.includes(g));
    if (!shareGroup) {
        return { isCompatible: false, offspringId: null, offspringName: null, message: 'Incompatible Egg Groups.' };
    }

    // Must be opposite genders
    if (parentA.gender === 'genderless' || parentB.gender === 'genderless') {
        return { isCompatible: false, offspringId: null, offspringName: null, message: 'Genderless Pokemon can only breed with Ditto.' };
    }

    if (parentA.gender === parentB.gender) {
        return { isCompatible: false, offspringId: null, offspringName: null, message: 'Parents must be opposite genders.' };
    }

    // Determine Offspring (Mother's species)
    const mother = parentA.gender === 'female' ? pA : pB;
    const base = findBaseEvolution(mother.evolutionChain);

    return {
        isCompatible: true,
        offspringId: base?.id || mother.id,
        offspringName: base?.name || mother.name,
        message: 'Compatible!'
    };
};
