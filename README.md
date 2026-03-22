# SpeechArena

[![日本語](https://img.shields.io/badge/lang-日本語-red.svg)](README_ja.md)

SpeechArena is a human-centered A/B evaluation platform for real-time full-duplex speech dialogue models.

It enables pairwise comparison of speech dialogue systems through live human interaction, using the **FD-DMOS (Full-Duplex Dialogue MOS)** evaluation framework.

---

## Motivation

Real-time speech dialogue systems (e.g., Moshi-based models) often suffer from:

- Session startup failure
- Conversation collapse
- Turn-taking instability
- Latency-related degradation

SpeechArena evaluates models under real interactive conditions rather than offline or text-based benchmarks.

---

## Evaluation: FD-DMOS Framework

Each conversation is rated on 4 dimensions (1–5 scale):

|                    | Objective-leaning                        | Subjective-leaning                          |
|--------------------|------------------------------------------|---------------------------------------------|
| **Sound quality**  | Acoustic Naturalness (speech signal)     | Perceived Naturalness (human-likeness)      |
| **Content**        | Semantic Clarity (comprehensibility)     | Conversational Usefulness (dialogue value)  |

Additionally:
- **Conversation success** (Yes / No)
- **Packet loss detection** (for filtering unreliable trials)
- **A/B preference vote** (after all trials)

---

## Evaluation Protocol

Each worker performs:

- 2 conversations per model (~2 min each)
- After each conversation: FD-DMOS 4-dimension rating + success/failure + packet loss check
- After all conversations: direct A/B preference vote

Trials with packet loss are excluded from leaderboard scoring.

---

## Scoring

```
SuccessRate  = successful_trials / total_trials
AverageScore = mean(4 FD-DMOS scores) normalized to 0..1
TotalScore   = 0.5 * SuccessRate + 0.5 * AverageScore
```

---

## System Architecture

```
Worker Browser
↓
SpeechArena Web (Next.js on Vercel)
↓ (redirect to conversation tab)
Moshi Server (GPU) -- exposed via Cloudflare Tunnel (HTTPS)
```

---

## Tech Stack

- Next.js 16 (App Router) + React 19
- Prisma 7 + Supabase PostgreSQL
- Moshi (`uv run -m moshi.server`)
- Cloudflare Tunnel (HTTPS exposure)
- Vercel (deployment)
- GPU inference (RTX 3090 x2, 2 models simultaneously)

---

## Monorepo Layout

```
speech-arena/
├── README.md / README_ja.md
├── apps/
│   └── web/              # Next.js (App Router) + Prisma
├── client/
│   └── dist/             # Moshi Web UI static files
└── scripts/              # Automation (start/stop arena)
```

---

## Quick Start

```bash
git clone https://github.com/kobas-lab/speech-arena.git
cd speech-arena/apps/web
npm install
cp .env.example .env  # configure DATABASE_URL, DIRECT_URL
npx prisma migrate dev
npm run dev
```

See [README_ja.md](README_ja.md) for detailed setup instructions.

---

## Scripts

```bash
# Start Moshi servers + Cloudflare Tunnels + DB seed (round 1)
./scripts/start-arena.sh

# Start round 2 (different model pair)
./scripts/start-arena-round2.sh

# Stop all sessions
./scripts/stop-arena.sh
```

---

## Roadmap

- [ ] Fixed domain via Cloudflare
- [ ] Bradley-Terry / Elo ranking
- [ ] Automatic success detection
- [ ] Audio recording (server-side)
- [ ] Turn-taking metrics
- [ ] Multi-model tournament

---

## License

MIT (TBD)

---

## Authors

- Your Name
- Your Lab / Institution
