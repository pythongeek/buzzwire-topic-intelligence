# Buzzwire Topic Intelligence

AI-powered topic discovery and scoring engine for viral content.

## 100% FREE - No Paid API Keys Required

This project uses **completely free data sources** - no RapidAPI, no paid subscriptions.

## Data Sources (All Free)

| Platform | Method | Rate Limit |
|----------|--------|------------|
| **Twitter/X** | Nitter RSS | Unlimited |
| **Reddit** | Public JSON API | Unlimited |
| **News** | Google News RSS + HackerNews | Unlimited |
| **Trends** | Google Trends Embed | Unlimited |

## Features

- **Topic Discovery** - Search across Twitter, Reddit, HackerNews, and News sources
- **5-Dimension Scoring Engine**:
  - Virality Score (Twitter/Reddit engagement velocity)
  - Competitive Score (content gap analysis)
  - Freshness Score (time decay with momentum tracking)
  - Authority Score (source credibility weighting)
  - Engagement Quality Score (sentiment and save rates)

- **Training Dataset** - Label topics as Viral/Moderate/Flop → build ML dataset
- **Visual Dashboard** - Recharts-powered visualizations
- **Vercel Ready** - One-click deployment

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (no API keys needed!)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pythongeek/buzzwire-topic-intelligence)

Or via CLI:

```bash
npx vercel
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION (FREE)                    │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Twitter    │    Reddit    │  Google News │ HackerNews API │
│  (Nitter)   │  (Public)    │    (RSS)     │   (Free API)   │
└──────┬───────┴──────┬───────┴──────┬───────┴───────┬────────┘
       │               │               │               │
       ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│              5-DIMENSION SCORING ENGINE                    │
│  Virality │ Competitive │ Freshness │ Authority │ Engage   │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                   TOPIC DASHBOARD                           │
│  📊 Score Cards  │  📈 Trend Charts  │  🎯 Recommendations │
└─────────────────────────────────────────────────────────────┘
```

## Scoring Engine

### Overall Score Formula

```
TOPIC_SCORE = (
    w₁ × VIRALITY +
    w₂ × COMPETITIVE +
    w₃ × FRESHNESS +
    w₄ × AUTHORITY +
    w₅ × ENGAGEMENT
) × TOPIC_TYPE_MULTIPLIER
```

### Default Weights

| Component | Weight | Description |
|-----------|--------|-------------|
| Virality | 25% | Engagement velocity across platforms |
| Competitive | 25% | Content gap and saturation analysis |
| Freshness | 20% | Time decay with momentum bonus |
| Authority | 15% | Source credibility (E-E-A-T) |
| Engagement | 15% | Sentiment and save rates |

### Topic Lifecycle Stages

| Stage | Hours | Multiplier | Action |
|-------|-------|------------|--------|
| 🔥 Emergence | 0-6 | 1.5× | Publish NOW |
| 📈 Acceleration | 6-24 | 1.3× | Monitor closely |
| ⚡ Peak | 24-72 | 1.0× | Act fast |
| 📉 Decay | 72-168 | 0.6× | Long-tail angle |
| 🌲 Evergreen | 168+ | 0.3× | Time-insensitive |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data**: Nitter RSS, Reddit API, Google News RSS, HackerNews API

## Optional: Add API Keys for Higher Limits

While everything works **without API keys**, you can add optional keys for higher rate limits:

```env
# .env.local (optional)
TWITTER_BEARER_TOKEN=your_twitter_token  # Twitter API (500K/month free)
NEWS_API_KEY=your_key                     # NewsAPI (100/day free)
```

## License

MIT
