/**
 * Scoring Engine Weights Configuration
 * Adjust these based on your content strategy priorities
 */

export const SCORING_WEIGHTS = {
  virality: 0.25,
  competitive: 0.25,
  freshness: 0.20,
  authority: 0.15,
  engagement: 0.15,
} as const;

export const TOPIC_TYPE_MULTIPLIERS = {
  breaking_news: { virality: 0.30, freshness: 0.35, authority: 0.20 },
  technology: { virality: 0.25, freshness: 0.20, authority: 0.25 },
  business: { virality: 0.20, freshness: 0.25, authority: 0.30 },
  entertainment: { virality: 0.35, freshness: 0.20, authority: 0.15 },
  sports: { virality: 0.30, freshness: 0.25, authority: 0.15 },
  health: { virality: 0.20, freshness: 0.20, authority: 0.30 },
  science: { virality: 0.25, freshness: 0.20, authority: 0.25 },
  politics: { virality: 0.25, freshness: 0.30, authority: 0.20 },
  lifestyle: { virality: 0.25, freshness: 0.20, authority: 0.20 },
} as const;

export const DECAY_CONSTANTS = {
  breaking_news: 0.10,  // half-life ~7 hours
  daily_news: 0.02,     // half-life ~35 hours
  trend: 0.05,          // half-life ~14 hours
  evergreen: 0.001,     // half-life ~700 hours
} as const;

export const AUTHORITY_TIERS = {
  'A+': { weight: 1.0, examples: ['Reuters', 'AP', 'BBC', 'Bloomberg'] },
  'A': { weight: 0.85, examples: ['NYT', 'WSJ', 'The Guardian', 'Washington Post'] },
  'B': { weight: 0.6, examples: ['Regional outlets', 'Specialized publications'] },
  'C': { weight: 0.4, examples: ['Blogs', 'Independent media'] },
  'UGC': { weight: 0.2, examples: ['Social posts', 'Reddit', 'Twitter'] },
} as const;

export const LIFECYCLE_HOURS = {
  emergence: 6,
  acceleration: 24,
  peak: 72,
  decay: 168,
} as const;

export const LIFECYCLE_MULTIPLIERS = {
  emergence: 1.5,
  acceleration: 1.3,
  peak: 1.0,
  decay: 0.6,
  evergreen: 0.3,
} as const;
