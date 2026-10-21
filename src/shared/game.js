// Game rules shared by the browser and the API (api/_lib). Keep this file free of browser/Node-only APIs.

export const DIFFICULTIES = {
    easy: { id: 'easy', label: 'Easy', seconds: 30, base: 100 },
    medium: { id: 'medium', label: 'Medium', seconds: 20, base: 150 },
    hard: { id: 'hard', label: 'Hard', seconds: 10, base: 200 },
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES);
export const DEFAULT_DIFFICULTY = 'medium';
export const MAX_SPEED_BONUS = 100;

export const getDifficulty = (id) => DIFFICULTIES[id] || DIFFICULTIES[DEFAULT_DIFFICULTY];

// Points for a correct answer: the difficulty's base plus up to 100 for speed.
// `remainingSeconds` may be fractional (server) or a whole countdown value (client).
export const pointsFor = (difficultyId, remainingSeconds) => {
    const { seconds, base } = getDifficulty(difficultyId);
    const fraction = Math.min(1, Math.max(0, remainingSeconds / seconds));
    return base + Math.round(MAX_SPEED_BONUS * fraction);
};

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;
const NICKNAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} _.'-]*$/u; // \p{M}: combining marks (e.g. Devanagari vowel signs)

// Returns { ok: true, value } with a normalised nickname, or { ok: false, error }.
export const validateNickname = (input) => {
    if (typeof input !== 'string') return { ok: false, error: 'Enter a nickname.' };
    const value = input.normalize('NFC').trim().replace(/\s+/g, ' ');
    if (value.length < NICKNAME_MIN) return { ok: false, error: `Nicknames need at least ${NICKNAME_MIN} characters.` };
    if (value.length > NICKNAME_MAX) return { ok: false, error: `Nicknames can be at most ${NICKNAME_MAX} characters.` };
    if (!NICKNAME_PATTERN.test(value)) return { ok: false, error: 'Use letters, numbers, spaces, dots, dashes or underscores.' };
    return { ok: true, value };
};

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;
