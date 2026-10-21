# 🧠 Quiz Competition

A timed quiz game: play solo, battle friends in **live multiplayer rooms**, climb the **global leaderboard**, review your answers and track your history. Built with React, React Router and Tailwind CSS, with a serverless API on Vercel backed by Neon Postgres.

**🔗 Live:** https://quiz-competition-plum.vercel.app

## ✨ Features

- **Play solo** by picking a topic and a difficulty (Easy 30s · Medium 20s · Hard 10s per question)
- **Live multiplayer rooms**: the host creates a room (6-character code + invite link), friends join with a nickname, the host starts, and everyone gets the same questions in the same order on a shared clock. Answers are scored **on the server** (correctness + speed) and a **live scoreboard** updates every ~1.5s
- **Global leaderboard**: post a solo result with a nickname; top 20 overall or per topic / difficulty, refreshed live (also on the home page)
- **Timed questions** with a countdown, progress bar, speed bonus and streak badge
- Clear **selected / correct / wrong** answer states; keyboard shortcuts (1–4 to pick, Enter to confirm)
- **Results** with a score ring and an answer-by-answer review, saved to **History**
- **Global search (Ctrl+K / ⌘K)** across topics, questions and your past games, powered by MiniSearch (fuzzy, prefix, ranked); jump straight to a topic or a highlighted past result
- **Review my mistakes** practice mode: missed questions are saved, practised in short rounds, and leave the list once you get them right
- **Profile, Friends, Chat and Search** pages
- Sticky navbar with a mobile menu, 404 page
- **Installable & offline**: install it to your home screen or desktop with the **Install app** button; it keeps working without a connection
- **Light / dark theme**: follows your system by default; the toggle in the top bar remembers your choice

> **Demo parts:** login accepts any password and 4–6 digit code; profile, friends and chat use sample data from `src/data/`; history and session live in the browser. Rooms and the leaderboard are real and served by the API below.

## 🛠 Tech Stack

React 19 · React Router 7 · Vite 7 · Tailwind CSS 4 · MiniSearch · lucide-react icons · vite-plugin-pwa (Workbox) · Vercel Functions (Node) · Neon serverless Postgres

## ▶️ Run locally

```bash
git clone https://github.com/Prajjawalsingh87/Quiz-Competition.git
cd Quiz-Competition
npm install
npm run dev        # frontend only: http://localhost:5173 (rooms/leaderboard need the API)
```

With the API (rooms + leaderboard), use the Vercel CLI, which runs Vite and the functions in `api/` together:

```bash
npm i -g vercel
vercel link                 # pick the quiz-competition project
vercel env pull .env.local  # writes DATABASE_URL (git-ignored, never commit it)
vercel dev                  # http://localhost:3000
```

Note that the pulled `DATABASE_URL` points at the shared Neon database; tables are created automatically on the first request.

### Tests

```bash
npm test   # pure game/validation logic always runs
# API + SQL tests need a throwaway Postgres (they DROP and recreate the tables):
docker run -d --name quiz-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=quiz -p 55432:5432 postgres:16-alpine
TEST_DATABASE_URL=postgres://postgres:test@localhost:55432/quiz npm test
```

CI (`.github/workflows/ci.yml`) runs lint, all tests against a Postgres service, and the build on every PR.

## 📂 Project structure

```
api/                  # Vercel serverless functions (Node, Web Request/Response handlers)
├── rooms/            # POST /api/rooms, /api/rooms/:code (+ join, start, answer)
├── leaderboard.js    # GET/POST /api/leaderboard
└── _lib/             # db (schema), rooms (state machine), leaderboard, rate limits, http helpers
tests/api/            # node:test suites (logic + real SQL against Postgres)
src/
├── pages/            # Home, Quiz, Room, Leaderboard, History, Profile, Friends, Chat, Search, Login, NotFound
├── components/       # Navbar, Footer, Avatar, EmptyState, ...
│   └── quiz/         # QuizPlayer, QuizResults
├── data/             # question bank (shared with the API) and social sample data
├── shared/           # game rules shared by browser and API (difficulties, scoring, nicknames)
└── utils/            # localStorage helpers, page titles
```

## 🎮 Multiplayer rooms

