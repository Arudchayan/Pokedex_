import { get, set, del } from 'idb-keyval';
import { MAX_POKEMON_ID, POKEAPI_GRAPHQL_URL } from '../constants';
import { PokemonListItem, PokemonDetails, PokemonMove, PokemonForm, Item } from '../types';
import { logError, retryApiCall, isNetworkError } from '../utils/errorHandler';
import { sanitizeString, validateSafeNumber, sanitizeUrl, isSafeString, isSafeNumber, isSafeUrl } from '../utils/securityUtils';
import { scheduleIdleTask } from '../utils/scheduler';
import { logger } from '../utils/logger';
import fetchAllPokemonQuery from '../graphql/fetchAllPokemon.graphql?raw';
import getPokemonDetailsQuery from '../graphql/getPokemonDetails.graphql?raw';
import fetchMovesQuery from '../graphql/fetchMoves.graphql?raw';
import fetchItemsQuery from '../graphql/fetchItems.graphql?raw';
import type {
  FetchAllPokemonQuery,
  FetchMovesQuery,
  FetchItemsQuery,
  GetPokemonDetailsQuery
} from '../graphql/generated';

// --- Interfaces for GraphQL Response ---

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

// --- End Interfaces ---

const FLAVOR_TEXT_SANITIZATION_REGEX = /[\n\f]/g;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_TIMESTAMP_KEY = 'pokedex_master_list_timestamp';
const CACHE_KEY = 'pokedex_master_list_v1';
const MOVES_CACHE_KEY = 'pokedex_moves';
const MOVES_CACHE_TIMESTAMP_KEY = 'pokedex_moves_timestamp';
const ITEMS_CACHE_KEY = 'pokedex_items';
const ITEMS_CACHE_TIMESTAMP_KEY = 'pokedex_items_timestamp';

const EVOLUTION_ITEM_MAP: Record<number, string> = {
  198: "King's Rock",
  210: "Metal Coat",
  235: "Dragon Scale",
  237: "Up-Grade",
  211: "Deep Sea Scale",
  212: "Deep Sea Tooth",
  303: "Razor Claw",
  326: "Razor Fang",
  306: "Protector",
  307: "Electirizer",
  308: "Magmarizer",
  309: "Dubious Disc",
  310: "Reaper Cloth",
  519: "Prism Scale",
  624: "Sachet",
  625: "Whipped Dream",
};

