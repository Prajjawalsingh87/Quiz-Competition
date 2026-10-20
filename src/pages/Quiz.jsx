import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Users, Link as LinkIcon, ArrowRight, Play, Copy, Check, AlertCircle, CheckCircle2, X, RotateCcw, Trash2 } from 'lucide-react';
import { TOPICS, getTopic, topicForRoom, shuffle, SECONDS_PER_QUESTION, REVIEW_TOPIC, REVIEW_SIZE, questionsForMistakes } from '../data/quizData';
import { saveResult, loadMistakes, updateMistakes, clearMistakes } from '../utils/storage';
import TopicIcon from '../components/TopicIcon';
import PageHeader from '../components/PageHeader';
import QuizPlayer from '../components/quiz/QuizPlayer';
import QuizResults from '../components/quiz/QuizResults';
import useDocumentTitle from '../utils/useDocumentTitle';

const ROOM_PATTERN = /^[A-Z0-9]{6}$/;

const makeRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Accepts a bare code or a full invite link (…/quiz?room=CODE).
const parseRoomInput = (value) => {
    const trimmed = value.trim();
    const fromLink = trimmed.match(/[?&]room=([A-Za-z0-9]+)/);
    return (fromLink ? fromLink[1] : trimmed).toUpperCase();
};

const Quiz = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [topicId, setTopicId] = useState(() => (getTopic(searchParams.get('topic')) ? searchParams.get('topic') : TOPICS[0].id));
    const [roomId, setRoomId] = useState(() => searchParams.get('room') || '');
    const [joinError, setJoinError] = useState('');
    const [createdRoom, setCreatedRoom] = useState(null);
    const [copied, setCopied] = useState(false);
    const [game, setGame] = useState(null); // { topic, questions, roomCode, key }
    const [result, setResult] = useState(null);
    const [mistakes, setMistakes] = useState(() => loadMistakes());
    const location = useLocation();

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

    const startGame = (gameTopic, roomCode = null, questions = shuffle(gameTopic.questions)) => {
        setResult(null);
        setGame({ topic: gameTopic, questions, roomCode, key: Date.now() });
        window.scrollTo({ top: 0 });
    };

    const startReview = (list = reviewQuestions) => {
        if (!list.length) return;
        startGame(REVIEW_TOPIC, null, shuffle(list).slice(0, REVIEW_SIZE));
    };

    const handleClearMistakes = () => {
        if (window.confirm('Clear your list of missed questions?')) {
            clearMistakes();
            setMistakes([]);
        }
    };

    const selectTopic = (id) => {
        setTopicId(id);
        const next = new URLSearchParams(searchParams);
        next.set('topic', id);
        setSearchParams(next, { replace: true });
    };

    const handleCreateRoom = () => {
        setCreatedRoom(makeRoomCode());
        setCopied(false);
    };

    const inviteLink = createdRoom ? `${window.location.origin}/quiz?room=${createdRoom}` : '';

    const copyInvite = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        const code = parseRoomInput(roomId);
        if (!code) {
            setJoinError('Enter a room code or paste an invite link.');
            return;
        }
        if (!ROOM_PATTERN.test(code)) {
            setJoinError('Room codes are 6 letters or numbers, e.g. K7Q2XD.');
            return;
        }
        setJoinError('');
        startGame(topicForRoom(code), code);
    };

    const handleFinish = (finalResult) => {
        const correct = finalResult.answers.filter((a) => a.correct).length;
        saveResult({
            id: `${Date.now()}`,
            topicId: game.topic.id,
            topicName: game.topic.name,
            roomCode: game.roomCode,
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
        return (
            <QuizResults
                topic={game.topic}
                result={result}
                onReplay={isReview ? (reviewQuestions.length ? () => startReview() : null) : () => startGame(game.topic, game.roomCode)}
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
                roomCode={game.roomCode}
                onFinish={handleFinish}
                onQuit={exitGame}
            />
        );
    }

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Play"
                title="Ready to compete?"
                description="Warm up solo, host a room for your friends, or jump into a friend’s challenge."
            />

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.45fr_1fr]">

                {/* Solo: pick a topic */}
                <section className="card p-5 sm:p-6" aria-labelledby="solo-title">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 id="solo-title" className="text-lg font-bold">Solo practice</h2>
                            <p className="text-sm text-muted">{topic.questions.length} questions · {SECONDS_PER_QUESTION}s each · speed bonus</p>
                        </div>
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

                    <button type="button" onClick={() => startGame(topic)} className="btn btn-primary btn-lg mt-6 w-full">
                        Start {topic.name} <ArrowRight className="size-5" aria-hidden="true" />
                    </button>
                </section>

                <div className="space-y-6">
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

                    {/* Create room */}
                    <section className="card p-5 sm:p-6" aria-labelledby="create-title">
                        <div className="mb-4 flex items-start gap-4">
                            <span className="icon-tile"><Plus className="size-5" aria-hidden="true" /></span>
                            <div>
                                <h2 id="create-title" className="text-lg font-bold">Create a room</h2>
                                <p className="text-sm text-muted">Host a game and invite friends with a code.</p>
                            </div>
                        </div>

                        {createdRoom ? (
                            <div className="animate-fade-up space-y-3">
                                <div className="flex items-center justify-between rounded-xl border border-dashed border-brand/40 bg-brand-soft px-4 py-3">
                                    <div>
                                        <p className="text-xs font-medium text-muted">Room code</p>
                                        <p className="font-mono text-2xl font-bold tracking-[0.2em] text-brand-ink">{createdRoom}</p>
                                    </div>
                                    <button type="button" onClick={() => setCreatedRoom(null)} className="btn btn-ghost size-9 px-0" title="Cancel room">
                                        <X className="size-4" aria-hidden="true" /><span className="sr-only">Cancel room</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={copyInvite} className="btn btn-secondary">
                                        {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                                        {copied ? 'Copied!' : 'Copy invite'}
                                    </button>
                                    <button type="button" onClick={() => startGame(topicForRoom(createdRoom), createdRoom)} className="btn btn-primary">
                                        Start <Play className="size-4 fill-current" aria-hidden="true" />
                                    </button>
                                </div>
                                <p className="text-xs text-muted">Topic for this room: <span className="font-medium text-fg">{topicForRoom(createdRoom).name}</span></p>
                            </div>
                        ) : (
                            <button type="button" onClick={handleCreateRoom} className="btn btn-secondary w-full">
                                Create new room <ArrowRight className="size-4" aria-hidden="true" />
                            </button>
                        )}
                    </section>

                    {/* Join room */}
                    <section className="card p-5 sm:p-6" aria-labelledby="join-title">
                        <div className="mb-4 flex items-start gap-4">
                            <span className="icon-tile bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-400"><Users className="size-5" aria-hidden="true" /></span>
                            <div>
                                <h2 id="join-title" className="text-lg font-bold">Join a room</h2>
                                <p className="text-sm text-muted">Got a code or invite link? Jump right in.</p>
                            </div>
                        </div>

                        <form onSubmit={handleJoinRoom} noValidate className="space-y-3">
                            <label htmlFor="room-id" className="sr-only">Room code or invite link</label>
                            <div className="relative">
                                <LinkIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                                <input
                                    id="room-id"
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => { setRoomId(e.target.value); setJoinError(''); }}
                                    className={`input pl-10 ${joinError ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}`}
                                    placeholder="Room code or invite link"
                                    autoComplete="off"
                                    aria-invalid={!!joinError}
                                    aria-describedby={joinError ? 'room-error' : undefined}
                                />
                            </div>
                            {joinError && (
                                <p id="room-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
                                    <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {joinError}
                                </p>
                            )}
                            <button type="submit" className="btn btn-primary w-full">
                                Join game <Play className="size-4 fill-current" aria-hidden="true" />
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
