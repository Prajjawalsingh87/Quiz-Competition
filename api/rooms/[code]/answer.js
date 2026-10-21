import { route } from '../../_lib/http.js';
import { submitAnswer } from '../../_lib/rooms.js';

// POST /api/rooms/:code/answer — lock in an answer for the live question.
const handler = route({ POST: submitAnswer });
export const POST = handler;
export const GET = handler;
