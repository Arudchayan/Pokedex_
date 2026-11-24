// src/utils/shinyOddsUtils.ts

export const GENERATIONS = {
  gen2: 'Generation 2 (GSC)',
  gen3: 'Generation 3 (RSE/FRLG)',
  gen4: 'Generation 4 (DPPt/HGSS)',
  gen5: 'Generation 5 (BW/B2W2)',
  gen6: 'Generation 6 (XY/ORAS)',
  gen7: 'Generation 7 (SM/USUM)',
  gen8: 'Generation 8 (SwSh)',
  gen9: 'Generation 9 (SV)',
};

export type GenerationKey = keyof typeof GENERATIONS;

/**
 * Sparkling Power levels available from Gen 9 sandwich meals.
 * Level 0 means the effect is not active.
 */
export const SPARKLING_POWER_LEVELS = [0, 1, 2, 3] as const;

export type SparklingPowerLevel = (typeof SPARKLING_POWER_LEVELS)[number];

/** Each Sparkling Power level adds one shiny roll to wild encounters. */
export const SPARKLING_POWER_ROLLS: Record<SparklingPowerLevel, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
};

/**
 * The Shiny Charm was introduced in Generation V (Pokémon Black/White).
 * It does not exist in Generations 2-4, so it must not affect their odds.
 */
const SHINY_CHARM_GENERATIONS: ReadonlySet<GenerationKey> = new Set<GenerationKey>([
  'gen5',
  'gen6',
  'gen7',
  'gen8',
  'gen9',
]);

export function isShinyCharmAvailable(gen: GenerationKey): boolean {
  return SHINY_CHARM_GENERATIONS.has(gen);
}

export interface ShinyMethod {
  id: string;
  name: string;
  odds: number;
  /** Gen 9 shiny rolls out of 4096 before modifiers. Defaults to the base roll. */
  rolls?: number;
}

export const SHINY_METHODS: Record<GenerationKey, ShinyMethod[]> = {
  gen2: [{ id: 'breeding', name: 'Breeding (Shiny Parent)', odds: 1 / 64 }],
  gen3: [{ id: 'random', name: 'Random Encounters', odds: 1 / 8192 }],
  gen4: [
    { id: 'random', name: 'Random Encounters', odds: 1 / 8192 },
    { id: 'masuda', name: 'Masuda Method', odds: 5 / 8192 }, // ~1/1638
    { id: 'radar', name: 'Poke Radar (Chain of 40)', odds: 41 / 8192 }, // ~1/200
  ],
  gen5: [
    { id: 'random', name: 'Random Encounters', odds: 1 / 8192 },
    { id: 'masuda', name: 'Masuda Method', odds: 6 / 8192 }, // ~1/1365
  ],
  gen6: [
    { id: 'random', name: 'Random Encounters', odds: 1 / 4096 },
    { id: 'masuda', name: 'Masuda Method', odds: 1 / 683 },
    { id: 'radar', name: 'Poke Radar (Chain of 40)', odds: 1 / 200 }, // Approx
    { id: 'chain_fishing', name: 'Chain Fishing (Chain of 20+)', odds: 1 / 100 }, // Approx
    { id: 'friend_safari', name: 'Friend Safari', odds: 1 / 512 },
    { id: 'dexnav', name: 'DexNav (Search Level 999)', odds: 1 / 173 }, // Complex formula, approx
  ],
  gen7: [
    { id: 'random', name: 'Random Encounters', odds: 1 / 4096 },
    { id: 'masuda', name: 'Masuda Method', odds: 1 / 683 },
    { id: 'sos', name: 'SOS Battle (Chain of 31+)', odds: 13 / 4096 }, // ~1/315
    { id: 'wormhole', name: 'Ultra Wormhole (Max)', odds: 1 / 100 }, // Varies greatly
  ],
  gen8: [
    { id: 'random', name: 'Random Encounters', odds: 1 / 4096 },
    { id: 'masuda', name: 'Masuda Method', odds: 1 / 683 },
    { id: 'battle_count', name: 'Battle Count (500+ battles)', odds: 1 / 683 }, // Only with charm effectively? (Buggy in SwSh) - simplified
    { id: 'dynamax_adventures', name: 'Dynamax Adventures', odds: 1 / 300 },
  ],
  gen9: [
    { id: 'random', name: 'Random Encounters', odds: 1 / 4096, rolls: 1 },
    // Masuda eggs get six rolls; Sparkling Power only affects wild encounters.
    { id: 'masuda', name: 'Masuda Method', odds: 1 / 683, rolls: 6 },
    { id: 'outbreak', name: 'Mass Outbreak (60+ KOs)', odds: 1 / 1365, rolls: 3 },
  ],
};

