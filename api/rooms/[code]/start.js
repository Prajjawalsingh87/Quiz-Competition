import { route } from '../../_lib/http.js';
import { startRoom } from '../../_lib/rooms.js';

// POST /api/rooms/:code/start — host starts the game.
const handler = route({ POST: startRoom });
export const POST = handler;
export const GET = handler;
