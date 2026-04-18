import type { Topic, TwitterTweet, RedditPost, NewsArticle } from '@/types';
import type { ViralityScore } from '@/types';

/**
 * Virality Score Module
 * Based on Twitter's Heavy Ranker algorithm insights
 * 
 * Key weights from Twitter's algorithm:
 * - Reply engagement by author: 75.0 (highest)
 * - Good click: 11.0
 * - Good profile click: 12.0
 * - Reply: 13.5
 * - Retweet: 1.0
 * - Favorite: 0.5
 */

export interface ViralityInputs {
  twitter: {
    tweets: TwitterTweet[];
    engagementVelocity: number; // engagements per hour
  };
  reddit: {
    posts: RedditPost[];
    engagementVelocity: number;
  };
  news: {
    articles: NewsArticle[];
    coverageVelocity: number;
  };
}

export function calculateViralityScore(inputs: ViralityInputs): ViralityScore {
  const twitterScore = calculateTwitterVirality(inputs.twitter);
  const redditScore = calculateRedditVirality(inputs.reddit);
  const newsScore = calculateNewsVirality(inputs.news);
  const crossPlatform = calculateCrossPlatformCorrelation(inputs);

  // Weighted combination based on data availability
  const hasTwitter = inputs.twitter.tweets.length > 0;
  const hasReddit = inputs.reddit.posts.length > 0;
  const hasNews = inputs.news.articles.length > 0;

  const weights = {
    twitter: hasTwitter ? 0.45 : 0,
    reddit: hasReddit ? 0.35 : 0,
    news: hasNews ? 0.20 : 0,
  };

  // Normalize weights to sum to 1
  const totalWeight = weights.twitter + weights.reddit + weights.news;
  if (totalWeight > 0) {
    weights.twitter /= totalWeight;
    weights.reddit /= totalWeight;
    weights.news /= totalWeight;
  }

  const overallScore = Math.round(
    twitterScore * weights.twitter +
    redditScore * weights.reddit +
    newsScore * weights.news +
    crossPlatform * 0.15 // bonus for cross-platform resonance
  );

  return {
    score: Math.min(100, Math.max(0, overallScore)),
    twitterVelocity: inputs.twitter.engagementVelocity,
    redditVelocity: inputs.reddit.engagementVelocity,
    newsVelocity: inputs.news.coverageVelocity,
    crossPlatformCorrelation: crossPlatform,
  };
}

function calculateTwitterVirality(twitter: ViralityInputs['twitter']): number {
  if (twitter.tweets.length === 0) return 0;

  // Twitter engagement metrics weights (from Heavy Ranker)
  const WEIGHTS = {
    replyEngagement: 75.0,
    profileClick: 12.0,
    reply: 13.5,
    goodClick: 11.0,
    retweet: 1.0,
    favorite: 0.5,
  };

  let totalEngagement = 0;
  let maxPossibleScore = 0;

  twitter.tweets.forEach((tweet) => {
    const metrics = tweet.publicMetrics;
    
    // Calculate weighted engagement
    const engagement =
      metrics.replyCount * WEIGHTS.reply +
      metrics.retweetCount * WEIGHTS.retweet +
      metrics.likeCount * WEIGHTS.favorite +
      metrics.quoteCount * WEIGHTS.retweet;

    // Apply velocity bonus (engagements in first 2 hours are more valuable)
    const hoursOld = (Date.now() - new Date(tweet.createdAt).getTime()) / (1000 * 60 * 60);
    const velocityBonus = hoursOld < 2 ? 1.5 : 1.0;

    totalEngagement += engagement * velocityBonus;
    maxPossibleScore += (
      1000 * WEIGHTS.reply +
      1000 * WEIGHTS.retweet +
      1000 * WEIGHTS.favorite
    );
  });

  // Normalize to 0-100
  const baseScore = maxPossibleScore > 0 ? (totalEngagement / maxPossibleScore) * 100 : 0;
  
  // Apply velocity multiplier
  const velocityMultiplier = Math.min(2, twitter.engagementVelocity / 100);

  return Math.round(baseScore * velocityMultiplier);
}

function calculateRedditVirality(reddit: ViralityInputs['reddit']): number {
  if (reddit.posts.length === 0) return 0;

  // Reddit engagement factors
  const upvoteWeight = 1.0;
  const commentWeight = 3.0; // Comments drive algorithmic reach more
  const crosspostWeight = 5.0;

  let totalScore = 0;

  reddit.posts.forEach((post) => {
    // Normalize scores (Reddit scores can be very high)
    const normalizedUpvotes = Math.log10(post.score + 1) * 10;
    const normalizedComments = Math.log10(post.numComments + 1) * 10;

    // Calculate post age factor (time decay)
    const hoursOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    const ageFactor = Math.max(0.2, 1 - (hoursOld / 168)); // 168 hours = 1 week

    const postScore =
      (normalizedUpvotes * upvoteWeight +
       normalizedComments * commentWeight) * ageFactor;

    totalScore += postScore;
  });

  // Normalize
  const avgScore = totalScore / reddit.posts.length;
  const velocityBonus = Math.min(1.5, reddit.engagementVelocity / 50);

  return Math.round(Math.min(100, avgScore * velocityBonus));
}

function calculateNewsVirality(news: ViralityInputs['news']): number {
  if (news.articles.length === 0) return 0;

  // News virality based on coverage velocity and source diversity
  const coverageScore = Math.min(100, news.articles.length * 10);
  const velocityBonus = Math.min(1.5, news.coverageVelocity / 5);

  // Source diversity bonus
  const uniqueSources = new Set(news.articles.map((a) => a.source.name)).size;
  const diversityBonus = Math.min(1.3, 1 + (uniqueSources * 0.1));

  return Math.round(coverageScore * velocityBonus * diversityBonus);
}

function calculateCrossPlatformCorrelation(inputs: ViralityInputs): number {
  // Detect if the topic is trending across multiple platforms
  // Twitter → Reddit: ~2-6 hours lag
  // News → Twitter: ~15-30 min lag
  // Reddit → Twitter: ~1-3 hours lag

  const platformsActive = [
    inputs.twitter.tweets.length > 0,
    inputs.reddit.posts.length > 0,
    inputs.news.articles.length > 0,
  ].filter(Boolean).length;

  if (platformsActive < 2) return 0;

  // Base score for multi-platform presence
  let correlation = platformsActive * 20;

  // Velocity correlation bonus
  const velocities = [
    inputs.twitter.engagementVelocity,
    inputs.reddit.engagementVelocity,
    inputs.news.coverageVelocity,
  ].filter((v) => v > 0);

  if (velocities.length >= 2) {
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const velocitySpread = Math.max(...velocities) / (Math.min(...velocities) + 1);
    
    // If velocities are similar across platforms, higher correlation
    if (velocitySpread < 2) {
      correlation += 20;
    }
  }

  return Math.min(100, correlation);
}

export function classifyViralityLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
