import { describe, it, expect } from 'vitest';
import { compressTeam, decompressTeam } from './urlCompression';
import { TeamMember, PokemonListItem } from '../types';

describe('urlCompression', () => {
  const mockMasterList: PokemonListItem[] = [
    {
      id: 1,
      name: 'bulbasaur',
      imageUrl: 'img/1.png',
      shinyImageUrl: 'img/shiny/1.png',
      types: ['grass', 'poison'],
      flavorText: 'Seed pokemon',
      stats: [],
    },
    {
      id: 25,
      name: 'pikachu',
      imageUrl: 'img/25.png',
      shinyImageUrl: 'img/shiny/25.png',
      types: ['electric'],
      flavorText: 'Electric mouse',
      stats: [],
    },
  ];

  it('should return empty string for empty team', () => {
    expect(compressTeam([])).toBe('');
  });

  it('should compress and decompress a simple team (IDs only)', () => {
    const team: TeamMember[] = [{ ...mockMasterList[0] }, { ...mockMasterList[1] }];

    const compressed = compressTeam(team);
    expect(compressed).toBeTruthy();

    const decompressed = decompressTeam(compressed, mockMasterList);
    expect(decompressed.length).toBe(2);
    expect(decompressed[0].id).toBe(1);
    expect(decompressed[1].id).toBe(25);
  });

  it('should preserve competitive stats (Moves, EVs, IVs, Nature, Ability, Item)', () => {
    const team: TeamMember[] = [
      {
        ...mockMasterList[0],
        selectedMoves: ['tackle', 'growl'],
        selectedNature: 'Bold',
        selectedAbility: 'Overgrow',
        selectedItem: 'Leftovers',
        evs: { hp: 252, defense: 252, speed: 4 },
        ivs: { attack: 0 },
      },
    ];

    const compressed = compressTeam(team);
    const decompressed = decompressTeam(compressed, mockMasterList);

    const p = decompressed[0];
    expect(p.id).toBe(1);
    expect(p.selectedMoves).toEqual(['tackle', 'growl']);
    expect(p.selectedNature).toBe('Bold');
    expect(p.selectedAbility).toBe('Overgrow');
    expect(p.selectedItem).toBe('Leftovers');

    // EV Check
    expect(p.evs?.hp).toBe(252);
    expect(p.evs?.defense).toBe(252);
    expect(p.evs?.speed).toBe(4);
    expect(p.evs?.attack).toBeUndefined(); // Was 0/undefined

    // IV Check
    expect(p.ivs?.attack).toBe(0);
    expect(p.ivs?.hp).toBeUndefined(); // Default 31 should be undefined in decompressed if implementation logic holds (or check logic)

    // Let's check logic:
    // Compressed: only stores non-31.
    // Decompressed: puts into object.
    // So HP (31) is not in object -> undefined.
  });

  it('should preserve Shiny status', () => {
    const team: TeamMember[] = [
      {
        ...mockMasterList[1],
        imageUrl: mockMasterList[1].shinyImageUrl, // Simulate shiny
      },
    ];

    const compressed = compressTeam(team);
    const decompressed = decompressTeam(compressed, mockMasterList);

    expect(decompressed[0].imageUrl).toBe(mockMasterList[1].shinyImageUrl);
  });

  it('should handle invalid compressed strings safely', () => {
    expect(decompressTeam('invalid-string', mockMasterList)).toEqual([]);
  });
});
