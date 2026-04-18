import type {
  Topic,
  TopicScores,
  ScoredTopic,
  Recommendation,
  TopicCategory,
  ViralityInputs,
  EngagementInputs,
  FreshnessInputs,
  AuthorityInputs,
} from '@/types';
import { SCORING_WEIGHTS, TOPIC_TYPE_MULTIPLIERS } from './weights';
import { calculateViralityScore } from './virality';
import { calculateCompetitiveScore, CompetitiveInputs } from './competitive';
import { calculateFreshnessScore, calculateLifecycleStage } from './freshness';
import { calculateAuthorityScore } from './authority';
import { calculateEngagementScore } from './engagement';

/**
 * Main Scoring Engine
 * Combines all 5 scoring modules into a unified topic score
 */

export interface TopicScoringInputs {
  // Virality inputs
  twitterTweets?: ViralityInputs['twitter']['tweets'];
  twitterVelocity?: number;
  redditPosts?: ViralityInputs['reddit']['posts'];
  redditVelocity?: number;
  newsArticles?: ViralityInputs['news']['articles'];
  newsVelocity?: number;

  // Competitive inputs
  keywordDifficulty?: number;
  contentVolume?: number;
  topCompetitors?: CompetitiveInputs['topCompetitors'];
  searchVolume?: number;

  // Freshness inputs
  topicAgeHours?: number;
  emergenceTime?: Date;
  volumeHistory?: number[];
  topicType?: 'breaking_news' | 'daily_news' | 'trend' | 'evergreen';
  currentVolume?: number;
  previousVolume?: number;

  // Authority inputs
  sources?: AuthorityInputs['sources'];
  hasOriginalReporting?: boolean;
  hasExpertCitations?: boolean;

  // Engagement inputs
  sentimentPolarity?: number;
  sentimentStrength?: number;
  saveBookmarkRate?: number;
  avgCommentDepth?: number;
  shareToViewRatio?: number;
}

export function scoreTopic(
  topicId: string,
  category: TopicCategory,
  inputs: TopicScoringInputs
): TopicScores {
  // 1. Calculate Virality Score
  const virality = calculateViralityScore({
    twitter: {
      tweets: inputs.twitterTweets || [],
      engagementVelocity: inputs.twitterVelocity || 0,
    },
    reddit: {
      posts: inputs.redditPosts || [],
      engagementVelocity: inputs.redditVelocity || 0,
    },
    news: {
      articles: inputs.newsArticles || [],
      coverageVelocity: inputs.newsVelocity || 0,
    },
  });

  // 2. Calculate Competitive Score
  const competitive = calculateCompetitiveScore({
    keywordDifficulty: inputs.keywordDifficulty || 50,
    contentVolume: inputs.contentVolume || 0,
    topCompetitors: inputs.topCompetitors || [],
    searchVolume: inputs.searchVolume,
  });

  // 3. Calculate Freshness Score
  const freshness = calculateFreshnessScore({
    topicAgeHours: inputs.topicAgeHours || 0,
    emergenceTime: inputs.emergenceTime || new Date(),
    volumeHistory: inputs.volumeHistory || [],
    topicType: inputs.topicType || 'trend',
    currentVolume: inputs.currentVolume || 0,
    previousVolume: inputs.previousVolume,
  });

  // 4. Calculate Authority Score
  const authority = calculateAuthorityScore({
    sources: inputs.sources || [],
    hasOriginalReporting: inputs.hasOriginalReporting || false,
    hasExpertCitations: inputs.hasExpertCitations || false,
  });

  // 5. Calculate Engagement Quality Score
  const engagement = calculateEngagementScore({
    sources: inputs.sources || [],
    sentimentPolarity: inputs.sentimentPolarity || 0,
    sentimentStrength: inputs.sentimentStrength || 0,
    saveBookmarkRate: inputs.saveBookmarkRate,
    avgCommentDepth: inputs.avgCommentDepth,
    shareToViewRatio: inputs.shareToViewRatio,
  });

  // Get category-specific weights
  const categoryWeights = TOPIC_TYPE_MULTIPLIERS[category];

  // 6. Calculate weighted overall score
  const overall = Math.round(
    virality.score * (SCORING_WEIGHTS.virality + (categoryWeights.virality - 0.25)) +
    competitive.score * SCORING_WEIGHTS.competitive +
    freshness.score * (SCORING_WEIGHTS.freshness + (categoryWeights.freshness - 0.20)) +
    authority.score * (SCORING_WEIGHTS.authority + (categoryWeights.authority - 0.15)) +
    engagement.score * SCORING_WEIGHTS.engagement
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    virality,
    competitive,
    freshness,
    authority,
    engagement,
  };
}

