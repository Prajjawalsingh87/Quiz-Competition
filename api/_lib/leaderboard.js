import { TOPICS, getTopic } from '../../src/data/quizData.js';
import { DIFFICULTIES, MAX_SPEED_BONUS, validateNickname } from '../../src/shared/game.js';
import { HttpError, json, readJson } from './http.js';
import { db } from './db.js';
import { enforce, pruneRateLimits } from './rateLimit.js';

export const LEADERBOARD_SIZE = 20;
const MAX_DURATION_MS = 2 * 60 * 60 * 1000;
const isInt = (v) => Number.isInteger(v);

// Lower bound on how long a solo round must have taken, given its score. A correct answer worth
// `base + bonus` was answered with about bonus% of the timer left, so the rest of the timer elapsed.
// Allows for whole-second countdown display and bonus rounding, plus a little network/render slack.
export const minPlausibleDurationMs = ({ difficulty, score, correct }) => {
    const { seconds, base } = DIFFICULTIES[difficulty];
    const bonusSum = score - correct * base;
    const perCorrect = seconds - 1 - (0.5 * seconds) / MAX_SPEED_BONUS;
    const minSeconds = correct * perCorrect - (bonusSum * seconds) / MAX_SPEED_BONUS;
    return Math.max(0, Math.floor(minSeconds * 1000) - 1500);
};

// Solo scores are computed in the browser, so they cannot be fully trusted. This rejects
// anything that is impossible under the game rules (too many points, too fast, wrong shape).
export const validateSubmission = (body) => {
    const fail = (message) => { throw new HttpError(422, message, { code: 'invalid_submission' }); };
    const nickname = validateNickname(body.nickname);
    if (!nickname.ok) fail(nickname.error);

    const topic = typeof body.topicId === 'string' ? getTopic(body.topicId) : null;
    if (!topic) fail('Unknown topic.');
    const difficulty = DIFFICULTIES[body.difficulty];
    if (!difficulty || !Object.hasOwn(DIFFICULTIES, body.difficulty)) fail('Unknown difficulty.');

    const { score, correct, total, durationMs } = body;
    if (![score, correct, total, durationMs].every(isInt)) fail('Score, correct, total and durationMs must be whole numbers.');
    if (total !== topic.questions.length) fail(`A ${topic.name} round has ${topic.questions.length} questions.`);
    if (correct < 1 || correct > total) fail('Correct answers must be between 1 and the number of questions.');
    if (score < correct * difficulty.base || score > correct * (difficulty.base + MAX_SPEED_BONUS)) fail('That score is not possible for this round.');
    if (durationMs < 1000 || durationMs > MAX_DURATION_MS) fail('That round time is not plausible.');
    if (durationMs < minPlausibleDurationMs({ difficulty: difficulty.id, score, correct })) fail('That score was submitted faster than the timer allows.');

    return { nickname: nickname.value, topicId: topic.id, difficulty: difficulty.id, score, correct, total, durationMs };
};

export const parseFilters = (url) => {
    const topic = url.searchParams.get('topic') || null;
    const difficulty = url.searchParams.get('difficulty') || null;
    if (topic && topic !== 'all' && !getTopic(topic)) throw new HttpError(400, 'Unknown topic filter.');
    if (difficulty && difficulty !== 'all' && !Object.hasOwn(DIFFICULTIES, difficulty)) throw new HttpError(400, 'Unknown difficulty filter.');
    return { topicId: topic === 'all' ? null : topic, difficulty: difficulty === 'all' ? null : difficulty };
};

const toEntry = (row, i) => ({
    rank: i + 1,
    nickname: row.nickname,
    topicId: row.topic_id,
    difficulty: row.difficulty,
    score: Number(row.score),
    correct: Number(row.correct),
    total: Number(row.total),
    durationMs: Number(row.duration_ms),
    createdAt: new Date(row.created_at).toISOString(),
});

// Top entries, best score per nickname, so one person cannot fill the board.
export const topScores = async (sql, { topicId = null, difficulty = null } = {}, limit = LEADERBOARD_SIZE) => {
    const rows = await sql`
        SELECT * FROM (
            SELECT DISTINCT ON (lower(nickname)) id, nickname, topic_id, difficulty, score, correct, total, duration_ms, created_at
            FROM scores
            WHERE (${topicId}::text IS NULL OR topic_id = ${topicId}::text)
              AND (${difficulty}::text IS NULL OR difficulty = ${difficulty}::text)
            ORDER BY lower(nickname), score DESC, duration_ms ASC, id ASC
        ) best
        ORDER BY score DESC, duration_ms ASC, id ASC
        LIMIT ${limit}`;
    return rows.map(toEntry);
};

// Position this result would take on its topic + difficulty board (ignoring the player's other entries).
const rankFor = async (sql, entry) => {
    const [row] = await sql`
        SELECT count(*) AS ahead FROM (
            SELECT DISTINCT ON (lower(nickname)) nickname, score, duration_ms
            FROM scores
            WHERE topic_id = ${entry.topicId} AND difficulty = ${entry.difficulty}
            ORDER BY lower(nickname), score DESC, duration_ms ASC, id ASC
        ) best
        WHERE lower(best.nickname) <> lower(${entry.nickname})
          AND (best.score > ${entry.score} OR (best.score = ${entry.score} AND best.duration_ms < ${entry.durationMs}))`;
    return Number(row.ahead) + 1;
};

export const getLeaderboard = async (request) => {
    const filters = parseFilters(new URL(request.url));
    const sql = await db();
    const entries = await topScores(sql, filters);
    return json({ entries, filters: { topicId: filters.topicId || 'all', difficulty: filters.difficulty || 'all' }, topics: TOPICS.map((t) => t.id) }, 200, {
        // Briefly cacheable at the edge; a fresh submit returns its own rank, so this lag is invisible.
        'cache-control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=10',
    });
};

export const submitScore = async (request, now = Date.now()) => {
    const entry = validateSubmission(await readJson(request));
    const sql = await db();
    const ipHash = await enforce(sql, request, 'submitScore', now);
    await enforce(sql, request, 'submitScoreDaily', now);
    const [row] = await sql`
        INSERT INTO scores (nickname, topic_id, difficulty, score, correct, total, duration_ms, ip_hash)
        VALUES (${entry.nickname}, ${entry.topicId}, ${entry.difficulty}, ${entry.score}, ${entry.correct}, ${entry.total}, ${entry.durationMs}, ${ipHash})
        RETURNING id`;
    const rank = await rankFor(sql, entry);
    if (Math.random() < 0.05) await pruneRateLimits(sql, now);
    return json({ id: String(row.id), rank, entry }, 201);
};
