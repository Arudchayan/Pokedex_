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

export const SHINY_METHODS = {
  gen2: [
    { id: 'breeding', name: 'Breeding (Shiny Parent)', odds: 1/64 },
  ],
  gen3: [
    { id: 'random', name: 'Random Encounters', odds: 1/8192 },
  ],
  gen4: [
    { id: 'random', name: 'Random Encounters', odds: 1/8192 },
    { id: 'masuda', name: 'Masuda Method', odds: 5/8192 }, // ~1/1638
    { id: 'radar', name: 'Poke Radar (Chain of 40)', odds: 41/8192 }, // ~1/200
  ],
  gen5: [
    { id: 'random', name: 'Random Encounters', odds: 1/8192 },
    { id: 'masuda', name: 'Masuda Method', odds: 6/8192 }, // ~1/1365
  ],
  gen6: [
    { id: 'random', name: 'Random Encounters', odds: 1/4096 },
    { id: 'masuda', name: 'Masuda Method', odds: 1/683 },
    { id: 'radar', name: 'Poke Radar (Chain of 40)', odds: 1/200 }, // Approx
    { id: 'chain_fishing', name: 'Chain Fishing (Chain of 20+)', odds: 1/100 }, // Approx
    { id: 'friend_safari', name: 'Friend Safari', odds: 1/512 },
    { id: 'dexnav', name: 'DexNav (Search Level 999)', odds: 1/173 }, // Complex formula, approx
  ],
  gen7: [
    { id: 'random', name: 'Random Encounters', odds: 1/4096 },
    { id: 'masuda', name: 'Masuda Method', odds: 1/683 },
    { id: 'sos', name: 'SOS Battle (Chain of 31+)', odds: 13/4096 }, // ~1/315
    { id: 'wormhole', name: 'Ultra Wormhole (Max)', odds: 1/100 }, // Varies greatly
  ],
  gen8: [
    { id: 'random', name: 'Random Encounters', odds: 1/4096 },
    { id: 'masuda', name: 'Masuda Method', odds: 1/683 },
    { id: 'battle_count', name: 'Battle Count (500+ battles)', odds: 1/683 }, // Only with charm effectively? (Buggy in SwSh) - simplified
    { id: 'dynamax_adventures', name: 'Dynamax Adventures', odds: 1/300 },
  ],
  gen9: [
    { id: 'random', name: 'Random Encounters', odds: 1/4096 },
    { id: 'masuda', name: 'Masuda Method', odds: 1/683 },
    { id: 'outbreak', name: 'Mass Outbreak (60+ KOs)', odds: 1/1365 },
    { id: 'sandwich', name: 'Sparkling Power Lv. 3', odds: 1/1024 }, // Base with sandwich
  ],
};

// Modifiers
// Charm adds 2 extra rolls usually.
// Gen 5: Charm increases odds from 1/8192 -> 1/2730 (roughly 3 rolls)
// Gen 6+: Charm increases odds from 1/4096 -> 1/1365 (roughly 3 rolls)

export function calculateShinyOdds(
  gen: GenerationKey,
  methodId: string,
  hasCharm: boolean,
  hasSandwich: boolean = false // Gen 9 specific
): { odds: number; text: string } {
  const methods = SHINY_METHODS[gen];
  if (!methods) return { odds: 0, text: 'Unknown Generation' };

  const method = methods.find(m => m.id === methodId);
  if (!method) return { odds: 0, text: 'Unknown Method' };

  let odds = method.odds;
  let rolls = 1;

  // Base odds adjustments based on method
  // Note: This is a simplification. Actual mechanics are rolls.
  // 1/X probability is approximated by rolls/Base.

  // --- Gen 2-4 (Pre-Charm for most, or specific charm handling) ---
  if (gen === 'gen2') return { odds, text: `1 in ${Math.round(1/odds)}` };

  // --- Charm Handling ---
  if (hasCharm) {
      // In Gen 5+, Shiny Charm usually adds 2 extra rolls for standard encounters/eggs
      if (['random', 'masuda', 'friend_safari', 'outbreak'].includes(methodId)) {
          if (gen === 'gen5') {
            // Gen 5 Charm: 1/8192 -> ~1/2730 (2 extra rolls if simple, but actually it's complicated)
            // Masuda Gen 5: 6/8192 -> 8/8192 with charm
             if (methodId === 'masuda') odds = 8/8192; // 1/1024
             else odds = 1/2730;
          } else if (parseInt(gen.replace('gen', '')) >= 6) {
             // Gen 6+: Base 1/4096. Charm adds 2 rolls usually.
             // Random: 1/4096 -> 3/4096 (~1/1365)
             // Masuda: 1/683 (6/4096) -> 1/512 (8/4096)
             if (methodId === 'masuda') odds = 1/512;
             else if (methodId === 'random') odds = 3/4096; // 1/1365
             else if (methodId === 'friend_safari') odds = 1/512 + (2/4096); // Roughly 1/512 still fixed? Actually FS is fixed 1/512, charm might not affect it or brings it to 1/273? Conflicting data. Generally FS is 1/512 flat.
             // Let's stick to standard formula for random/outbreak
             else if (methodId === 'outbreak') {
                 // SV Outbreak 60+: 1/1365 (3 rolls). With Charm: 1/819 (5 rolls)
                 odds = 5/4096; // 1/819
             }
          }
      }

      // Special cases
      if (gen === 'gen8' && methodId === 'dynamax_adventures') {
          odds = 1/100; // 1/300 -> 1/100 with charm
      }
      if (gen === 'gen9' && methodId === 'sandwich') {
          // Sandwich 3 adds 3 rolls. Base 1/4096 -> 4/4096 (1/1024).
          // Charm adds 2 rolls. Total 6 rolls?
          // Sandwich 3 + Charm: 1/683 (6/4096)
          odds = 1/683;
      }
  }

  // --- Sandwich Handling (Gen 9) ---
  if (hasSandwich && gen === 'gen9' && methodId !== 'sandwich') {
      // If we are combining Sandwich with other methods (like Outbreak)
      // Sandwich Lv3 adds 3 rolls.
      // Outbreak (60+) is 3 rolls (1/1365).
      // Charm adds 2 rolls.

      // Base (1) + Outbreak60 (+2) + Charm (+2) + Sandwich3 (+3) = 8 rolls?
      // 8/4096 = 1/512.

      let currentRolls = 1;
      if (methodId === 'outbreak') currentRolls += 2;
      if (hasCharm) currentRolls += 2;
      currentRolls += 3; // Sandwich

      odds = currentRolls / 4096;
  }

  const denom = Math.round(1 / odds);
  return { odds, text: `1 in ${denom}` };
}