const getShowdownName = (name: string): string => {
  return name.toLowerCase().replace(/[.':\s-]/g, '');
}

const parseGenSprites = (spritesJson: string | any): Record<string, { default: string; shiny?: string }> => {
  const genSprites: Record<string, { default: string; shiny?: string }> = {};

  try {
    const sprites = typeof spritesJson === 'string' ? JSON.parse(spritesJson) : spritesJson;
    if (!sprites || !sprites.versions) return genSprites;

    const versions = sprites.versions;

    // Helper to add if exists
    const addIfExist = (key: string, data: any) => {
      if (data && data.front_default) {
        genSprites[key] = {
          default: data.front_default,
          shiny: data.front_shiny || undefined
        };
      }
    };

    // Mapping relevant versions
    // Generation I
    if (versions['generation-i']) {
      addIfExist('Gen 1: Red/Blue', versions['generation-i']['red-blue']);
      addIfExist('Gen 1: Yellow', versions['generation-i']['yellow']);
    }
    // Generation II
    if (versions['generation-ii']) {
      addIfExist('Gen 2: Gold', versions['generation-ii']['gold']);
      addIfExist('Gen 2: Silver', versions['generation-ii']['silver']);
      addIfExist('Gen 2: Crystal', versions['generation-ii']['crystal']);
    }
    // Generation III
    if (versions['generation-iii']) {
      addIfExist('Gen 3: Ruby/Sapphire', versions['generation-iii']['ruby-sapphire']);
      addIfExist('Gen 3: Emerald', versions['generation-iii']['emerald']);
      addIfExist('Gen 3: FireRed/LeafGreen', versions['generation-iii']['firered-leafgreen']);
    }
    // Generation IV
    if (versions['generation-iv']) {
      addIfExist('Gen 4: Diamond/Pearl', versions['generation-iv']['diamond-pearl']);
      addIfExist('Gen 4: Platinum', versions['generation-iv']['platinum']);
      addIfExist('Gen 4: HeartGold/SoulSilver', versions['generation-iv']['heartgold-soulsilver']);
    }
    // Generation V
    if (versions['generation-v']) {
      addIfExist('Gen 5: Black/White', versions['generation-v']['black-white']);
    }
    // Generation VI
    if (versions['generation-vi']) {
      addIfExist('Gen 6: X/Y', versions['generation-vi']['x-y']);
      addIfExist('Gen 6: OmegaRuby/AlphaSapphire', versions['generation-vi']['omegaruby-alphasapphire']);
    }
    // Generation VII
    if (versions['generation-vii']) {
      addIfExist('Gen 7: UltraSun/UltraMoon', versions['generation-vii']['ultra-sun-ultra-moon']);
    }

    // Add modern styles as "generations" too for consistency in selector
    if (sprites.other) {
      if (sprites.other['official-artwork']) {
        addIfExist('Official Artwork', sprites.other['official-artwork']);
      }
      if (sprites.other['home']) {
        addIfExist('HOME', sprites.other['home']);
      }
    }

  } catch (e) {
    console.warn('Failed to parse gen sprites', e);
  }

  return genSprites;
};

const extractSpriteUrls = (pokemonId: number, pokemonName: string) => {
  const genericOfficialArt = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  const genericShinyOfficialArt = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemonId}.png`;
  const genericSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  const genericShinySprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`;

  const showdownName = getShowdownName(pokemonName);
  const showdownAnimated = `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`
  const shinyShowdownAnimated = `https://play.pokemonshowdown.com/sprites/ani-shiny/${showdownName}.gif`

  return {
    showdownUrl: showdownAnimated,
    shinyShowdownUrl: shinyShowdownAnimated,
    officialUrl: genericOfficialArt,
    shinyOfficialUrl: genericShinyOfficialArt,
    defaultUrl: genericSprite,
    shinyDefaultUrl: genericShinySprite,
  };
};


async function queryPokeAPI<T>(
  query: string,
  variables: Record<string, any> = {},
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  try {
    const timeoutSignal = AbortSignal.timeout(30000);
    const combinedSignal = options.signal
      ? (AbortSignal.any ? AbortSignal.any([options.signal, timeoutSignal]) : options.signal)
      : timeoutSignal;
    const response = await fetch(POKEAPI_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      // Add timeout
      signal: combinedSignal, // 30 second timeout
    });

    if (!response.ok) {
      const error = new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      logError(error, { endpoint: POKEAPI_GRAPHQL_URL, status: response.status });
      throw error;
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors) {
      logger.debug('GraphQL Errors:', json.errors);
      const error = new Error(`GraphQL Error: ${json.errors[0]?.message || 'Unknown error'}`);
      logError(error, { graphqlErrors: json.errors });
      throw error;
    }

    return json.data;
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      const timeoutError = new Error('Request timed out. Please try again.');
      logError(timeoutError, { context: 'API Timeout' });
      throw timeoutError;
    }

    // Handle network errors
    if (error instanceof Error && isNetworkError(error)) {
      const networkError = new Error('Network error. Please check your connection.');
      logError(networkError, { context: 'Network Error' });
      throw networkError;
    }

    throw error;
  }
}

