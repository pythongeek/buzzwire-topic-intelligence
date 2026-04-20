'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Topic, ApiResponse } from '@/types';

export default function TopicDetailPage() {
  const params = useParams();
  const topicId = params.id as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, we'd fetch the topic by ID from the API
    // For now, we'll get it from localStorage or show an error
    const fetchTopic = async () => {
      setIsLoading(true);
      try {
        // Try to get from localStorage (set when user clicks a topic)
        const savedTopic = localStorage.getItem('selectedTopic');
        if (savedTopic) {
          const parsed = JSON.parse(savedTopic);
          // Decode the date strings back to Date objects
          parsed.createdAt = new Date(parsed.createdAt);
          parsed.updatedAt = new Date(parsed.updatedAt);
          parsed.sources = parsed.sources.map((s: any) => ({
            ...s,
            publishedAt: new Date(s.publishedAt),
          }));
          setTopic(parsed);
        } else {
          setError('Topic not found. Please go back and select a topic.');
        }
      } catch (e) {
        setError('Failed to load topic details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading topic details...</p>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-xl text-gray-300 mb-4">{error || 'Topic not found'}</p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Group sources by platform
  const sourcesByPlatform = topic.sources.reduce((acc, source) => {
    if (!acc[source.platform]) acc[source.platform] = [];
    acc[source.platform].push(source);
    return acc;
  }, {} as Record<string, typeof topic.sources>);

  // Calculate platform breakdown
  const platformStats = Object.entries(sourcesByPlatform).map(([platform, sources]) => ({
    platform,
    count: sources.length,
    sources,
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition">
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold">{topic.title}</h1>
              <p className="text-sm text-gray-400 capitalize">{topic.category.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* WHY This Topic Section */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Why This Topic Was Selected
          </h2>
          
          <div className="space-y-4">
            {/* Overall Recommendation */}
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Recommendation</h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  topic.lifecycleStage === 'emergence' ? 'bg-green-500/20 text-green-400' :
                  topic.lifecycleStage === 'acceleration' ? 'bg-blue-500/20 text-blue-400' :
                  topic.lifecycleStage === 'peak' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {topic.lifecycleStage.toUpperCase()}
                </span>
                <span className="text-gray-400">
                  Emerging {topic.scores.freshness.hoursSinceEmergence.toFixed(1)} hours ago
                </span>
              </div>
            </div>

            {/* Scoring Breakdown */}
            <div className="p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-3">5-Dimension Scoring Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Virality</span>
                    <span className="font-mono text-white">{topic.scores.virality.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 rounded-full"
                      style={{ width: `${topic.scores.virality.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Twitter: {topic.scores.virality.twitterVelocity.toFixed(1)} | Reddit: {topic.scores.virality.redditVelocity.toFixed(1)} | News: {topic.scores.virality.newsVelocity.toFixed(1)}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Competitive</span>
                    <span className="font-mono text-white">{topic.scores.competitive.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${topic.scores.competitive.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Content gap: {topic.scores.competitive.contentGap} | Difficulty: {topic.scores.competitive.keywordDifficulty}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Freshness</span>
                    <span className="font-mono text-white">{topic.scores.freshness.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${topic.scores.freshness.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {topic.scores.freshness.hoursSinceEmergence.toFixed(1)}h old | Momentum: {topic.scores.freshness.momentumBonus}x
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Authority</span>
                    <span className="font-mono text-white">{topic.scores.authority.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${topic.scores.authority.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tier: {topic.scores.authority.tier} | Original reporting bonus: +{topic.scores.authority.originalReportingBonus}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Engagement</span>
                    <span className="font-mono text-white">{topic.scores.engagement.score}/100</span>
                  </div>
                  <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${topic.scores.engagement.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sentiment: {topic.scores.engagement.sentimentPolarity > 0 ? 'positive' : topic.scores.engagement.sentimentPolarity < 0 ? 'negative' : 'neutral'} 
                    ({topic.scores.engagement.sentimentStrength.toFixed(2)} strength)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources Section */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Data Sources ({topic.sources.length} sources)
          </h2>

          <div className="space-y-4">
            {platformStats.map(({ platform, count, sources }) => (
              <div key={platform} className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium capitalize flex items-center gap-2">
                    <span className="text-xl">
                      {platform === 'twitter' ? '🐦' :
                       platform === 'reddit' ? '🤖' :
                       platform === 'hackernews' ? '👾' :
                       platform === 'news' ? '📰' :
                       platform === 'gdelt' ? '🌍' : '📈'}
                    </span>
                    {platform.replace('_', ' ')}
                  </h3>
                  <span className="text-sm text-gray-400">{count} articles</span>
                </div>
                <div className="space-y-2">
                  {sources.slice(0, 5).map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 bg-gray-800 rounded hover:bg-gray-600/50 transition"
                    >
                      <span className="text-sm text-gray-300 truncate flex-1">{source.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(source.publishedAt).toLocaleDateString()}
                      </span>
                    </a>
                  ))}
                  {sources.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{sources.length - 5} more sources
                    </p>
                  )}
                </div>
              </div>
            ))}

            {topic.sources.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No source data available for this topic yet.</p>
                <p className="text-sm mt-2">This may happen if the external APIs are not returning data.</p>
              </div>
            )}
          </div>
        </section>

        {/* Metadata Section */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Engagement Metrics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{topic.metadata.tweetCount}</div>
              <div className="text-sm text-gray-400">Tweets</div>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{topic.metadata.redditPostCount}</div>
              <div className="text-sm text-gray-400">Reddit Posts</div>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{topic.metadata.newsArticleCount}</div>
              <div className="text-sm text-gray-400">News Articles</div>
            </div>
            <div className="p-4 bg-gray-700/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">
                {topic.metadata.breakoutPercent ? `+${topic.metadata.breakoutPercent}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-400">Breakout</div>
            </div>
          </div>

          {topic.metadata.relatedQueries.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Related Queries</h3>
              <div className="flex flex-wrap gap-2">
                {topic.metadata.relatedQueries.map((query, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                  >
                    {query}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Keywords */}
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            Topic Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {topic.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}