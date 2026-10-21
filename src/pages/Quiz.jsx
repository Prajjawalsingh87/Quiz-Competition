import React, { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Link as LinkIcon, ArrowRight, Play, AlertCircle, CheckCircle2, RotateCcw, Trash2, Plus, Loader2, UserRound } from 'lucide-react';
import { TOPICS, ROOM_TOPICS, getTopic, shuffle, REVIEW_TOPIC, REVIEW_SIZE, questionsForMistakes, roomQuestionCount } from '../data/quizData';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, getDifficulty, validateNickname, ROOM_CODE_PATTERN, NICKNAME_MAX } from '../shared/game';
import { saveResult, loadMistakes, updateMistakes, clearMistakes, loadNickname, saveNickname, loadUser, saveRoomSession, loadRoomSession } from '../utils/storage';
import { apiFetch } from '../utils/api';
import TopicIcon from '../components/TopicIcon';
import PageHeader from '../components/PageHeader';
import DifficultyPicker from '../components/DifficultyPicker';
import QuizPlayer from '../components/quiz/QuizPlayer';
import QuizResults from '../components/quiz/QuizResults';
import useDocumentTitle from '../utils/useDocumentTitle';

// Accepts a bare code or a full invite link (…/room/CODE, or the older …/quiz?room=CODE).
const parseRoomInput = (value) => {
    const trimmed = value.trim();
    const fromLink = trimmed.match(/\/room\/([A-Za-z0-9]+)/) || trimmed.match(/[?&]room=([A-Za-z0-9]+)/);
    return (fromLink ? fromLink[1] : trimmed).toUpperCase();
};

const initialNickname = () => loadNickname() || loadUser()?.name?.slice(0, NICKNAME_MAX) || '';

const FieldError = ({ id, children }) => (
    <p id={id} className="flex items-center gap-1.5 text-sm text-danger" role="alert">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {children}
    </p>
);

