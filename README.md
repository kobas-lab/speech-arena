# 🎙 SpeechArena

SpeechArena is a human-centered A/B evaluation platform for real-time speech dialogue models.

It enables pairwise comparison of full-duplex speech dialogue systems through live human interaction.

This project is designed to evaluate:

- Conversation success rate
- Human subjective ratings
- Pairwise model preference
- Real-time robustness

---

## 🚀 Motivation

Real-time speech dialogue systems (e.g., Moshi-based models) often suffer from:

- Session startup failure
- Conversation collapse
- Turn-taking instability
- Latency-related degradation

SpeechArena evaluates models under real interactive conditions rather than offline or text-based benchmarks.

---

## 🏗 Monorepo Layout

```

speech-arena/
├── README.md
├── apps/
│   └── web/              # Next.js (App Router) + Prisma
├── services/
│   └── moshi/            # (optional) gateway / proxy / utilities
└── scripts/              # (optional) ops, data export, analysis

```

> MVP: `apps/web` だけでも動きます。

---

## 🏗 System Architecture (MVP)

```

Worker Browser
↓
SpeechArena Web (Next.js)
↓ (connect)
Moshi Server(s) (GPU)  -- exposed via Cloudflare Tunnel (HTTPS)

````

- Models are hosted via `uv run -m moshi.server`
- GPU inference runs on:
  - Lab GPU server
  - ABCI (for training)
- SpeechArena handles:
  - Model assignment
  - Trial tracking
  - Rating collection
  - Pairwise ranking

---

## 🧪 Evaluation Protocol (MVP)

Each worker performs:

- 5 trials per model
- Each trial: ~2 minutes conversation
- After each trial:
  - Conversation success (Yes / No)
  - Naturalness (1–5)
  - Audio quality (1–5)

After all trials:

- Direct A/B preference vote

Conversation failures are included in scoring.

---

## 📊 Scoring (Current MVP)

For each model:

```txt
SuccessRate  = successful_trials / total_trials
AverageScore = mean(naturalness, audio_quality)   # normalized to 0..1 if needed
TotalScore   = 0.5 * SuccessRate + 0.5 * AverageScore
````

Pairwise win rate is also computed.

Future versions will include:

* Bradley–Terry ranking
* Elo rating
* Stability-aware scoring
* Automatic success detection

---

## 🛠 Tech Stack

* Next.js (App Router)
* Prisma + PostgreSQL
* Moshi (`uv run -m moshi.server`)
* Cloudflare Tunnel (HTTPS exposure)
* GPU inference (24GB+ VRAM recommended)

---

# 🔧 Setup Guide (MVP)

## 0) Prerequisites

* Node.js (recommended: Node 20 LTS)
* PostgreSQL (local or hosted)
* Python env for Moshi server (GPU side)
* `cloudflared` (GPU side)

---

## 1) Clone Repository

```bash
git clone https://github.com/your-org/speech-arena.git
cd speech-arena
```

---

## 2) Create Next.js App (Monorepo)

Create the web app under `apps/web`:

```bash
mkdir -p apps
cd apps
npx create-next-app@latest web
```

Recommended options:

* TypeScript: Yes
* ESLint: Yes
* Tailwind: Yes
* src/: Yes
* App Router: Yes

Then return to repo root:

```bash
cd ..
```

---

## 3) Install Dependencies (web)

```bash
cd apps/web
npm install
```

---

## 4) Setup Database (Prisma)

Create `.env` in `apps/web`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
MODEL_A_URL="https://xxxxx.trycloudflare.com"
MODEL_B_URL="https://yyyyy.trycloudflare.com"
```

Run migration:

```bash
npx prisma migrate dev
```

---

## 5) Launch Moshi Servers (GPU Side)

Example:

```bash
# Model A
uv run -m moshi.server --model-path /path/to/model_A --port 8998

# Model B
uv run -m moshi.server --model-path /path/to/model_B --port 8999
```

---

## 6) Expose Moshi via Cloudflare Tunnel (GPU Side)

### Install cloudflared (no sudo option)

If you cannot use `sudo`, use the standalone binary:

```bash
mkdir -p $HOME/bin
cd $HOME/bin
curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
export PATH="$HOME/bin:$PATH"
```

### Run tunnel

```bash
cloudflared tunnel --url http://localhost:8998
cloudflared tunnel --url http://localhost:8999
```

You will receive HTTPS URLs like:

```txt
https://xxxxx.trycloudflare.com
https://yyyyy.trycloudflare.com
```

Set them in `apps/web/.env` (or Vercel env).

---

## 7) Run Web App Locally

```bash
cd apps/web
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## 8) Deploy to Vercel

Deploy `apps/web` as the Vercel project root (Monorepo setting).

Set environment variables in Vercel dashboard:

* `DATABASE_URL`
* `MODEL_A_URL`
* `MODEL_B_URL`

---

# ⚠️ Limitations (MVP)

* Manual success labeling
* No automatic latency measurement
* No turn-taking logging
* Limited concurrent sessions (GPU constraint)
* Temporary Cloudflare URLs (unless configured)

---

# 🗺 Roadmap

* [ ] Fixed domain via Cloudflare
* [ ] WebRTC integration
* [ ] Automatic success detection
* [ ] Turn-taking metrics
* [ ] Bradley–Terry ranking
* [ ] Public leaderboard
* [ ] Multi-model tournament

---

# 🎓 Research Goal

SpeechArena aims to become a standardized benchmark for:

* Real-time speech dialogue systems
* Full-duplex conversational AI
* Stability-aware evaluation
* Human-centered model ranking

---

# 📜 License

MIT (TBD)

---

# 👥 Authors

* Your Name
* Your Lab / Institution

```
