// Runs the real handlers and SQL against Postgres. Set TEST_DATABASE_URL to a throwaway database
// (CI starts one as a service; locally: docker run -e POSTGRES_PASSWORD=test -p 55432:5432 postgres:16-alpine).
// Every table the API uses is dropped and recreated, so never point this at a real database.
import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPgSql } from './pgSql.js';
import { setSql, db } from '../../api/_lib/db.js';
import { createRoom, joinRoom, startRoom, getRoom, submitAnswer, resolveQuestion, COUNTDOWN_MS, REVEAL_MS, ROOM_TTL_MS, MAX_PLAYERS } from '../../api/_lib/rooms.js';
import { submitScore, getLeaderboard } from '../../api/_lib/leaderboard.js';
import { route } from '../../api/_lib/http.js';

const url = process.env.TEST_DATABASE_URL;
process.env.IP_HASH_SALT ||= 'test-salt';
const skip = url ? false : 'TEST_DATABASE_URL not set';

const BASE = 'http://localhost';
const req = (path, { method = 'GET', body, token, ip = '203.0.113.7' } = {}) => new Request(`${BASE}${path}`, {
    method,
    headers: {
        'x-real-ip': ip,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { 'x-player-token': token } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
});

// Handlers throw HttpError for client errors; route() turns those into responses, as in production.
const call = async (fn, request, now) => {
    const res = await route({ [request.method]: (r) => fn(r, now) })(request);
    return { status: res.status, headers: res.headers, body: await res.json() };
};

describe('API against Postgres', { skip }, () => {
    let sql;

    before(async () => {
        sql = createPgSql(url);
        for (const table of ['room_answers', 'room_players', 'rooms', 'scores', 'rate_limits']) {
            await sql.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        }
        setSql(sql);
        await db();
    });

    after(async () => sql?.end());

    beforeEach(async () => {
        await sql.query('TRUNCATE room_answers, room_players, rooms, scores, rate_limits');
    });

    describe('rooms', () => {
        const T = 1_800_000_000_000;

        const setup = async () => {
            const created = await call(createRoom, req('/api/rooms', { method: 'POST', body: { nickname: 'Hosty', topicId: 'science', difficulty: 'medium' } }), T);
            assert.equal(created.status, 201);
            const { code, token: hostToken } = created.body;
            const guest = await call(joinRoom, req(`/api/rooms/${code}/join`, { method: 'POST', body: { nickname: 'Guesty' } }), T + 100);
            assert.equal(guest.status, 201);
            const [row] = await sql`SELECT questions FROM rooms WHERE code = ${code}`;
            const answers = row.questions.map((ref) => resolveQuestion(ref).answer);
            return { code, hostToken, guestToken: guest.body.token, answers };
        };

        it('plays a full game with server-side scoring', async () => {
            const { code, hostToken, guestToken, answers } = await setup();

            const lobby = await call(getRoom, req(`/api/rooms/${code}`, { token: guestToken }), T + 200);
            assert.equal(lobby.body.phase, 'lobby');
            assert.deepEqual(lobby.body.players.map((p) => p.nickname).sort(), ['Guesty', 'Hosty']);
            assert.equal(lobby.body.me.nickname, 'Guesty');
            assert.equal(lobby.body.me.isHost, false);

            const notHost = await call(startRoom, req(`/api/rooms/${code}/start`, { method: 'POST', token: guestToken }), T + 300);
            assert.equal(notHost.status, 403);

            const start = T + 1000;
            const started = await call(startRoom, req(`/api/rooms/${code}/start`, { method: 'POST', token: hostToken }), start);
            assert.equal(started.status, 200);
            assert.equal(started.body.phase, 'countdown');
            const q0 = start + COUNTDOWN_MS;

            const early = await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', token: hostToken, body: { questionIndex: 0, choice: answers[0] } }), q0 - 1);
            assert.equal(early.status, 409);

            // Host answers right after 2s; the client-sent fields cannot influence the points.
            const a1 = await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', token: hostToken, body: { questionIndex: 0, choice: answers[0], points: 99999, correct: true } }), q0 + 2000);
            assert.equal(a1.status, 201);
            assert.deepEqual(a1.body, { accepted: true, questionIndex: 0, choice: answers[0] });

            const again = await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', token: hostToken, body: { questionIndex: 0, choice: answers[0] } }), q0 + 2500);
            assert.equal(again.status, 409);

            // Mid-question: the guest sees that the host answered, but not the points or the correct answer.
            const mid = await call(getRoom, req(`/api/rooms/${code}`, { token: guestToken }), q0 + 3000);
            assert.equal(mid.body.phase, 'question');
            assert.equal(mid.body.reveal, null);
            assert.equal(mid.body.question.answer, undefined);
            const hostMid = mid.body.players.find((p) => p.nickname === 'Hosty');
            assert.equal(hostMid.answered, true);
            assert.equal(hostMid.score, 0);

            // Guest answers wrong; everyone has answered, so the reveal starts immediately.
            const wrong = (answers[0] + 1) % 4;
            const a2 = await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', token: guestToken, body: { questionIndex: 0, choice: wrong } }), q0 + 4000);
            assert.equal(a2.status, 201);

            const reveal = await call(getRoom, req(`/api/rooms/${code}`, { token: guestToken }), q0 + 4100);
            assert.equal(reveal.body.phase, 'reveal');
            assert.equal(reveal.body.phaseEndsAt, q0 + 4000 + REVEAL_MS);
            assert.equal(reveal.body.reveal.answer, answers[0]);
            assert.deepEqual(reveal.body.me.answer, { choice: wrong, correct: false, points: 0 });
            assert.deepEqual(reveal.body.players.map((p) => [p.nickname, p.score, p.lastPoints]), [['Hosty', 240, 240], ['Guesty', 0, 0]]);

            // Next question starts after the reveal; nobody answers, so it runs out on the timer.
            const q1 = q0 + 4000 + REVEAL_MS;
            const second = await call(getRoom, req(`/api/rooms/${code}`, { token: hostToken }), q1 + 10);
            assert.equal(second.body.questionIndex, 1);
            assert.equal(second.body.phase, 'question');
            const late = await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', token: guestToken, body: { questionIndex: 1, choice: answers[1] } }), q1 + 20_000);
            assert.equal(late.status, 409);
            const guestRight = await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', token: guestToken, body: { questionIndex: 1, choice: answers[1] } }), q1 + 19_000);
            assert.equal(guestRight.status, 201);

            // Long after: everything has finished; the review lists each question.
            const done = await call(getRoom, req(`/api/rooms/${code}`, { token: guestToken }), q1 + 10 * 60_000);
            assert.equal(done.body.phase, 'finished');
            assert.equal(done.body.review.length, 5);
            assert.equal(done.body.review[1].correct, true);
            assert.equal(done.body.review[1].points, 155);
            assert.deepEqual(done.body.players.map((p) => [p.nickname, p.score, p.correct]), [['Hosty', 240, 1], ['Guesty', 155, 1]]);
            const [{ status }] = await sql`SELECT status FROM rooms WHERE code = ${code}`;
            assert.equal(status, 'finished');
        });

        it('closes the question early when the last answers arrive at the same time', async () => {
            const { code, hostToken, guestToken, answers } = await setup();
            const start = T + 1000;
            await call(startRoom, req(`/api/rooms/${code}/start`, { method: 'POST', token: hostToken }), start);
            const q0 = start + COUNTDOWN_MS;
            const results = await Promise.all([hostToken, guestToken].map((token) => call(submitAnswer,
                req(`/api/rooms/${code}/answer`, { method: 'POST', token, body: { questionIndex: 0, choice: answers[0] } }), q0 + 1000)));
            assert.deepEqual(results.map((r) => r.status), [201, 201]);
            const [{ reveal_at: revealAt }] = await sql`SELECT reveal_at FROM rooms WHERE code = ${code}`;
            assert.equal(Number(revealAt), q0 + 1000);
        });

        it('rejects joins after the start, duplicate nicknames and unknown rooms', async () => {
            const { code, hostToken } = await setup();
            const dup = await call(joinRoom, req(`/api/rooms/${code}/join`, { method: 'POST', body: { nickname: 'guesty' } }), T + 500);
            assert.equal(dup.status, 409);
            assert.equal(dup.body.code, 'nickname_taken');

            await call(startRoom, req(`/api/rooms/${code}/start`, { method: 'POST', token: hostToken }), T + 600);
            const late = await call(joinRoom, req(`/api/rooms/${code}/join`, { method: 'POST', body: { nickname: 'Latecomer' } }), T + 700);
            assert.equal(late.status, 409);
            assert.equal(late.body.code, 'started');

            const again = await call(startRoom, req(`/api/rooms/${code}/start`, { method: 'POST', token: hostToken }), T + 800);
            assert.equal(again.status, 409);

            assert.equal((await call(getRoom, req('/api/rooms/ZZZZZZ'), T)).status, 404);
            assert.equal((await call(getRoom, req('/api/rooms/bad!'), T)).status, 400);
            assert.equal((await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', body: { questionIndex: 0, choice: 0 } }), T)).status, 401);
            assert.equal((await call(submitAnswer, req(`/api/rooms/${code}/answer`, { method: 'POST', token: 'x'.repeat(32), body: { questionIndex: 0, choice: 0 } }), T)).status, 403);
        });

        it('validates room input', async () => {
            const bad = async (body) => (await call(createRoom, req('/api/rooms', { method: 'POST', body }), T)).status;
            assert.equal(await bad({ nickname: 'A', topicId: 'science' }), 422);
            assert.equal(await bad({ nickname: 'Ann', topicId: 'review' }), 422);
            assert.equal(await bad({ nickname: 'Ann', topicId: 'science', difficulty: 'toString' }), 422);
            const notJson = await route({ POST: (r) => createRoom(r, T) })(new Request(`${BASE}/api/rooms`, { method: 'POST', body: 'nickname=x' }));
            assert.equal(notJson.status, 415);
            const mixed = await call(createRoom, req('/api/rooms', { method: 'POST', body: { nickname: 'Ann', topicId: 'mixed' } }), T);
            assert.equal(mixed.status, 201);
            const state = await call(getRoom, req(`/api/rooms/${mixed.body.code}`, { token: mixed.body.token }), T);
            assert.equal(state.body.totalQuestions, 8);
            assert.equal(state.body.difficulty, 'medium');
        });

        it('caps room size', async () => {
            const { code } = await setup();
            for (let i = 2; i < MAX_PLAYERS; i++) {
                const r = await call(joinRoom, req(`/api/rooms/${code}/join`, { method: 'POST', body: { nickname: `Player ${i}` }, ip: `198.51.100.${i}` }), T + i);
                assert.equal(r.status, 201);
            }
            const full = await call(joinRoom, req(`/api/rooms/${code}/join`, { method: 'POST', body: { nickname: 'One too many' } }), T + 999);
            assert.equal(full.status, 409);
            assert.equal(full.body.code, 'full');
        });

        it('expires rooms and cleans them up', async () => {
            const { code } = await setup();
            const gone = await call(getRoom, req(`/api/rooms/${code}`), T + ROOM_TTL_MS + 1);
            assert.equal(gone.status, 410);
            await call(createRoom, req('/api/rooms', { method: 'POST', body: { nickname: 'Next', topicId: 'tech' } }), T + ROOM_TTL_MS + 2);
            const left = await sql`SELECT code FROM rooms`;
            assert.equal(left.length, 1);
            assert.notEqual(left[0].code, code);
            assert.equal((await sql`SELECT count(*)::int AS n FROM room_players WHERE room_code = ${code}`)[0].n, 0);
        });

        it('rate-limits room creation per IP', async () => {
            const make = (ip, now) => call(createRoom, req('/api/rooms', { method: 'POST', body: { nickname: 'Spam', topicId: 'tech' }, ip }), now);
            for (let i = 0; i < 10; i++) assert.equal((await make('192.0.2.1', T + i)).status, 201);
            const limited = await make('192.0.2.1', T + 20);
            assert.equal(limited.status, 429);
            assert.ok(Number(limited.headers.get('retry-after')) > 0);
            assert.equal((await make('192.0.2.2', T + 21)).status, 201);
            assert.equal((await make('192.0.2.1', T + 60 * 60 * 1000 + 1)).status, 201);
        });
    });

    describe('leaderboard', () => {
        const T = 1_800_000_000_000;
        const entry = (over = {}) => ({ nickname: 'Ada', topicId: 'science', difficulty: 'medium', score: 1000, correct: 5, total: 5, durationMs: 60_000, ...over });
        const post = (body, { ip = '203.0.113.50', now = T } = {}) => call(submitScore, req('/api/leaderboard', { method: 'POST', body, ip }), now);
        const board = async (query = '') => (await call(getLeaderboard, req(`/api/leaderboard${query}`))).body;

        it('stores valid results, ranks them and keeps one row per nickname', async () => {
            const first = await post(entry());
            assert.equal(first.status, 201);
            assert.equal(first.body.rank, 1);
            assert.equal((await post(entry({ nickname: 'Grace', score: 1100 }), { ip: '203.0.113.51' })).body.rank, 1);
            assert.equal((await post(entry({ nickname: 'Linus', score: 900, durationMs: 120_000 }), { ip: '203.0.113.52' })).body.rank, 3);
            await post(entry({ nickname: 'ada', score: 800, durationMs: 120_000 }), { now: T + 1 });
            await post(entry({ nickname: 'Tim', topicId: 'tech', difficulty: 'hard', score: 1200 }), { ip: '203.0.113.53' });

            const all = await board();
            assert.deepEqual(all.entries.map((e) => [e.rank, e.nickname, e.score]), [[1, 'Tim', 1200], [2, 'Grace', 1100], [3, 'Ada', 1000], [4, 'Linus', 900]]);
            assert.deepEqual((await board('?topic=science')).entries.map((e) => e.nickname), ['Grace', 'Ada', 'Linus']);
            assert.deepEqual((await board('?topic=tech&difficulty=hard')).entries.map((e) => e.nickname), ['Tim']);
            assert.deepEqual((await board('?difficulty=easy')).entries, []);
            assert.equal((await call(getLeaderboard, req('/api/leaderboard?topic=nope'))).status, 400);
        });

        it('breaks ties by time and returns at most 20', async () => {
            for (let i = 0; i < 25; i++) {
                await sql`INSERT INTO scores (nickname, topic_id, difficulty, score, correct, total, duration_ms, ip_hash)
                    VALUES (${`P${i}`}, 'tech', 'easy', ${500 + i}, 5, 5, 60000, 'x')`;
            }
            await sql`INSERT INTO scores (nickname, topic_id, difficulty, score, correct, total, duration_ms, ip_hash) VALUES ('Quick', 'tech', 'easy', 524, 5, 5, 30000, 'x')`;
            const { entries } = await board();
            assert.equal(entries.length, 20);
            assert.deepEqual(entries.slice(0, 2).map((e) => e.nickname), ['Quick', 'P24']);
        });

        it('rejects implausible results without storing them', async () => {
            assert.equal((await post(entry({ score: 5000 }))).status, 422);
            assert.equal((await post(entry({ nickname: '<b>x</b>' }))).status, 422);
            assert.equal((await sql`SELECT count(*)::int AS n FROM scores`)[0].n, 0);
        });

        it('rate-limits submissions per IP in the database', async () => {
            for (let i = 0; i < 5; i++) assert.equal((await post(entry({ nickname: `Fast ${i}` }), { now: T + i })).status, 201);
            const limited = await post(entry({ nickname: 'Fast 6' }), { now: T + 10 });
            assert.equal(limited.status, 429);
            assert.equal(limited.body.code, 'rate_limited');
            assert.ok(Number(limited.headers.get('retry-after')) >= 1);
            assert.equal((await post(entry({ nickname: 'Other' }), { ip: '203.0.113.99', now: T + 11 })).status, 201);
            assert.equal((await post(entry({ nickname: 'Fast 7' }), { now: T + 61_000 })).status, 201);
            const [{ n }] = await sql`SELECT count(*)::int AS n FROM rate_limits WHERE key LIKE 'submitScore:%'`;
            assert.equal(n, 2);
            const [stored] = await sql`SELECT ip_hash FROM scores LIMIT 1`;
            assert.match(stored.ip_hash, /^[0-9a-f]{64}$/);
        });
    });
});
