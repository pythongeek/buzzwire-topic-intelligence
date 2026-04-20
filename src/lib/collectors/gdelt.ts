/**
 * GDELT News Collector - 100% Free Global News Coverage
 * 
 * GDELT (Global Database of Events, Language, and Tone) monitors
 * news from worldwide in 100+ languages from 1979 to present.
 * 
 * Free API: https://api.gdeltproject.org/
 * No API key required for basic usage!
 */

import type { NewsArticle } from '@/types';

// GDELT API bases
const GDELT_BASE = 'https://api.gdeltproject.org/api/v1';
const GDELT_DOCS = 'https://api.gdeltproject.org/api/v2/docdoc/doc';

interface GDELTArticle {
  seendate: string;
  sourcelang: string;
  sourceurl: string;
  title: string;
  text: string;
}

/**
 * Search GDELT for news articles on a topic
 * Free, no API key required
 */
export async function searchGDELT(
  query: string,
  options: {
    maxResults?: number;
    mode?: 'artlist' | 'arttimeline' | 'volartlist';
    format?: 'json' | 'html' | 'csv';
  } = {}
): Promise<NewsArticle[]> {
  const { maxResults = 20, mode = 'artlist', format = 'json' } = options;

  try {
    // GDELT Article Search API
    const params = new URLSearchParams({
      query,
      mode,
      format,
      maxarticles: String(maxResults),
    });

    const url = `${GDELT_DOCS}?${params}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BuzzwireTopic/1.0 (research)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`GDELT API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (data?.articles) {
      return data.articles.map(normalizeGDELTArticle);
    }
    
    // Fallback if no articles
    return [];
  } catch (e) {
    console.error('GDELT fetch error:', e);
    return [];
  }
}

/**
 * Get latest news from GDELT (last 15 minutes)
 */
export async function getLatestNews(
  options: { maxResults?: number; sourcelang?: string } = {}
): Promise<NewsArticle[]> {
  const { maxResults = 20, sourcelang = 'english' } = options;

  try {
    // GDELT's last 15 minutes of news
    const url = `${GDELT_DOCS}?query=%22%22&mode=artlist&format=json&maxarticles=${maxResults}&sourcelang=${sourcelang}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BuzzwireTopic/1.0 (research)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (data?.articles) {
      return data.articles.map(normalizeGDELTArticle);
    }
    
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Search by theme (GDELT themes)
 */
export async function searchByTheme(
  theme: string,
  options: { maxResults?: number } = {}
): Promise<NewsArticle[]> {
  const { maxResults = 20 } = options;

  // GDELT themes include: ENVIRONMENT, SCIENCE, POLITICS, etc.
  const themeQuery = `theme:${theme}`;
  
  try {
    const params = new URLSearchParams({
      query: themeQuery,
      mode: 'artlist',
      format: 'json',
      maxarticles: String(maxResults),
    });

    const url = `${GDELT_DOCS}?${params}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BuzzwireTopic/1.0 (research)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (data?.articles) {
      return data.articles.map(normalizeGDELTArticle);
    }
    
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Get trending topics from GDELT
 */
export async function getTrendingFromGDELT(
  options: { maxResults?: number } = {}
): Promise<{ topic: string; count: number; themes: string[] }[]> {
  const { maxResults = 10 } = options;

  // Common trending themes in GDELT
  const themes = [
    'ECON_UNEMPLOYMENT', 'ENV_CLIMATE', 'SECURITY_WAR_CONFLICT',
    'TECH_AI', 'POLITICS_ELECTION', 'HEALTH_DISEASE',
    'ECON_STOCKMARKET', 'ENV_POLLUTION', 'LAW_CRIME',
  ];

  const trending: { topic: string; count: number; themes: string[] }[] = [];

  for (const theme of themes.slice(0, maxResults)) {
    try {
      const articles = await searchByTheme(theme, { maxResults: 5 });
      if (articles.length > 0) {
        trending.push({
          topic: theme.replace('SECURITY_', '').replace('ENV_', '').replace('ECON_', '').replace('TECH_', '').replace('POLITICS_', '').replace('HEALTH_', '').replace('LAW_', '').replace('_', ' '),
          count: articles.length,
          themes: [theme],
        });
      }
    } catch (e) {
      // Skip this theme
    }
  }

  return trending;
}

/**
 * Normalize GDELT article to our format
 */
function normalizeGDELTArticle(article: any): NewsArticle {
  return {
    title: article.title || article.seename || 'Untitled',
    description: article.text?.slice(0, 200) || article.title?.slice(0, 200) || '',
    url: article.sourceurl || article.url || '',
    urlToImage: null,
    publishedAt: article.seeddate ? new Date(article.seeddate) : new Date(article.seendate || Date.now()),
    source: {
      id: article.domain || 'gdelt',
      name: article.source || article.domain || 'GDELT',
    },
    author: null,
  };
}



/**
 * Calculate GDELT coverage velocity
 */
export function calculateGDELTVelocity(articles: NewsArticle[]): number {
  if (articles.length === 0) return 0;

  const now = Date.now();
  let totalVelocity = 0;

  articles.forEach((article) => {
    const ageHours = Math.max(0.1, (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60));
    // More recent = higher velocity
    const velocity = 1 / Math.sqrt(ageHours);
    totalVelocity += velocity;
  });

  return totalVelocity / articles.length;
}

/**
 * Export collector
 */
export const gdeltCollector = {
  searchGDELT,
  getLatestNews,
  searchByTheme,
  getTrendingFromGDELT,
  calculateGDELTVelocity,
};