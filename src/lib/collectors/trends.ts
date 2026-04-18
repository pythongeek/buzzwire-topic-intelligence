import type { GoogleTrendsData } from '@/types';

/**
 * Google Trends Data Collector
 * 
 * Uses pytrends unofficial API for Google Trends data
 * Alternative: SerpAPI or rapidapi Google Trends
 */

// Using public Google Trends data endpoints
const TRENDS_BASE = 'https://trends.google.com/trends/api';

interface InterestOverTime {
  timelineData: {
    time: string;
    value: number;
    formattedValue: string;
  }[];
}

interface RelatedQueries {
  query: string;
  value: number;
  formattedValue: string;
}

interface GeoMap {
  countryCode: string;
  name: string;
  value: number;
}

/**
 * Get interest over time for a topic
 */
export async function getInterestOverTime(
  query: string,
  options: {
    timeframe?: string; // 'now 1-d', 'now 7-d', 'past 30d', 'past 90d', 'past 12m', 'today 5-y'
    geo?: string;       // Country code, e.g., 'US', 'GB', 'GLOBAL'
  } = {}
): Promise<{ time: string; value: number }[]> {
  const { timeframe = 'now 7-d', geo = 'US' } = options;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${TRENDS_BASE}/widgets/timeline?病q=${encodedQuery}&tz=-480&geo=${geo}&ns=15`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Google Trends API error: ${response.status}`);
      return getSimulatedInterestOverTime(query);
    }

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonStr = text.substring(jsonStart);
    const data = JSON.parse(jsonStr);

    const timelineData = data.timelineData || [];

    return timelineData.map((item: any) => ({
      time: item.time,
      value: item.value?.[0] || 0,
    }));
  } catch (error) {
    console.error('Google Trends fetch error:', error);
    return getSimulatedInterestOverTime(query);
  }
}

/**
 * Get related queries for a topic
 */
