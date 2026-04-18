// Core Topic Types
export interface Topic {
  id: string;
  title: string;
  category: TopicCategory;
  description: string;
  keywords: string[];
  sources: Source[];
  createdAt: Date;
  updatedAt: Date;
  lifecycleStage: LifecycleStage;
  scores: TopicScores;
  metadata: TopicMetadata;
}

export type TopicCategory =
  | 'breaking_news'
  | 'technology'
  | 'business'
  | 'entertainment'
  | 'sports'
  | 'health'
  | 'science'
  | 'politics'
  | 'lifestyle';

export type LifecycleStage =
  | 'emergence'    // 0-6 hours
  | 'acceleration' // 6-24 hours
  | 'peak'         // 24-72 hours
  | 'decay'        // 72-168 hours
  | 'evergreen';   // 168+ hours

export interface TopicScores {
  overall: number;
  virality: ViralityScore;
  competitive: CompetitiveScore;
  freshness: FreshnessScore;
  authority: AuthorityScore;
  engagement: EngagementScore;
}

export interface ViralityScore {
  score: number;
  twitterVelocity: number;
  redditVelocity: number;
  newsVelocity: number;
  crossPlatformCorrelation: number;
}

export interface CompetitiveScore {
  score: number;
  saturationIndex: number;
  keywordDifficulty: number;
  contentGap: 'high' | 'medium' | 'low';
  topCompetitors: Competitor[];
}

export interface Competitor {
  name: string;
  domainAuthority: number;
  estimatedTraffic: number;
}

export interface FreshnessScore {
  score: number;
  hoursSinceEmergence: number;
  momentumBonus: number;
  decayConstant: number;
  projectedPeak: Date | null;
}

export interface AuthorityScore {
  score: number;
  tier: AuthorityTier;
  primarySources: Source[];
  originalReportingBonus: number;
}

export type AuthorityTier = 'A+' | 'A' | 'B' | 'C' | 'UGC';

export interface EngagementScore {
  score: number;
  sentimentPolarity: number;
  sentimentStrength: number;
  saveBookmarkRate: number;
  commentDepth: number;
  shareToViewRatio: number;
}

export interface Source {
  platform: Platform;
  name: string;
  url: string;
  engagement: EngagementMetrics;
  publishedAt: Date;
}

export type Platform = 'twitter' | 'reddit' | 'news' | 'google_trends';

export interface EngagementMetrics {
  likes?: number;
  retweets?: number;
  shares?: number;
  comments?: number;
  views?: number;
  upvotes?: number;
}

export interface TopicMetadata {
  tweetCount: number;
  redditPostCount: number;
  newsArticleCount: number;
  googleTrendsInterest: number;
  breakoutPercent: number | null;
  relatedQueries: string[];
  geographicBreakdown: GeoInterest[];
}

export interface GeoInterest {
  region: string;
  country: string;
  interest: number;
}

// Data Collection Types
export interface TwitterTweet {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    followers: number;
  };
  createdAt: Date;
  publicMetrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  };
  contextAnnotations?: { domain: { name: string } }[];
}

export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  createdAt: Date;
  score: number;
  numComments: number;
  selftext?: string;
  url: string;
  isVideo: boolean;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: Date;
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
}

export interface GoogleTrendsData {
  topic: string;
  interestOverTime: { time: string; value: number }[];
  relatedQueries: { query: string; value: number }[];
  geographicBreakdown: { region: string; country: string; value: number }[];
  breakoutPercent: number | null;
}

// Scoring Engine Types
export interface ScoredTopic extends Topic {
  scores: TopicScores;
  recommendation: Recommendation;
}

export interface Recommendation {
  action: 'publish_now' | 'monitor' | 'skip';
  angle: string;
  format: 'article' | 'video' | 'infographic' | 'comparison' | 'tutorial';
  targetSubreddits: string[];
  bestPostingTime: {
    day: string;
    hour: number;
    timezone: string;
  };
  confidence: number;
}

// Training Dataset Types
export interface TrainingExample {
  id: string;
  topic: {
    title: string;
    category: TopicCategory;
    keywords: string[];
    sources: Source[];
    metadata: TopicMetadata;
  };
  scores: TopicScores;
  outcome: TrainingOutcome;
  features: FeatureVector;
  labeledAt: Date;
  labeledBy: string;
}

export interface TrainingOutcome {
  actualVirality: number;      // 0-100 how viral it actually became
  engagementRate: number;       // actual engagement / expected
  successScore: number;         // overall success 0-100
  category: 'viral' | 'moderate' | 'flop';
}

export interface FeatureVector {
  // Virality features
  twitterEngagementVelocity: number;
  redditEngagementVelocity: number;
  crossPlatformCorrelation: number;
  earlyInfluencerCaptureRate: number;

  // Content features
  headlineSentiment: number;
  headlineEmotion: 'positive' | 'negative' | 'neutral' | 'mixed';
  contentLength: number;
  hasMedia: boolean;
  hasNumbers: boolean;
  questionFormat: boolean;

  // Timing features
  dayOfWeek: number;
  hourOfDay: number;
  daysSinceEvent: number;
  topicAge: number;

  // Market features
  competitionDensity: number;
  keywordDifficulty: number;
  trendMomentum: number;
}

export interface ModelPrediction {
  topic: string;
  predictedScore: number;
  confidence: number;
  featureImportance: { feature: string; importance: number }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface TopicsListResponse extends ApiResponse<Topic[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CollectionJob {
  id: string;
  platform: Platform;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  itemsCollected: number;
  error?: string;
}
