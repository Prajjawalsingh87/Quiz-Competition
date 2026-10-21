import { route } from '../_lib/http.js';
import { createRoom } from '../_lib/rooms.js';

// POST /api/rooms — create a room; the creator becomes its host.
const handler = route({ POST: createRoom });
export const POST = handler;
export const GET = handler;
