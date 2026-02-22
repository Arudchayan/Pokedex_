import { describe, it, expect } from 'vitest';
import { calculateBreedingCompatibility, findBaseEvolution, BreedingParent } from '../../utils/breedingLogic';
import { PokemonDetails, Evolution } from '../../types';

// Helper to create mock Pokemon
const createMockPokemon = (id: number, name: string, eggGroups: string[], genderRate: number, evolutionChain: Evolution[] = []): PokemonDetails => ({
  id,
  name,
  eggGroups,
  genderRate,
  evolutionChain,
  // ... other required props mocked as empty/default
  imageUrl: '',
  shinyImageUrl: '',
  types: [],
  flavorText: '',
  stats: [],
  abilities: [],
  moves: [],
  detailImageUrl: '',
  shinyDetailImageUrl: '',
  height: 0,
  weight: 0,
  color: '',
  habitat: '',
  captureRate: 0,
  baseHappiness: 0,
  genus: '',
  weaknesses: [],
  growthRate: '',
  shape: '',
  forms: []
});

const createMockEvolution = (id: number, name: string, evolvesFromId: number | null = null): Evolution => ({
    id, name, evolvesFromId, imageUrl: ''
});

describe('breedingLogic', () => {
  describe('findBaseEvolution', () => {
    it('should find the base evolution (evolvesFromId is null)', () => {
      const chain: Evolution[] = [
        createMockEvolution(1, 'Bulbasaur', null),
        createMockEvolution(2, 'Ivysaur', 1),
        createMockEvolution(3, 'Venusaur', 2)
      ];
      const base = findBaseEvolution(chain);
      expect(base?.name).toBe('Bulbasaur');
    });

    it('should handle unordered chain', () => {
      const chain: Evolution[] = [
          createMockEvolution(2, 'Ivysaur', 1),
          createMockEvolution(1, 'Bulbasaur', null),
      ];
      const base = findBaseEvolution(chain);
      expect(base?.name).toBe('Bulbasaur');
    });
  });

  describe('calculateBreedingCompatibility', () => {
    const ditto = createMockPokemon(132, 'Ditto', ['Ditto'], -1);
    const pikachuM = createMockPokemon(25, 'Pikachu', ['Field', 'Fairy'], 4, [createMockEvolution(172, 'Pichu', null), createMockEvolution(25, 'Pikachu', 172)]);
    const pikachuF = createMockPokemon(25, 'Pikachu', ['Field', 'Fairy'], 4, [createMockEvolution(172, 'Pichu', null), createMockEvolution(25, 'Pikachu', 172)]);
    const lucarioM = createMockPokemon(448, 'Lucario', ['Field', 'Human-Like'], 1, [createMockEvolution(447, 'Riolu', null), createMockEvolution(448, 'Lucario', 447)]);
    const magnemite = createMockPokemon(81, 'Magnemite', ['Mineral'], -1, [createMockEvolution(81, 'Magnemite', null)]);
    const legendary = createMockPokemon(150, 'Mewtwo', ['no-eggs'], -1);

    const parentPikaM: BreedingParent = { pokemon: pikachuM, gender: 'male' };
    const parentPikaF: BreedingParent = { pokemon: pikachuF, gender: 'female' };
    const parentLucarioM: BreedingParent = { pokemon: lucarioM, gender: 'male' };
    const parentDitto: BreedingParent = { pokemon: ditto, gender: 'genderless' };
    const parentMagnemite: BreedingParent = { pokemon: magnemite, gender: 'genderless' };
    const parentLegend: BreedingParent = { pokemon: legendary, gender: 'genderless' };

    it('should allow breeding compatible male and female sharing egg group', () => {
      const result = calculateBreedingCompatibility(parentPikaF, parentLucarioM);
      expect(result.isCompatible).toBe(true);
      expect(result.offspringName).toBe('Pichu'); // Mother is Pikachu -> Pichu
    });

    it('should fail if parents are same gender', () => {
      const result = calculateBreedingCompatibility(parentPikaM, parentLucarioM);
      expect(result.isCompatible).toBe(false);
      expect(result.message).toContain('opposite genders');
    });

    it('should allow breeding with Ditto', () => {
      const result = calculateBreedingCompatibility(parentPikaM, parentDitto);
      expect(result.isCompatible).toBe(true);
      expect(result.offspringName).toBe('Pichu');
    });

    it('should allow Genderless + Ditto', () => {
      const result = calculateBreedingCompatibility(parentMagnemite, parentDitto);
      expect(result.isCompatible).toBe(true);
      expect(result.offspringName).toBe('Magnemite');
    });

    it('should fail Genderless + Genderless (Non-Ditto)', () => {
        // Magnemite + Magnemite (if we had two). Or Magnemite + Klink.
        // But logic says genderless can ONLY breed with Ditto.
        // Let's test Magnemite + Magnemite.
        const result = calculateBreedingCompatibility(parentMagnemite, parentMagnemite);
        expect(result.isCompatible).toBe(false);
        expect(result.message).toContain('Ditto');
    });

    it('should fail if egg groups do not match', () => {
      const charizard = createMockPokemon(6, 'Charizard', ['Monster', 'Dragon'], 1);
      const parentChar: BreedingParent = { pokemon: charizard, gender: 'female' };
      const result = calculateBreedingCompatibility(parentChar, parentPikaM); // Field/Fairy vs Monster/Dragon
      expect(result.isCompatible).toBe(false);
      expect(result.message).toContain('Incompatible Egg Groups');
    });

    it('should fail if Undiscovered group', () => {
      const result = calculateBreedingCompatibility(parentLegend, parentDitto);
      expect(result.isCompatible).toBe(false);
      expect(result.message).toContain('Undiscovered');
    });

    it('should fail Ditto + Ditto', () => {
        const result = calculateBreedingCompatibility(parentDitto, parentDitto);
        expect(result.isCompatible).toBe(false);
        expect(result.message).toContain('Two Dittos');
    });
  });
});
