import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { TOPICS, getTopic, roomTopicMeta, MIXED_TOPIC, MIXED_SIZE } from '../../src/data/quizData.js';
import { DIFFICULTIES, pointsFor, validateNickname, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, ROOM_CODE_PATTERN } from '../../src/shared/game.js';
import { HttpError, json, readJson, playerToken, sha256 } from './http.js';
import { db } from './db.js';
import { enforce, pruneRateLimits } from './rateLimit.js';

export const COUNTDOWN_MS = 3000;
export const REVEAL_MS = 5000;
export const ROOM_TTL_MS = 3 * 60 * 60 * 1000;
export const MAX_PLAYERS = 20;
// A player who has not polled for this long no longer holds up "everyone answered".
export const ACTIVE_WINDOW_MS = 12000;

// ---------- Pure helpers (unit tested) ----------

export const makeRoomCode = () => Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)]).join('');

export const normaliseCode = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

const shuffled = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// The room's question order, fixed at creation, as [topicId, questionIndex] references into the bank.
export const buildQuestionRefs = (topicId) => {
    if (topicId === MIXED_TOPIC.id) {
        const all = TOPICS.flatMap((t) => t.questions.map((_, i) => [t.id, i]));
        return shuffled(all).slice(0, MIXED_SIZE);
    }
    const topic = getTopic(topicId);
    return shuffled(topic.questions.map((_, i) => [topic.id, i]));
};

export const resolveQuestion = (ref) => {
    const [topicId, index] = ref;
    const question = getTopic(topicId)?.questions[index];
    if (!question) throw new Error(`Unknown question reference ${topicId}/${index}`);
    return question;
};

// Rooms advance on a clock: countdown -> (question -> reveal) x N -> finished. A question ends when its
// timer runs out or, earlier, when every active player has answered (reveal_at). There is no server
// process to drive this, so every request computes the current state from the stored timestamps.
export const advance = (room, now) => {
    if (room.status !== 'playing') return room;
    const next = { ...room };
    const durationMs = DIFFICULTIES[room.difficulty].seconds * 1000;
    for (;;) {
        const questionEnd = Math.min(next.questionStartedAt + durationMs, next.revealAt ?? Infinity);
        const nextStart = questionEnd + REVEAL_MS;
        if (now < nextStart) break;
        if (next.questionIndex + 1 >= next.total) {
            next.status = 'finished';
            break;
        }
        next.questionIndex += 1;
        next.questionStartedAt = nextStart;
        next.revealAt = null;
    }
    return next;
};

export const phaseOf = (room, now) => {
    if (room.status === 'lobby') return { phase: 'lobby', endsAt: null };
    if (room.status === 'finished') return { phase: 'finished', endsAt: null };
    const durationMs = DIFFICULTIES[room.difficulty].seconds * 1000;
    if (now < room.questionStartedAt) return { phase: 'countdown', endsAt: room.questionStartedAt };
    const questionEnd = Math.min(room.questionStartedAt + durationMs, room.revealAt ?? Infinity);
    if (now < questionEnd) return { phase: 'question', endsAt: questionEnd };
    return { phase: 'reveal', endsAt: questionEnd + REVEAL_MS };
};

// Server-side scoring: correctness from the stored question bank, speed from the server clock.
export const scoreAnswer = (room, choice, now) => {
    const question = resolveQuestion(room.questions[room.questionIndex]);
    const correct = choice === question.answer;
    const elapsedMs = Math.max(0, now - room.questionStartedAt);
    const remaining = DIFFICULTIES[room.difficulty].seconds - elapsedMs / 1000;
    return { correct, points: correct ? pointsFor(room.difficulty, remaining) : 0, elapsedMs };
};

const sameProgress = (a, b) => a.status === b.status && a.questionIndex === b.questionIndex
    && a.questionStartedAt === b.questionStartedAt && (a.revealAt ?? null) === (b.revealAt ?? null);

const fromRow = (row) => ({
    code: row.code,
    topicId: row.topic_id,
    difficulty: row.difficulty,
    questions: row.questions,
    total: row.questions.length,
    status: row.status,
    questionIndex: Number(row.question_index),
    questionStartedAt: row.question_started_at == null ? null : Number(row.question_started_at),
    revealAt: row.reveal_at == null ? null : Number(row.reveal_at),
    expiresAt: Number(row.expires_at),
});

const publicQuestion = (q) => ({ q: q.q, options: q.options });