/**
 * Resolve a method within a generation, falling back to the first method when
 * an unknown or removed id is supplied (for example a stale UI selection).
 */
export function resolveShinyMethod(gen: GenerationKey, methodId: string): ShinyMethod | undefined {
  const methods = SHINY_METHODS[gen];
  if (!methods) return undefined;
  return methods.find((m) => m.id === methodId) ?? methods[0];
}

// Modifiers
// Charm adds 2 extra rolls usually.
// Gen 5: Charm increases odds from 1/8192 -> 1/2730 (roughly 3 rolls)
// Gen 6+: Charm increases odds from 1/4096 -> 1/1365 (roughly 3 rolls)

export function calculateShinyOdds(
  gen: GenerationKey,
  methodId: string,
  hasCharm: boolean,
  sparklingPower: SparklingPowerLevel = 0 // Gen 9 only
): { odds: number; text: string } {
  const methods = SHINY_METHODS[gen];
  if (!methods) return { odds: 0, text: 'Unknown Generation' };

  const method = resolveShinyMethod(gen, methodId);
  if (!method) return { odds: 0, text: 'Unknown Method' };

  const id = method.id;
  const charmActive = hasCharm && isShinyCharmAvailable(gen);

  // --- Gen 9: rolls out of 4096 ---
  // Base 1 roll, the Shiny Charm adds 2, and Sparkling Power adds one roll
  // per level. Masuda eggs start at 6 rolls and ignore Sparkling Power
  // because it only applies to wild encounters.
  if (gen === 'gen9') {
    const methodRolls = method.rolls ?? 1;
    const sparklingRolls = id === 'masuda' ? 0 : SPARKLING_POWER_ROLLS[sparklingPower];
    const totalRolls = methodRolls + (charmActive ? 2 : 0) + sparklingRolls;
    const odds = totalRolls / 4096;
    return { odds, text: `1 in ${Math.round(1 / odds)}` };
  }

  let odds = method.odds;

  // Gen 2 breeding odds are fixed and unaffected by later-generation items.
  if (gen === 'gen2') return { odds, text: `1 in ${Math.round(1 / odds)}` };

  // --- Charm Handling (Gen 5+ only) ---
  if (charmActive) {
    // In Gen 5+, Shiny Charm usually adds 2 extra rolls for standard encounters/eggs
    if (['random', 'masuda', 'friend_safari', 'outbreak'].includes(id)) {
      if (gen === 'gen5') {
        // Gen 5 Charm: 1/8192 -> ~1/2730 (2 extra rolls if simple, but actually it's complicated)
        // Masuda Gen 5: 6/8192 -> 8/8192 with charm
        if (id === 'masuda')
          odds = 8 / 8192; // 1/1024
        else odds = 1 / 2730;
      } else if (parseInt(gen.replace('gen', '')) >= 6) {
        // Gen 6+: Base 1/4096. Charm adds 2 rolls usually.
        // Random: 1/4096 -> 3/4096 (~1/1365)
        // Masuda: 1/683 (6/4096) -> 1/512 (8/4096)
        if (id === 'masuda') odds = 1 / 512;
        else if (id === 'random')
          odds = 3 / 4096; // 1/1365
        else if (id === 'friend_safari')
          odds = 1 / 512 + 2 / 4096; // Roughly 1/512 still fixed? Actually FS is fixed 1/512, charm might not affect it or brings it to 1/273? Conflicting data. Generally FS is 1/512 flat.
        // Let's stick to standard formula for random/outbreak
        else if (id === 'outbreak') {
          // SV Outbreak 60+: 1/1365 (3 rolls). With Charm: 1/819 (5 rolls)
          odds = 5 / 4096; // 1/819
        }
      }
    }

    // Special cases
    if (gen === 'gen8' && id === 'dynamax_adventures') {
      odds = 1 / 100; // 1/300 -> 1/100 with charm
    }
  }

  const denom = Math.round(1 / odds);
  return { odds, text: `1 in ${denom}` };
}
