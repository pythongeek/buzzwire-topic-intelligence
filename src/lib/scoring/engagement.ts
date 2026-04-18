import type { EngagementScore, Source } from '@/types';

/**
 * Engagement Quality Score Module
 * Based on sentiment analysis and high-value engagement signals
 * 
 * Key insight: Save/bookmark ratio and comment depth are strong quality signals
 */

export interface EngagementInputs {
  sources: Source[];
  sentimentPolarity: number;      // -1 to 1 (VADER compound score)
  sentimentStrength: number;       // 0 to 1 (intensity of emotion)
  saveBookmarkRate?: number;       // Estimated saves / views
  avgCommentDepth?: number;        // Average reply chain depth
  shareToViewRatio?: number;       // Shares / views
  positiveRate?: number;           // % of positive reactions
  negativeRate?: number;           // % of negative reactions
}

export function calculateEngagementScore(inputs: EngagementInputs): EngagementScore {
  const sentimentScore = calculateSentimentScore(
    inputs.sentimentPolarity,
    inputs.sentimentStrength
  );
  
  const saveBookmarkScore = calculateSaveBookmarkScore(inputs.saveBookmarkRate);
  const commentDepthScore = calculateCommentDepthScore(inputs.avgCommentDepth);
  const shareScore = calculateShareScore(inputs.shareToViewRatio);

  // Weighted combination
  const score = (
    sentimentScore * 0.25 +
    saveBookmarkScore * 0.30 +  // High-value indicator
    commentDepthScore * 0.25 +
    shareScore * 0.20
  );

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    sentimentPolarity: Math.round(inputs.sentimentPolarity * 100) / 100,
    sentimentStrength: Math.round(inputs.sentimentStrength * 100) / 100,
    saveBookmarkRate: inputs.saveBookmarkRate || 0,
    commentDepth: inputs.avgCommentDepth || 0,
    shareToViewRatio: inputs.shareToViewRatio || 0,
  };
}

function calculateSentimentScore(polarity: number, strength: number): number {
  // Polarity: -1 (negative) to 1 (positive)
  // Strength: 0 (neutral) to 1 (intense)
  
  // Optimal sentiment for engagement is slightly positive
  // Pure neutrality or extreme negativity/positivity reduces engagement
  const polarityScore = 1 - Math.abs(polarity); // 1 when neutral, 0 when extreme
  const strengthScore = strength; // Higher intensity = more engagement

  // Sweet spot is moderate positivity with strong emotional charge
  const emotionalResonance = Math.sin((polarity + 1) * Math.PI / 2) * strength;

  return Math.round(emotionalResonance * 100);
}

function calculateSaveBookmarkScore(rate?: number): number {
  if (!rate || rate === 0) return 30; // Default baseline for no data

  // Save/bookmark is a strong quality signal
  // Industry benchmarks: 1-2% is good, 3%+ is excellent
  if (rate >= 0.03) return 90;
  if (rate >= 0.02) return 75;
  if (rate >= 0.01) return 60;
  if (rate >= 0.005) return 45;
  return 30;
}

function calculateCommentDepthScore(depth?: number): number {
  if (!depth || depth === 0) return 25; // Default baseline

  // Comment depth indicates engaged discussion
  // 2-3 replies deep is typical, 5+ is excellent engagement
  if (depth >= 5) return 90;
  if (depth >= 4) return 75;
  if (depth >= 3) return 60;
  if (depth >= 2) return 45;
  return 30;
}

function calculateShareScore(ratio?: number): number {
  if (!ratio || ratio === 0) return 25; // Default baseline

  // Share-to-view ratio indicates value and shareability
  // 1% is good, 3%+ is viral
  if (ratio >= 0.03) return 90;
  if (ratio >= 0.01) return 70;
  if (ratio >= 0.005) return 50;
  if (ratio >= 0.001) return 35;
  return 25;
}

export function aggregateEngagementMetrics(sources: Source[]): {
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalViews: number;
  engagementRate: number;
} {
  let totalLikes = 0;
  let totalShares = 0;
  let totalComments = 0;
  let totalViews = 0;

  sources.forEach((source) => {
    const engagement = source.engagement;
    totalLikes += engagement.likes || 0;
    totalShares += (engagement.retweets || 0) + (engagement.shares || 0);
    totalComments += engagement.comments || 0;
    totalViews += engagement.views || 0;
  });

  const engagementRate = totalViews > 0
    ? (totalLikes + totalShares + totalComments) / totalViews
    : 0;

  return {
    totalLikes,
    totalShares,
    totalComments,
    totalViews,
    engagementRate,
  };
}

export function analyzeSentimentTrend(
  currentPolarity: number,
  previousPolarity: number
): 'improving' | 'stable' | 'declining' {
  const diff = currentPolarity - previousPolarity;
  if (diff > 0.1) return 'improving';
  if (diff < -0.1) return 'declining';
  return 'stable';
}

export function estimateViralityFromEngagement(
  engagementRate: number,
  velocity: number
): number {
  // Simple virality estimation from engagement patterns
  // K-factor inspired: each engagement leads to potential shares
  const kFactor = engagementRate * velocity;
  
  // K > 1 means viral potential
  if (kFactor > 1) return Math.min(100, Math.round(kFactor * 50));
  if (kFactor > 0.5) return Math.round(kFactor * 50);
  return Math.round(kFactor * 30);
}
