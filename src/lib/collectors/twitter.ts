import type { TwitterTweet } from '@/types';

/**
 * Twitter/X Data Collector
 * 
 * Data Sources:
 * - Twitter API v2 (free tier: 500K tweets/month)
 * - Nitter RSS (backup, no auth required)
 */

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const NITTER_INSTANCES = [
  'nitter.net',
  'nitter.privacydev.net',
  'nitter.poast.org',
];

/**
 * Search for tweets matching a query
 */
export async function searchTweets(
  query: string,
  options: {
    maxResults?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<TwitterTweet[]> {
  const { maxResults = 10, startDate, endDate } = options;

  if (TWITTER_BEARER_TOKEN) {
    return searchTweetsViaAPI(query, { maxResults, startDate, endDate });
  } else {
    return searchTweetsViaNitter(query, { maxResults });
  }
}

/**
 * Get tweets via Twitter API v2
 */
async function searchTweetsViaAPI(
  query: string,
  options: { maxResults?: number; startDate?: Date; endDate?: Date }
): Promise<TwitterTweet[]> {
  const { maxResults = 10, startDate, endDate } = options;

  const params = new URLSearchParams({
    query,
    'max_results': String(maxResults),
    'tweet.fields': 'created_at,public_metrics,context_annotations,author_id',
    'expansions': 'author_id',
    'user.fields': 'name,username,public_metrics',
  });

  if (startDate) params.set('start_time', startDate.toISOString());
  if (endDate) params.set('end_time', endDate.toISOString());

  const response = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?${params}`,
    {
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status}`);
  }

  const data = await response.json();
  return normalizeTweets(data);
}

/**
 * Search tweets via Nitter RSS (no auth required)
 */
async function searchTweetsViaNitter(
  query: string,
  options: { maxResults?: number }
): Promise<TwitterTweet[]> {
  const { maxResults = 10 } = options;
  const instance = NITTER_INSTANCES[0];
  
  // Nitter doesn't support search, so we get trending and filter
  const response = await fetch(`${instance}/`);
  
  if (!response.ok) {
    throw new Error(`Nitter error: ${response.status}`);
  }

  const html = await response.text();
  
  // Parse Nitter HTML to extract tweets
  // This is a simplified parser - in production use a proper HTML parser
  const tweets = parseNitterHtml(html, maxResults);
  
  return tweets;
}

/**
 * Get trending topics from Twitter
 */
export async function getTrendingTopics(
  location: 'worldwide' | string = 'worldwide'
): Promise<{ name: string; volume: number }[]> {
  if (!TWITTER_BEARER_TOKEN) {
    // Fallback to simulated data for demo
    return getSimulatedTrendingTopics();
  }

  // Twitter's trends endpoint requires place WOEID
  const WOEID_MAP: Record<string, number> = {
    worldwide: 1,
    'us': 23424977,
    'uk': 23424975,
  };

  const woeid = WOEID_MAP[location] || WOEID_MAP.worldwide;

  const response = await fetch(
    `https://api.twitter.com/1.1/trends/place.json?id=${woeid}`,
    {
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status}`);
  }

  const data = await response.json();
  return data[0].trends.map((trend: { name: string; tweet_volume: number }) => ({
    name: trend.name,
    volume: trend.tweet_volume || 0,
  }));
}

/**
 * Normalize Twitter API response to our types
 */
function normalizeTweets(data: any): TwitterTweet[] {
  if (!data.data) return [];

  const users = data.includes?.users || [];
  const userMap = new Map(users.map((u: any) => [u.id, u]));

  return data.data.map((tweet: any) => {
    const author = userMap.get(tweet.author_id) || {};
    
    return {
      id: tweet.id,
      text: tweet.text,
      author: {
        id: tweet.author_id,
        username: author.username || 'unknown',
        followers: author.public_metrics?.followers_count || 0,
      },
      createdAt: new Date(tweet.created_at),
      publicMetrics: {
        retweetCount: tweet.public_metrics?.retweet_count || 0,
        likeCount: tweet.public_metrics?.like_count || 0,
        replyCount: tweet.public_metrics?.reply_count || 0,
        quoteCount: tweet.public_metrics?.quote_count || 0,
      },
      contextAnnotations: tweet.context_annotations || [],
    };
  });
}

/**
 * Parse Nitter HTML to extract tweets
 */
function parseNitterHtml(html: string, maxResults: number): TwitterTweet[] {
  // Simplified parsing - in production use Cheerio or similar
  const tweets: TwitterTweet[] = [];
  const tweetRegex = /<tweet[^>]*>([\s\S]*?)<\/tweet>/gi;
  let match;
  let count = 0;

  while ((match = tweetRegex.exec(html)) && count < maxResults) {
    const content = match[1];
    const usernameMatch = content.match(/data-username="([^"]*)"/);
    const textMatch = content.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    
    if (usernameMatch && textMatch) {
      tweets.push({
        id: `nitter-${count}`,
        text: textMatch[1].replace(/<[^>]*>/g, ''),
        author: {
          id: usernameMatch[1],
          username: usernameMatch[1],
          followers: 0,
        },
        createdAt: new Date(),
        publicMetrics: {
          retweetCount: 0,
          likeCount: 0,
          replyCount: 0,
          quoteCount: 0,
        },
      });
      count++;
    }
  }

  return tweets;
}

/**
 * Get simulated trending topics for demo
 */
function getSimulatedTrendingTopics(): { name: string; volume: number }[] {
  return [
    { name: '#AI', volume: 125000 },
    { name: '#OpenAI', volume: 89000 },
    { name: '#TechNews', volume: 67000 },
    { name: '#Gaming', volume: 54000 },
    { name: '#Sports', volume: 42000 },
    { name: '#Business', volume: 38000 },
    { name: '#Science', volume: 31000 },
    { name: '#Health', volume: 28000 },
    { name: '#Entertainment', volume: 25000 },
    { name: '#Politics', volume: 22000 },
  ];
}

/**
 * Calculate engagement velocity (engagements per hour)
 */
export function calculateEngagementVelocity(tweets: TwitterTweet[]): number {
  if (tweets.length === 0) return 0;

  const now = Date.now();
  let totalEngagement = 0;
  let totalHours = 0;

  tweets.forEach((tweet) => {
    const ageHours = (now - new Date(tweet.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours > 0) {
      const engagement =
        tweet.publicMetrics.likeCount +
        tweet.publicMetrics.retweetCount * 2 +
        tweet.publicMetrics.replyCount * 3;
      
      totalEngagement += engagement / ageHours;
      totalHours += 1;
    }
  });

  return totalHours > 0 ? totalEngagement / totalHours : 0;
}
