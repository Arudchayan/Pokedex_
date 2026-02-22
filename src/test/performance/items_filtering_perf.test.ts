import { describe, it, expect, vi } from 'vitest';
import { Item } from '../../types';

describe('Item Filtering Performance', () => {
    const itemCount = 2000;
    const searchIterations = 1000;
    const searchTerms = ['ball', 'potion', 'berry', 'stone', 'plate'];

    // Generate mock items
    const items: Item[] = Array.from({ length: itemCount }, (_, i) => ({
        id: i,
        name: `Item ${i} ${searchTerms[i % searchTerms.length].toUpperCase()}`,
        imageUrl: 'http://example.com/img.png',
        // precompute for the optimized test case
        // Note: The interface currently doesn't have nameLower, so I'll cast to any for now
        // or just use a local extended interface
    }));

    // Add nameLower property manually for the optimized test
    const optimizedItems = items.map(item => ({
        ...item,
        nameLower: item.name.toLowerCase()
    }));

    it('measures filtering performance', () => {
        console.log(`\nBenchmarking filtering on ${itemCount} items over ${searchIterations} iterations...`);

        // Baseline: Current Implementation
        const startBaseline = performance.now();
        let baselineResultsCount = 0;

        for (let i = 0; i < searchIterations; i++) {
            const term = searchTerms[i % searchTerms.length];
            const termLower = term.toLowerCase();
            const filtered = items.filter(item =>
                item.name.toLowerCase().includes(termLower)
            ).slice(0, 10);
            baselineResultsCount += filtered.length;
        }

        const endBaseline = performance.now();
        const durationBaseline = endBaseline - startBaseline;
        console.log(`Baseline (toLowerCase inside loop): ${durationBaseline.toFixed(2)}ms`);

        // Optimization: Precomputed nameLower
        const startOptimized = performance.now();
        let optimizedResultsCount = 0;

        for (let i = 0; i < searchIterations; i++) {
            const term = searchTerms[i % searchTerms.length];
            const termLower = term.toLowerCase();
            const filtered = optimizedItems.filter((item: any) =>
                (item.nameLower || item.name.toLowerCase()).includes(termLower)
            ).slice(0, 10);
            optimizedResultsCount += filtered.length;
        }

        const endOptimized = performance.now();
        const durationOptimized = endOptimized - startOptimized;
        console.log(`Optimized (precomputed nameLower): ${durationOptimized.toFixed(2)}ms`);

        const improvement = durationBaseline - durationOptimized;
        const improvementPercent = (improvement / durationBaseline) * 100;
        console.log(`Improvement: ${improvement.toFixed(2)}ms (${improvementPercent.toFixed(1)}%)`);

        expect(baselineResultsCount).toBe(optimizedResultsCount);
        // We expect improvement, but in CI environments timing can vary.
        // We assert logic correctness, and just log performance.
    });
});
