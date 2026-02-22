
import { describe, it, expect } from 'vitest';
import { compressTeam, decompressTeam } from '../../utils/urlCompression';
import { PokemonListItem, TeamMember } from '../../types';

describe('urlCompression', () => {
  const mockMasterList: PokemonListItem[] = [
    { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], imageUrl: 'img1', shinyImageUrl: 'simg1' },
    { id: 25, name: 'pikachu', types: ['electric'], imageUrl: 'img25', shinyImageUrl: 'simg25' },
    { id: 133, name: 'eevee', types: ['normal'], imageUrl: 'img133', shinyImageUrl: 'simg133' },
  ];

  it('should compress and decompress a team correctly', () => {
    const team: TeamMember[] = [
      {
        ...mockMasterList[0],
        selectedMoves: ['tackle', 'growl'],
        selectedAbility: 'overgrow',
        selectedNature: 'bold',
        selectedItem: 'miracle-seed',
        evs: { hp: 252, defense: 252 },
        ivs: { speed: 0 },
      },
    ];

    const compressed = compressTeam(team);
    const decompressed = decompressTeam(compressed, mockMasterList);

    expect(decompressed).toHaveLength(1);
    expect(decompressed[0].id).toBe(1);
    expect(decompressed[0].selectedMoves).toEqual(['tackle', 'growl']);
    expect(decompressed[0].selectedAbility).toBe('overgrow');
    expect(decompressed[0].selectedNature).toBe('bold');
    expect(decompressed[0].selectedItem).toBe('miracle-seed');
    expect(decompressed[0].evs?.hp).toBe(252);
    expect(decompressed[0].ivs?.speed).toBe(0);
  });

  // Security tests
  it('should limit the number of team members to prevent DoS', () => {
    // Create a malicious string that expands to 100 Pikachus
    const maliciousTeam = Array(100).fill({ id: 25 });
    const jsonString = JSON.stringify(maliciousTeam);
    const compressed = require('lz-string').compressToEncodedURIComponent(jsonString);

    const decompressed = decompressTeam(compressed, mockMasterList);

    // We expect it to be capped (e.g. at 12 or 6)
    // For this test, we assume the cap will be implemented as 12
    expect(decompressed.length).toBeLessThanOrEqual(12);
  });

  it('should sanitize strings in decompressed data', () => {
     const maliciousTeam = [{
        id: 25,
        a: '<script>alert(1)</script>',
        n: 'Bold<',
        i: 'Berry"',
        m: ['Move1', '<img src=x>']
     }];
     const jsonString = JSON.stringify(maliciousTeam);
     const compressed = require('lz-string').compressToEncodedURIComponent(jsonString);

     const decompressed = decompressTeam(compressed, mockMasterList);

     expect(decompressed[0].selectedAbility).toBe('scriptalert(1)/script'); // Sanitize removes < >
     expect(decompressed[0].selectedNature).toBe('Bold');
     expect(decompressed[0].selectedItem).toBe('Berry');
     expect(decompressed[0].selectedMoves?.[1]).toBe('img src=x');
  });
});