export function createScoredTopic(
  topic: Topic,
  inputs: TopicScoringInputs
): ScoredTopic {
  const scores = scoreTopic(topic.id, topic.category, inputs);
  const recommendation = generateRecommendation(topic, scores);

  return {
    ...topic,
    scores,
    recommendation,
  };
}

export function generateRecommendation(
  topic: Topic,
  scores: TopicScores
): Recommendation {
  // Determine action based on overall score and freshness
  const lifecycleStage = calculateLifecycleStage(scores.freshness.hoursSinceEmergence);
  let action: 'publish_now' | 'monitor' | 'skip';

  if (scores.overall >= 70 && lifecycleStage === 'emergence') {
    action = 'publish_now';
  } else if (scores.overall >= 50 || lifecycleStage === 'acceleration') {
    action = 'monitor';
  } else {
    action = 'skip';
  }

  // Generate angle suggestion based on content gap
  let angle: string;
  switch (scores.competitive.contentGap) {
    case 'high':
      angle = `First-mover opportunity - create comprehensive coverage of "${topic.title}"`;
      break;
    case 'medium':
      angle = `Unique angle opportunity - differentiate with ${topic.category} perspective`;
      break;
    default:
      angle = `Quality differentiation - excel on depth, visuals, or expert insights`;
  }

  // Determine best format
  let format: Recommendation['format'];
  if (scores.virality.score >= 70) {
    format = 'video'; // High virality = visual content performs best
  } else if (scores.competitive.contentGap === 'high') {
    format = 'article'; // Blue ocean = comprehensive article
  } else if (topic.category === 'technology' || topic.category === 'business') {
    format = 'comparison';
  } else {
    format = 'tutorial';
  }

  // Best posting time
  const bestPostingTime = calculateBestPostingTime(topic.category);

  // Calculate confidence based on data completeness
  const dataPoints = [
    scores.virality.twitterVelocity > 0,
    scores.virality.redditVelocity > 0,
    scores.competitive.keywordDifficulty > 0,
    scores.freshness.hoursSinceEmergence > 0,
    scores.authority.score > 0,
  ].filter(Boolean).length;

  const confidence = Math.round((dataPoints / 5) * 100);

  return {
    action,
    angle,
    format,
    targetSubreddits: getTargetSubreddits(topic.category),
    bestPostingTime,
    confidence,
  };
}

function calculateBestPostingTime(category: TopicCategory): Recommendation['bestPostingTime'] {
  // Based on Reddit and Twitter peak usage patterns
  const categoryTimes: Record<TopicCategory, { day: string; hour: number }> = {
    breaking_news: { day: 'Tuesday', hour: 9 },
    technology: { day: 'Wednesday', hour: 10 },
    business: { day: 'Tuesday', hour: 9 },
    entertainment: { day: 'Friday', hour: 18 },
    sports: { day: 'Saturday', hour: 14 },
    health: { day: 'Monday', hour: 8 },
    science: { day: 'Wednesday', hour: 11 },
    politics: { day: 'Tuesday', hour: 10 },
    lifestyle: { day: 'Sunday', hour: 12 },
  };

  return {
    ...categoryTimes[category],
    timezone: 'America/New_York',
  };
}

function getTargetSubreddits(category: TopicCategory): string[] {
  const subredditMap: Record<TopicCategory, string[]> = {
    breaking_news: ['r/news', 'r/worldnews', 'r/technology'],
    technology: ['r/technology', 'r/programming', 'r gadgets'],
    business: ['r/business', 'r/startups', 'r/entrepreneur'],
    entertainment: ['r/entertainment', 'r/movies', 'r/television'],
    sports: ['r/sports', 'r/nba', 'r/soccer'],
    health: ['r/health', 'r/medicine', 'r/fitness'],
    science: ['r/science', 'r/space', 'r/technology'],
    politics: ['r/politics', 'r/news', 'r/worldnews'],
    lifestyle: ['r/lifestyle', 'r/food', 'r/travel'],
  };

  return subredditMap[category] || ['r/news'];
}

export function compareTopics(a: ScoredTopic, b: ScoredTopic): number {
  return b.scores.overall - a.scores.overall;
}

export function filterByScore(
  topics: ScoredTopic[],
  minScore: number,
  maxScore?: number
): ScoredTopic[] {
  return topics.filter((topic) => {
    const score = topic.scores.overall;
    if (score < minScore) return false;
    if (maxScore !== undefined && score > maxScore) return false;
    return true;
  });
}

export function rankTopics(topics: ScoredTopic[]): ScoredTopic[] {
  return [...topics].sort(compareTopics);
}