const Quiz = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [topicId, setTopicId] = useState(() => (getTopic(searchParams.get('topic')) ? searchParams.get('topic') : TOPICS[0].id));
    const [difficulty, setDifficulty] = useState(() => (Object.hasOwn(DIFFICULTIES, searchParams.get('difficulty') || '') ? searchParams.get('difficulty') : DEFAULT_DIFFICULTY));
    const [game, setGame] = useState(null); // { topic, questions, difficulty, key }
    const [result, setResult] = useState(null);
    const [mistakes, setMistakes] = useState(() => loadMistakes());
    const location = useLocation();

    // Multiplayer form state
    const [nickname, setNickname] = useState(initialNickname);
    const [roomTopicId, setRoomTopicId] = useState(TOPICS[0].id);
    const [roomDifficulty, setRoomDifficulty] = useState(DEFAULT_DIFFICULTY);
    const [roomInput, setRoomInput] = useState(() => searchParams.get('room') || '');
    const [pending, setPending] = useState(null); // 'create' | 'join'
    const [errors, setErrors] = useState({});

    // A jump from global search (Ctrl+K) selects that topic, even mid-game.
    const jump = location.state?.jump;
    const [seenJump, setSeenJump] = useState(jump);
    if (jump !== seenJump) {
        setSeenJump(jump);
        const target = searchParams.get('topic');
        if (getTopic(target)) setTopicId(target);
        setGame(null);
        setResult(null);
    }

    const reviewQuestions = questionsForMistakes(mistakes);

    useDocumentTitle(game ? (result ? 'Results' : game.topic.name) : 'Play');

    const topic = getTopic(topicId);

    const startGame = (gameTopic, questions = shuffle(gameTopic.questions), gameDifficulty = difficulty) => {
        setResult(null);
        setGame({ topic: gameTopic, questions, difficulty: gameDifficulty, key: Date.now() });
        window.scrollTo({ top: 0 });
    };

    const startReview = (list = reviewQuestions) => {
        if (!list.length) return;
        startGame(REVIEW_TOPIC, shuffle(list).slice(0, REVIEW_SIZE), DEFAULT_DIFFICULTY);
    };

    const handleClearMistakes = () => {
        if (window.confirm('Clear your list of missed questions?')) {
            clearMistakes();
            setMistakes([]);
        }
    };

    const updateParam = (key, value) => {
        const next = new URLSearchParams(searchParams);
        next.set(key, value);
        setSearchParams(next, { replace: true });
    };

    const selectTopic = (id) => {
        setTopicId(id);
        updateParam('topic', id);
    };

    const selectDifficulty = (id) => {
        setDifficulty(id);
        updateParam('difficulty', id);
    };

    const checkNickname = () => {
        const check = validateNickname(nickname);
        if (!check.ok) {
            setErrors({ nickname: check.error });
            return null;
        }
        saveNickname(check.value);
        setNickname(check.value);
        return check.value;
    };

    const handleCreateRoom = async () => {
        const name = checkNickname();
        if (!name) return;
        setErrors({});
        setPending('create');
        try {
            const room = await apiFetch('/api/rooms', { method: 'POST', body: { nickname: name, topicId: roomTopicId, difficulty: roomDifficulty } });
            saveRoomSession(room.code, { token: room.token, playerId: room.playerId });
            navigate(`/room/${room.code}`);
        } catch (err) {
            setErrors({ create: err.message });
            setPending(null);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        const code = parseRoomInput(roomInput);
        if (!code) {
            setErrors({ room: 'Enter a room code or paste an invite link.' });
            return;
        }
        if (!ROOM_CODE_PATTERN.test(code)) {
            setErrors({ room: 'Room codes are 6 letters or numbers, e.g. K7Q2XD.' });
            return;
        }
        // Already in this room (e.g. came back from another tab): go straight there.
        if (loadRoomSession(code)) {
            navigate(`/room/${code}`);
            return;
        }
        const name = checkNickname();
        if (!name) return;
        setErrors({});
        setPending('join');
        try {
            const joined = await apiFetch(`/api/rooms/${code}/join`, { method: 'POST', body: { nickname: name } });
            saveRoomSession(code, { token: joined.token, playerId: joined.playerId });
            navigate(`/room/${code}`);
        } catch (err) {
            setErrors({ join: err.message });
            setPending(null);
        }
    };

    const handleFinish = (finalResult) => {
        const correct = finalResult.answers.filter((a) => a.correct).length;
        saveResult({
            id: `${Date.now()}`,
            topicId: game.topic.id,
            topicName: game.topic.name,
            roomCode: null,
            difficulty: game.difficulty,
            correct,
            total: finalResult.answers.length,
            score: finalResult.score,
            missed: finalResult.answers.filter((a) => !a.correct).map((a) => a.question),
            date: new Date().toISOString(),
        });
        setMistakes(updateMistakes(finalResult.answers));
        setResult(finalResult);
        window.scrollTo({ top: 0 });
    };

    const exitGame = () => {
        setGame(null);
        setResult(null);
    };

    if (game && result) {
        const isReview = game.topic.id === REVIEW_TOPIC.id;
        const correct = result.answers.filter((a) => a.correct).length;
        return (
            <QuizResults
                topic={game.topic}
                result={result}
                submission={isReview || !correct ? null : {
                    topicId: game.topic.id,
                    difficulty: game.difficulty,
                    score: result.score,
                    correct,
                    total: result.answers.length,
                    durationMs: Math.round(result.durationMs),
                }}
                onReplay={isReview ? (reviewQuestions.length ? () => startReview() : null) : () => startGame(game.topic, undefined, game.difficulty)}
                replayLabel={isReview ? 'Review again' : 'Play again'}
                mistakesLeft={reviewQuestions.length}
                onReview={!isReview && reviewQuestions.length ? () => startReview() : null}
                onExit={exitGame}
            />
        );
    }

    if (game) {
        return (
            <QuizPlayer
                key={game.key}
                topic={game.topic}
                questions={game.questions}
                difficulty={game.difficulty}
                onFinish={handleFinish}
                onQuit={exitGame}
            />
        );
    }

    const level = getDifficulty(difficulty);

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Play"
                title="Ready to compete?"
                description="Warm up solo, host a live room for your friends, or jump into a friend’s challenge."
            />

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.45fr_1fr]">

                {/* Solo: pick a topic */}
                <section className="card p-5 sm:p-6" aria-labelledby="solo-title">
                    <div className="mb-5">
                        <h2 id="solo-title" className="text-lg font-bold">Solo practice</h2>
                        <p className="text-sm text-muted">{topic.questions.length} questions · {level.seconds}s each · speed bonus · post your score to the leaderboard</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Topic">
                        {TOPICS.map((t) => {
                            const active = t.id === topicId;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => selectTopic(t.id)}
                                    className={`flex min-w-0 items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${active
                                        ? 'border-brand bg-brand-soft'
                                        : 'border-line hover:border-brand/40 hover:bg-surface-2'}`}
                                >
                                    <TopicIcon topic={t} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">{t.name}</span>
                                        <span className="mt-0.5 block text-xs leading-snug text-muted">{t.description}</span>
                                    </span>
                                    {active && <CheckCircle2 className="size-5 shrink-0 text-brand" aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-5">
                        <p className="label">Difficulty</p>
                        <DifficultyPicker value={difficulty} onChange={selectDifficulty} label="Solo difficulty" />
                        <p className="mt-2 text-xs text-muted">Harder levels give you less time but more points per correct answer ({level.base} + up to 100 speed bonus).</p>
                    </div>

                    <button type="button" onClick={() => startGame(topic)} className="btn btn-primary btn-lg mt-6 w-full">
                        Start {topic.name} <ArrowRight className="size-5" aria-hidden="true" />
                    </button>
                </section>

                <div className="space-y-6">
                    {/* Multiplayer */}
                    <section className="card p-5 sm:p-6" aria-labelledby="multi-title">
                        <div className="mb-5 flex items-start gap-4">
                            <span className="icon-tile bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400"><Users className="size-5" aria-hidden="true" /></span>
                            <div>
                                <h2 id="multi-title" className="text-lg font-bold">Play with friends</h2>
                                <p className="text-sm text-muted">Live rooms: same questions, same clock, scored by the server.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="nickname" className="label">Your nickname</label>
                            <div className="relative">
                                <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                                <input
                                    id="nickname"
                                    type="text"
                                    value={nickname}
                                    maxLength={NICKNAME_MAX}
                                    onChange={(e) => { setNickname(e.target.value); setErrors({}); }}
                                    className={`input pl-10 ${errors.nickname ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}`}
                                    placeholder="e.g. QuizWhiz"
                                    autoComplete="nickname"
                                    aria-invalid={!!errors.nickname}
                                    aria-describedby={errors.nickname ? 'nickname-error' : undefined}
                                />
                            </div>
                            {errors.nickname && <FieldError id="nickname-error">{errors.nickname}</FieldError>}
                        </div>

                        {/* Create */}
                        <div className="mt-5 space-y-3 border-t border-line pt-5">
                            <h3 className="flex items-center gap-2 text-sm font-bold"><Plus className="size-4 text-brand" aria-hidden="true" /> Create a room</h3>
                            <div>
                                <label htmlFor="room-topic" className="sr-only">Room topic</label>
                                <select id="room-topic" value={roomTopicId} onChange={(e) => setRoomTopicId(e.target.value)} className="input cursor-pointer">
                                    {ROOM_TOPICS.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name} · {roomQuestionCount(t.id)} questions</option>
                                    ))}
                                </select>
                            </div>
                            <DifficultyPicker value={roomDifficulty} onChange={setRoomDifficulty} label="Room difficulty" />
                            {errors.create && <FieldError id="create-error">{errors.create}</FieldError>}
                            <button type="button" onClick={handleCreateRoom} disabled={pending !== null} className="btn btn-primary w-full">
                                {pending === 'create'
                                    ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Creating room…</>
                                    : <>Create room <ArrowRight className="size-4" aria-hidden="true" /></>}
                            </button>
                        </div>

                        {/* Join */}
                        <form onSubmit={handleJoinRoom} noValidate className="mt-5 space-y-3 border-t border-line pt-5">
                            <h3 className="flex items-center gap-2 text-sm font-bold"><LinkIcon className="size-4 text-brand" aria-hidden="true" /> Join a room</h3>
                            <label htmlFor="room-id" className="sr-only">Room code or invite link</label>
                            <input
                                id="room-id"
                                type="text"
                                value={roomInput}
                                onChange={(e) => { setRoomInput(e.target.value); setErrors({}); }}
                                className={`input ${errors.room ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}`}
                                placeholder="Room code or invite link"
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                aria-invalid={!!errors.room}
                                aria-describedby={errors.room ? 'room-error' : undefined}
                            />
                            {errors.room && <FieldError id="room-error">{errors.room}</FieldError>}
                            {errors.join && <FieldError id="join-error">{errors.join}</FieldError>}
                            <button type="submit" disabled={pending !== null} className="btn btn-secondary w-full">
                                {pending === 'join'
                                    ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Joining…</>
                                    : <>Join game <Play className="size-4 fill-current" aria-hidden="true" /></>}
                            </button>
                        </form>
                    </section>

                    {/* Review mistakes */}
                    <section className="card p-5 sm:p-6" aria-labelledby="review-title">
                        <div className="mb-4 flex items-start gap-4">
                            <span className="icon-tile bg-danger-soft text-danger"><RotateCcw className="size-5" aria-hidden="true" /></span>
                            <div className="min-w-0 flex-1">
                                <h2 id="review-title" className="text-lg font-bold">Review my mistakes</h2>
                                <p className="text-sm text-muted">
                                    {reviewQuestions.length
                                        ? `${reviewQuestions.length} missed question${reviewQuestions.length === 1 ? '' : 's'} saved. Get one right and it leaves the list.`
                                        : 'Questions you miss will show up here so you can practise them.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => startReview()} disabled={!reviewQuestions.length} className="btn btn-secondary flex-1">
                                Practise {reviewQuestions.length ? Math.min(reviewQuestions.length, REVIEW_SIZE) : ''} <Play className="size-4 fill-current" aria-hidden="true" />
                            </button>
                            {reviewQuestions.length > 0 && (
                                <button type="button" onClick={handleClearMistakes} className="btn btn-ghost size-11 px-0" title="Clear missed questions">
                                    <Trash2 className="size-4" aria-hidden="true" /><span className="sr-only">Clear missed questions</span>
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
