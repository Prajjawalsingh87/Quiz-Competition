# Quiz Studio

A responsive solo quiz app built with React, Vite and React Router.

Live: https://quiz-competition-plum.vercel.app

## Features

- Five-question rounds from a curated ten-question bank
- Web, Systems or Mixed topics, shuffled each round
- 60 seconds per question; expired questions count as unanswered
- Answer selection, score and explanations for every question
- Save up to 50 results in this browser; view and clear history
- Responsive indigo/slate design, keyboard focus and reduced-motion support

Results are saved only when you choose **Save result**. No account or backend
is required. Multiplayer rooms, AI generation, chat, friends and authentication
are not implemented; legacy routes explain this and link back to practice.
The former placeholder components are retained in source for future development.

## Run and verify

Node.js 24:

```bash
npm ci
npm run dev
npm run lint
npm run build
```

Question content lives in `src/data/questions.js`. The three active pages are
`Home`, `Quiz`, and `History`. `vercel.json` supports direct navigation to routes.

## Deploy from the terminal

```bash
vercel link --project quiz-competition
vercel deploy
vercel deploy --prod
```

The CLI's local project link is ignored by Git. Preview and production storage
are separate browser origins; results do not automatically sync between them.
