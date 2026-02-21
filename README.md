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

## 🏗 System Architecture

```
Worker Browser
↓
SpeechArena (Next.js on Vercel)
↓ (redirect)
Cloudflare Tunnel
↓
moshi.server (GPU)
```

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

```

SuccessRate = successful_trials / total_trials
AverageScore = mean(naturalness, audio_quality)
TotalScore = 0.5 * SuccessRate + 0.5 * AverageScore

````

Pairwise win rate is also computed.

Future versions will include:

- Bradley–Terry ranking
- Elo rating
- Stability-aware scoring
- Automatic success detection

---

## 🛠 Tech Stack

- Next.js (App Router)
- Prisma + PostgreSQL
- Moshi (`uv run -m moshi.server`)
- Cloudflare Tunnel (HTTPS exposure)
- GPU inference (24GB+ VRAM required)

---

# 🔧 Setup Guide

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-org/speech-arena.git
cd speech-arena
````

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Setup Database

```bash
npx prisma migrate dev
```

---

## 4️⃣ Launch Moshi Servers (GPU Side)

Example:

```bash
# Model A
uv run -m moshi.server --model-path /path/to/model_A --port 8998

# Model B
uv run -m moshi.server --model-path /path/to/model_B --port 8999
```

---

## 5️⃣ Expose via Cloudflare Tunnel

Install:

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

Run tunnel:

```bash
cloudflared tunnel --url http://localhost:8998
cloudflared tunnel --url http://localhost:8999
```

You will receive HTTPS URLs:

```
https://xxxxx.trycloudflare.com
https://yyyyy.trycloudflare.com
```

---

## 6️⃣ Configure Environment Variables

In `.env` or Vercel:

```
MODEL_A_URL=https://xxxxx.trycloudflare.com
MODEL_B_URL=https://yyyyy.trycloudflare.com
```

---

## 7️⃣ Run Web App Locally

```bash
npm run dev
```

---

## 8️⃣ Deploy to Vercel

```bash
vercel
```

Set environment variables in Vercel dashboard.

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
