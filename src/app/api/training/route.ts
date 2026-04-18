import { NextRequest, NextResponse } from 'next/server';
import type { TrainingExample, FeatureVector, TrainingOutcome, TopicCategory } from '@/types';

// In-memory storage for demo (use a database in production)
const trainingExamples: TrainingExample[] = [];

/**
 * Sample training examples for demonstration
 * In production, these would come from historical data with known outcomes
 */
const sampleTrainingData: TrainingExample[] = [
  {
    id: 'sample-1',
    topic: {
      title: 'AI Video Generation Sora',
      category: 'technology',
      keywords: ['AI', 'video', 'Sora', 'OpenAI'],
      sources: [],
      metadata: {
        tweetCount: 15000,
        redditPostCount: 250,
        newsArticleCount: 45,
        googleTrendsInterest: 95,
        breakoutPercent: 2500,
        relatedQueries: ['Sora AI', 'OpenAI video', 'AI tools'],
        geographicBreakdown: [],
      },
    },
    scores: {
      overall: 85,
      virality: { score: 92, twitterVelocity: 850, redditVelocity: 45, newsVelocity: 12, crossPlatformCorrelation: 88 },
      competitive: { score: 45, saturationIndex: 0.45, keywordDifficulty: 65, contentGap: 'medium', topCompetitors: [] },
      freshness: { score: 95, hoursSinceEmergence: 4, momentumBonus: 1.5, decayConstant: 0.05, projectedPeak: null },
      authority: { score: 70, tier: 'A', primarySources: [], originalReportingBonus: 0 },
      engagement: { score: 80, sentimentPolarity: 0.6, sentimentStrength: 0.75, saveBookmarkRate: 0.03, commentDepth: 4, shareToViewRatio: 0.025 },
    },
    outcome: { actualVirality: 88, engagementRate: 1.4, successScore: 85, category: 'viral' },
    features: {
      twitterEngagementVelocity: 850,
      redditEngagementVelocity: 45,
      crossPlatformCorrelation: 88,
      earlyInfluencerCaptureRate: 0.65,
      headlineSentiment: 0.6,
      headlineEmotion: 'positive',
      contentLength: 1200,
      hasMedia: true,
      hasNumbers: false,
      questionFormat: false,
      dayOfWeek: 3,
      hourOfDay: 10,
      daysSinceEvent: 0,
      topicAge: 4,
      competitionDensity: 0.45,
      keywordDifficulty: 65,
      trendMomentum: 150,
    },
    labeledAt: new Date(),
    labeledBy: 'system',
  },
  {
    id: 'sample-2',
    topic: {
      title: 'iPhone 16 Pro Review',
      category: 'technology',
      keywords: ['iPhone', 'Apple', 'review', 'smartphone'],
      sources: [],
      metadata: {
        tweetCount: 5000,
        redditPostCount: 180,
        newsArticleCount: 32,
        googleTrendsInterest: 78,
        breakoutPercent: 150,
        relatedQueries: ['iPhone 16', 'Apple review', 'best smartphone'],
        geographicBreakdown: [],
      },
    },
    scores: {
      overall: 68,
      virality: { score: 65, twitterVelocity: 320, redditVelocity: 28, newsVelocity: 8, crossPlatformCorrelation: 72 },
      competitive: { score: 35, saturationIndex: 0.72, keywordDifficulty: 82, contentGap: 'low', topCompetitors: [] },
      freshness: { score: 55, hoursSinceEmergence: 72, momentumBonus: 1.0, decayConstant: 0.02, projectedPeak: null },
      authority: { score: 75, tier: 'A', primarySources: [], originalReportingBonus: 0 },
      engagement: { score: 70, sentimentPolarity: 0.4, sentimentStrength: 0.55, saveBookmarkRate: 0.025, commentDepth: 3, shareToViewRatio: 0.015 },
    },
    outcome: { actualVirality: 62, engagementRate: 0.9, successScore: 68, category: 'moderate' },
    features: {
      twitterEngagementVelocity: 320,
      redditEngagementVelocity: 28,
      crossPlatformCorrelation: 72,
      earlyInfluencerCaptureRate: 0.45,
      headlineSentiment: 0.4,
      headlineEmotion: 'positive',
      contentLength: 2500,
      hasMedia: true,
      hasNumbers: true,
      questionFormat: false,
      dayOfWeek: 5,
      hourOfDay: 14,
      daysSinceEvent: 14,
      topicAge: 72,
      competitionDensity: 0.72,
      keywordDifficulty: 82,
      trendMomentum: 20,
    },
    labeledAt: new Date(),
    labeledBy: 'system',
  },
  {
    id: 'sample-3',
    topic: {
      title: 'Remote Work Statistics 2024',
      category: 'business',
      keywords: ['remote work', 'statistics', 'workplace', '2024'],
      sources: [],
      metadata: {
        tweetCount: 800,
        redditPostCount: 45,
        newsArticleCount: 12,
        googleTrendsInterest: 35,
        breakoutPercent: 25,
        relatedQueries: ['work from home', 'WFH statistics'],
        geographicBreakdown: [],
      },
    },
    scores: {
      overall: 42,
      virality: { score: 35, twitterVelocity: 45, redditVelocity: 8, newsVelocity: 3, crossPlatformCorrelation: 35 },
      competitive: { score: 55, saturationIndex: 0.55, keywordDifficulty: 45, contentGap: 'medium', topCompetitors: [] },
      freshness: { score: 30, hoursSinceEmergence: 168, momentumBonus: 0.8, decayConstant: 0.001, projectedPeak: null },
      authority: { score: 60, tier: 'B', primarySources: [], originalReportingBonus: 0 },
      engagement: { score: 45, sentimentPolarity: 0.2, sentimentStrength: 0.35, saveBookmarkRate: 0.015, commentDepth: 2, shareToViewRatio: 0.008 },
    },
    outcome: { actualVirality: 28, engagementRate: 0.5, successScore: 42, category: 'flop' },
    features: {
      twitterEngagementVelocity: 45,
      redditEngagementVelocity: 8,
      crossPlatformCorrelation: 35,
      earlyInfluencerCaptureRate: 0.2,
      headlineSentiment: 0.2,
      headlineEmotion: 'neutral',
      contentLength: 1800,
      hasMedia: false,
      hasNumbers: true,
      questionFormat: false,
      dayOfWeek: 1,
      hourOfDay: 9,
      daysSinceEvent: 90,
      topicAge: 168,
      competitionDensity: 0.55,
      keywordDifficulty: 45,
      trendMomentum: 5,
    },
    labeledAt: new Date(),
    labeledBy: 'system',
  },
];

