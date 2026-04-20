/**
 * Twitter/X Data Collector - Real Data Only
 * 
 * Sources:
 * 1. Twitter Syndication API (public tweets)
 * 2. Nitter instances (no auth required)
 * 
 * Returns EMPTY ARRAY if no data - NO FAKE DATA
 */

import type { TwitterTweet } from '@/types';

/**
 * Search for real tweets
 */
export async function searchTweets(
  query: string,
  options: { maxResults?: number } = {}
): Promise<TwitterTweet[]> {
  const { maxResults = 10 } = options;

  // Try Twitter's mobile API
  try {
    const tweets = await tryTwitterMobileAPI(query, maxResults);
    if (tweets.length > 0) return tweets;
  } catch (e) {
    // Continue
  }

  // Try Nitter instances
  try {
    const tweets = await tryNitterWithTimeout(query, maxResults);
    if (tweets.length > 0) return tweets;
  } catch (e) {
    // Continue
  }

  // Return empty - NO FAKE DATA
  return [];
}

/**
 * Try Twitter's mobile API endpoint
 */
async function tryTwitterMobileAPI(query: string, maxResults: number): Promise<TwitterTweet[]> {
  try {
    const response = await fetch(
      `https://syndication.twitter.com/srv/timeline-profile/timeline?screen_name=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const html = await response.text();
      return parseTwitterTimelineHTML(html);
    }
  } catch (e) {
    // Fail silently
  }
  return [];
}

/**
 * Try Nitter with proper error handling and timeout
 */
async function tryNitterWithTimeout(query: string, maxResults: number): Promise<TwitterTweet[]> {
  const nitterInstances = [
    'https://nitter.privacydev.net',
    'https://nitter.poast.org', 
    'https://nitter.net',
  ];

  for (const baseUrl of nitterInstances) {
    try {
      const url = `${baseUrl}/search?f=tweets&q=${encodeURIComponent(query)}&n=${maxResults}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TopicResearchBot/1.0)',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const html = await response.text();
        const tweets = parseNitterHTML(html, maxResults);
        if (tweets.length > 0) {
          return tweets;
        }
      }
    } catch (e) {
      continue;
    }
  }

  return [];
}

/**
 * Parse Twitter timeline HTML
 */
function parseTwitterTimelineHTML(html: string): TwitterTweet[] {
  const tweets: TwitterTweet[] = [];
  
  const jsonMatch = html.match(/<script[^>]*>window\["__initial_data__"\]=([\s\S]*?);<\/script>/i);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const timeline = data?.timeline?.map?.((item: any) => ({
        id: item.tweet?.id || `tweet-${Math.random()}`,
        text: item.tweet?.text || '',
        author: {
          id: item.tweet?.user?.id || 'unknown',
          username: item.tweet?.user?.screen_name || 'unknown',
          followers: item.tweet?.user?.followers_count || 0,
        },
        createdAt: new Date(item.tweet?.created_at || Date.now()),
        publicMetrics: {
          retweetCount: item.tweet?.retweet_count || 0,
          likeCount: item.tweet?.favorite_count || 0,
          replyCount: item.tweet?.reply_count || 0,
          quoteCount: item.tweet?.quote_count || 0,
        },
      }));
      
      if (timeline && timeline.length > 0) {
        return timeline;
      }
    } catch (e) {
      // Parse failed
    }
  }
  
  return [];
}

/**
 * Parse Nitter HTML response
 */
function parseNitterHTML(html: string, maxResults: number): TwitterTweet[] {
  const tweets: TwitterTweet[] = [];
  
  const usernameRegex = /data-screen-name="([^"]+)"/g;
  const usernameMatches = [...html.matchAll(usernameRegex)];
  
  const textRegex = /<p[^>]*class="[^"]*tweet-content[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
  const textMatches = [...html.matchAll(textRegex)];
  
  const dateRegex = /class="tweet-date"[^>]*>[\s\S]*?<a[^>]*title="([^"]+)"/i;
  const dateMatches = [...html.matchAll(dateRegex)];
  
  const count = Math.min(usernameMatches.length, textMatches.length, maxResults || 10);
  
  for (let i = 0; i < count; i++) {
    const username = usernameMatches[i]?.[1];
    const text = textMatches[i]?.[1]?.replace(/<[^>]*>/g, '').trim();
    const dateStr = dateMatches[i]?.[1];
    
    if (username && text && text.length > 5) {
      tweets.push({
        id: `nitter-${Date.now()}-${i}`,
        text,
        author: {
          id: username,
          username,
          followers: 0,
        },
        createdAt: dateStr ? new Date(dateStr) : new Date(),
        publicMetrics: {
          retweetCount: 0,
          likeCount: 0,
          replyCount: 0,
          quoteCount: 0,
        },
      });
    }
  }
  
  return tweets;
}

/**
 * Get trending topics - real data only
 */
export async function getTrendingTopics(): Promise<{ name: string; volume: number }[]> {
  try {
    const response = await fetch(
      'https://syndication.twitter.com/srv/timeline-trends/list',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const html = await response.text();
      const trendsMatch = html.match(/Trends\s*=\s*(\[[\s\S]*?\])/);
      if (trendsMatch) {
        try {
          const trends = JSON.parse(trendsMatch[1]);
          return trends.slice(0, 10).map((t: any) => ({
            name: t.name || t.query || '',
            volume: t.volume || 0,
          })).filter(t => t.name && t.volume > 0);
        } catch (e) {
          // Parse failed
        }
      }
    }
  } catch (e) {
    // Fall through
  }
  
  return [];
}

/**
 * Calculate engagement velocity
 */
export function calculateEngagementVelocity(tweets: TwitterTweet[]): number {
  if (tweets.length === 0) return 0;

  const now = Date.now();
  let totalVelocity = 0;

  tweets.forEach((tweet) => {
    const ageHours = Math.max(0.1, (now - new Date(tweet.createdAt).getTime()) / (1000 * 60 * 60));
    const engagement =
      tweet.publicMetrics.likeCount +
      tweet.publicMetrics.retweetCount * 2 +
      tweet.publicMetrics.replyCount * 3;
    
    totalVelocity += engagement / ageHours;
  });

  return totalVelocity / tweets.length;
}