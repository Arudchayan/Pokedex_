
import { describe, expect, it } from 'vitest';
import { importFromShowdown, exportToShowdown } from './teamExport';
import { TeamMember, PokemonListItem } from '../types';

describe('teamExport', () => {
  const mockMasterList: PokemonListItem[] = [
    {
      id: 1,
      name: 'bulbasaur',
      imageUrl: 'bulbasaur.png',
      shinyImageUrl: 'bulbasaur-shiny.png',
      types: ['grass', 'poison'],
      flavorText: '',
      stats: [
          { name: 'hp', value: 45 },
          { name: 'attack', value: 49 },
          { name: 'defense', value: 49 },
          { name: 'special-attack', value: 65 },
          { name: 'special-defense', value: 65 },
          { name: 'speed', value: 45 }
      ],
      abilities: ['Overgrow', 'Chlorophyll']
    },
    {
      id: 25,
      name: 'pikachu',
      imageUrl: 'pikachu.png',
      shinyImageUrl: 'pikachu-shiny.png',
      types: ['electric'],
      flavorText: '',
      stats: [
           { name: 'hp', value: 35 },
           { name: 'attack', value: 55 },
           { name: 'defense', value: 40 },
           { name: 'special-attack', value: 50 },
           { name: 'special-defense', value: 50 },
           { name: 'speed', value: 90 }
      ],
      abilities: ['Static', 'Lightning Rod']
    },
    {
      id: 6,
      name: 'charizard',
      imageUrl: 'charizard.png',
      shinyImageUrl: 'charizard-shiny.png',
      types: ['fire', 'flying'],
      flavorText: '',
      stats: [],
      abilities: ['Blaze', 'Solar Power']
    }
  ];

  describe('importFromShowdown', () => {
    it('imports basic pokemon names', () => {
      const input = 'Pikachu\n\nBulbasaur';
      const result = importFromShowdown(input, mockMasterList);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('pikachu');
      expect(result[1].name).toBe('bulbasaur');
    });

    it('imports pokemon with items and nicknames', () => {
      const input = 'Pikachu @ Light Ball\n\nSparky (Charizard) @ Charcoal\n\nBulbasaur (M)';
      const result = importFromShowdown(input, mockMasterList);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('pikachu');
      expect(result[0].selectedItem).toBe('Light Ball');

      expect(result[1].name).toBe('charizard');
      expect(result[1].selectedItem).toBe('Charcoal');

      expect(result[2].name).toBe('bulbasaur');
    });

    it('imports full competitive sets', () => {
        const input = `
Charizard @ Life Orb
Ability: Solar Power
Shiny: Yes
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Fire Blast
- Air Slash
- Solar Beam
- Focus Blast
        `.trim();

        const result = importFromShowdown(input, mockMasterList);
        expect(result).toHaveLength(1);
        const char = result[0];

        expect(char.name).toBe('charizard');
        expect(char.selectedItem).toBe('Life Orb');
        expect(char.selectedAbility).toBe('Solar Power');
        expect(char.imageUrl).toContain('shiny'); // Should switch to shiny URL
        expect(char.isShiny).toBe(true);
        expect(char.selectedNature).toBe('Timid');

        expect(char.evs).toEqual({
            'special-attack': 252,
            'special-defense': 4,
            'speed': 252
        });

        expect(char.ivs).toEqual({
            'attack': 0
        });

        expect(char.selectedMoves).toEqual([
            'Fire Blast', 'Air Slash', 'Solar Beam', 'Focus Blast'
        ]);
    });
  });

  describe('exportToShowdown', () => {
      it('exports full competitive set', () => {
          const team: TeamMember[] = [{
              ...mockMasterList[2], // Charizard
              selectedItem: 'Life Orb',
              selectedAbility: 'Solar Power',
              isShiny: true,
              selectedNature: 'Timid',
              evs: {
                  'special-attack': 252,
                  'special-defense': 4,
                  'speed': 252
              },
              ivs: {
                  'attack': 0
              },
              selectedMoves: ['Fire Blast', 'Air Slash', 'Solar Beam', 'Focus Blast']
          }];

          const result = exportToShowdown(team);

          expect(result).toContain('Charizard @ Life Orb');
          expect(result).toContain('Ability: Solar Power');
          expect(result).toContain('Shiny: Yes');
          expect(result).toContain('Timid Nature');
          expect(result).toContain('EVs: 252 SpA / 4 SpD / 252 Spe');
          expect(result).toContain('IVs: 0 Atk');
          expect(result).toContain('- Fire Blast');
      });

      it('does not export shiny for normal pokemon', () => {
          const team: TeamMember[] = [{
              ...mockMasterList[0], // Bulbasaur
              // Default isShiny: undefined/false
          }];

          const result = exportToShowdown(team);
          expect(result).not.toContain('Shiny: Yes');
      });
  });
});
