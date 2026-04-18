import type { RedditPost } from '@/types';

/**
 * Reddit Data Collector
 * 
 * Data Sources:
 * - Reddit API (no auth for public endpoints)
 * - Pushshift.io (historical data)
 */

const PUSHSHIFT_URL = 'https://api.pusht.sh/reddit';
const REDDIT_BASE = 'https://www.reddit.com';

/**
 * Search posts across Reddit
 */
export async function searchPosts(
  query: string,
  options: {
    subreddit?: string;
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    limit?: number;
    after?: Date;
    before?: Date;
  } = {}
): Promise<RedditPost[]> {
  const { sort = 'relevance', limit = 25, after, before } = options;

  if (after || before) {
    return searchPostsViaPushshift(query, options);
  }
  
  return searchPostsViaReddit(query, { ...options, sort, limit });
}

/**
 * Search posts via Reddit's official API
 */
async function searchPostsViaReddit(
  query: string,
  options: {
    subreddit?: string;
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    limit?: number;
  }
): Promise<RedditPost[]> {
  const { subreddit, sort = 'relevance', limit = 25 } = options;

  const path = subreddit
    ? `/r/${subreddit}/search.json`
    : `/search.json`;

  const params = new URLSearchParams({
    q: query,
    restrict_sr: subreddit ? '1' : '0',
    sort,
    limit: String(limit),
  });

  const response = await fetch(`${REDDIT_BASE}${path}?${params}`, {
    headers: {
      'User-Agent': 'BuzzwireTopicIntelligence/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();
  return normalizeRedditPosts(data.data.children);
}

/**
 * Search posts via Pushshift (better for historical data)
 */
async function searchPostsViaPushshift(
  query: string,
  options: {
    subreddit?: string;
    limit?: number;
    after?: Date;
    before?: Date;
  }
): Promise<RedditPost[]> {
  const { subreddit, limit = 25, after, before } = options;

  const params = new URLSearchParams({
    query,
    limit: String(limit),
    sort: 'desc',
    sort_type: 'score',
  });

  if (subreddit) params.set('subreddit', subreddit);
  if (after) params.set('after', String(Math.floor(after.getTime() / 1000)));
  if (before) params.set('before', String(Math.floor(before.getTime() / 1000)));

  const response = await fetch(`${PUSHSHIFT_URL}/search?${params}`, {
    headers: {
      'User-Agent': 'BuzzwireTopicIntelligence/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Pushshift API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.map(normalizePushshiftPost);
}

/**
 * Get rising posts from a subreddit
 */
export async function getRisingPosts(
  subreddit: string,
  limit: number = 25
): Promise<RedditPost[]> {
  const response = await fetch(
    `${REDDIT_BASE}/r/${subreddit}/rising.json?limit=${limit}`,
    {
      headers: {
        'User-Agent': 'BuzzwireTopicIntelligence/1.0',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();
  return normalizeRedditPosts(data.data.children);
}

/**
 * Get top posts from multiple subreddits
 */
export async function getTopPostsFromSubreddits(
  subreddits: string[],
  options: {
    timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year';
    limit?: number;
  } = {}
): Promise<{ subreddit: string; posts: RedditPost[] }[]> {
  const { timeframe = 'day', limit = 25 } = options;

  const results = await Promise.all(
    subreddits.map(async (subreddit) => {
      try {
        const response = await fetch(
          `${REDDIT_BASE}/r/${subreddit}/top.json?t=${timeframe}&limit=${limit}`,
          {
            headers: {
              'User-Agent': 'BuzzwireTopicIntelligence/1.0',
            },
          }
        );

        if (!response.ok) {
          console.error(`Error fetching r/${subreddit}: ${response.status}`);
          return { subreddit, posts: [] };
        }

        const data = await response.json();
        return {
          subreddit,
          posts: normalizeRedditPosts(data.data.children),
        };
      } catch (error) {
        console.error(`Error fetching r/${subreddit}:`, error);
        return { subreddit, posts: [] };
      }
    })
  );

  return results;
}

/**
 * Normalize Reddit API response
 */
function normalizeRedditPosts(children: any[]): RedditPost[] {
  return children.map(({ data }: { data: any }) => ({
    id: data.id,
    title: data.title,
    subreddit: data.subreddit,
    author: data.author,
    createdAt: new Date(data.created_utc * 1000),
    score: data.score,
    numComments: data.num_comments,
    selftext: data.selftext,
    url: data.url,
    isVideo: data.is_video,
  }));
}

/**
 * Normalize Pushshift response
 */
function normalizePushshiftPost(post: any): RedditPost {
  return {
    id: post.id,
    title: post.title,
    subreddit: post.subreddit,
    author: post.author,
    createdAt: new Date(post.created_utc * 1000),
    score: post.score,
    numComments: post.num_comments,
    selftext: post.selftext,
    url: post.url,
    isVideo: post.is_video || false,
  };
}

/**
 * Calculate Reddit engagement velocity
 */
export function calculateRedditVelocity(posts: RedditPost[]): number {
  if (posts.length === 0) return 0;

  const now = Date.now();
  let totalVelocity = 0;

  posts.forEach((post) => {
    const ageHours = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours > 0 && ageHours < 168) {
      // Within 1 week
      const velocity = (post.score + post.numComments) / ageHours;
      totalVelocity += velocity;
    }
  });

  return totalVelocity / posts.length;
}

/**
 * Get subreddits by category
 */
export function getSubredditsByCategory(
  category: string
): string[] {
  const categoryMap: Record<string, string[]> = {
    technology: [
      'technology', 'programming', 'computers', 'gadgets', 'tech',
      'SoftwareGore', 'ProgrammerHumor', 'machinelearning', 'artificial',
    ],
    business: [
      'business', 'entrepreneur', 'startups', 'smallbusiness',
      'investing', 'finance', 'economics', 'wallstreetbets',
    ],
    entertainment: [
      'movies', 'television', 'music', 'gaming', 'books',
      'television', 'movies', 'Documentaries', 'anime',
    ],
    sports: [
      'sports', 'nba', 'nfl', 'soccer', 'baseball',
      'hockey', 'MMA', 'boxing', 'CollegeBasketball',
    ],
    news: [
      'news', 'worldnews', 'politics', 'UpliftingNews',
      'NotTheOnion', 'OffensiveArticles', 'news', 'truenews',
    ],
    science: [
      'science', 'space', '物理学', 'biology', 'chemistry',
      'technology', 'EverythingScience', 'askscience',
    ],
    health: [
      'health', 'fitness', 'nutrition', 'mentalhealth',
      'medical', 'PublicHealth', 'Wellness',
    ],
    lifestyle: [
      'lifestyle', 'food', 'travel', 'fashion', 'DIY',
      'LifeProTips', 'todayilearned', 'aww',
    ],
  };

  return categoryMap[category.toLowerCase()] || categoryMap.news;
}
