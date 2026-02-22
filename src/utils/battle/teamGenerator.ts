import { PokemonListItem, PokemonDetails } from '../../types';
import { fetchAllPokemons, fetchPokemonDetails, fetchAllMoves } from '../../services/pokeapiService';
import type { Move } from '../../services/pokeapiService';
import { BattlePokemon, BattleMove, StatSet, TypeName } from './types';
import { getLogicId } from './moveLogic';
import { PREMADE_TEAMS } from './premadeData';

// Helper to map API stats to our StatSet
const mapStats = (stats: any[]): StatSet => {
    return {
        hp: stats.find((s: any) => s.stat?.name === 'hp' || s.name === 'hp')?.base_stat || 50,
        atk: stats.find((s: any) => s.stat?.name === 'attack' || s.name === 'attack')?.base_stat || 50,
        def: stats.find((s: any) => s.stat?.name === 'defense' || s.name === 'defense')?.base_stat || 50,
        spa: stats.find((s: any) => s.stat?.name === 'special-attack' || s.name === 'special-attack')?.base_stat || 50,
        spd: stats.find((s: any) => s.stat?.name === 'special-defense' || s.name === 'special-defense')?.base_stat || 50,
        spe: stats.find((s: any) => s.stat?.name === 'speed' || s.name === 'speed')?.base_stat || 50,
    };
};

// Calculate actual stats at Level 50 (Simplified mostly)
const calcStat = (base: number, iv: number, ev: number, level: number, isHp: boolean) => {
    if (isHp) {
        return Math.floor(((2 * base + iv + (ev / 4)) * level) / 100) + level + 10;
    }
    return Math.floor(((2 * base + iv + (ev / 4)) * level) / 100) + 5;
};

export const generatePremadeTeam = (side: 'A' | 'B'): BattlePokemon[] => {
    // Return deep clone of premade team
    const source = side === 'A' ? PREMADE_TEAMS.teamA : PREMADE_TEAMS.teamB;
    return JSON.parse(JSON.stringify(source));
};

export const generateRandomTeam = async (count: number = 6): Promise<BattlePokemon[]> => {
    try {
        // 1. Fetch Master List
        const all = await fetchAllPokemons();
        const allMoves = await fetchAllMoves();

        const team: BattlePokemon[] = [];
        const usedIds = new Set<number>();
        const MAX_RETRIES = 20;
        let attempts = 0;

        // 2. Pick Random Mons
        while (team.length < count && attempts < MAX_RETRIES) {
            attempts++;
            const randomIdx = Math.floor(Math.random() * all.length);
            const p = all[randomIdx];

            // Skip basic if possible, skip duplicates
            if (usedIds.has(p.id)) continue;

            try {
                // 3. Get Full Details
                const details = await fetchPokemonDetails(p.id);
                if (!details) continue;

                usedIds.add(p.id);

                // 4. Transform to BattlePokemon
                // Ensure stats exist
                if (!details.stats || details.stats.length === 0) continue;

                const baseStats = mapStats(details.stats as any[]);
                const level = 50;
                const stats: StatSet = {
                    hp: calcStat(baseStats.hp, 31, 85, level, true),
                    atk: calcStat(baseStats.atk, 31, 85, level, false),
                    def: calcStat(baseStats.def, 31, 85, level, false),
                    spa: calcStat(baseStats.spa, 31, 85, level, false),
                    spd: calcStat(baseStats.spd, 31, 85, level, false),
                    spe: calcStat(baseStats.spe, 31, 85, level, false),
                };

                // 5. Pick Moves
                // We use details.moves for the list of moves this mon learns,
                // and allMoves to get the move data.
                const learnableNames = details.moves.map(m => m.name);

                // Filter allMoves to find ones this pokemon can learn that are implemented in API dump
                const validPool = allMoves.filter(m => learnableNames.includes(m.name) && (m.power || m.accuracy));

                const selectedMoves: BattleMove[] = [];
                const shuffled = [...validPool].sort(() => 0.5 - Math.random());

                for (const m of shuffled) {
                    if (selectedMoves.length >= 4) break;
                    // Add Move
                    selectedMoves.push({
                        id: m.name,
                        name: m.name,
                        type: m.type as TypeName,
                        power: m.power || 0,
                        accuracy: m.accuracy || 100,
                        pp: m.pp || 15,
                        maxPp: m.pp || 15,
                        priority: 0,
                        category: m.category as any || 'physical',
                        target: 'normal',
                        desc: '',
                        logicId: getLogicId(m.name, '')
                    });
                }

                // Fallback moves if none found
                if (selectedMoves.length === 0) {
                    selectedMoves.push({
                        id: 'Tackle', name: 'Tackle', type: 'normal', power: 40, accuracy: 100, pp: 35, maxPp: 35, priority: 0, category: 'physical', target: 'normal', desc: '', logicId: 'basic_damage'
                    });
                }

                team.push({
                    id: `p${team.length}_${p.name}`,
                    speciesId: p.id,
                    name: p.name,
                    types: details.types as [TypeName, TypeName?],
                    level: 50,
                    gender: Math.random() > 0.5 ? 'M' : 'F',
                    baseStats,
                    stats,
                    currentHp: stats.hp,
                    maxHp: stats.hp,
                    status: 'none',
                    statStages: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
                    moves: selectedMoves,
                    ability: 'unknown',
                    item: 'leftovers',
                    spriteBack: details.shinyImageUrl || details.imageUrl, // Fallback
                    spriteFront: details.imageUrl
                });

            } catch (e) {
                console.error("Failed to gen pokemon", p.name, e);
            }
        }

        // If we couldn't generate a full team, return partial results.
        // If we generated nothing, throw so the caller can fall back.
        if (team.length === 0) throw new Error("Could not generate any pokemon via API");

        return team;

    } catch (e) {
        console.error("Team Gen Critical Failure", e);
        throw e; // Caller handles fallback
    }
};
