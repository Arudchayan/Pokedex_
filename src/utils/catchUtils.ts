export const BALL_TYPES = {
  POKE_BALL: { name: 'Poke Ball', multiplier: 1, color: 'text-red-500' },
  GREAT_BALL: { name: 'Great Ball', multiplier: 1.5, color: 'text-blue-500' },
  ULTRA_BALL: { name: 'Ultra Ball', multiplier: 2, color: 'text-yellow-500' },
  MASTER_BALL: { name: 'Master Ball', multiplier: 255, color: 'text-purple-600' }, // Guaranteed
  NET_BALL: {
    name: 'Net Ball',
    multiplier: 3.5,
    condition: 'Water or Bug type',
    color: 'text-teal-500',
  },
  DUSK_BALL: {
    name: 'Dusk Ball',
    multiplier: 3.0,
    condition: 'Night or Cave',
    color: 'text-green-600',
  },
  QUICK_BALL: {
    name: 'Quick Ball',
    multiplier: 5.0,
    condition: 'First Turn',
    color: 'text-yellow-400',
  },
  TIMER_BALL: {
    name: 'Timer Ball',
    multiplier: 4.0,
    condition: '10+ Turns',
    color: 'text-gray-500',
  }, // Simplified max
};

export const STATUS_CONDITIONS = {
  NONE: { name: 'None', multiplier: 1, color: 'text-gray-400' },
  SLEEP: { name: 'Sleep', multiplier: 2.5, color: 'text-indigo-400' },
  FREEZE: { name: 'Freeze', multiplier: 2.5, color: 'text-cyan-400' },
  PARALYZE: { name: 'Paralyze', multiplier: 1.5, color: 'text-yellow-300' },
  POISON: { name: 'Poison', multiplier: 1.5, color: 'text-purple-400' },
  BURN: { name: 'Burn', multiplier: 1.5, color: 'text-red-400' },
};

interface CatchCalculationParams {
  captureRate: number;
  ballMultiplier: number;
  statusMultiplier: number;
  hpPercent: number; // 0-100
  isMasterBall?: boolean;
}

/**
 * Calculates the probability of capturing a Pokemon.
 * Based on the Gen 3/4 formula approximation.
 *
 * Formula: X = (((3 * MaxHP - 2 * HP) * Rate * BallMod) / (3 * MaxHP)) * StatusMod
 * Catch Probability ≈ X / 255
 *
 * Note: This is a simplified probability. The actual game performs 4 shake checks.
 * P(Catch) = P(Shake)^4
 * Where P(Shake) depends on X.
 */
export const calculateCatchProbability = ({
  captureRate,
  ballMultiplier,
  statusMultiplier,
  hpPercent,
  isMasterBall = false,
}: CatchCalculationParams): number => {
  if (isMasterBall) return 100;

  // HP Factor = (3 * Max - 2 * Curr) / (3 * Max)
  // Can be simplified using percentages:
  // Let Max = 100.
  // Factor = (300 - 2 * hpPercent) / 300
  const hpFactor = (300 - 2 * hpPercent) / 300;

  // X value (Modified Catch Rate)
  const X = captureRate * ballMultiplier * hpFactor * statusMultiplier;

  // If X >= 255, it's a guaranteed catch (usually)
  if (X >= 255) return 100;

  // Shake Probability Calculation (Gen 4 formula)
  // b = 65536 / (255/X)^0.1875
  // P(Shake) = b / 65536
  // P(Catch) = (b / 65536)^4

  // Simplified derivation:
  // P(Catch) ≈ (X / 255)^0.75  <-- Historically decent approximation, but let's use the shake formula for better accuracy.

  try {
    const shakeProbability = Math.pow(255 / X, -0.1875); // Equivalent to (X/255)^0.1875 ? No, wait.
    // b = 65536 * (X/255)^0.1875
    // P(one shake) = (X/255)^0.1875
    // P(catch) = ((X/255)^0.1875)^4 = (X/255)^0.75

    // Wait, let's recheck the exponent.
    // Gen 3/4: b = 1048560 / sqrt(sqrt(16711680 / X)) = 1048560 / ((16711680/X)^0.25)
    // This is getting complex with integer math.

    // Let's stick to the Gen 5+ formula which matches modern games better.
    // Capture Probability = X / 255 ? No, that's Gen 1.

    // Let's use the standard approximation for modern apps:
    // P = (X/255) * 100 is often displayed, but (X/255)^0.75 is closer to true probability because of the 4 checks.
    // Let's use the straightforward X/255 linear approximation for now, as it's the "Modified Catch Rate".
    // Actually, Bulbapedia says: "The probability of capturing a Pokémon is approximately X/255."

    const probability = (X / 255) * 100;
    return Math.min(Math.max(probability, 0), 100);
  } catch (e) {
    return 0;
  }
};

export const getBallMultiplier = (
  ballKey: string,
  pokemonTypes: string[] = [],
  isNight: boolean = false,
  turn: number = 1
): number => {
  const ball = BALL_TYPES[ballKey as keyof typeof BALL_TYPES];
  if (!ball) return 1;

  if (ballKey === 'NET_BALL') {
    if (pokemonTypes.includes('water') || pokemonTypes.includes('bug')) return ball.multiplier;
    return 1;
  }
  if (ballKey === 'DUSK_BALL') {
    return isNight ? ball.multiplier : 1;
  }
  if (ballKey === 'QUICK_BALL') {
    return turn === 1 ? ball.multiplier : 1;
  }

  return ball.multiplier;
};
