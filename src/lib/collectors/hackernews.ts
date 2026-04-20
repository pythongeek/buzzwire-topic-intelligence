/**
 * Hacker News Data Collector - 100% Free API
 * 
 * Uses Algolia's hosted HN API (no auth required)
 * Source: https://github.com/HackerNews/API
 */

import type { NewsArticle } from '@/types';

// Algolia HN API base
const HN_API_BASE = 'https://hn.algolia.com/api/v1';

/**
 * Get top stories from Hacker News
 */
export async function getTopStories(limit: number = 20): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${HN_API_BASE}/search?tags=front_page&hitsPerPage=${limit}`,
      {
        headers: {
          'User-Agent': 'BuzzwireTopic/1.0 (research)',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.hits.map(normalizeHNArticle);
  } catch (e) {
    return [];
  }
}

/**
 * Search Hacker News stories
 */
export async function searchStories(
  query: string,
  options: { limit?: number; tags?: string } = {}
): Promise<NewsArticle[]> {
  const { limit = 20 } = options;

  try {
    const response = await fetch(
      `${HN_API_BASE}/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`,
      {
        headers: {
          'User-Agent': 'BuzzwireTopic/1.0 (research)',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.hits.map(normalizeHNArticle);
  } catch (e) {
    return [];
  }
}

/**
 * Get newest stories
 */
export async function getNewestStories(limit: number = 20): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${HN_API_BASE}/search?tags=story&sort=byDate&hitsPerPage=${limit}`,
      {
        headers: {
          'User-Agent': 'BuzzwireTopic/1.0 (research)',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.hits.map(normalizeHNArticle);
  } catch (e) {
    return [];
  }
}

/**
 * Get Ask HN posts (discussion threads)
 */
export async function getAskHNPosts(limit: number = 15): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${HN_API_BASE}/search?query=ask hn&tags=ask_hn&hitsPerPage=${limit}`,
      {
        headers: {
          'User-Agent': 'BuzzwireTopic/1.0 (research)',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.hits.map(normalizeHNArticle);
  } catch (e) {
    return [];
  }
}

/**
 * Get Show HN posts
 */
export async function getShowHNPosts(limit: number = 15): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `${HN_API_BASE}/search?query=&tags=show_hn&hitsPerPage=${limit}`,
      {
        headers: {
          'User-Agent': 'BuzzwireTopic/1.0 (research)',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.hits.map(normalizeHNArticle);
  } catch (e) {
    return [];
  }
}

/**
 * Normalize HN article to our NewsArticle format
 */
function normalizeHNArticle(hit: any): NewsArticle {
  return {
    title: hit.title || 'Untitled',
    description: hit.text || hit.comment_text || (hit.title?.slice(0, 160) + (hit.title?.length > 160 ? '...' : '')),
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    urlToImage: null, // HN doesn't have images in API
    publishedAt: new Date(hit.created_at || Date.now()),
    source: {
      id: 'hackernews',
      name: 'Hacker News',
    },
    author: hit.author || 'Anonymous',
  };
}



/**
 * Calculate HN engagement velocity
 */
export function calculateHNVelocity(articles: NewsArticle[]): number {
  if (articles.length === 0) return 0;

  const now = Date.now();
  let totalVelocity = 0;

  articles.forEach((article) => {
    const ageHours = Math.max(0.1, (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60));
    // HN engagement is primarily in comments (approximated by age factor)
    const engagement = 1 / ageHours;
    totalVelocity += engagement;
  });

  return totalVelocity / articles.length;
}

/**
 * Export collector interface
 */
export const hackerNewsCollector = {
  getTopStories,
  searchStories,
  getNewestStories,
  getAskHNPosts,
  getShowHNPosts,
  calculateHNVelocity,
};