// Shapes the response for one viewer. Correct answers and other players' points for the live
// question are withheld until the reveal phase.
export const buildState = ({ room, now, players, myAnswers, me }) => {
    const { phase, endsAt } = phaseOf(room, now);
    const topic = roomTopicMeta(room.topicId);
    const difficulty = DIFFICULTIES[room.difficulty];
    const showQuestion = phase === 'question' || phase === 'reveal';
    const current = showQuestion ? resolveQuestion(room.questions[room.questionIndex]) : null;
    const mine = myAnswers?.find((a) => Number(a.question_index) === room.questionIndex) || null;

    const state = {
        code: room.code,
        status: room.status,
        phase,
        phaseEndsAt: endsAt,
        serverNow: now,
        topic: { id: topic.id, name: topic.name },
        difficulty: difficulty.id,
        seconds: difficulty.seconds,
        totalQuestions: room.total,
        questionIndex: room.status === 'lobby' ? null : room.questionIndex,
        expiresAt: room.expiresAt,
        players: players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            isHost: p.is_host,
            score: Number(p.score),
            correct: Number(p.correct),
            answered: phase === 'question' || phase === 'reveal' ? Boolean(p.answered_current) : false,
            lastPoints: phase === 'reveal' || phase === 'finished' ? Number(p.last_points) : null,
            online: now - Number(p.last_seen) < ACTIVE_WINDOW_MS,
        })),
        question: current ? publicQuestion(current) : null,
        reveal: phase === 'reveal' ? { answer: current.answer, explain: current.explain } : null,
        me: null,
        review: null,
    };

    if (me) {
        state.me = {
            id: me.id,
            nickname: me.nickname,
            isHost: me.isHost,
            answer: mine ? {
                choice: mine.choice == null ? null : Number(mine.choice),
                ...(phase === 'reveal' ? { correct: mine.correct, points: Number(mine.points) } : {}),
            } : null,
        };
        if (phase === 'finished') {
            state.review = room.questions.map((ref, i) => {
                const q = resolveQuestion(ref);
                const a = myAnswers.find((row) => Number(row.question_index) === i);
                return {
                    question: q.q,
                    options: q.options,
                    answer: q.answer,
                    explain: q.explain,
                    chosen: a && a.choice != null ? Number(a.choice) : null,
                    correct: Boolean(a?.correct),
                    points: a ? Number(a.points) : 0,
                };
            });
        }
    }
    return state;
};

// ---------- Database access ----------

const loadRoom = async (sql, code, tokenHash) => {
    const [row] = await sql`
        SELECT r.*, p.id AS me_id, p.nickname AS me_nickname, p.is_host AS me_host
        FROM rooms r
        LEFT JOIN room_players p ON p.room_code = r.code AND p.token_hash = ${tokenHash ?? ''}
        WHERE r.code = ${code}`;
    return row || null;
};

const requireRoom = (row, now) => {
    if (!row) throw new HttpError(404, 'No room with that code. Check it and try again.', { code: 'not_found' });
    if (Number(row.expires_at) <= now) throw new HttpError(410, 'This room has expired. Create a new one.', { code: 'expired' });
    return fromRow(row);
};

const saveProgress = (sql, before, after) => sql`
    UPDATE rooms SET status = ${after.status}, question_index = ${after.questionIndex},
        question_started_at = ${after.questionStartedAt}::bigint, reveal_at = ${after.revealAt}::bigint
    WHERE code = ${before.code} AND status = ${before.status} AND question_index = ${before.questionIndex}
        AND reveal_at IS NOT DISTINCT FROM ${before.revealAt}::bigint`;

const scoreboardQuery = (sql, room, phase) => {
    // While a question is live its points stay hidden, so scores cannot leak who answered correctly.
    const hiddenIndex = phase === 'question' ? room.questionIndex : -1;
    return sql`
        SELECT p.id, p.nickname, p.is_host, p.last_seen, p.joined_at,
            COALESCE(SUM(a.points) FILTER (WHERE a.question_index <> ${hiddenIndex}), 0) AS score,
            COUNT(*) FILTER (WHERE a.correct AND a.question_index <> ${hiddenIndex}) AS correct,
            COALESCE(SUM(a.points) FILTER (WHERE a.question_index = ${room.questionIndex}), 0) AS last_points,
            COALESCE(BOOL_OR(a.question_index = ${room.questionIndex}), FALSE) AS answered_current
        FROM room_players p
        LEFT JOIN room_answers a ON a.room_code = p.room_code AND a.player_id = p.id
        WHERE p.room_code = ${room.code}
        GROUP BY p.id
        ORDER BY score DESC, p.joined_at ASC`;
};

const myAnswersQuery = (sql, room, playerId) => sql`
    SELECT question_index, choice, correct, points FROM room_answers
    WHERE room_code = ${room.code} AND player_id = ${playerId}
    ORDER BY question_index`;