export async function getRelatedQueries(
  query: string,
  options: {
    timeframe?: string;
    geo?: string;
  } = {}
): Promise<{ query: string; value: number }[]> {
  const { timeframe = 'now 7-d', geo = 'US' } = options;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${TRENDS_BASE}/widgets/search?q=${encodedQuery}&geo=${geo}&widget=Searches`;

    const response = await fetch(url);

    if (!response.ok) {
      return getSimulatedRelatedQueries(query);
    }

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonStr = text.substring(jsonStart);
    const data = JSON.parse(jsonStr);

    const rankedList = data.rankedList || [];

    if (rankedList.length > 0) {
      return rankedList[0].rankedList.map((item: any) => ({
        query: item.query,
        value: item.value,
      }));
    }

    return [];
  } catch (error) {
    console.error('Google Trends fetch error:', error);
    return getSimulatedRelatedQueries(query);
  }
}

/**
 * Get geographic breakdown for a topic
 */
export async function getGeographicBreakdown(
  query: string,
  options: {
    timeframe?: string;
  } = {}
): Promise<{ region: string; country: string; value: number }[]> {
  const { timeframe = 'now 7-d' } = options;

  // Simulated data for demo
  return getSimulatedGeographicBreakdown(query);
}

/**
 * Get breakout topics (exploding in popularity)
 */
export async function getBreakoutTopics(
  options: {
    category?: string;
    geo?: string;
  } = {}
): Promise<{ topic: string; breakoutPercent: number }[]> {
  const { geo = 'US' } = options;

  // Return simulated breakout topics
  return [
    { topic: 'AI Video Generation', breakoutPercent: 2500 },
    { topic: 'Electric Vehicle News', breakoutPercent: 1800 },
    { topic: 'Space Tourism', breakoutPercent: 1200 },
    { topic: 'Climate Tech', breakoutPercent: 950 },
    { topic: 'Remote Work Tools', breakoutPercent: 720 },
  ];
}

/**
 * Get combined Google Trends data
 */
export async function getGoogleTrendsData(
  query: string,
  options?: {
    timeframe?: string;
    geo?: string;
  }
): Promise<GoogleTrendsData> {
  const [interestOverTime, relatedQueries, geographicBreakdown] = await Promise.all([
    getInterestOverTime(query, options),
    getRelatedQueries(query, options),
    getGeographicBreakdown(query, options),
  ]);

  // Calculate breakout percentage
  const breakoutPercent = calculateBreakoutPercent(interestOverTime);

  return {
    topic: query,
    interestOverTime,
    relatedQueries,
    geographicBreakdown,
    breakoutPercent,
  };
}

/**
 * Calculate breakout percentage from interest data
 */
function calculateBreakoutPercent(
  interestOverTime: { time: string; value: number }[]
): number | null {
  if (interestOverTime.length < 2) return null;

  const firstHalf = interestOverTime.slice(0, Math.floor(interestOverTime.length / 2));
  const secondHalf = interestOverTime.slice(Math.floor(interestOverTime.length / 2));

  const firstAvg =
    firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;

  if (firstAvg === 0) return secondAvg > 0 ? 2500 : null;

  const increase = ((secondAvg - firstAvg) / firstAvg) * 100;

  return increase > 0 ? Math.round(increase) : null;
}

/**
 * Simulated interest over time for demo
 */
function getSimulatedInterestOverTime(
  query: string
): { time: string; value: number }[] {
  const now = Date.now();
  const data: { time: string; value: number }[] = [];

  // Generate 24 data points (hourly for past 24 hours)
  for (let i = 23; i >= 0; i--) {
    const time = now - i * 60 * 60 * 1000;
    // Simulate interest with some randomness and trend
    const baseValue = 50 + Math.random() * 30;
    const trendBoost = (23 - i) * 2; // Gradual increase
    const noise = Math.random() * 10 - 5;

    data.push({
      time: String(Math.floor(time / 1000)),
      value: Math.round(baseValue + trendBoost + noise),
    });
  }

  return data;
}

/**
 * Simulated related queries for demo
 */
function getSimulatedRelatedQueries(
  query: string
): { query: string; value: number }[] {
  const relatedMap: Record<string, string[]> = {
    ai: ['ChatGPT', 'OpenAI', 'AI tools', 'machine learning', 'AI chatbot'],
    tech: ['iPhone', 'Samsung', 'Google Pixel', 'laptops', 'tablets'],
    business: ['stock market', 'investing', 'crypto', 'real estate', 'startup'],
    sports: ['NBA', 'NFL', 'Soccer', ' Olympics', 'MMA'],
  };

  const keywords = Object.keys(relatedMap).find((k) =>
    query.toLowerCase().includes(k)
  ) || 'default';

  const queries = relatedMap[keywords] || relatedMap.default;

  return queries.map((q) => ({
    query: q,
    value: Math.round(Math.random() * 100),
  }));
}

/**
 * Simulated geographic breakdown for demo
 */
function getSimulatedGeographicBreakdown(
  query: string
): { region: string; country: string; value: number }[] {
  return [
    { region: 'California', country: 'US', value: 100 },
    { region: 'New York', country: 'US', value: 85 },
    { region: 'Texas', country: 'US', value: 72 },
    { region: 'Florida', country: 'US', value: 65 },
    { region: 'Ontario', country: 'CA', value: 58 },
    { region: 'London', country: 'GB', value: 52 },
    { region: 'Ontario', country: 'AU', value: 45 },
  ];
}

/**
 * Calculate trend momentum
 */
export function calculateTrendMomentum(
  interestOverTime: { time: string; value: number }[]
): number {
  if (interestOverTime.length < 2) return 0;

  // Compare first half average to second half average
  const midpoint = Math.floor(interestOverTime.length / 2);
  const firstHalf = interestOverTime.slice(0, midpoint);
  const secondHalf = interestOverTime.slice(midpoint);

  const firstAvg = firstHalf.reduce((s, i) => s + i.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, i) => s + i.value, 0) / secondHalf.length;

  if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;

  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

/**
 * Classify trend category
 */
export function classifyTrendCategory(breakoutPercent: number | null): {
  category: 'breakout' | 'rising' | 'steady' | 'declining';
  multiplier: number;
} {
  if (!breakoutPercent) {
    return { category: 'steady', multiplier: 1.0 };
  }

  if (breakoutPercent >= 2500) {
    return { category: 'breakout', multiplier: 1.5 };
  }
  if (breakoutPercent >= 100) {
    return { category: 'rising', multiplier: 1.2 };
  }
  if (breakoutPercent >= 0) {
    return { category: 'steady', multiplier: 1.0 };
  }
  return { category: 'declining', multiplier: 0.8 };
}
