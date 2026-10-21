import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pointsFor, validateNickname, DIFFICULTIES } from '../../src/shared/game.js';
import { TOPICS, MIXED_SIZE } from '../../src/data/quizData.js';
import { validateSubmission, minPlausibleDurationMs, parseFilters } from '../../api/_lib/leaderboard.js';
import { advance, phaseOf, buildState, scoreAnswer, buildQuestionRefs, resolveQuestion, makeRoomCode, REVEAL_MS } from '../../api/_lib/rooms.js';
import { HttpError } from '../../api/_lib/http.js';

describe('scoring', () => {
    it('gives base points plus a speed bonus of up to 100', () => {
        assert.equal(pointsFor('medium', 20), 250);
        assert.equal(pointsFor('medium', 10), 200);
        assert.equal(pointsFor('medium', 0), 150);
        assert.equal(pointsFor('easy', 30), 200);
        assert.equal(pointsFor('hard', 5), 250);
    });

    it('clamps out-of-range remaining time', () => {
        assert.equal(pointsFor('hard', -3), 200);
        assert.equal(pointsFor('hard', 99), 300);
    });
});

describe('nicknames', () => {
    it('normalises whitespace and accepts unicode letters', () => {
        assert.deepEqual(validateNickname('  Ada   Lovelace '), { ok: true, value: 'Ada Lovelace' });
        assert.equal(validateNickname('प्रज्जवल').ok, true);
    });

    it('rejects bad input', () => {
        for (const bad of [undefined, 42, '', 'a', 'x'.repeat(21), '<script>', 'http://spam', '-dash']) {
            assert.equal(validateNickname(bad).ok, false, `expected ${String(bad)} to be rejected`);
        }
    });
});

const science = TOPICS.find((t) => t.id === 'science');
const valid = { nickname: 'Ada', topicId: 'science', difficulty: 'medium', score: 1000, correct: 5, total: science.questions.length, durationMs: 60_000 };
const rejects = (body, pattern) => assert.throws(() => validateSubmission(body), (err) => err instanceof HttpError && err.status === 422 && pattern.test(err.message));

