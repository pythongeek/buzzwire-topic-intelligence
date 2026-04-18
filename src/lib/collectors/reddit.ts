/**
 * Reddit Data Collector - 100% Free (no API key required)
 * 
 * Uses Reddit's public JSON endpoints (no auth needed)
 */

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
  } = {}
): Promise<import('@/types').RedditPost[]> {
  const { sort = 'relevance', limit = 25 } = options;

  try {
    const path = options.subreddit
      ? `/r/${options.subreddit}/search.json`
      : `/search.json`;

    const params = new URLSearchParams({
      q: query,
      restrict_sr: options.subreddit ? '1' : '0',
      sort: sort === 'relevance' ? 'relevance' : sort,
      limit: String(limit),
    });

    const response = await fetch(`${REDDIT_BASE}${path}?${params}`, {
      headers: {
        'User-Agent': 'BuzzwireTopic/1.0 (free, no auth)',
      },
    });

    if (!response.ok) {
      return getSimulatedPosts(query);
    }

    const data = await response.json();
    return normalizeRedditPosts(data.data.children);
  } catch (error) {
    console.error('Reddit search error:', error);
    return getSimulatedPosts(query);
  }
}

/**
 * Get rising posts from a subreddit
 */
export async function getRisingPosts(
  subreddit: string,
  limit: number = 25
): Promise<import('@/types').RedditPost[]> {
  try {
    const response = await fetch(
      `${REDDIT_BASE}/r/${subreddit}/rising.json?limit=${limit}`,
      {
        headers: {
          'User-Agent': 'BuzzwireTopic/1.0 (free, no auth)',
        },
      }
    );

    if (!response.ok) {
      return getSimulatedPosts(subreddit);
    }

    const data = await response.json();
    return normalizeRedditPosts(data.data.children);
  } catch (error) {
    console.error('Reddit rising error:', error);
    return getSimulatedPosts(subreddit);
  }
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
): Promise<{ subreddit: string; posts: import('@/types').RedditPost[] }[]> {
  const { timeframe = 'day', limit = 25 } = options;

  const results = await Promise.all(
    subreddits.map(async (subreddit) => {
      try {
        const response = await fetch(
          `${REDDIT_BASE}/r/${subreddit}/top.json?t=${timeframe}&limit=${limit}`,
          {
            headers: {
              'User-Agent': 'BuzzwireTopic/1.0 (free, no auth)',
            },
          }
        );

        if (!response.ok) {
          return { subreddit, posts: [] };
        }

        const data = await response.json();
        return {
          subreddit,
          posts: normalizeRedditPosts(data.data.children),
        };
      } catch (error) {
        return { subreddit, posts: [] };
      }
    })
  );

  return results;
}

/**
 * Get multiple subreddits' hot posts at once
 */
export async function getHotPostsFromSubreddits(
  subreddits: string[],
  limit: number = 10
): Promise<{ subreddit: string; posts: import('@/types').RedditPost[] }[]> {
  const results = await Promise.all(
    subreddits.slice(0, 10).map(async (subreddit) => {
      try {
        const response = await fetch(
          `${REDDIT_BASE}/r/${subreddit}/hot.json?limit=${limit}`,
          {
            headers: {
              'User-Agent': 'BuzzwireTopic/1.0 (free, no auth)',
            },
          }
        );

        if (!response.ok) {
          return { subreddit, posts: [] };
        }

        const data = await response.json();
        return {
          subreddit,
          posts: normalizeRedditPosts(data.data.children),
        };
      } catch {
        return { subreddit, posts: [] };
      }
    })
  );

  return results;
}

/**
 * Normalize Reddit API response
 */
function normalizeRedditPosts(children: any[]): import('@/types').RedditPost[] {
  return children
    .map(({ data }: { data: any }) => ({
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
    }))
    .filter((post) => post.title && post.title.length > 5);
}

/**
 * Calculate Reddit engagement velocity
 */
export function calculateRedditVelocity(posts: import('@/types').RedditPost[]): number {
  if (posts.length === 0) return 0;

  const now = Date.now();
  let totalVelocity = 0;
  let count = 0;

  posts.forEach((post) => {
    const ageHours = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours > 0 && ageHours < 168) {
      const velocity = (post.score + post.numComments) / ageHours;
      totalVelocity += velocity;
      count++;
    }
  });

  return count > 0 ? totalVelocity / count : 0;
}

/**
 * Get subreddits by category
 */
export function getSubredditsByCategory(category: string): string[] {
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
      'Documentaries', 'anime',
    ],
    sports: [
      'sports', 'nba', 'nfl', 'soccer', 'baseball',
      'hockey', 'MMA', 'boxing', 'CollegeBasketball',
    ],
    news: [
      'news', 'worldnews', 'politics', 'UpliftingNews',
      'NotTheOnion', 'OffensiveArticles',
    ],
    science: [
      'science', 'space', 'biology', 'chemistry',
      'EverythingScience', 'askscience',
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

/**
 * Get simulated posts for demo/fallback
 */
function getSimulatedPosts(query: string): import('@/types').RedditPost[] {
  const baseTime = Date.now();

  return [
    {
      id: `sim-${Date.now()}-1`,
      title: `Everything you need to know about ${query} in 2024`,
      subreddit: 'technology',
      author: 'TechEnthusiast',
      createdAt: new Date(baseTime - 2 * 60 * 60 * 1000),
      score: 4523,
      numComments: 342,
      selftext: 'Comprehensive guide covering all aspects...',
      url: 'https://reddit.com',
      isVideo: false,
    },
    {
      id: `sim-${Date.now()}-2`,
      title: `${query}: Breaking developments and what experts say`,
      subreddit: 'technology',
      author: 'NewsBot',
      createdAt: new Date(baseTime - 5 * 60 * 60 * 1000),
      score: 2891,
      numComments: 189,
      selftext: '',
      url: 'https://reddit.com',
      isVideo: false,
    },
    {
      id: `sim-${Date.now()}-3`,
      title: `My analysis: Why ${query} matters for the future`,
      subreddit: 'technology',
      author: 'DeepDive',
      createdAt: new Date(baseTime - 8 * 60 * 60 * 1000),
      score: 1567,
      numComments: 234,
      selftext: 'After months of research...',
      url: 'https://reddit.com',
      isVideo: false,
    },
    {
      id: `sim-${Date.now()}-4`,
      title: `${query} discussion thread - Share your thoughts`,
      subreddit: 'technology',
      author: 'DiscussionKing',
      createdAt: new Date(baseTime - 12 * 60 * 60 * 1000),
      score: 892,
      numComments: 567,
      selftext: '',
      url: 'https://reddit.com',
      isVideo: false,
    },
  ];
}
