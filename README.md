# Buzzwire Topic Intelligence

AI-powered topic discovery and scoring engine for viral content.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Topic+Intelligence+Dashboard)

## Features

- **Topic Discovery** - Search and track topics across Twitter, Reddit, and News sources
- **5-Dimension Scoring Engine**:
  - Virality Score (Twitter/Reddit engagement velocity)
  - Competitive Score (content gap analysis)
  - Freshness Score (time decay with momentum tracking)
  - Authority Score (source credibility weighting)
  - Engagement Quality Score (sentiment and save rates)

- **Training Dataset** - Build custom ML training data with labeled outcomes
- **Visual Dashboard** - Recharts-powered visualizations
- **Vercel Ready** - One-click deployment

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your API keys to .env.local:
# TWITTER_BEARER_TOKEN=your_twitter_token
# NEWS_API_KEY=your_newsapi_key

# Run development server
npm run dev
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pythongeek/buzzwire-topic-intelligence)

Or via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/topics` | Get topics with scores (query params: `q`, `category`) |
| POST | `/api/topics` | Score a custom topic |
| GET | `/api/training` | Get training examples |
| POST | `/api/training` | Add training example |
| DELETE | `/api/training` | Clear training data |

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

| Component | Default Weight | Description |
|-----------|---------------|-------------|
| Virality | 25% | Engagement velocity across platforms |
| Competitive | 25% | Content gap and saturation analysis |
| Freshness | 20% | Time decay with momentum bonus |
| Authority | 15% | Source credibility (E-E-A-T) |
| Engagement | 15% | Sentiment and save rates |

### Topic Lifecycle Stages

| Stage | Hours | Multiplier | Action |
|-------|-------|------------|--------|
| Emergence | 0-6 | 1.5× | Publish NOW |
| Acceleration | 6-24 | 1.3× | Monitor closely |
| Peak | 24-72 | 1.0× | Act fast |
| Decay | 72-168 | 0.6× | Long-tail angle |
| Evergreen | 168+ | 0.3× | Time-insensitive |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Sources**: Twitter API, Reddit API, NewsAPI, Google Trends

## Environment Variables

```env
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
NEWS_API_KEY=your_newsapi_key
```

## License

MIT