export const isPokemonListItemValid = (data: any): data is PokemonListItem => {
  if (!data || typeof data !== 'object') return false;

  // Validate required primitives and safety
  if (typeof data.id !== 'number' || data.id === 0) return false;
  if (!isSafeString(data.name)) return false;

  if (!isSafeUrl(data.imageUrl)) return false;
  if (!isSafeUrl(data.shinyImageUrl)) return false;
  if (!isSafeString(data.flavorText)) return false;

  // Validate arrays
  if (!Array.isArray(data.types)) return false;
  for (const t of data.types) {
    if (!isSafeString(t)) return false;
  }

  // Validate stats
  if (!Array.isArray(data.stats)) return false;
  for (const s of data.stats) {
    if (!s || typeof s !== 'object') return false;
    if (!isSafeString(s.name)) return false;
    if (typeof s.value !== 'number') return false;
  }

  // Validate abilities
  if (!Array.isArray(data.abilities)) return false;
  for (const a of data.abilities) {
    if (!isSafeString(a)) return false;
  }

  if (data.bst !== undefined && typeof data.bst !== 'number') return false;

  if (data.nameLower !== undefined && !isSafeString(data.nameLower)) return false;
  if (data.flavorTextLower !== undefined && !isSafeString(data.flavorTextLower)) return false;

  if (data.abilitiesLower !== undefined) {
    if (!Array.isArray(data.abilitiesLower)) return false;
    for (const a of data.abilitiesLower) {
      if (!isSafeString(a)) return false;
    }
  }

  return true;
};

// Validator for PokemonListItem to ensure cache integrity
export const validatePokemonListItem = (data: any): PokemonListItem | null => {
  if (!data || typeof data !== 'object') return null;

  const id = validateSafeNumber(data.id);
  const name = sanitizeString(data.name);

  // Essential fields must be present
  if (!id || !name) return null;

  return {
    id,
    name,
    imageUrl: sanitizeUrl(data.imageUrl),
    shinyImageUrl: sanitizeUrl(data.shinyImageUrl),
    types: Array.isArray(data.types) ? data.types.map((t: any) => sanitizeString(String(t))) : [],
    flavorText: sanitizeString(data.flavorText),
    stats: Array.isArray(data.stats) ? data.stats.map((s: any) => ({
      name: sanitizeString(s.name),
      value: validateSafeNumber(s.value) || 0
    })) : [],
    abilities: Array.isArray(data.abilities) ? data.abilities.map((a: any) => sanitizeString(String(a))) : [],
    bst: validateSafeNumber(data.bst),
    nameLower: sanitizeString(data.nameLower),
    flavorTextLower: sanitizeString(data.flavorTextLower),
    abilitiesLower: Array.isArray(data.abilitiesLower) ? data.abilitiesLower.map((a: any) => sanitizeString(String(a))) : []
  };
};

