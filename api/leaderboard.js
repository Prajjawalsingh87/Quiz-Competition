import { route } from './_lib/http.js';
import { getLeaderboard, submitScore } from './_lib/leaderboard.js';

// GET /api/leaderboard?topic=&difficulty= — top 20; POST /api/leaderboard — submit a solo result.
const handler = route({ GET: getLeaderboard, POST: submitScore });
export const GET = handler;
export const POST = handler;
