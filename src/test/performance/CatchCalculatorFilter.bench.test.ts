import { describe, it, expect } from 'vitest';
import { PokemonListItem } from '../../types';

describe('CatchCalculator Search Performance Benchmark', () => {
    const listSize = 100000;
    const masterPokemonList: PokemonListItem[] = Array.from({ length: listSize }, (_, i) => ({
        id: i,
        name: `Pokemon${i}`,
        nameLower: `pokemon${i}`,
        imageUrl: '',
        shinyImageUrl: '',
        types: ['normal'],
        flavorText: '',
    }));

    const search = "mon1";
    const searchLower = search.toLowerCase();

    it('benchmarks filtering performance', () => {
        // Measure baseline (current implementation)
        const startBaseline = performance.now();
        const baselineResult = masterPokemonList
            .filter(p => p.name.toLowerCase().includes(searchLower))
            .slice(0, 5);
        const endBaseline = performance.now();
        const baselineTime = endBaseline - startBaseline;

        // Measure optimization (proposed implementation)
        const startOptimization = performance.now();
        const optimizedResult = masterPokemonList
            .filter(p => (p.nameLower || p.name.toLowerCase()).includes(searchLower))
            .slice(0, 5);
        const endOptimization = performance.now();
        const optimizationTime = endOptimization - startOptimization;

        console.log(`Baseline Time (toLowerCase): ${baselineTime.toFixed(4)}ms`);
        console.log(`Optimized Time (nameLower): ${optimizationTime.toFixed(4)}ms`);
        console.log(`Improvement: ${(baselineTime / optimizationTime).toFixed(2)}x faster`);

        expect(baselineResult).toEqual(optimizedResult);
        // We expect optimization to be faster, but let's not make the test flaky on CI/slower machines
        // just log the result. However, for a local run, we should see a difference.
        // expect(optimizationTime).toBeLessThan(baselineTime);
    });
});