describe('solo submission sanity checks', () => {
    it('accepts a plausible result', () => {
        assert.deepEqual(validateSubmission(valid), { ...valid });
    });

    it('rejects impossible scores', () => {
        rejects({ ...valid, score: 5 * 250 + 1 }, /not possible/);
        rejects({ ...valid, correct: 2, score: 1000 }, /not possible/);
        rejects({ ...valid, score: 5 * 150 - 1 }, /not possible/);
        rejects({ ...valid, correct: 6 }, /between 1/);
        rejects({ ...valid, correct: 0, score: 0 }, /between 1/);
        rejects({ ...valid, total: 10 }, /has 5 questions/);
        rejects({ ...valid, score: 999.5 }, /whole numbers/);
        rejects({ ...valid, score: '1000' }, /whole numbers/);
    });

    it('rejects unknown topics and difficulties, including prototype keys', () => {
        rejects({ ...valid, topicId: 'review' }, /Unknown topic/);
        rejects({ ...valid, topicId: 'mixed' }, /Unknown topic/);
        rejects({ ...valid, difficulty: 'insane' }, /Unknown difficulty/);
        rejects({ ...valid, difficulty: '__proto__' }, /Unknown difficulty/);
        rejects({ ...valid, difficulty: 'constructor' }, /Unknown difficulty/);
    });

    it('rejects results faster than the timer allows', () => {
        // Five correct answers worth only the base score means each one was answered with no time left.
        rejects({ ...valid, score: 750, durationMs: 30_000 }, /faster than the timer/);
        rejects({ ...valid, durationMs: 500 }, /not plausible/);
        rejects({ ...valid, durationMs: 3 * 60 * 60 * 1000 }, /not plausible/);
    });

    it('accepts every legitimately played round (simulated)', () => {
        for (const difficulty of Object.keys(DIFFICULTIES)) {
            const { seconds } = DIFFICULTIES[difficulty];
            for (let trial = 0; trial < 300; trial++) {
                let score = 0; let correct = 0; let durationMs = 0;
                for (let i = 0; i < 5; i++) {
                    const elapsed = Math.random() * seconds; // real time spent before answering
                    const shownLeft = Math.max(0, seconds - Math.floor(elapsed)); // countdown shows whole seconds
                    durationMs += elapsed * 1000 + Math.random() * 2000; // plus time on the reveal screen
                    if (Math.random() < 0.7) { correct++; score += pointsFor(difficulty, shownLeft); }
                }
                if (!correct) continue;
                const body = { ...valid, difficulty, score, correct, durationMs: Math.max(1000, Math.round(durationMs)) };
                assert.doesNotThrow(() => validateSubmission(body), `difficulty=${difficulty} ${JSON.stringify(body)}`);
            }
        }
    });

    it('computes a sensible minimum duration', () => {
        assert.equal(minPlausibleDurationMs({ difficulty: 'hard', score: 5 * 300, correct: 5 }), 0);
        assert.ok(minPlausibleDurationMs({ difficulty: 'hard', score: 5 * 200, correct: 5 }) > 40_000);
    });

    it('validates leaderboard filters', () => {
        assert.deepEqual(parseFilters(new URL('http://x/api/leaderboard')), { topicId: null, difficulty: null });
        assert.deepEqual(parseFilters(new URL('http://x/api/leaderboard?topic=tech&difficulty=hard')), { topicId: 'tech', difficulty: 'hard' });
        assert.deepEqual(parseFilters(new URL('http://x/api/leaderboard?topic=all&difficulty=all')), { topicId: null, difficulty: null });
        assert.throws(() => parseFilters(new URL('http://x/api/leaderboard?topic=nope')), HttpError);
        assert.throws(() => parseFilters(new URL('http://x/api/leaderboard?difficulty=toString')), HttpError);
    });
});

describe('room question order', () => {
    it('uses every question of a topic exactly once', () => {
        const refs = buildQuestionRefs('history');
        assert.equal(refs.length, 5);
        assert.deepEqual(refs.map(([, i]) => i).sort(), [0, 1, 2, 3, 4]);
        refs.forEach((ref) => assert.ok(resolveQuestion(ref).q));
    });

    it('draws a mixed set without repeats', () => {
        const refs = buildQuestionRefs('mixed');
        assert.equal(refs.length, MIXED_SIZE);
        assert.equal(new Set(refs.map((r) => r.join(':'))).size, MIXED_SIZE);
    });

    it('makes 6-character codes from the unambiguous alphabet', () => {
        for (let i = 0; i < 50; i++) assert.match(makeRoomCode(), /^[A-HJ-NP-Z2-9]{6}$/);
    });
});

const T0 = 1_000_000;
const room = (over = {}) => ({
    code: 'ABC234', topicId: 'science', difficulty: 'medium', status: 'playing', total: 3, questionIndex: 0,
    questionStartedAt: T0, revealAt: null, expiresAt: T0 + 1e9,
    questions: [['science', 0], ['science', 1], ['science', 2]],
    ...over,
});