export const fetchAllPokemons = async (signal?: AbortSignal): Promise<PokemonListItem[]> => {
  try {
    const cached = await get(CACHE_KEY);
    const cachedTimestamp = await get(CACHE_TIMESTAMP_KEY);

    let isCacheValid = false;

    // Check TTL
    if (cachedTimestamp) {
      const timestamp = typeof cachedTimestamp === 'number' ? cachedTimestamp : parseInt(cachedTimestamp, 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < CACHE_TTL) {
        isCacheValid = true;
      } else {
        logger.debug('Cache expired, refetching...');
      }
    }

    if (cached && isCacheValid) {
      const parsed = cached;
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate cached data to prevent corrupted state
        let validated: PokemonListItem[] = parsed;
        let isValid = true;
        for (const item of parsed) {
          if (!isPokemonListItemValid(item)) {
            isValid = false;
            break;
          }
        }

        if (!isValid) {
          validated = parsed.map(validatePokemonListItem).filter((p): p is PokemonListItem => p !== null);
        }

        // If validation preserves most of the list, use it.
        // If we lost items (validated.length < parsed.length), it means cache was corrupted.
        // However, slight corruption shouldn't block app start, but severe corruption should trigger refetch.
        // Here we'll be strict: if ANY item is invalid, or if the list is empty, refetch.
        // This ensures the "master list" is always 100% correct.
        if (validated.length === parsed.length && validated.length > 0) {
          return validated;
        } else {
          console.warn(`Cache corrupted: ${parsed.length - validated.length} invalid items found. Refetching.`);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load pokemon list from cache', e);
  }

  // Use retry logic for fetching all Pokemon
  const data = await retryApiCall(
    () => queryPokeAPI<FetchAllPokemonQuery>(fetchAllPokemonQuery, { limit: MAX_POKEMON_ID }, { signal }),
    3, // max 3 retries
    2000 // start with 2s delay
  );

  const processed = data.pokemon_v2_pokemon.filter(p => {
    // Basic validation to prevent crashes from malformed data
    const isValidId = validateSafeNumber(p.id);
    const isValidName = sanitizeString(p.name);
    // Ensure critical arrays exist
    const hasTypes = Array.isArray(p.pokemon_v2_pokemontypes);
    const hasStats = Array.isArray(p.pokemon_v2_pokemonstats);

    if (!isValidId || !isValidName || !hasTypes || !hasStats) {
      console.warn(`Sentinel: Skipping invalid pokemon ID: ${p.id}`);
      return false;
    }
    return true;
  }).map(p => {
    // Optimization: Directly construct Showdown URLs to avoid parsing JSON sprites for every Pokemon
    // We only fetch ID to check existence, saving bandwidth by avoiding the large 'sprites' JSON string
    const hasSprites = p.pokemon_v2_pokemonsprites && p.pokemon_v2_pokemonsprites.length > 0;
    let showdownUrl, shinyShowdownUrl;
    if (hasSprites) {
      const showdownName = getShowdownName(p.name);
      showdownUrl = `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;
      shinyShowdownUrl = `https://play.pokemonshowdown.com/sprites/ani-shiny/${showdownName}.gif`;
    }

    const genericSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
    const genericShinySprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${p.id}.png`;
    const flavorText = p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspeciesflavortexts?.[0]?.flavor_text?.replace(FLAVOR_TEXT_SANITIZATION_REGEX, ' ') || '';
    const stats = p.pokemon_v2_pokemonstats.map(s => ({ name: s.pokemon_v2_stat?.name || 'unknown', value: s.base_stat }));
    const types = p.pokemon_v2_pokemontypes.map((t) => t.pokemon_v2_type?.name || 'unknown');
    const bst = stats.reduce((sum, stat) => sum + stat.value, 0);

    return {
      id: p.id,
      name: p.name,
      imageUrl: showdownUrl || genericSprite,
      shinyImageUrl: shinyShowdownUrl || genericShinySprite,
      types,
      flavorText: flavorText,
      stats: stats,
      bst: bst,
      abilities: (p.pokemon_v2_pokemonabilities || []).map(a => a.pokemon_v2_ability?.name || 'unknown'),
      // Optimization: Pre-compute lowercased values for filtering
      nameLower: p.name.toLowerCase(),
      flavorTextLower: flavorText.toLowerCase(),
      abilitiesLower: (p.pokemon_v2_pokemonabilities || []).map(a => a.pokemon_v2_ability?.name.toLowerCase() || 'unknown'),
    }
  });

  scheduleIdleTask(async () => {
    try {
      await set(CACHE_KEY, processed);
      await set(CACHE_TIMESTAMP_KEY, Date.now());
    } catch (e) {
      console.warn('Failed to cache pokemon list', e);
    }
  });

  return processed;
};

export interface Move {
  id: number;
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}

// Item type is now defined in src/types.ts and imported above.
// Re-export for backwards compatibility with existing consumers.
export type { Item } from '../types';

export const isMoveValid = (data: any): data is Move => {
  if (!data || typeof data !== 'object') return false;

  if (typeof data.id !== 'number' || data.id === 0) return false;
  if (!isSafeString(data.name)) return false;

  if (data.type && !isSafeString(data.type)) return false;
  if (data.category && !isSafeString(data.category)) return false;

  if (data.power !== null && (typeof data.power !== 'number' || !isSafeNumber(data.power, 0, 1000))) return false;
  if (data.accuracy !== null && (typeof data.accuracy !== 'number' || !isSafeNumber(data.accuracy, 0, 100))) return false;

  if (typeof data.pp !== 'number' || !isSafeNumber(data.pp, 0, 100)) return false;

  return true;
};

export const isItemValid = (data: any): data is Item => {
  if (!data || typeof data !== 'object') return false;

  if (typeof data.id !== 'number' || data.id === 0) return false;
  if (!isSafeString(data.name)) return false;

  if (typeof data.cost !== 'number') return false;
  if (!isSafeString(data.flavorText)) return false;
  if (!isSafeUrl(data.imageUrl)) return false;

  return true;
};
const validateMove = (data: any): Move | null => {
  if (!data || typeof data !== 'object') return null;
  const id = validateSafeNumber(data.id);
  const name = sanitizeString(data.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    type: sanitizeString(data.type) || 'normal',
    category: sanitizeString(data.category) || 'status',
    power: validateSafeNumber(data.power, 0, 1000) ?? null,
    accuracy: validateSafeNumber(data.accuracy, 0, 100) ?? null,
    pp: validateSafeNumber(data.pp, 0, 100) || 0,
  };
};

const validateItem = (data: any): Item | null => {
  if (!data || typeof data !== 'object') return null;
  const id = validateSafeNumber(data.id);
  const name = sanitizeString(data.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    cost: validateSafeNumber(data.cost) || 0,
    flavorText: sanitizeString(data.flavorText),
    imageUrl: sanitizeUrl(data.imageUrl),
    nameLower: data.nameLower || name.toLowerCase(),
  };
};

export const fetchAllMoves = async (): Promise<Move[]> => {
  // Basic caching
  try {
    const cached = await get(MOVES_CACHE_KEY);
    const cachedTimestamp = await get(MOVES_CACHE_TIMESTAMP_KEY);

    let isCacheValid = false;
    if (cachedTimestamp) {
      const timestamp = typeof cachedTimestamp === 'number' ? cachedTimestamp : parseInt(cachedTimestamp, 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < CACHE_TTL) {
        isCacheValid = true;
      } else {
        logger.debug('Moves cache expired, refetching...');
      }
    }

    if (cached && isCacheValid) {
      const parsed = cached;
      if (Array.isArray(parsed)) {
        let validated: Move[] = parsed;
        let isValid = true;
        for (const item of parsed) {
          if (!isMoveValid(item)) {
            isValid = false;
            break;
          }
        }

        if (!isValid) {
          validated = parsed.map(validateMove).filter((m): m is Move => m !== null);
        }
        if (validated.length > 0) return validated;
        // If validation resulted in empty array (all invalid), treat as corrupted
        console.warn('Cached moves failed validation, refetching...');
        await del(MOVES_CACHE_KEY);
      }
    }
  } catch (e) {
    console.warn('Corrupted moves cache, refetching...', e);
    await del(MOVES_CACHE_KEY);
  }

  try {
    const data = await queryPokeAPI<FetchMovesQuery>(fetchMovesQuery);
    const moves = data.pokemon_v2_move.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.pokemon_v2_type?.name || 'normal',
      category: m.pokemon_v2_movedamageclass?.name || 'status',
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp
    })).map(validateMove).filter((m: Move | null): m is Move => m !== null);

    scheduleIdleTask(async () => {
      try {
        await set(MOVES_CACHE_KEY, moves);
        await set(MOVES_CACHE_TIMESTAMP_KEY, Date.now());
      } catch (e) {
        console.error('Failed to cache moves', e);
      }
    });
    return moves;
  } catch (e) {
    console.error("Failed to fetch moves", e);
    return [];
  }
};

export const fetchAllItems = async (): Promise<Item[]> => {
  try {
    const cached = await get(ITEMS_CACHE_KEY);
    const cachedTimestamp = await get(ITEMS_CACHE_TIMESTAMP_KEY);

    let isCacheValid = false;
    if (cachedTimestamp) {
      const timestamp = typeof cachedTimestamp === 'number' ? cachedTimestamp : parseInt(cachedTimestamp, 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < CACHE_TTL) {
        isCacheValid = true;
      } else {
        logger.debug('Items cache expired, refetching...');
      }
    }

    if (cached && isCacheValid) {
      const parsed = cached;
      if (Array.isArray(parsed)) {
        let validated: Item[] = parsed;
        let isValid = true;
        for (const item of parsed) {
          if (!isItemValid(item)) {
            isValid = false;
            break;
          }
        }

        if (!isValid) {
          validated = parsed.map(validateItem).filter((i): i is Item => i !== null);
        }
        if (validated.length > 0) return validated;
        console.warn('Cached items failed validation, refetching...');
        await del(ITEMS_CACHE_KEY);
      }
    }
  } catch (e) {
    console.warn('Corrupted items cache, refetching...', e);
    await del(ITEMS_CACHE_KEY);
  }

  try {
    const data = await queryPokeAPI<FetchItemsQuery>(fetchItemsQuery);
    const items: Item[] = [];
    for (const i of data.pokemon_v2_item) {
      const itemData = {
        id: i.id,
        name: i.name,
        cost: i.cost || 0,
        flavorText: i.pokemon_v2_itemflavortexts?.[0]?.flavor_text || '',
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${i.name}.png`
      };
      const validated = validateItem(itemData);
      if (validated) {
        items.push(validated);
      }
    }

    scheduleIdleTask(async () => {
      try {
        await set(ITEMS_CACHE_KEY, items);
        await set(ITEMS_CACHE_TIMESTAMP_KEY, Date.now());
      } catch (e) {
        console.error('Failed to cache items', e);
      }
    });
    return items;
  } catch (e) {
    console.error("Failed to fetch items", e);
    return [];
  }
};

export const fetchPokemonDetails = async (id: number): Promise<PokemonDetails | null> => {
  const data = await queryPokeAPI<GetPokemonDetailsQuery>(
    getPokemonDetailsQuery,
    { id }
  );

  const species = data.pokemon_v2_pokemonspecies[0];
  if (!species) return null;

  const defaultPokemon = species.pokemon_v2_pokemons.find((p) => p.is_default) || species.pokemon_v2_pokemons[0];
  if (!defaultPokemon) return null;

  const flavorText = species?.pokemon_v2_pokemonspeciesflavortexts[0]?.flavor_text?.replace(FLAVOR_TEXT_SANITIZATION_REGEX, ' ') || 'No description available.';

  const moves: PokemonMove[] = (defaultPokemon.pokemon_v2_pokemonmoves || []).map((m) => ({
    name: m.pokemon_v2_move?.name?.replace(/-/g, ' ') || 'Unknown Move',
    type: m.pokemon_v2_move?.pokemon_v2_type?.name || 'normal',
    power: m.pokemon_v2_move?.power,
    accuracy: m.pokemon_v2_move?.accuracy,
    pp: m.pokemon_v2_move?.pp,
    priority: m.pokemon_v2_move?.priority || 0,
    damageClass: m.pokemon_v2_move?.pokemon_v2_movedamageclass?.name || 'status',
    learnMethod: m.pokemon_v2_movelearnmethod?.name?.replace(/-/g, ' ') || 'Unknown',
    level: m.level,
  }));

  const forms = species.pokemon_v2_pokemons.map((p): PokemonForm => {
    const { officialUrl, shinyOfficialUrl } = extractSpriteUrls(p.id, p.name);

    let formName = p.name.replace(species.name, '').trim();
    if (formName.startsWith('-')) formName = formName.substring(1);
    if (formName === '') formName = 'Default';

    return {
      id: p.id,
      name: p.name,
      formName: formName.replace(/-/g, ' '),
      isDefault: p.is_default,
      types: p.pokemon_v2_pokemontypes.map((t) => t.pokemon_v2_type?.name || 'unknown'),
      imageUrl: officialUrl,
      shinyImageUrl: shinyOfficialUrl,
      height: p.height,
      weight: p.weight,
      stats: (p.pokemon_v2_pokemonstats || []).map((s) => ({ name: s.pokemon_v2_stat?.name || 'unknown', value: s.base_stat })),
      abilities: (p.pokemon_v2_pokemonabilities || []).map((a) => ({ name: a.pokemon_v2_ability?.name || 'unknown' })),
    }
  });

  const defaultForm = forms.find(f => f.isDefault) || forms[0];

  const {
    showdownUrl, shinyShowdownUrl,
    officialUrl, shinyOfficialUrl,
    defaultUrl, shinyDefaultUrl
  } = extractSpriteUrls(defaultPokemon.id, defaultPokemon.name);

  const spritesBlob = defaultPokemon.pokemon_v2_pokemonsprites?.[0]?.sprites;
  const genSprites = spritesBlob ? parseGenSprites(spritesBlob) : {};

  return {
    id: defaultPokemon.id,
    name: species.name, // Use the base species name for consistency
    imageUrl: showdownUrl || defaultUrl,
    shinyImageUrl: shinyShowdownUrl || shinyDefaultUrl,
    detailImageUrl: officialUrl,
    shinyDetailImageUrl: shinyOfficialUrl,
    types: defaultForm.types,
    height: defaultForm.height,
    weight: defaultForm.weight,
    stats: defaultForm.stats,
    abilities: defaultForm.abilities,
    genSprites: genSprites,
    evolutionChain: species?.pokemon_v2_evolutionchain?.pokemon_v2_pokemonspecies?.map((e) => {
      const { officialUrl: evoOfficial, defaultUrl: evoSprite } = extractSpriteUrls(e.id, e.name);

      // Extract evolution details
      const evoDetails = e.pokemon_v2_pokemonevolutions[0];
      let trigger = evoDetails?.pokemon_v2_evolutiontrigger?.name;
      const minLevel = evoDetails?.min_level;
      const item = evoDetails?.pokemon_v2_item?.name;
      const heldItemId = evoDetails?.held_item_id;
      const heldItem = heldItemId ? (EVOLUTION_ITEM_MAP[heldItemId] || `Item ${heldItemId}`) : undefined;
      const timeOfDay = evoDetails?.time_of_day;
      const knownMove = evoDetails?.pokemon_v2_move?.name;
      const minHappiness = evoDetails?.min_happiness;
      const location = evoDetails?.pokemon_v2_location?.name;

      if (trigger === 'level-up' && !minLevel && !minHappiness && !knownMove && !location && !timeOfDay && !heldItemId) {
        // Sometimes level-up is default but condition is hidden or it's base form
        if (e.id !== species.pokemon_v2_evolutionchain.pokemon_v2_pokemonspecies[0].id) {
          trigger = 'Special Condition';
        } else {
          trigger = undefined; // Base form
        }
      }

      return {
        id: e.id,
        name: e.name,
        imageUrl: evoOfficial || evoSprite,
        trigger: trigger?.replace(/-/g, ' '),
        minLevel: minLevel,
        item: item?.replace(/-/g, ' '),
        heldItem: heldItem,
        timeOfDay: timeOfDay,
        knownMove: knownMove?.replace(/-/g, ' '),
        minHappiness: minHappiness,
        location: location?.replace(/-/g, ' '),
        evolvesFromId: e.evolves_from_species_id
      };
    }) || [],
    color: species?.pokemon_v2_pokemoncolor?.name || 'gray',
    habitat: species?.pokemon_v2_pokemonhabitat?.name || 'Unknown',
    captureRate: species?.capture_rate,
    baseHappiness: species?.base_happiness,
    genderRate: species?.gender_rate,
    genus: species?.pokemon_v2_pokemonspeciesnames[0]?.genus || 'Unknown',
    flavorText: flavorText,
    weaknesses: [], // Will be calculated on the client
    eggGroups: species?.pokemon_v2_pokemonegggroups?.map((g) => g.pokemon_v2_egggroup?.name || 'Unknown') || [],
    growthRate: species?.pokemon_v2_growthrate?.name?.replace(/-/g, ' ') || 'Unknown',
    shape: species?.pokemon_v2_pokemonshape?.name || 'Unknown',
    moves: moves,
    forms: forms
  };
};
