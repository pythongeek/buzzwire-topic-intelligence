import type { FreshnessScore, LifecycleStage } from '@/types';
import { DECAY_CONSTANTS, LIFECYCLE_HOURS, LIFECYCLE_MULTIPLIERS } from './weights';

/**
 * Freshness Score Module
 * Based on time-decay models with momentum tracking
 * 
 * Implements exponential decay with momentum bonuses
 */

export interface FreshnessInputs {
  topicAgeHours: number;           // How old is this topic
  emergenceTime: Date;            // When did it first appear
  volumeHistory: number[];         // Volume at different time points
  topicType: 'breaking_news' | 'daily_news' | 'trend' | 'evergreen';
  currentVolume: number;
  previousVolume?: number;         // Volume from previous period
}

export function calculateFreshnessScore(inputs: FreshnessInputs): FreshnessScore {
  const { hoursSinceEmergence, momentumBonus, decayConstant } = calculateDecay(inputs);
  const stage = calculateLifecycleStage(inputs.topicAgeHours);
  const projectedPeak = calculateProjectedPeak(inputs);

  // Base score from decay function
  const baseScore = 100 * Math.exp(-decayConstant * hoursSinceEmergence);

  // Apply momentum bonus if volume is increasing
  const scoreWithMomentum = baseScore * momentumBonus;

  // Apply lifecycle stage multiplier
  const lifecycleMultiplier = LIFECYCLE_MULTIPLIERS[stage];
  const finalScore = scoreWithMomentum * lifecycleMultiplier;

  return {
    score: Math.min(100, Math.max(0, Math.round(finalScore))),
    hoursSinceEmergence: Math.round(hoursSinceEmergence * 10) / 10,
    momentumBonus: Math.round(momentumBonus * 100) / 100,
    decayConstant,
    projectedPeak,
  };
}

function calculateDecay(inputs: FreshnessInputs): {
  hoursSinceEmergence: number;
  momentumBonus: number;
  decayConstant: number;
} {
  const hoursSinceEmergence = inputs.topicAgeHours;
  
  // Select decay constant based on topic type
  let decayConstant: number;
  switch (inputs.topicType) {
    case 'breaking_news':
      decayConstant = DECAY_CONSTANTS.breaking_news;
      break;
    case 'daily_news':
      decayConstant = DECAY_CONSTANTS.daily_news;
      break;
    case 'trend':
      decayConstant = DECAY_CONSTANTS.trend;
      break;
    case 'evergreen':
    default:
      decayConstant = DECAY_CONSTANTS.evergreen;
  }

  // Calculate momentum bonus
  let momentumBonus = 1.0;
  if (inputs.previousVolume && inputs.currentVolume) {
    const volumeRatio = inputs.currentVolume / inputs.previousVolume;
    if (volumeRatio > 1.5) {
      // Volume growing significantly
      momentumBonus = 1.5;
    } else if (volumeRatio > 1.2) {
      momentumBonus = 1.2;
    } else if (volumeRatio < 0.8) {
      // Volume declining
      momentumBonus = 0.8;
    }
  }

  return { hoursSinceEmergence, momentumBonus, decayConstant };
}

export function calculateLifecycleStage(hoursSinceEmergence: number): LifecycleStage {
  if (hoursSinceEmergence < LIFECYCLE_HOURS.emergence) {
    return 'emergence';
  } else if (hoursSinceEmergence < LIFECYCLE_HOURS.acceleration) {
    return 'acceleration';
  } else if (hoursSinceEmergence < LIFECYCLE_HOURS.peak) {
    return 'peak';
  } else if (hoursSinceEmergence < LIFECYCLE_HOURS.decay) {
    return 'decay';
  } else {
    return 'evergreen';
  }
}

function calculateProjectedPeak(inputs: FreshnessInputs): Date | null {
  const { volumeHistory, topicType, topicAgeHours } = inputs;

  if (volumeHistory.length < 2) {
    // Not enough data to project
    return null;
  }

  // Simple projection based on decay rate
  // Peak is typically at emergence/acceleration boundary for trending topics
  if (topicType === 'breaking_news' || topicType === 'trend') {
    // For fast-moving topics, peak is soon
    const hoursToPeak = Math.max(2, 12 - (topicAgeHours * 0.2));
    if (topicAgeHours < hoursToPeak) {
      return new Date(Date.now() + hoursToPeak * 60 * 60 * 1000);
    }
  }

  // For evergreen or established topics, no clear peak
  return null;
}

export function getFreshnessAdvice(stage: LifecycleStage, hoursSinceEmergence: number): string {
  switch (stage) {
    case 'emergence':
      return `Publish NOW - topic is fresh with maximum visibility potential (${hoursSinceEmergence.toFixed(1)}h old)`;
    case 'acceleration':
      return `Publish soon - momentum building, optimal window remaining`;
    case 'peak':
      return `Act fast - peak visibility approaching, competition intensifying`;
    case 'decay':
      return `Consider long-tail angle or pivot - mainstream interest declining`;
    case 'evergreen':
      return `Stable topic - time-insensitive, focus on quality over timing`;
  }
}

export function calculateTimeDecayFactor(
  hoursSincePublication: number,
  decayConstant: number
): number {
  return Math.exp(-decayConstant * hoursSincePublication);
}

export function estimateHalfLife(decayConstant: number): number {
  // Half-life = ln(2) / decay_constant
  return Math.log(2) / decayConstant;
}