describe('room clock', () => {
    it('moves countdown -> question -> reveal -> next question', () => {
        const r = room();
        assert.equal(phaseOf(r, T0 - 1).phase, 'countdown');
        assert.deepEqual(phaseOf(r, T0), { phase: 'question', endsAt: T0 + 20_000 });
        assert.deepEqual(phaseOf(r, T0 + 20_000), { phase: 'reveal', endsAt: T0 + 20_000 + REVEAL_MS });
        const later = advance(r, T0 + 20_000 + REVEAL_MS);
        assert.equal(later.questionIndex, 1);
        assert.equal(later.questionStartedAt, T0 + 20_000 + REVEAL_MS);
        assert.equal(phaseOf(later, T0 + 20_000 + REVEAL_MS).phase, 'question');
    });

    it('closes a question early once everyone has answered', () => {
        const r = room({ revealAt: T0 + 4000 });
        assert.equal(phaseOf(r, T0 + 4000).phase, 'reveal');
        const next = advance(r, T0 + 4000 + REVEAL_MS);
        assert.equal(next.questionIndex, 1);
        assert.equal(next.revealAt, null);
    });

    it('catches up several questions at once and finishes', () => {
        const r = room();
        const step = 20_000 + REVEAL_MS;
        assert.equal(advance(r, T0 + 2 * step + 1).questionIndex, 2);
        const done = advance(r, T0 + 3 * step);
        assert.equal(done.status, 'finished');
        assert.equal(phaseOf(done, T0 + 3 * step).phase, 'finished');
    });

    it('leaves lobby rooms alone', () => {
        const lobby = room({ status: 'lobby', questionStartedAt: null });
        assert.equal(advance(lobby, T0 * 2), lobby);
        assert.equal(phaseOf(lobby, T0).phase, 'lobby');
    });

    it('scores answers from the server clock', () => {
        const r = room();
        const answer = resolveQuestion(r.questions[0]).answer;
        assert.deepEqual(scoreAnswer(r, answer, T0), { correct: true, points: 250, elapsedMs: 0 });
        assert.deepEqual(scoreAnswer(r, answer, T0 + 10_000), { correct: true, points: 200, elapsedMs: 10_000 });
        assert.deepEqual(scoreAnswer(r, (answer + 1) % 4, T0 + 1000), { correct: false, points: 0, elapsedMs: 1000 });
    });
});

describe('room state view', () => {
    const players = [
        { id: 'p1', nickname: 'Host', is_host: true, score: '250', correct: '1', last_points: '250', answered_current: true, last_seen: String(T0) },
        { id: 'p2', nickname: 'Guest', is_host: false, score: '0', correct: '0', last_points: '0', answered_current: false, last_seen: String(T0 - 60_000) },
    ];
    const me = { id: 'p1', nickname: 'Host', isHost: true };
    const myAnswers = [{ question_index: 0, choice: 1, correct: true, points: 250 }];

    it('hides the correct answer and points while the question is live', () => {
        const s = buildState({ room: room(), now: T0 + 1000, players, myAnswers, me });
        assert.equal(s.phase, 'question');
        assert.deepEqual(Object.keys(s.question).sort(), ['options', 'q']);
        assert.equal(s.reveal, null);
        assert.deepEqual(s.me.answer, { choice: 1 });
        assert.equal(s.players[0].lastPoints, null);
        assert.equal(s.players[0].answered, true);
        assert.equal(s.players[0].online, true);
        assert.equal(s.players[1].online, false);
    });

    it('reveals the answer and my result after the question closes', () => {
        const s = buildState({ room: room(), now: T0 + 21_000, players, myAnswers, me });
        assert.equal(s.phase, 'reveal');
        assert.equal(s.reveal.answer, resolveQuestion(['science', 0]).answer);
        assert.deepEqual(s.me.answer, { choice: 1, correct: true, points: 250 });
        assert.equal(s.players[0].lastPoints, 250);
    });

    it('includes a personal review when finished', () => {
        const s = buildState({ room: room({ status: 'finished', questionIndex: 2 }), now: T0 * 2, players, myAnswers, me });
        assert.equal(s.phase, 'finished');
        assert.equal(s.question, null);
        assert.equal(s.review.length, 3);
        assert.equal(s.review[0].points, 250);
        assert.equal(s.review[1].chosen, null);
    });

    it('gives spectators no personal data', () => {
        const s = buildState({ room: room(), now: T0 + 1000, players, myAnswers: [], me: null });
        assert.equal(s.me, null);
        assert.equal(s.review, null);
    });
});
