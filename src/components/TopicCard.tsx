'use client';

import { OverallScore, ScoreBar } from './ScoreCharts';
import type { Topic, LifecycleStage } from '@/types';

interface TopicCardProps {
  topic: Topic;
  onClick?: () => void;
}

export function TopicCard({ topic, onClick }: TopicCardProps) {
  const stageConfig: Record<LifecycleStage, { label: string; color: string; bg: string }> = {
    emergence: { label: '🔥 EMERGENCE', color: '#ef4444', bg: 'bg-red-500/20' },
    acceleration: { label: '📈 ACCELERATING', color: '#f97316', bg: 'bg-orange-500/20' },
    peak: { label: '⚡ PEAK', color: '#eab308', bg: 'bg-yellow-500/20' },
    decay: { label: '📉 DECAYING', color: '#6b7280', bg: 'bg-gray-500/20' },
    evergreen: { label: '🌲 EVERGREEN', color: '#22c55e', bg: 'bg-green-500/20' },
  };

  const stage = stageConfig[topic.lifecycleStage];

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-all hover:shadow-lg hover:shadow-gray-900/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded ${stage.bg}`} style={{ color: stage.color }}>
              {stage.label}
            </span>
            <span className="text-xs text-gray-500 capitalize">{topic.category.replace('_', ' ')}</span>
          </div>
          <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">
            {topic.description}
          </p>
        </div>
        <OverallScore score={topic.scores.overall} />
      </div>

      {/* Scores Breakdown */}
      <ScoreBar scores={topic.scores} />

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span>🐦</span>
            <span>{topic.metadata.tweetCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span>{topic.metadata.redditPostCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📰</span>
            <span>{topic.metadata.newsArticleCount}</span>
          </div>
          {topic.metadata.breakoutPercent && (
            <div className="flex items-center gap-1">
              <span>🚀</span>
              <span className="text-green-400">+{topic.metadata.breakoutPercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Keywords */}
      {topic.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {topic.keywords.slice(0, 5).map((kw) => (
            <span
              key={kw}
              className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface TopicCardSkeletonProps {
  count?: number;
}

export function TopicCardSkeleton({ count = 3 }: TopicCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
              <div className="h-6 w-48 bg-gray-700 rounded" />
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-full" />
          </div>
          <div className="space-y-2">
            {[100, 75, 60, 85, 70].map((w, j) => (
              <div key={j} className="space-y-1">
                <div className="h-3 bg-gray-700 rounded" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
