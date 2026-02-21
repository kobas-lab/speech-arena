# SpeechArena v0.1 Specification

## 1. Purpose

SpeechArena is a human-centered A/B evaluation platform for real-time speech dialogue models.

The goal of v0.1 (MVP) is:

- Run A/B comparisons between two Moshi-based models
- Collect human ratings
- Measure conversation success rate
- Compute a simple ranking score
- Store all results in Supabase

This version prioritizes:
- Speed of implementation
- Data collection
- Minimal architecture complexity

---

## 2. System Scope (MVP)

### Included

- Worker session creation
- A/B matchup generation
- 5 trials per model
- Manual success labeling
- Naturalness + audio quality rating
- Final pairwise vote
- Simple leaderboard

### Excluded (Future Work)

- WebRTC integration
- Automatic success detection
- Turn-taking metrics
- Latency logging
- Bradley–Terry ranking
- Elo live updates

---

## 3. System Architecture

Browser (Worker)
        ↓
SpeechArena (Next.js)
        ↓ (redirect)
Cloudflare Tunnel
        ↓
moshi.server (GPU)

SpeechArena does NOT communicate directly with Moshi.
It redirects the worker to the Moshi Web UI endpoint.

---

## 4. Core Concepts

### 4.1 Worker

Represents one evaluation participant.

Table: `workers`

---

### 4.2 Matchup

Represents one A/B comparison session for a worker.

- One worker → One matchup
- One matchup → Two arms (Model A & Model B)

Table: `matchups`

---

### 4.3 Matchup Arm

Represents one model inside a matchup.

Table: `matchup_arms`

Fields:
- id
- matchupId
- modelId
- trialsRequired (default 5)

---

### 4.4 Trial

Represents one conversation attempt with one model.

Table: `trials`

Fields:
- trialIndex
- outcome (success / failure)
- naturalness (1–5)
- audioQuality (1–5)
- startedAt
- endedAt

---

### 4.5 Matchup Vote

Represents the final A/B preference.

Table: `matchup_votes`

Fields:
- choice (ARM_A / ARM_B)
- rationale (optional)

---

### 4.6 Model

Represents one deployed Moshi model endpoint.

Table: `models`

Fields:
- name
- endpointUrl
- description
- isActive

---

### 4.7 Model Ratings

Cached ranking values.

Table: `model_ratings`

Fields:
- eloScore
- btStrength
- wins
- losses
- draws

Ratings are computed from matchup_votes.

---

## 5. Evaluation Protocol

Per Worker:

1. Create matchup
2. For each model arm:
   - Perform 5 trials
   - Each trial approx. 2 minutes
   - After each trial:
     - Success (Yes / No)
     - Naturalness (1–5)
     - Audio Quality (1–5)
3. Submit final A/B preference

Conversation failures are included in scoring.

---

## 6. API Specification (MVP)

### 6.1 Create Matchup

POST /api/matchups

Response:
- matchupId
- arm list
- endpointUrl for each arm

---

### 6.2 Start Trial

POST /api/trials/start

Creates trial record and returns endpointUrl.

---

### 6.3 Complete Trial

POST /api/trials/complete

Stores:
- success
- naturalness
- audioQuality
- endedAt

---

### 6.4 Submit Vote

POST /api/matchups/vote

Stores:
- choice
- rationale

---

### 6.5 Get Leaderboard

GET /api/leaderboard

Returns simple ranking based on:

SuccessRate = successful_trials / total_trials
AverageScore = mean(naturalness, audioQuality)
TotalScore = 0.5 * SuccessRate + 0.5 * AverageScore

---

## 7. Ranking Logic (MVP)

For each model:

1. Compute success rate
2. Compute average rating
3. Combine into total score

Future versions:
- Bradley–Terry
- Elo rating
- Stability-aware ranking

---

## 8. Deployment Requirements

- Next.js deployed on Vercel
- Supabase for DB
- moshi.server running on GPU
- Cloudflare Tunnel exposing moshi endpoints via HTTPS

---

## 9. Non-Goals (MVP)

- Perfect architecture
- Maximum scalability
- Automatic metric logging
- Multi-model tournaments

The goal of v0.1 is to collect reliable human evaluation data as quickly as possible.

---

## 10. Definition of Done (MVP)

The MVP is considered complete when:

- A worker can complete a full A/B session
- All trials are stored in DB
- Final vote is stored
- Leaderboard is computed
- At least 10 workers have completed sessions

