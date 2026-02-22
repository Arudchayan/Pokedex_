// Sound service for Pokemon cries and UI sounds
let audioEnabled = true;
const audioCache = new Map<string, HTMLAudioElement>();
const MAX_CACHE_SIZE = 50; // Optimization: Limit cache size to prevent memory leaks

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const toggleAudio = () => {
  audioEnabled = !audioEnabled;
  return audioEnabled;
};

export const isAudioEnabled = () => audioEnabled;

// Export for testing
export const getAudioCacheSize = () => audioCache.size;
export const resetCache = () => audioCache.clear();

/**
 * Play a Pokemon cry sound
 * Uses the PokeAPI cry endpoint
 */
export const playPokemonCry = (pokemonId: number) => {
  if (!audioEnabled) return;

  try {
    const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`;
    
    // Check cache first
    let audio = audioCache.get(cryUrl);
    
    if (audio) {
      // Refresh LRU status: move to end of Map
      audioCache.delete(cryUrl);
      audioCache.set(cryUrl, audio);
    } else {
      // Optimization: Evict oldest if cache is full
      if (audioCache.size >= MAX_CACHE_SIZE) {
        // Map iterates in insertion order, so the first key is the oldest
        const oldestKey = audioCache.keys().next().value;
        if (oldestKey) {
            audioCache.delete(oldestKey);
        }
      }

      audio = new Audio(cryUrl);
      audio.volume = 0.3; // Lower volume for better UX
      audioCache.set(cryUrl, audio);
    }
    
    // Reset and play
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silently fail if audio can't play (e.g., user hasn't interacted with page yet)
    });
  } catch (error) {
    // Silently fail - audio is not critical
    console.debug('Could not play Pokemon cry', error);
  }
};

/**
 * Play UI sound effects
 */
export const playUISound = (soundType: 'click' | 'success' | 'error' | 'whoosh') => {
  if (!audioEnabled) return;

  // Create simple audio feedback using Web Audio API
  try {
    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    switch (soundType) {
      case 'click':
        oscillator.frequency.value = 800;
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
      case 'success':
        oscillator.frequency.value = 600;
        oscillator.start(audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'error':
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'whoosh':
        oscillator.frequency.value = 1000;
        oscillator.start(audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
    }
  } catch (error) {
    // Silently fail
    console.debug('Could not play UI sound', error);
  }
};

export default {
  playPokemonCry,
  playUISound,
  toggleAudio,
  isAudioEnabled,
  getAudioCacheSize,
  resetCache,
};
