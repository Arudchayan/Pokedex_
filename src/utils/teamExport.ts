import { PokemonListItem, TeamMember } from '../types';
import { sanitizeString, MAX_INPUT_LENGTH } from './securityUtils';

// Mapping from API stat names to Showdown stat names
const STAT_NAME_MAP: Record<string, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

// Mapping from Showdown stat names to API stat names (Reverse map)
const SHOWDOWN_STAT_MAP: Record<string, string> = {
  HP: 'hp',
  Atk: 'attack',
  Def: 'defense',
  SpA: 'special-attack',
  SpD: 'special-defense',
  Spe: 'speed',
};

const clampStatValue = (raw: string, min: number, max: number): number | null => {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
};

export const exportToShowdown = (team: TeamMember[]): string => {
  if (!team || team.length === 0) return '';

  return team
    .map((pokemon) => {
      // 1. Name & Item
      let header = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
      if (pokemon.selectedItem) {
        header += ` @ ${pokemon.selectedItem}`;
      }
      let exportText = header;

      // 2. Ability
      if (pokemon.selectedAbility) {
        exportText += `\nAbility: ${pokemon.selectedAbility}`;
      }

      // 3. Shiny
      const isShiny =
        pokemon.isShiny || (pokemon.shinyImageUrl && pokemon.imageUrl === pokemon.shinyImageUrl);
      if (isShiny) {
        exportText += `\nShiny: Yes`;
      }

      // 4. EVs
      if (pokemon.evs) {
        const evsParts: string[] = [];
        // Standard order: HP, Atk, Def, SpA, SpD, Spe
        const statOrder = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

        statOrder.forEach((statKey) => {
          const val = pokemon.evs?.[statKey];
          if (val && val > 0) {
            evsParts.push(`${val} ${STAT_NAME_MAP[statKey]}`);
          }
        });

        if (evsParts.length > 0) {
          exportText += `\nEVs: ${evsParts.join(' / ')}`;
        }
      }

      // 5. Nature
      if (pokemon.selectedNature) {
        exportText += `\n${pokemon.selectedNature} Nature`;
      }

      // 6. IVs
      if (pokemon.ivs) {
        const ivsParts: string[] = [];
        const statOrder = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
        let hasIVs = false;

        statOrder.forEach((statKey) => {
          const val = pokemon.ivs?.[statKey];
          // Showdown only lists IVs if they are NOT 31 (default)
          if (val !== undefined && val !== 31) {
            ivsParts.push(`${val} ${STAT_NAME_MAP[statKey]}`);
            hasIVs = true;
          }
        });

        if (hasIVs) {
          exportText += `\nIVs: ${ivsParts.join(' / ')}`;
        }
      }

      // 7. Moves
      if (pokemon.selectedMoves && pokemon.selectedMoves.length > 0) {
        pokemon.selectedMoves.forEach((move) => {
          if (move) {
            exportText += `\n- ${move}`;
          }
        });
      }

      return exportText;
    })
    .join('\n\n');
};

export const exportTeamToClipboard = async (team: TeamMember[]): Promise<boolean> => {
  try {
    const text = exportToShowdown(team);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy team: ', err);
    return false;
  }
};

// Pre-compute clean name map for O(1) lookup
const createPokemonMap = (masterList: PokemonListItem[]): Map<string, PokemonListItem> => {
  const map = new Map<string, PokemonListItem>();
  masterList.forEach((p) => {
    const cleanName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    map.set(cleanName, p);
  });
  return map;
};

