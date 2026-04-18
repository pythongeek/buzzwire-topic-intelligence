import type { AuthorityScore, AuthorityTier, Source, Platform } from '@/types';
import { AUTHORITY_TIERS } from './weights';

/**
 * Authority Score Module
 * Based on Google's E-E-A-T principles and source credibility
 */

export interface AuthorityInputs {
  sources: Source[];
  hasOriginalReporting: boolean;
  hasExpertCitations: boolean;
  publicationLongevity?: number; // Years in publication
}

export function calculateAuthorityScore(inputs: AuthorityInputs): AuthorityScore {
  const sourceWeights = calculateSourceWeights(inputs.sources);
  const avgSourceWeight = sourceWeights.reduce((a, b) => a + b, 0) / sourceWeights.length;
  
  // Base score from source quality
  let score = avgSourceWeight * 100;

  // Original reporting bonus (25% boost)
  const originalReportingBonus = inputs.hasOriginalReporting ? 1.25 : 1.0;

  // Expert citation bonus (20% boost)
  const expertCitationBonus = inputs.hasExpertCitations ? 1.20 : 1.0;

  // Publication longevity bonus (up to 15%)
  const longevityBonus = inputs.publicationLongevity
    ? Math.min(1.15, 1 + (inputs.publicationLongevity * 0.02))
    : 1.0;

  score = score * originalReportingBonus * expertCitationBonus * longevityBonus;

  // Determine tier
  const tier = classifyAuthorityTier(score);

  return {
    score: Math.min(100, Math.round(score)),
    tier,
    primarySources: inputs.sources.slice(0, 5),
    originalReportingBonus: inputs.hasOriginalReporting ? 25 : 0,
  };
}

function calculateSourceWeights(sources: Source[]): number[] {
  return sources.map((source) => {
    const platform = source.platform;
    const sourceName = source.name.toLowerCase();

    // Platform base weights
    let platformWeight: number;
    switch (platform) {
      case 'news':
        platformWeight = 0.8;
        break;
      case 'twitter':
        platformWeight = 0.4;
        break;
      case 'reddit':
        platformWeight = 0.3;
        break;
      case 'google_trends':
        platformWeight = 0.2;
        break;
      default:
        platformWeight = 0.3;
    }

    // Source-specific weights
    let sourceBonus = 0;
    for (const [tier, config] of Object.entries(AUTHORITY_TIERS)) {
      if (config.examples.some((ex) => sourceName.includes(ex.toLowerCase()))) {
        sourceBonus = config.weight - 0.5; // Relative to baseline
        break;
      }
    }

    // Known high-authority sources
    const knownHighAuthority = [
      'reuters', 'ap news', 'associated press', 'bbc',
      'nytimes', 'ny times', 'wall street journal', 'wsj',
      'washington post', 'the guardian', 'bloomberg',
      'financial times', 'science', 'nature',
    ];

    if (knownHighAuthority.some((name) => sourceName.includes(name))) {
      sourceBonus = 0.5; // Major boost for recognized sources
    }

    return Math.min(1, platformWeight + sourceBonus);
  });
}

export function classifyAuthorityTier(score: number): AuthorityTier {
  if (score >= 90) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 55) return 'B';
  if (score >= 30) return 'C';
  return 'UGC';
}

export function getAuthorityAdvice(tier: AuthorityTier): string {
  switch (tier) {
    case 'A+':
      return 'Highest credibility - major wire services and top publications';
    case 'A':
      return 'High credibility - major national outlets with strong reputation';
    case 'B':
      return 'Moderate credibility - specialized or regional publications';
    case 'C':
      return 'Lower credibility - blogs and independent media';
    case 'UGC':
      return 'User-generated content - social posts and community content';
  }
}

export function calculateCredibilityScore(
  historicalAccuracy: number,
  publicationFrequency: number,
  expertCitationRate: number,
  correctionRate: number
): number {
  // Composite credibility formula
  const score = (
    historicalAccuracy * 0.4 +
    publicationFrequency * 0.3 +
    expertCitationRate * 0.2 +
    (1 - correctionRate) * 0.1
  ) * 100;

  return Math.min(100, Math.max(0, Math.round(score)));
}
