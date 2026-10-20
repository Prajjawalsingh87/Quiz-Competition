# 🧠 Quiz Competition

A timed quiz game: play solo, create or join rooms with a code, review your answers, and track your history. Built with React, React Router and Tailwind CSS.

**🔗 Live:** https://quiz-competition-plum.vercel.app

## ✨ Features

- **Play solo** by picking a topic, or **create a room** (code + copyable invite link) and **join by code or link**
- **Timed questions** with a countdown, progress bar, speed bonus and streak badge
- Clear **selected / correct / wrong** answer states; keyboard shortcuts (1–4 to pick, Enter to confirm)
- **Results** with a score ring and an answer-by-answer review, saved to **History**
- **Global search (Ctrl+K / ⌘K)** across topics, questions and your past games, powered by MiniSearch (fuzzy, prefix, ranked); jump straight to a topic or a highlighted past result
- **Review my mistakes** practice mode: missed questions are saved, practised in short rounds, and leave the list once you get them right
- **Profile, Friends, Chat and Search** pages
- Sticky navbar with a mobile menu, 404 page
- **Installable & offline**: install it to your home screen or desktop with the **Install app** button; it keeps working without a connection
- **Light / dark theme**: follows your system by default; the toggle in the top bar remembers your choice

> **Demo mode:** there is no backend yet. Login accepts any password and 4–6 digit code, data comes from sample files in `src/data/`, and history/session are stored in the browser. Rooms share a topic but are not live multiplayer.

## 🛠 Tech Stack

React 19 · React Router 7 · Vite 7 · Tailwind CSS 4 · MiniSearch · lucide-react icons · vite-plugin-pwa (Workbox)

## ▶️ Run locally

```bash
git clone https://github.com/Prajjawalsingh87/Quiz-Competition.git
cd Quiz-Competition
npm install
npm run dev        # http://localhost:5173
```

## 📂 Project structure

```
src/
├── pages/            # Home, Quiz, History, Profile, Friends, Chat, Search, Login, NotFound
├── components/       # Navbar, Footer, Avatar, EmptyState, ...
│   └── quiz/         # QuizPlayer, QuizResults
├── data/             # sample questions and social data
└── utils/            # localStorage helpers, page titles
```

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

Deployed on **Vercel** (`vercel.json` rewrites all routes to `index.html` so deep links like `/quiz` work); every push to `main` deploys to production.
