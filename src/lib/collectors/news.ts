import type { NewsArticle, GoogleTrendsData } from '@/types';

/**
 * News API Collector
 * 
 * Data Sources:
 * - NewsAPI.org (free tier: 100 requests/day)
 * - Google News RSS (backup)
 */

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';

/**
 * Search news articles
 */
export async function searchNews(
  query: string,
  options: {
    language?: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru';
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
    pageSize?: number;
    from?: Date;
    to?: Date;
    domains?: string[];
  } = {}
): Promise<NewsArticle[]> {
  const {
    language = 'en',
    sortBy = 'relevancy',
    pageSize = 20,
    from,
    to,
    domains,
  } = options;

  if (NEWS_API_KEY) {
    return searchNewsViaAPI(query, { language, sortBy, pageSize, from, to, domains });
  }

  return searchNewsViaRSS(query);
}

/**
 * Search news via NewsAPI.org
 */
async function searchNewsViaAPI(
  query: string,
  options: {
    language?: string;
    sortBy?: string;
    pageSize?: number;
    from?: Date;
    to?: Date;
    domains?: string[];
  }
): Promise<NewsArticle[]> {
  const { language, sortBy, pageSize, from, to, domains } = options;

  const params = new URLSearchParams({
    q: query,
    language,
    sortBy,
    pageSize: String(pageSize),
    apiKey: NEWS_API_KEY!,
  });

  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  if (domains?.length) params.set('domains', domains.join(','));

  const response = await fetch(`${NEWS_API_BASE}/everything?${params}`);

  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }

  const data = await response.json();
  return data.articles.map(normalizeNewsArticle);
}

/**
 * Get top headlines by category
 */
export async function getTopHeadlines(
  category?: string,
  options: {
    country?: string;
    pageSize?: number;
  } = {}
): Promise<NewsArticle[]> {
  const { country = 'us', pageSize = 20 } = options;

  if (!NEWS_API_KEY) {
    return getSimulatedHeadlines(category);
  }

  const params = new URLSearchParams({
    country,
    pageSize: String(pageSize),
    apiKey: NEWS_API_KEY!,
  });

  if (category) params.set('category', category);

  const response = await fetch(`${NEWS_API_BASE}/top-headlines?${params}`);

  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }

  const data = await response.json();
  return data.articles.map(normalizeNewsArticle);
}

/**
 * Search news via Google News RSS (no API key required)
 */
async function searchNewsViaRSS(query: string): Promise<NewsArticle[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  const response = await fetch(rssUrl);

  if (!response.ok) {
    throw new Error(`Google News RSS error: ${response.status}`);
  }

  const xml = await response.text();
  return parseRSSArticles(xml);
}

/**
 * Parse RSS XML to articles
 */
function parseRSSArticles(xml: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) && articles.length < 20) {
    const content = match[1];

    const title = extractXmlTag(content, 'title');
    const description = extractXmlTag(content, 'description');
    const link = extractXmlTag(content, 'link');
    const pubDate = extractXmlTag(content, 'pubDate');
    const source = extractXmlTag(content, 'source');

    if (title && link) {
      articles.push({
        title: cleanHtml(title),
        description: cleanHtml(description || ''),
        url: link,
        urlToImage: extractImageFromDescription(description || ''),
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        source: {
          id: null,
          name: source || 'Unknown',
        },
        author: null,
      });
    }
  }

  return articles;
}

/**
 * Extract a tag from XML content
 */
function extractXmlTag(content: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Clean HTML from text
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Extract image URL from Google News description
 */
function extractImageFromDescription(description: string): string | null {
  const imgMatch = description.match(/src=["']([^"']*)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

/**
 * Normalize NewsAPI article
 */
function normalizeNewsArticle(article: any): NewsArticle {
  return {
    title: article.title,
    description: article.description || '',
    url: article.url,
    urlToImage: article.urlToImage,
    publishedAt: new Date(article.publishedAt),
    source: {
      id: article.source?.id || null,
      name: article.source?.name || 'Unknown',
    },
    author: article.author,
  };
}

/**
 * Get simulated headlines for demo
 */
function getSimulatedHeadlines(category?: string): NewsArticle[] {
  const headlines: Record<string, NewsArticle[]> = {
    technology: [
      {
        title: 'AI Breakthrough: New Model Achieves Human-Level Reasoning',
        description: 'Researchers announce major advancement in artificial intelligence capabilities.',
        url: 'https://example.com/ai-breakthrough',
        urlToImage: 'https://picsum.photos/seed/tech1/800/400',
        publishedAt: new Date(),
        source: { id: null, name: 'Tech Daily' },
        author: 'Sarah Chen',
      },
      {
        title: 'Apple Unveils Next-Generation Device Features',
        description: 'The tech giant reveals plans for revolutionary new product line.',
        url: 'https://example.com/apple-news',
        urlToImage: 'https://picsum.photos/seed/tech2/800/400',
        publishedAt: new Date(),
        source: { id: null, name: 'Tech Insider' },
        author: 'Mike Johnson',
      },
    ],
    business: [
      {
        title: 'Stock Market Hits Record High Amid Economic Optimism',
        description: 'Major indices surge as investors respond positively to earnings reports.',
        url: 'https://example.com/market-news',
        urlToImage: 'https://picsum.photos/seed/biz1/800/400',
        publishedAt: new Date(),
        source: { id: null, name: 'Financial Times' },
        author: 'Jane Smith',
      },
    ],
    default: [
      {
        title: 'Breaking: Major Event Shakes Global Markets',
        description: 'Developing story as events unfold around the world.',
        url: 'https://example.com/breaking',
        urlToImage: 'https://picsum.photos/seed/news1/800/400',
        publishedAt: new Date(),
        source: { id: null, name: 'Global News' },
        author: 'News Desk',
      },
    ],
  };

  return headlines[category || 'default'] || headlines.default;
}

/**
 * Calculate news coverage velocity
 */
export function calculateCoverageVelocity(articles: NewsArticle[]): number {
  if (articles.length === 0) return 0;

  const now = Date.now();
  let totalVelocity = 0;
  let count = 0;

  articles.forEach((article) => {
    const ageHours = (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours > 0 && ageHours < 72) {
      totalVelocity += 1 / ageHours; // More recent = higher velocity
      count++;
    }
  });

  return count > 0 ? (totalVelocity / count) * 100 : 0;
}