const meFrom = (row) => (row.me_id ? { id: row.me_id, nickname: row.me_nickname, isHost: row.me_host } : null);

// Reads (and, if the clock has moved it on, persists) the room, then returns the viewer's state.
const readState = async (sql, code, tokenHash, now) => {
    const row = await loadRoom(sql, code, tokenHash);
    const stored = requireRoom(row, now);
    const room = advance(stored, now);
    const me = meFrom(row);
    const { phase } = phaseOf(room, now);
    const queries = [
        scoreboardQuery(sql, room, phase),
        me ? myAnswersQuery(sql, room, me.id) : sql`SELECT 1 WHERE FALSE`,
    ];
    if (me) queries.push(sql`UPDATE room_players SET last_seen = ${now}::bigint WHERE id = ${me.id}`);
    if (!sameProgress(stored, room)) queries.push(saveProgress(sql, stored, room));
    const [players, myAnswers] = await sql.transaction(queries);
    return buildState({ room, now, players, myAnswers, me });
};

const newToken = () => randomBytes(24).toString('base64url');

const parseCodeParam = (request) => {
    const segments = new URL(request.url).pathname.split('/').filter(Boolean); // api, rooms, CODE, [action]
    const code = normaliseCode(decodeURIComponent(segments[2] || ''));
    if (!ROOM_CODE_PATTERN.test(code)) throw new HttpError(400, 'Room codes are 6 letters or numbers.', { code: 'bad_code' });
    return code;
};

const requireToken = (request) => {
    const token = playerToken(request);
    if (!token) throw new HttpError(401, 'Join the room first.', { code: 'no_token' });
    return sha256(token);
};

// ---------- Route handlers ----------

export const createRoom = async (request, now = Date.now()) => {
    const body = await readJson(request);
    const nickname = validateNickname(body.nickname);
    if (!nickname.ok) throw new HttpError(422, nickname.error, { code: 'bad_nickname' });
    const topicId = typeof body.topicId === 'string' ? body.topicId : '';
    if (!roomTopicMeta(topicId) || topicId === 'review') throw new HttpError(422, 'Pick a topic for the room.', { code: 'bad_topic' });
    const difficulty = body.difficulty ?? 'medium';
    if (!Object.hasOwn(DIFFICULTIES, difficulty)) throw new HttpError(422, 'Unknown difficulty.', { code: 'bad_difficulty' });

    const sql = await db();
    await enforce(sql, request, 'createRoom', now);
    // Housekeeping: expired rooms (and their players/answers, via cascade) go away.
    await sql`DELETE FROM rooms WHERE expires_at <= ${now}::bigint`;
    if (Math.random() < 0.05) await pruneRateLimits(sql, now);

    const token = newToken();
    const playerId = randomUUID();
    const refs = JSON.stringify(buildQuestionRefs(topicId));
    for (let attempt = 0; attempt < 6; attempt++) {
        const code = makeRoomCode();
        const created = await sql`
            WITH room AS (
                INSERT INTO rooms (code, topic_id, difficulty, questions, created_at, expires_at)
                VALUES (${code}, ${topicId}, ${difficulty}, ${refs}::jsonb, ${now}::bigint, ${now + ROOM_TTL_MS}::bigint)
                ON CONFLICT (code) DO NOTHING
                RETURNING code
            )
            INSERT INTO room_players (id, room_code, nickname, token_hash, is_host, joined_at, last_seen)
            SELECT ${playerId}, room.code, ${nickname.value}, ${sha256(token)}, TRUE, ${now}::bigint, ${now}::bigint FROM room
            RETURNING room_code`;
        if (created.length) {
            return json({ code, token, playerId, expiresAt: now + ROOM_TTL_MS }, 201);
        }
    }
    throw new Error('Could not allocate a room code');
};