- **Create**: `POST /api/rooms` with a nickname, topic (any topic or *Mixed bag*, 8 random questions) and difficulty. The server picks the question order once, so every player sees the same questions in the same order. The creator becomes the host and gets a secret player token (kept in `localStorage`, sent as `x-player-token`; only its SHA-256 is stored).
- **Join**: friends open the invite link `/room/CODE` (or type the code) and pick a nickname (unique per room, max 20 players). Joining closes when the game starts; latecomers can watch.
- **Play**: the host starts the game; after a 3s countdown each question is open for the difficulty's timer, then the answer is revealed for 5s. A question closes early once every active player has answered.
- **Scoring is server-side**: the client only sends `{ questionIndex, choice }`. The server checks the answer against its own question bank and scores speed from its own clock: `base + round(100 × time left / timer)` with base 100 / 150 / 200 for Easy / Medium / Hard. Points for the live question stay hidden until the reveal.
- **No websockets on serverless**, so clients short-poll `GET /api/rooms/:code` every ~1.5s (and right when a phase is due to end). There is no background process either: each request derives the current phase from stored timestamps and persists any transition with a conditional update, so concurrent polls agree.
- **Expiry**: rooms expire 3 hours after creation; expired rooms (with their players and answers) are deleted when new rooms are created.

## 🏆 Global leaderboard

After a solo round, post the result with a nickname. The board shows the **top 20** (best result per nickname; ties go to the faster round) for all topics or one topic, and all or one difficulty.
Solo scores are computed in the browser, so the server **sanity-checks** them: known topic/difficulty, `total` equals the topic's question count, `1 ≤ correct ≤ total`, the score fits `correct × base … correct × (base + 100)`, and the round took at least as long as the score implies under the timer. Submissions are **rate-limited per IP** (5/minute, 60/day) with counters in Postgres, since serverless instances share no memory; IPs are stored only as salted hashes.

## 🔌 API

| Method | Path | Body / headers | Response |
| --- | --- | --- | --- |
| `POST` | `/api/rooms` | `{ nickname, topicId, difficulty? }` | `201 { code, token, playerId, expiresAt }` · 10/hour per IP |
| `GET` | `/api/rooms/:code` | optional `x-player-token` | room state: `phase` (`lobby`/`countdown`/`question`/`reveal`/`finished`), `phaseEndsAt`, `serverNow`, `players` (scoreboard), `question`, `reveal`, `me`, `review` |
| `POST` | `/api/rooms/:code/join` | `{ nickname }` | `201 { code, token, playerId }` · 30/10 min per IP |
| `POST` | `/api/rooms/:code/start` | `x-player-token` (host) | room state |
| `POST` | `/api/rooms/:code/answer` | `x-player-token`, `{ questionIndex, choice }` | `201 { accepted }` |
| `GET` | `/api/leaderboard?topic=&difficulty=` | — | `{ entries: [{ rank, nickname, topicId, difficulty, score, correct, total, durationMs, createdAt }] }` |
| `POST` | `/api/leaderboard` | `{ nickname, topicId, difficulty, score, correct, total, durationMs }` | `201 { id, rank, entry }` |

Errors are JSON `{ error, code? }` with `400/401/403/404/409/410/413/415/422/429` (429 includes `Retry-After`).

### Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Vercel (set by the Neon Marketplace integration) | **Pooled** Neon connection string used by the API (Neon HTTP driver). Required. |
| `IP_HASH_SALT` | Vercel (secret, recommended) | Secret salt for hashing client IPs in rate limits / scores. If unset, a salt is derived from `DATABASE_URL` (also secret); there is never a public fallback. |
| `TEST_DATABASE_URL` | local / CI only | Throwaway Postgres for the API tests. |

The Neon integration also adds `DATABASE_URL_UNPOOLED`, `PG*` and `POSTGRES_*` variables; the app does not use them. Tables are created idempotently (`CREATE TABLE IF NOT EXISTS`) on each instance's first request. Functions run in `sin1` (Singapore), next to the database.

## 📲 Install & offline (PWA)

`vite-plugin-pwa` generates `manifest.webmanifest` and a Workbox service worker (`sw.js`) at build time.
The service worker precaches the built app so it opens offline, and updates itself automatically when a
new version is deployed. The **Install app** button only appears when the browser offers installation
(the `beforeinstallprompt` event). Icons (`public/pwa-*.png`, maskable and Apple touch icons) are rendered
from the app's SVG logo. `vercel.json` serves `sw.js`, `registerSW.js` and the manifest with
`Cache-Control: no-cache` so updates are picked up promptly.

## 🌗 Theme

The app follows `prefers-color-scheme` until you pick a theme with the toggle (`src/shell/`); the choice is
saved in `localStorage` (`color-theme`) and applied before first paint. The design tokens in `src/index.css`
switch on `<html data-theme="dark">`, and Tailwind's `dark:` variant follows the same attribute.

## 🚀 Deployment

Deployed on **Vercel** (`vercel.json` rewrites every non-`/api` route to `index.html` so deep links like `/room/K7Q2XD` work, and pins functions to `sin1`); every push to `main` deploys to production. The service worker never serves `/api/*` from cache.
