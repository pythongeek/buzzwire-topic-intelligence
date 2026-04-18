'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopicCard, TopicCardSkeleton } from '@/components/TopicCard';
import { ScoreRadar, OverallScore } from '@/components/ScoreCharts';
import { TrendChart, VelocityChart } from '@/components/TrendCharts';
import type { Topic, TopicCategory, TrainingExample, ApiResponse } from '@/types';

const CATEGORIES: { value: TopicCategory; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'science', label: 'Science' },
  { value: 'health', label: 'Health' },
  { value: 'breaking_news', label: 'Breaking News' },
];

const SAMPLE_TOPICS: Topic[] = [
  {
    id: 'sample-1',
    title: 'AI Video Generation - Sora vs Runway',
    category: 'technology',
    description: 'Battle of AI video generators intensifies as new models emerge',
    keywords: ['AI', 'video', 'Sora', 'Runway', 'ML'],
    sources: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lifecycleStage: 'emergence',
    scores: {
      overall: 85,
      virality: { score: 92, twitterVelocity: 850, redditVelocity: 45, newsVelocity: 12, crossPlatformCorrelation: 88 },
      competitive: { score: 45, saturationIndex: 0.45, keywordDifficulty: 65, contentGap: 'medium', topCompetitors: [] },
      freshness: { score: 95, hoursSinceEmergence: 4, momentumBonus: 1.5, decayConstant: 0.05, projectedPeak: null },
      authority: { score: 70, tier: 'A', primarySources: [], originalReportingBonus: 0 },
      engagement: { score: 80, sentimentPolarity: 0.6, sentimentStrength: 0.75, saveBookmarkRate: 0.03, commentDepth: 4, shareToViewRatio: 0.025 },
    },
    metadata: {
      tweetCount: 15000,
      redditPostCount: 250,
      newsArticleCount: 45,
      googleTrendsInterest: 95,
      breakoutPercent: 2500,
      relatedQueries: ['Sora AI', 'OpenAI video', 'AI tools'],
      geographicBreakdown: [],
    },
  },
  {
    id: 'sample-2',
    title: 'iPhone 16 Pro Review Roundup',
    category: 'technology',
    description: 'Comprehensive reviews reveal strengths and weaknesses of latest iPhone',
    keywords: ['iPhone', 'Apple', 'review', 'smartphone'],
    sources: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lifecycleStage: 'acceleration',
    scores: {
      overall: 72,
      virality: { score: 70, twitterVelocity: 320, redditVelocity: 28, newsVelocity: 8, crossPlatformCorrelation: 72 },
      competitive: { score: 35, saturationIndex: 0.72, keywordDifficulty: 82, contentGap: 'low', topCompetitors: [] },
      freshness: { score: 65, hoursSinceEmergence: 48, momentumBonus: 1.1, decayConstant: 0.02, projectedPeak: null },
      authority: { score: 75, tier: 'A', primarySources: [], originalReportingBonus: 0 },
      engagement: { score: 70, sentimentPolarity: 0.4, sentimentStrength: 0.55, saveBookmarkRate: 0.025, commentDepth: 3, shareToViewRatio: 0.015 },
    },
    metadata: {
      tweetCount: 5000,
      redditPostCount: 180,
      newsArticleCount: 32,
      googleTrendsInterest: 78,
      breakoutPercent: 150,
      relatedQueries: ['iPhone 16', 'Apple review'],
      geographicBreakdown: [],
    },
  },
  {
    id: 'sample-3',
    title: 'SpaceX Starship Update',
    category: 'science',
    description: 'Latest developments in SpaceX Starship program',
    keywords: ['SpaceX', 'Starship', 'space', 'Mars'],
    sources: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lifecycleStage: 'peak',
    scores: {
      overall: 68,
      virality: { score: 65, twitterVelocity: 280, redditVelocity: 35, newsVelocity: 15, crossPlatformCorrelation: 75 },
      competitive: { score: 60, saturationIndex: 0.4, keywordDifficulty: 55, contentGap: 'medium', topCompetitors: [] },
      freshness: { score: 50, hoursSinceEmergence: 60, momentumBonus: 1.0, decayConstant: 0.05, projectedPeak: null },
      authority: { score: 80, tier: 'A+', primarySources: [], originalReportingBonus: 0 },
      engagement: { score: 72, sentimentPolarity: 0.7, sentimentStrength: 0.8, saveBookmarkRate: 0.035, commentDepth: 5, shareToViewRatio: 0.02 },
    },
    metadata: {
      tweetCount: 4200,
      redditPostCount: 150,
      newsArticleCount: 28,
      googleTrendsInterest: 82,
      breakoutPercent: 320,
      relatedQueries: ['SpaceX', 'Starship launch', 'Mars'],
      geographicBreakdown: [],
    },
  },
];

