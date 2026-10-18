# 🧠 Quiz Competition

A timed quiz game: play solo, create or join rooms with a code, review your answers, and track your history. Built with React, React Router and Tailwind CSS.

**🔗 Live:** https://quiz-competition-plum.vercel.app

## ✨ Features

- **Play solo** by picking a topic, or **create a room** (code + copyable invite link) and **join by code or link**
- **Timed questions** with a countdown, progress bar, speed bonus and streak badge
- Clear **selected / correct / wrong** answer states; keyboard shortcuts (1–4 to pick, Enter to confirm)
- **Results** with a score ring and an answer-by-answer review, saved to **History**
- **Profile, Friends, Chat and Search** pages
- Sticky navbar with a mobile menu, automatic dark mode, 404 page

> **Demo mode:** there is no backend yet. Login accepts any password and 4–6 digit code, data comes from sample files in `src/data/`, and history/session are stored in the browser. Rooms share a topic but are not live multiplayer.

## 🛠 Tech Stack

React 19 · React Router 7 · Vite 7 · Tailwind CSS 4 · lucide-react icons

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

## 🚀 Deployment

Deployed on **Vercel** (`vercel.json` rewrites all routes to `index.html` so deep links like `/quiz` work); every push to `main` deploys to production.
