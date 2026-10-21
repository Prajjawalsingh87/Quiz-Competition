import { route } from '../../_lib/http.js';
import { joinRoom } from '../../_lib/rooms.js';

// POST /api/rooms/:code/join — join the lobby with a nickname.
const handler = route({ POST: joinRoom });
export const POST = handler;
export const GET = handler;