export const importFromShowdown = (text: string, masterList: PokemonListItem[]): TeamMember[] => {
  if (!text || !masterList) return [];

  // SECURITY: Truncate input to prevent DoS via massive strings
  // 50KB is enough for > 100 Pokemon in Showdown format
  const safeText = text.length > MAX_INPUT_LENGTH ? text.substring(0, MAX_INPUT_LENGTH) : text;

  // Normalize line endings
  const normalizedText = safeText.replace(/\r\n/g, '\n');

  // Split by double newline to separate Pokemon
  // But strictly, Showdown export uses double newlines between sets.
  const blocks = normalizedText.split(/\n\s*\n/);

  const foundTeam: TeamMember[] = [];
  const pokemonMap = createPokemonMap(masterList);

  let processedCount = 0;

  for (const block of blocks) {
    if (!block.trim()) continue;
    if (processedCount >= 6) break; // Limit to 6 Pokemon usually, but let caller decide.
    // Safety limits: keep parsing bounded to prevent DoS.
    if (foundTeam.length >= 20) break; // Hard limit for safety

    const lines = block.split('\n');
    if (lines.length === 0) continue;

    // --- Parse Header (Name @ Item) ---
    const headerLine = lines[0].trim();
    let namePart = headerLine;
    let itemPart: string | undefined = undefined;

    if (headerLine.includes('@')) {
      const parts = headerLine.split('@');
      namePart = parts[0].trim();
      itemPart = parts[1].trim();
    }

    // Sanitize item if present
    if (itemPart) itemPart = sanitizeString(itemPart);

    // Handle Nicknames / Gender: "Nickname (Species) (M)"
    let speciesName = namePart;

    // ReDoS Prevention: Use a safer, non-greedy regex or string parsing
    // Old: /(.*)\s\((.*)\)/ which is greedy and potentially slow
    // New strategy: Check for " (Species)" or " (M)" at the end explicitly
    // Since names can have spaces, but parenthesis are usually at the end.

    // Simplest safe approach: LastIndexOf '('
    const lastParenIndex = namePart.lastIndexOf(' (');

    if (lastParenIndex > 0 && namePart.endsWith(')')) {
      const contentInsideParens = namePart.substring(lastParenIndex + 2, namePart.length - 1);
      const nameBeforeParens = namePart.substring(0, lastParenIndex);

      if (['M', 'F', 'm', 'f'].includes(contentInsideParens)) {
        // "Pikachu (M)" - nameBeforeParens is the species
        // But check if there's another level of nesting? "Sparky (Pikachu) (M)"
        // Showdown format: Nickname (Species) (Gender) @ Item
        // If we stripped @ Item, we have "Sparky (Pikachu) (M)"

        const secondParenIndex = nameBeforeParens.lastIndexOf(' (');
        if (secondParenIndex > 0 && nameBeforeParens.endsWith(')')) {
          // "Sparky (Pikachu)"
          const species = nameBeforeParens.substring(
            secondParenIndex + 2,
            nameBeforeParens.length - 1
          );
          speciesName = species;
        } else {
          // "Pikachu (M)"
          speciesName = nameBeforeParens;
        }
      } else {
        // "Sparky (Pikachu)" - content is species
        speciesName = contentInsideParens;
      }
    }

    // Clean up if we missed something (fallback)
    if (speciesName.endsWith('(M)') || speciesName.endsWith('(F)')) {
      speciesName = speciesName.substring(0, speciesName.length - 3).trim();
    }

    const basePokemon = findPokemonInMap(speciesName, pokemonMap);
    if (!basePokemon) continue;

    const member: TeamMember = {
      ...basePokemon,
      selectedItem: itemPart,
      selectedMoves: [],
      evs: {},
      ivs: {},
    };

    // --- Parse Body ---
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('Ability:')) {
        member.selectedAbility = sanitizeString(line.substring(8).trim());
      } else if (line.startsWith('Shiny:')) {
        if (line.toLowerCase().includes('yes')) {
          member.imageUrl = member.shinyImageUrl;
          member.isShiny = true;
        }
      } else if (line.startsWith('EVs:')) {
        const evsText = line.substring(4).trim(); // "252 Atk / 4 SpD / 252 Spe"
        const parts = evsText.split('/');
        parts.forEach((part) => {
          const [valStr, statName] = part.trim().split(' ');
          const apiStat = SHOWDOWN_STAT_MAP[statName];
          const safeVal = clampStatValue(valStr, 0, 252);
          if (apiStat && safeVal !== null) {
            member.evs = member.evs || {};
            member.evs[apiStat] = safeVal;
          }
        });
      } else if (line.startsWith('IVs:')) {
        const ivsText = line.substring(4).trim();
        const parts = ivsText.split('/');
        parts.forEach((part) => {
          const [valStr, statName] = part.trim().split(' ');
          const apiStat = SHOWDOWN_STAT_MAP[statName];
          const safeVal = clampStatValue(valStr, 0, 31);
          if (apiStat && safeVal !== null) {
            member.ivs = member.ivs || {};
            member.ivs[apiStat] = safeVal;
          }
        });
      } else if (line.endsWith('Nature')) {
        // "Adamant Nature"
        const natureName = line.split(' ')[0];
        member.selectedNature = sanitizeString(natureName);
      } else if (line.startsWith('-')) {
        const moveName = line.substring(1).trim();
        member.selectedMoves?.push(sanitizeString(moveName));
      }
    }

    foundTeam.push(member);
    processedCount++;
  }

  return foundTeam;
};

const findPokemonInMap = (
  name: string,
  map: Map<string, PokemonListItem>
): PokemonListItem | undefined => {
  // Try exact match first
  let p = map.get(name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  if (p) return p;

  // Unknown name after normalization.
  return undefined;
};
