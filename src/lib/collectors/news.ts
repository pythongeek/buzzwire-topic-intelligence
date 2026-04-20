/**
 * News Data Collector - Real Data Only
 * 
 * Sources:
 * - Google News RSS (free, no API key)
 * - Hacker News Algolia API (free, no auth)
 * 
 * Returns EMPTY ARRAY if no data - NO FAKE DATA
 */

import type { NewsArticle } from '@/types';

const GOOGLE_NEWS_RSS = 'https://news.google.com/rss';
const HACKERNEWS_API = 'https://hn.algolia.com/api/v1';

/**
 * Search news articles via Google News RSS - REAL DATA ONLY
 */
export async function searchNews(
  query: string,
  options: {
    language?: string;
    pageSize?: number;
  } = {}
): Promise<NewsArticle[]> {
  const { language = 'en', pageSize = 20 } = options;

  try {
    const searchUrl = `${GOOGLE_NEWS_RSS}/search?q=${encodeURIComponent(query)}&hl=${language}&gl=${language}&ceid=${language.toUpperCase()}:EN`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseRSSArticles(xml, pageSize);
  } catch (error) {
    console.error('Google News RSS error:', error);
    return [];
  }
}

/**
 * Get top headlines by category via Google News RSS
 */
export async function getTopHeadlines(
  category?: string,
  options: {
    country?: string;
    pageSize?: number;
  } = {}
): Promise<NewsArticle[]> {
  const { country = 'US', pageSize = 20 } = options;

  const topicMap: Record<string, string> = {
    technology: 'CBIlzBcCNPI',
    business: 'CAAqJggKIiBDQkFTRWdvSkwyMHZnNXJXVktTZ0FQAVMaG9UVmsrY0EvSUJv',
    sports: 'CAAqJggKIiBDQkFTRWdvSkwyMHZnVkZ5Q0FOTXBGMGdCakF4a0Foa0FQAQ',
    science: 'CAAqJggKIiBDQkFTRWdvSkwyMHZnV1FrV0FoaG9UVmsrY0EvSUFv',
    health: 'CAAqJggKIiBDQkFTRWdvSkwyMHZnVkxDTUVaR0FoaG9UVmsrY0EvSUFv',
    entertainment: 'CAAqJggKIiBDQkFTRWdvSkwyMHZnd0JwV0FrSkFoaG9UVmsrY0EvSUFv',
  };

  try {
    const topicCode = category ? topicMap[category] || topicMap.technology : topicMap.technology;
    
    const rssUrl = `${GOOGLE_NEWS_RSS}/topics/${topicCode}?hl=${country === 'US' ? 'en-US' : country}&gl=${country === 'US' ? 'US' : country}`;

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseRSSArticles(xml, pageSize);
  } catch (error) {
    console.error('Google News topics error:', error);
    return [];
  }
}

/**
 * Get news from Hacker News - REAL DATA ONLY
 */
export async function getHackerNewsTopStories(limit: number = 20): Promise<NewsArticle[]> {
  try {
    const response = await fetch(`${HACKERNEWS_API}/search?query=all&tags=story&hitsPerPage=${limit}`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    return data.hits.map((hit: any) => ({
      title: hit.title || 'Untitled',
      description: hit.story_text || hit.comment_text || '',
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      urlToImage: null,
      publishedAt: new Date(hit.created_at || Date.now()),
      source: {
        id: 'hackernews',
        name: 'Hacker News',
      },
      author: hit.author || 'Anonymous',
    }));
  } catch (error) {
    console.error('Hacker News API error:', error);
    return [];
  }
}

/**
 * Parse RSS XML to articles
 */
function parseRSSArticles(xml: string, maxArticles: number): NewsArticle[] {
  const articles: NewsArticle[] = [];
  
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) && articles.length < maxArticles) {
    const content = match[1];

    const title = extractXmlTag(content, 'title');
    const description = extractXmlTag(content, 'description');
    const link = extractXmlTag(content, 'link');
    const pubDate = extractXmlTag(content, 'pubDate');
    const source = extractXmlTag(content, 'source') || 'Google News';

    if (title && link) {
      articles.push({
        title: cleanHtml(title),
        description: cleanHtml(description || ''),
        url: link,
        urlToImage: extractImageFromDescription(description || ''),
        publishedAt: pubDate ? new Date(pubDate) : new Date(),
        source: {
          id: null,
          name: cleanHtml(source),
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
  const regex = new RegExp(`<${tag}(?:[^>]*)?>([^<]*)</${tag}>`, 'i');
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
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Extract image URL from Google News description
 */
function extractImageFromDescription(description: string): string | null {
  const imgMatch = description.match(/src=["']([^"']*)["']/i);
  if (imgMatch && imgMatch[1] && !imgMatch[1].includes('data:')) {
    return imgMatch[1];
  }
  
  const ogMatch = description.match(/content=["']([^"']*image[^"']*)["']/i);
  if (ogMatch) return ogMatch[1];
  
  return null;
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
      totalVelocity += 1 / ageHours;
      count++;
    }
  });

  return count > 0 ? (totalVelocity / count) * 100 : 0;
}