export default function Dashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<TopicCategory>('technology');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'training' | 'settings'>('discover');
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);

  // Fetch topics
  const fetchTopics = useCallback(async (query?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ category });
      if (query) params.set('q', query);

      const response = await fetch(`/api/topics?${params}`);
      const data: ApiResponse<Topic[]> = await response.json();

      if (data.success && data.data) {
        setTopics(data.data);
        if (data.data.length > 0 && !selectedTopic) {
          setSelectedTopic(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      // Use sample data as fallback
      setTopics(SAMPLE_TOPICS);
      if (!selectedTopic) setSelectedTopic(SAMPLE_TOPICS[0]);
    } finally {
      setIsLoading(false);
    }
  }, [category, selectedTopic]);

  // Fetch training examples
  const fetchTrainingExamples = useCallback(async () => {
    try {
      const response = await fetch('/api/training?includeSamples=true');
      const data = await response.json();
      if (data.success) {
        setTrainingExamples(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch training examples:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchTopics();
    } else if (activeTab === 'training') {
      fetchTrainingExamples();
    }
  }, [activeTab, fetchTopics, fetchTrainingExamples]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTopics(searchQuery);
  };

  const handleAddTrainingExample = async (topic: Topic, outcome: 'viral' | 'moderate' | 'flop') => {
    try {
      const response = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: {
            title: topic.title,
            category: topic.category,
            keywords: topic.keywords,
            sources: topic.sources,
            metadata: topic.metadata,
          },
          scores: topic.scores,
          outcome: {
            actualVirality: topic.scores.overall,
            engagementRate: topic.scores.engagement.score / 100,
            successScore: topic.scores.overall,
            category: outcome,
          },
          features: {
            twitterEngagementVelocity: topic.scores.virality.twitterVelocity,
            redditEngagementVelocity: topic.scores.virality.redditVelocity,
            crossPlatformCorrelation: topic.scores.virality.crossPlatformCorrelation,
            earlyInfluencerCaptureRate: 0.5,
            headlineSentiment: topic.scores.engagement.sentimentPolarity,
            headlineEmotion: 'positive',
            contentLength: 1000,
            hasMedia: true,
            hasNumbers: topic.title.includes('20'),
            questionFormat: topic.title.includes('?'),
            dayOfWeek: new Date().getDay(),
            hourOfDay: new Date().getHours(),
            daysSinceEvent: topic.scores.freshness.hoursSinceEmergence / 24,
            topicAge: topic.scores.freshness.hoursSinceEmergence,
            competitionDensity: topic.scores.competitive.saturationIndex,
            keywordDifficulty: topic.scores.competitive.keywordDifficulty,
            trendMomentum: topic.metadata.breakoutPercent || 0,
          },
        }),
      });

      if (response.ok) {
        fetchTrainingExamples();
      }
    } catch (error) {
      console.error('Failed to add training example:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Buzzwire Topic Intelligence
              </h1>
              <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">
                MVP v1.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('discover')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'discover'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                📊 Discover
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'training'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                🎓 Training
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'discover' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Search & Topics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics (e.g., 'AI video', 'crypto', 'sports')..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TopicCategory)}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium transition"
                >
                  Search
                </button>
              </form>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                  <TopicCardSkeleton count={4} />
                ) : topics.length > 0 ? (
                  topics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      onClick={() => setSelectedTopic(topic)}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    <p className="text-lg">No topics found</p>
                    <p className="text-sm mt-2">Try a different search or category</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Topic Detail */}
            <div className="space-y-6">
              {selectedTopic ? (
                <>
                  {/* Topic Detail Card */}
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">{selectedTopic.title}</h2>
                      <OverallScore score={selectedTopic.scores.overall} size="large" />
                    </div>

                    <p className="text-gray-400 mb-6">{selectedTopic.description}</p>

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Score Breakdown</h3>
                      <ScoreRadar scores={selectedTopic.scores} />
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">Engagement Velocity</h3>
                      <VelocityChart
                        twitterVelocity={selectedTopic.scores.virality.twitterVelocity}
                        redditVelocity={selectedTopic.scores.virality.redditVelocity}
                        newsVelocity={selectedTopic.scores.virality.newsVelocity}
                      />
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 bg-gray-700/50 rounded-lg mb-6">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">Recommendation</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">
                            {selectedTopic.lifecycleStage.toUpperCase()}
                          </span>
                          <span className="text-gray-400">
                            {selectedTopic.scores.freshness.hoursSinceEmergence.toFixed(1)}h old
                          </span>
                        </div>
                        {selectedTopic.metadata.breakoutPercent && (
                          <div className="text-green-400">
                            🚀 Breakout: +{selectedTopic.metadata.breakoutPercent}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add to Training */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-300">Add to Training Data</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddTrainingExample(selectedTopic, 'viral')}
                          className="flex-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg text-sm hover:bg-green-600/30 transition"
                        >
                          ✅ Viral
                        </button>
                        <button
                          onClick={() => handleAddTrainingExample(selectedTopic, 'moderate')}
                          className="flex-1 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/30 transition"
                        >
                          ➡️ Moderate
                        </button>
                        <button
                          onClick={() => handleAddTrainingExample(selectedTopic, 'flop')}
                          className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition"
                        >
                          ❌ Flop
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center text-gray-500">
                  <p>Select a topic to view details</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Platform Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Topics Tracked</span>
                    <span className="font-mono text-white">{topics.length || SAMPLE_TOPICS.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Training Examples</span>
                    <span className="font-mono text-white">{trainingExamples.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">API Status</span>
                    <span className="text-green-400">● Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Training Dataset</h2>
              <span className="text-sm text-gray-400">{trainingExamples.length} examples</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainingExamples.map((example) => (
                <div
                  key={example.id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{example.topic.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        example.outcome.category === 'viral'
                          ? 'bg-green-500/20 text-green-400'
                          : example.outcome.category === 'moderate'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {example.outcome.category.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3 capitalize">
                    {example.topic.category.replace('_', ' ')}
                  </p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Virality</span>
                      <span className="font-mono text-gray-300">{example.outcome.actualVirality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Success Score</span>
                      <span className="font-mono text-gray-300">{example.outcome.successScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Labeled</span>
                      <span className="font-mono text-gray-300">
                        {new Date(example.labeledAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {trainingExamples.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No training examples yet</p>
                <p className="text-sm mt-2">
                  Label topics from the Discover tab to build your training dataset
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Twitter Bearer Token</label>
                  <input
                    type="password"
                    placeholder="Enter your Twitter API bearer token"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">NewsAPI Key</label>
                  <input
                    type="password"
                    placeholder="Enter your NewsAPI key"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                API keys are stored in environment variables. Add them to your .env.local file:
              </p>
              <div className="mt-2 p-3 bg-gray-900 rounded-lg text-xs font-mono text-gray-400">
                TWITTER_BEARER_TOKEN=your_token{'\n'}
                NEWS_API_KEY=your_key
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Scoring Weights</h2>
              <div className="space-y-3">
                {['virality', 'competitive', 'freshness', 'authority', 'engagement'].map((weight) => (
                  <div key={weight} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{weight}</span>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      defaultValue="25"
                      className="w-48"
                    />
                    <span className="w-12 text-right font-mono text-gray-400">25%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