export const joinRoom = async (request, now = Date.now()) => {
    const code = parseCodeParam(request);
    const body = await readJson(request);
    const nickname = validateNickname(body.nickname);
    if (!nickname.ok) throw new HttpError(422, nickname.error, { code: 'bad_nickname' });

    const sql = await db();
    await enforce(sql, request, 'joinRoom', now);
    const room = requireRoom(await loadRoom(sql, code, null), now);
    if (room.status !== 'lobby') throw new HttpError(409, 'This game has already started. Ask the host for a new room.', { code: 'started' });

    const token = newToken();
    const playerId = randomUUID();
    const inserted = await sql`
        INSERT INTO room_players (id, room_code, nickname, token_hash, is_host, joined_at, last_seen)
        SELECT ${playerId}, ${code}, ${nickname.value}, ${sha256(token)}, FALSE, ${now}::bigint, ${now}::bigint
        WHERE EXISTS (SELECT 1 FROM rooms WHERE code = ${code} AND status = 'lobby')
          AND (SELECT count(*) FROM room_players WHERE room_code = ${code}) < ${MAX_PLAYERS}
        ON CONFLICT (room_code, lower(nickname)) DO NOTHING
        RETURNING id`;
    if (!inserted.length) {
        const [{ players, status }] = await sql`
            SELECT (SELECT count(*) FROM room_players WHERE room_code = ${code}) AS players,
                   (SELECT status FROM rooms WHERE code = ${code}) AS status`;
        if (status !== 'lobby') throw new HttpError(409, 'This game has already started. Ask the host for a new room.', { code: 'started' });
        if (Number(players) >= MAX_PLAYERS) throw new HttpError(409, `This room is full (${MAX_PLAYERS} players).`, { code: 'full' });
        throw new HttpError(409, 'That nickname is taken in this room. Pick another.', { code: 'nickname_taken' });
    }
    return json({ code, token, playerId }, 201);
};

export const startRoom = async (request, now = Date.now()) => {
    const code = parseCodeParam(request);
    const tokenHash = requireToken(request);
    const sql = await db();
    const row = await loadRoom(sql, code, tokenHash);
    requireRoom(row, now);
    const me = meFrom(row);
    if (!me) throw new HttpError(403, 'You are not in this room.', { code: 'not_member' });
    if (!me.isHost) throw new HttpError(403, 'Only the host can start the game.', { code: 'not_host' });
    const started = await sql`
        UPDATE rooms SET status = 'playing', question_index = 0, question_started_at = ${now + COUNTDOWN_MS}::bigint, reveal_at = NULL
        WHERE code = ${code} AND status = 'lobby'
        RETURNING code`;
    if (!started.length) throw new HttpError(409, 'The game has already started.', { code: 'started' });
    return json(await readState(sql, code, tokenHash, now));
};

export const getRoom = async (request, now = Date.now()) => {
    const code = parseCodeParam(request);
    const token = playerToken(request);
    const sql = await db();
    return json(await readState(sql, code, token ? sha256(token) : null, now));
};

export const submitAnswer = async (request, now = Date.now()) => {
    const code = parseCodeParam(request);
    const tokenHash = requireToken(request);
    const body = await readJson(request);
    const sql = await db();
    const row = await loadRoom(sql, code, tokenHash);
    const stored = requireRoom(row, now);
    const me = meFrom(row);
    if (!me) throw new HttpError(403, 'You are not in this room.', { code: 'not_member' });

    const room = advance(stored, now);
    const { phase } = phaseOf(room, now);
    if (phase !== 'question' || body.questionIndex !== room.questionIndex) {
        throw new HttpError(409, 'Too late — that question has closed.', { code: 'closed' });
    }
    const question = resolveQuestion(room.questions[room.questionIndex]);
    if (!Number.isInteger(body.choice) || body.choice < 0 || body.choice >= question.options.length) {
        throw new HttpError(422, 'Pick one of the answers.', { code: 'bad_choice' });
    }

    const { correct, points, elapsedMs } = scoreAnswer(room, body.choice, now);
    const queries = [];
    if (!sameProgress(stored, room)) queries.push(saveProgress(sql, stored, room));
    queries.push(
        sql`INSERT INTO room_answers (room_code, player_id, question_index, choice, correct, points, answer_ms)
            VALUES (${code}, ${me.id}, ${room.questionIndex}, ${body.choice}, ${correct}, ${points}, ${elapsedMs})
            ON CONFLICT DO NOTHING
            RETURNING question_index`,
        sql`UPDATE room_players SET last_seen = ${now}::bigint WHERE id = ${me.id}`,
        // Everyone still here has answered: close the question early and move to the reveal.
        sql`UPDATE rooms SET reveal_at = ${now}::bigint
            WHERE code = ${code} AND status = 'playing' AND question_index = ${room.questionIndex} AND reveal_at IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM room_players p
                WHERE p.room_code = ${code} AND p.last_seen >= ${now - ACTIVE_WINDOW_MS}::bigint
                  AND NOT EXISTS (
                    SELECT 1 FROM room_answers a
                    WHERE a.room_code = ${code} AND a.player_id = p.id AND a.question_index = ${room.questionIndex}))`,
    );
    const results = await sql.transaction(queries);
    const insertedRows = results[queries.length - 3];
    if (!insertedRows.length) throw new HttpError(409, 'You already answered this question.', { code: 'already_answered' });
    return json({ accepted: true, questionIndex: room.questionIndex, choice: body.choice }, 201);
};
