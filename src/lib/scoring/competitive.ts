import type { CompetitiveScore, Competitor } from '@/types';

/**
 * Competitive Score Module
 * Based on content gap analysis methodology from Ahrefs/Semrush
 * 
 * Measures how saturated a topic is and identifies opportunities
 */

export interface CompetitiveInputs {
  keywordDifficulty: number;      // 0-100 from SEO tools
  contentVolume: number;          // Estimated content pieces on topic
  topCompetitors: {
    domain: string;
    domainAuthority: number;
    estimatedTraffic: number;
  }[];
  searchVolume?: number;          // Monthly search volume
  cpcRange?: number;              // CPC indicates commercial value
}

export function calculateCompetitiveScore(inputs: CompetitiveInputs): CompetitiveScore {
  const { saturationIndex, contentGap } = calculateSaturation(inputs);
  const keywordDifficulty = Math.min(100, inputs.keywordDifficulty || 50);

  // Lower competition = higher score
  // Invert the relationship
  const competitionScore = Math.round(100 * Math.exp(-saturationIndex * 0.7));

  const competitors: Competitor[] = inputs.topCompetitors.map((c) => ({
    name: c.domain,
    domainAuthority: c.domainAuthority,
    estimatedTraffic: c.estimatedTraffic,
  }));

  return {
    score: Math.min(100, Math.max(0, competitionScore)),
    saturationIndex: Math.round(saturationIndex * 100) / 100,
    keywordDifficulty,
    contentGap,
    topCompetitors: competitors.slice(0, 5), // Top 5 competitors
  };
}

function calculateSaturation(inputs: CompetitiveInputs): {
  saturationIndex: number;
  contentGap: 'high' | 'medium' | 'low';
} {
  const { contentVolume, topCompetitors, searchVolume } = inputs;

  // Calculate content density
  const avgDA = topCompetitors.length > 0
    ? topCompetitors.reduce((sum, c) => sum + c.domainAuthority, 0) / topCompetitors.length
    : 50;

  const totalTraffic = topCompetitors.reduce((sum, c) => sum + c.estimatedTraffic, 0);

  // Saturation formula based on content volume, competition strength, and search demand
  const volumeFactor = Math.min(1, contentVolume / 1000); // Normalize to 1000 pieces
  const competitionFactor = Math.min(1, avgDA / 90);       // DA max ~90-100
  const demandFactor = searchVolume ? Math.min(1, searchVolume / 100000) : 0.5;

  const saturationIndex = (volumeFactor * 0.4) + (competitionFactor * 0.4) + ((1 - demandFactor) * 0.2);

  // Determine content gap
  let contentGap: 'high' | 'medium' | 'low';
  if (saturationIndex < 0.3) {
    contentGap = 'high';  // Blue ocean - underserved
  } else if (saturationIndex < 0.6) {
    contentGap = 'medium'; // Moderate opportunity
  } else {
    contentGap = 'low';    // Red ocean - saturated
  }

  return { saturationIndex, contentGap };
}

export function calculateTrafficPotential(
  searchVolume: number,
  positionProbability: number,
  ctrAtPosition: number[]
): number {
  // Estimate potential traffic if we rank for this topic
  const clicksAtPosition = ctrAtPosition.slice(0, 10); // Top 10 positions
  const weightedCTR = clicksAtPosition.reduce((sum, ctr, pos) => 
    sum + (ctr * positionProbability), 0);

  return Math.round(searchVolume * weightedCTR);
}

export function estimateContentDifficulty(
  topResultsDA: number[],
  backlinkRequirements: number[]
): number {
  // Estimate how difficult it would be to create competitive content
  const avgDA = topResultsDA.reduce((a, b) => a + b, 0) / topResultsDA.length;
  const avgBacklinks = backlinkRequirements.reduce((a, b) => a + b, 0) / backlinkRequirements.length;

  const daFactor = Math.min(1, avgDA / 90);
  const backlinkFactor = Math.min(1, avgBacklinks / 100);

  return Math.round((daFactor * 0.6 + backlinkFactor * 0.4) * 100);
}

export function getCompetitionRecommendation(score: CompetitiveScore): string {
  if (score.saturationIndex < 0.3) {
    return 'Strong opportunity - low competition with high demand';
  } else if (score.saturationIndex < 0.5) {
    return 'Moderate opportunity - find a unique angle or underserved subtopic';
  } else if (score.saturationIndex < 0.7) {
    return 'Competitive - differentiate on quality, format, or depth';
  } else {
    return 'Highly saturated - consider pivoting or targeting long-tail variations';
  }
}
