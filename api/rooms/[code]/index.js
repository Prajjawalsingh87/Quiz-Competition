import { route } from '../../_lib/http.js';
import { getRoom } from '../../_lib/rooms.js';

// GET /api/rooms/:code — current room state (send x-player-token to include your own answers).
const handler = route({ GET: getRoom });
export const GET = handler;
export const POST = handler;
