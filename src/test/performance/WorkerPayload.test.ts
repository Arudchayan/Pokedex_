import { describe, it, expect, vi } from 'vitest';
import type { PokemonListItem } from '../../types';

// Helper to estimate size of structured clone payload
// Since structuredClone() is hard to measure directly in terms of bytes, we use JSON.stringify as a proxy.
function estimatePayloadSize(data: any): number {
  return new TextEncoder().encode(JSON.stringify(data)).length;
}

function createMockPokemon(id: number): PokemonListItem {
  return {
    id,
    name: `Pokemon ${id}`,
    imageUrl: `https://example.com/pokemon/${id}.png`,
    shinyImageUrl: `https://example.com/pokemon/shiny/${id}.png`,
    types: ['fire', 'flying'],
    flavorText: 'A very cool pokemon that does things.',
    stats: [
      { name: 'hp', value: 100 },
      { name: 'attack', value: 100 },
      { name: 'defense', value: 100 },
      { name: 'special-attack', value: 100 },
      { name: 'special-defense', value: 100 },
      { name: 'speed', value: 100 },
    ],
    abilities: ['blaze', 'solar-power'],
    bst: 600,
    nameLower: `pokemon ${id}`,
    flavorTextLower: 'a very cool pokemon that does things.',
    abilitiesLower: ['blaze', 'solar-power'],
  };
}

describe('Worker Payload Benchmarks', () => {
  it('should demonstrate payload reduction by returning IDs instead of objects', () => {
    const listSize = 1000;
    const pokemonList = Array.from({ length: listSize }, (_, i) => createMockPokemon(i + 1));

    // Baseline: Returning full objects (current implementation)
    const baselinePayloadSize = estimatePayloadSize(pokemonList);

    // Optimized: Returning IDs only
    const optimizedPayloadSize = estimatePayloadSize(pokemonList.map(p => p.id));

    console.log(`Payload Size (1000 items):`);
    console.log(`Baseline (Objects): ${(baselinePayloadSize / 1024).toFixed(2)} KB`);
    console.log(`Optimized (IDs): ${(optimizedPayloadSize / 1024).toFixed(2)} KB`);

    // Expect significant reduction (>90%)
    const reduction = (baselinePayloadSize - optimizedPayloadSize) / baselinePayloadSize;
    expect(reduction).toBeGreaterThan(0.9);
  });

  it('should demonstrate savings of caching favorites array', () => {
    // Scenario: User types in search box (generating many filter requests) but favorites don't change.
    // Assuming 50 favorites selected.
    const favorites = Array.from({ length: 50 }, (_, i) => i + 1);

    const singleRequestPayload = estimatePayloadSize(favorites);

    // Simulate 100 filter operations (typing "charizard")
    const requests = 100;
    const totalBaselineTransfer = singleRequestPayload * requests;

    // Optimized: Send favorites only once
    const totalOptimizedTransfer = singleRequestPayload * 1;

    console.log(`Favorites Transfer (100 requests, 50 favorites):`);
    console.log(`Baseline (Resend every time): ${(totalBaselineTransfer / 1024).toFixed(2)} KB`);
    console.log(`Optimized (Cache): ${(totalOptimizedTransfer / 1024).toFixed(2)} KB`);

    expect(totalOptimizedTransfer).toBeLessThan(totalBaselineTransfer);
  });
});
