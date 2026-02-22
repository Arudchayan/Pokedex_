// Mulberry32 is a simple and fast 32-bit PRNG
export function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// Convert date string (YYYY-MM-DD) to integer seed
export function dateToSeed(dateString: string): number {
    // simple hash of the date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Helper to get today's date string in YYYY-MM-DD format
export function getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper to pick a random item from array using the seeded RNG
export function pickRandom<T>(array: T[], rng: () => number): T {
    const index = Math.floor(rng() * array.length);
    return array[index];
}
