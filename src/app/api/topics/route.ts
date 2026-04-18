import { NextRequest, NextResponse } from 'next/server';
import { searchTweets, getTrendingTopics, calculateEngagementVelocity } from '@/lib/collectors/twitter';
import { searchPosts, getTopPostsFromSubreddits, calculateRedditVelocity } from '@/lib/collectors/reddit';
import { searchNews, calculateCoverageVelocity } from '@/lib/collectors/news';
import { getGoogleTrendsData, calculateTrendMomentum } from '@/lib/collectors/trends';
import { scoreTopic, TopicScoringInputs } from '@/lib/scoring';
import type { Topic, TopicCategory, ApiResponse, TopicScores } from '@/types';

// GET /api/topics - Get topics with scores
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const category = (searchParams.get('category') as TopicCategory) || 'technology';

  try {
    if (!query) {
      // Return trending topics if no query provided
      const trending = await getTrendingTopics();
      return NextResponse.json({
        success: true,
        data: trending.map((t) => ({
          id: `trend-${Date.now()}-${Math.random()}`,
          title: t.name,
          category: category,
          description: `${t.volume.toLocaleString()} tweets in past 24h`,
          keywords: [t.name.replace('#', '')],
          sources: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          lifecycleStage: 'emergence' as const,
          scores: {
            overall: Math.min(100, Math.round(t.volume / 1000)),
            virality: {
              score: Math.min(100, Math.round(t.volume / 1000)),
              twitterVelocity: t.volume / 24,
              redditVelocity: 0,
              newsVelocity: 0,
              crossPlatformCorrelation: 0,
            },
            competitive: {
              score: 50,
              saturationIndex: 0.5,
              keywordDifficulty: 50,
              contentGap: 'medium' as const,
              topCompetitors: [],
            },
            freshness: {
              score: 100,
              hoursSinceEmergence: 2,
              momentumBonus: 1.5,
              decayConstant: 0.05,
              projectedPeak: null,
            },
            authority: {
              score: 40,
              tier: 'UGC' as const,
              primarySources: [],
              originalReportingBonus: 0,
            },
            engagement: {
              score: 50,
              sentimentPolarity: 0,
              sentimentStrength: 0,
              saveBookmarkRate: 0,
              commentDepth: 0,
              shareToViewRatio: 0,
            },
          },
          metadata: {
            tweetCount: t.volume,
            redditPostCount: 0,
            newsArticleCount: 0,
            googleTrendsInterest: t.volume,
            breakoutPercent: null,
            relatedQueries: [],
            geographicBreakdown: [],
          },
        })),
        timestamp: new Date(),
      } as ApiResponse<Topic[]>);
    }

    // Collect data from all sources
    const [twitterTweets, redditPosts, newsArticles, trendsData] = await Promise.all([
      searchTweets(query, { maxResults: 10 }).catch(() => []),
      searchPosts(query, { limit: 10 }).catch(() => []),
      searchNews(query, { pageSize: 10 }).catch(() => []),
      getGoogleTrendsData(query).catch(() => null),
    ]);

    // Calculate velocities
    const twitterVelocity = calculateEngagementVelocity(twitterTweets);
    const redditVelocity = calculateRedditVelocity(redditPosts);
    const newsVelocity = calculateCoverageVelocity(newsArticles);
    const trendMomentum = trendsData
      ? calculateTrendMomentum(trendsData.interestOverTime)
      : 0;

    // Build scoring inputs
    const scoringInputs: TopicScoringInputs = {
      twitterTweets,
      twitterVelocity,
      redditPosts,
      redditVelocity,
      newsArticles,
      newsVelocity,
      keywordDifficulty: trendsData?.breakoutPercent
        ? Math.min(100, trendsData.breakoutPercent / 25)
        : 50,
      contentVolume: twitterTweets.length + redditPosts.length + newsArticles.length,
      topicAgeHours: 4, // Estimated
      emergenceTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      volumeHistory: trendsData?.interestOverTime.map((i) => i.value) || [],
      topicType: trendsData?.breakoutPercent && trendsData.breakoutPercent > 100 ? 'trend' : 'daily_news',
      currentVolume: twitterTweets.length + redditPosts.length,
      sources: [
        ...twitterTweets.map((t) => ({
          platform: 'twitter' as const,
          name: t.author.username,
          url: `https://twitter.com/${t.author.username}/status/${t.id}`,
          engagement: {
            likes: t.publicMetrics.likeCount,
            retweets: t.publicMetrics.retweetCount,
            comments: t.publicMetrics.replyCount,
          },
          publishedAt: t.createdAt,
        })),
        ...redditPosts.map((p) => ({
          platform: 'reddit' as const,
          name: p.subreddit,
          url: p.url,
          engagement: {
            likes: p.score,
            comments: p.numComments,
          },
          publishedAt: p.createdAt,
        })),
        ...newsArticles.map((a) => ({
          platform: 'news' as const,
          name: a.source.name,
          url: a.url,
          engagement: {},
          publishedAt: a.publishedAt,
        })),
      ],
    };

    // Calculate scores
    const scores = scoreTopic(`topic-${Date.now()}`, category, scoringInputs);

    // Build topic object
    const topic: Topic = {
      id: `topic-${Date.now()}`,
      title: query,
      category,
      description: `Trending topic: ${query}`,
      keywords: query.split(' ').filter((w) => w.length > 2),
      sources: scoringInputs.sources || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lifecycleStage: scores.freshness.hoursSinceEmergence < 6 ? 'emergence' :
                       scores.freshness.hoursSinceEmergence < 24 ? 'acceleration' :
                       scores.freshness.hoursSinceEmergence < 72 ? 'peak' : 'decay',
      scores,
      metadata: {
        tweetCount: twitterTweets.length,
        redditPostCount: redditPosts.length,
        newsArticleCount: newsArticles.length,
        googleTrendsInterest: trendsData?.breakoutPercent || 0,
        breakoutPercent: trendsData?.breakoutPercent || null,
        relatedQueries: trendsData?.relatedQueries.map((q) => q.query) || [],
        geographicBreakdown: trendsData?.geographicBreakdown || [],
      },
    };

    return NextResponse.json({
      success: true,
      data: topic,
      timestamp: new Date(),
    } as ApiResponse<Topic>);
  } catch (error) {
    console.error('Topics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

// POST /api/topics - Score a custom topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, data } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Use provided data or collect fresh data
    const scoringInputs: TopicScoringInputs = data || {
      topicAgeHours: 4,
      topicType: 'trend',
      currentVolume: 10,
    };

    const scores = scoreTopic(`topic-${Date.now()}`, category || 'technology', scoringInputs);

    const topic: Topic = {
      id: `topic-${Date.now()}`,
      title,
      category: (category as TopicCategory) || 'technology',
      description: `Custom topic: ${title}`,
      keywords: title.split(' ').filter((w: string) => w.length > 2),
      sources: scoringInputs.sources || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lifecycleStage: 'emergence',
      scores,
      metadata: {
        tweetCount: 0,
        redditPostCount: 0,
        newsArticleCount: 0,
        googleTrendsInterest: 0,
        breakoutPercent: null,
        relatedQueries: [],
        geographicBreakdown: [],
      },
    };

    return NextResponse.json({
      success: true,
      data: topic,
      timestamp: new Date(),
    } as ApiResponse<Topic>);
  } catch (error) {
    console.error('Topics POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
