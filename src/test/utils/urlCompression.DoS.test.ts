import { describe, it, expect, vi } from 'vitest';
import { decompressTeam } from '../../utils/urlCompression';
import { PokemonListItem } from '../../types';
import LZString from 'lz-string';
import { MAX_DECOMPRESSED_LENGTH, MAX_COMPRESSED_LENGTH } from '../../utils/securityUtils';

// Mock LZString
vi.mock('lz-string', () => ({
  default: {
    decompressFromEncodedURIComponent: vi.fn(),
    compressToEncodedURIComponent: vi.fn(),
  },
}));

describe('urlCompression DoS Prevention', () => {
  const mockMasterList: PokemonListItem[] = [
    {
      id: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      imageUrl: 'img1',
      shinyImageUrl: 'simg1',
    },
  ];

  it('should reject extremely long compressed strings before decompression', () => {
    // Create a string longer than MAX_COMPRESSED_LENGTH
    const longCompressedString = 'a'.repeat(MAX_COMPRESSED_LENGTH + 1);

    // Spy on console.warn
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = decompressTeam(longCompressedString, mockMasterList);

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('Compressed team data too large');
    // Critical: Ensure decompression was NOT attempted
    expect(LZString.decompressFromEncodedURIComponent).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should return empty array if decompressed string exceeds MAX_DECOMPRESSED_LENGTH', () => {
    // Create a string slightly longer than the limit
    const longString = 'a'.repeat(MAX_DECOMPRESSED_LENGTH + 1);

    // Mock return value
    vi.mocked(LZString.decompressFromEncodedURIComponent).mockReturnValue(longString);

    // Spy on console.warn
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = decompressTeam('fake_compressed_string', mockMasterList);

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('Decompressed team data too large');
    expect(LZString.decompressFromEncodedURIComponent).toHaveBeenCalledWith(
      'fake_compressed_string'
    );

    warnSpy.mockRestore();
  });

  it('should accept strings within the limit', () => {
    const validJson = '[{"id":1}]';
    vi.mocked(LZString.decompressFromEncodedURIComponent).mockReturnValue(validJson);

    const result = decompressTeam('valid_compressed', mockMasterList);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});
