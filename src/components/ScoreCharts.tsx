'use client';

import {
  RadarChart,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';
import type { TopicScores } from '@/types';

interface ScoreRadarProps {
  scores: TopicScores;
}

export function ScoreRadar({ scores }: ScoreRadarProps) {
  const data = [
    { subject: 'Virality', score: scores.virality.score, color: '#ef4444' },
    { subject: 'Competitive', score: scores.competitive.score, color: '#f97316' },
    { subject: 'Freshness', score: scores.freshness.score, color: '#eab308' },
    { subject: 'Authority', score: scores.authority.score, color: '#22c55e' },
    { subject: 'Engagement', score: scores.engagement.score, color: '#06b6d4' },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2 flex-wrap">
        {data.map((d) => (
          <div key={d.subject} className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-gray-400">{d.subject}: {d.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ScoreBarProps {
  scores: TopicScores;
}

export function ScoreBar({ scores }: ScoreBarProps) {
  const data = [
    { name: 'Virality', value: scores.virality.score, color: '#ef4444' },
    { name: 'Competitive', value: scores.competitive.score, color: '#f97316' },
    { name: 'Freshness', value: scores.freshness.score, color: '#eab308' },
    { name: 'Authority', value: scores.authority.score, color: '#22c55e' },
    { name: 'Engagement', value: scores.engagement.score, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{item.name}</span>
            <span className="font-mono text-gray-400">{item.value}/100</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${item.value}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface OverallScoreProps {
  score: number;
  size?: 'small' | 'large';
}

export function OverallScore({ score, size = 'small' }: OverallScoreProps) {
  const getColor = (s: number) => {
    if (s >= 70) return '#22c55e';
    if (s >= 50) return '#eab308';
    if (s >= 30) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(score);

  if (size === 'small') {
    return (
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {score}
      </div>
    );
  }

  return (
    <div className="relative w-40 h-40">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          data={[{ value: score, color }]}
          startAngle={180}
          endAngle={0}
        >
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-gray-400">OVERALL</span>
      </div>
    </div>
  );
}