// GET /api/training - Get training data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') as TopicCategory | null;
  const limit = parseInt(searchParams.get('limit') || '50');
  const includeSamples = searchParams.get('includeSamples') === 'true';

  try {
    let examples = [...trainingExamples];

    if (includeSamples) {
      examples = [...sampleTrainingData, ...examples];
    }

    if (category) {
      examples = examples.filter((e) => e.topic.category === category);
    }

    return NextResponse.json({
      success: true,
      data: examples.slice(0, limit),
      count: examples.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Training GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}

// POST /api/training - Add training example
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, scores, outcome, features, labeledBy } = body;

    if (!topic || !scores || !outcome || !features) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: topic, scores, outcome, features' },
        { status: 400 }
      );
    }

    const example: TrainingExample = {
      id: `training-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      scores,
      outcome,
      features,
      labeledAt: new Date(),
      labeledBy: labeledBy || 'manual',
    };

    trainingExamples.push(example);

    return NextResponse.json({
      success: true,
      data: example,
      message: 'Training example added successfully',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Training POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add training example' },
      { status: 500 }
    );
  }
}

// DELETE /api/training - Clear training data
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clearAll = searchParams.get('clearAll') === 'true';

  try {
    if (clearAll) {
      trainingExamples.length = 0;
    }

    return NextResponse.json({
      success: true,
      message: clearAll ? 'All training examples cleared' : 'Training data preserved',
      count: trainingExamples.length,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Training DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear training data' },
      { status: 500 }
    );
  }
}
