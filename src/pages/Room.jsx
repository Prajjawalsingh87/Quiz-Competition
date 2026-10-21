import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    AlertCircle, ArrowRight, Check, CheckCircle2, Copy, Crown, Hourglass, Loader2, LogOut, Play, Share2,
    Timer, Trophy, UserRound, Users, WifiOff, XCircle, Lock, Eye,
} from 'lucide-react';
import { roomTopicMeta } from '../data/quizData';
import { getDifficulty, validateNickname, NICKNAME_MAX, ROOM_CODE_PATTERN } from '../shared/game';
import { apiFetch } from '../utils/api';
import { loadRoomSession, saveRoomSession, loadNickname, saveNickname, loadUser, saveResult } from '../utils/storage';
import useDocumentTitle from '../utils/useDocumentTitle';
import { colorForName, rankTone } from '../utils/format';
import TopicIcon from '../components/TopicIcon';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import AnswerOption from '../components/quiz/AnswerOption';

const POLL_MS = 1500;
const HIDDEN_POLL_MS = 5000;
const RETRY_MS = 3000;

// ---------- Live scoreboard ----------

const Scoreboard = ({ state, meId, title = 'Scoreboard' }) => {
    const { phase, players } = state;
    const answeredCount = players.filter((p) => p.answered).length;
    return (
        <section className="card overflow-hidden" aria-labelledby="scoreboard-title">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h2 id="scoreboard-title" className="flex items-center gap-2 text-base font-bold">
                    <Trophy className="size-4 text-amber-500" aria-hidden="true" /> {title}
                </h2>
                {phase === 'question'
                    ? <span className="badge bg-surface-2 text-muted tabular-nums">{answeredCount}/{players.length} answered</span>
                    : <span className="badge bg-surface-2 text-muted">{players.length} player{players.length === 1 ? '' : 's'}</span>}
            </div>
            <ol aria-live="polite">
                {players.map((p, i) => (
                    <li key={p.id} className={`flex items-center gap-3 border-b border-line px-5 py-3 last:border-0 ${p.id === meId ? 'bg-brand-soft/60' : ''}`}>
                        <span className={`w-5 text-center font-display font-bold tabular-nums ${rankTone(i)}`}>{i + 1}</span>
                        <Avatar name={p.nickname} color={colorForName(p.nickname)} size="sm" />
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                                <span className="truncate">{p.nickname}</span>
                                {p.isHost && <Crown className="size-3.5 shrink-0 text-amber-500" aria-label="Host" />}
                                {p.id === meId && <span className="text-xs font-medium text-muted">(you)</span>}
                            </p>
                            <p className="truncate text-xs text-muted">
                                {phase === 'question'
                                    ? (p.answered ? 'Locked in' : 'Thinking…')
                                    : `${p.correct} correct${p.online ? '' : ' · away'}`}
                            </p>
                        </div>
                        {phase === 'question' && (p.answered
                            ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Answered" />
                            : <Hourglass className="size-4 shrink-0 text-muted" aria-label="Not answered yet" />)}
                        {(phase === 'reveal') && p.lastPoints > 0 && (
                            <span className="badge animate-pop bg-success-soft text-success tabular-nums">+{p.lastPoints}</span>
                        )}
                        <span className="w-14 text-right text-sm font-bold tabular-nums">{p.score}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
};

// ---------- Lobby ----------

const Lobby = ({ state, session, onStart, starting, onJoin, error, joining }) => {
    const [copied, setCopied] = useState(false);
    const [nickname, setNickname] = useState(() => loadNickname() || loadUser()?.name?.slice(0, NICKNAME_MAX) || '');
    const inviteLink = `${window.location.origin}/room/${state.code}`;
    const canShare = typeof navigator.share === 'function';

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    const share = () => navigator.share({ title: 'Join my quiz room', text: `Join my ${state.topic.name} quiz — room ${state.code}`, url: inviteLink }).catch(() => {});

    return (
        <div className="space-y-6">
            <section className="card p-5 sm:p-6" aria-labelledby="lobby-title">
                <h2 id="lobby-title" className="sr-only">Lobby</h2>
                <div className="rounded-xl border border-dashed border-brand/40 bg-brand-soft px-4 py-4 text-center">
                    <p className="text-xs font-medium text-muted">Room code</p>
                    <p className="font-mono text-3xl font-bold tracking-[0.25em] text-brand-ink sm:text-4xl">{state.code}</p>
                </div>
                <div className={`mt-3 grid gap-3 ${canShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button type="button" onClick={copy} className="btn btn-secondary">
                        {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                        {copied ? 'Copied!' : 'Copy invite link'}
                    </button>
                    {canShare && (
                        <button type="button" onClick={share} className="btn btn-secondary">
                            <Share2 className="size-4" aria-hidden="true" /> Share
                        </button>
                    )}
                </div>

                <div className="mt-5 border-t border-line pt-5">
                    {!session ? (
                        <form onSubmit={(e) => { e.preventDefault(); onJoin(nickname); }} noValidate className="space-y-3">
                            <label htmlFor="join-nickname" className="label">Pick a nickname to join</label>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative sm:flex-1">
                                    <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                                    <input
                                        id="join-nickname"
                                        type="text"
                                        value={nickname}
                                        maxLength={NICKNAME_MAX}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className={`input pl-10 ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}`}
                                        placeholder="e.g. QuizWhiz"
                                        autoComplete="nickname"
                                        aria-invalid={!!error}
                                        aria-describedby={error ? 'join-error' : undefined}
                                    />
                                </div>
                                <button type="submit" disabled={joining} className="btn btn-primary">
                                    {joining ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4 fill-current" aria-hidden="true" />}
                                    Join room
                                </button>
                            </div>
                            {error && (
                                <p id="join-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
                                    <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {error}
                                </p>
                            )}
                        </form>
                    ) : state.me?.isHost ? (
                        <div className="space-y-2">
                            <button type="button" onClick={onStart} disabled={starting} className="btn btn-primary btn-lg w-full">
                                {starting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Play className="size-5 fill-current" aria-hidden="true" />}
                                Start game{state.players.length > 1 ? ` with ${state.players.length} players` : ''}
                            </button>
                            {error && (
                                <p className="flex items-center justify-center gap-1.5 text-sm text-danger" role="alert">
                                    <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {error}
                                </p>
                            )}
                            <p className="text-center text-xs text-muted">
                                {state.players.length > 1 ? 'Everyone gets the same questions at the same time.' : 'Share the code — you can also start alone.'}
                            </p>
                        </div>
                    ) : (
                        <p className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted" role="status">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Waiting for the host to start…
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
};

// ---------- Question / reveal ----------

const QuestionView = ({ state, remainingMs, myChoice, selected, setSelected, onSubmit, submitting, canAnswer, answerError }) => {
    const { phase, question, reveal, seconds } = state;
    const locked = myChoice !== null;
    const revealed = phase === 'reveal';
    const secondsLeft = Math.ceil(remainingMs / 1000);
    const timePct = revealed ? 0 : Math.min(100, (remainingMs / (seconds * 1000)) * 100);
    const urgent = secondsLeft <= Math.min(5, seconds / 4);
    const warn = secondsLeft <= seconds / 2;
    const timeTone = urgent ? 'text-danger bg-danger-soft' : warn ? 'text-warning bg-warning-soft' : 'text-brand-ink bg-brand-soft';
    const myResult = state.me?.answer;

    const stateFor = (i) => {
        if (!revealed) {
            if (locked) return myChoice === i ? 'selected' : 'dimmed';
            return selected === i ? 'selected' : 'idle';
        }
        if (i === reveal.answer) return 'correct';
        if (i === myChoice) return 'wrong';
        return 'dimmed';
    };

    return (
        <div className="card overflow-hidden">
            <div className="h-1 bg-line/60" aria-hidden="true">
                <div
                    className={`h-full transition-[width] duration-300 ease-linear ${urgent ? 'bg-danger' : warn ? 'bg-warning' : 'bg-brand'}`}
                    style={{ width: `${timePct}%` }}
                />
            </div>
            <div className="p-5 sm:p-8">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <h2 key={state.questionIndex} className="animate-fade-up text-xl leading-snug font-bold sm:text-2xl">{question.q}</h2>
                    <span className={`badge shrink-0 tabular-nums ${revealed ? 'bg-surface-2 text-muted' : timeTone}`}>
                        <Timer className="size-3.5" aria-hidden="true" /> 0:{String(revealed ? 0 : secondsLeft).padStart(2, '0')}
                    </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Answers">
                    {question.options.map((opt, i) => (
                        <AnswerOption
                            key={opt}
                            index={i}
                            label={opt}
                            state={stateFor(i)}
                            checked={(locked ? myChoice : selected) === i}
                            disabled={!canAnswer || locked || revealed}
                            onSelect={() => setSelected(i)}
                        />
                    ))}
                </div>

                <div aria-live="polite">
                    {revealed && (
                        <div className={`mt-5 flex animate-fade-up gap-3 rounded-xl p-4 text-sm ${myResult?.correct ? 'bg-success-soft' : canAnswer ? 'bg-danger-soft' : 'bg-surface-2'}`}>
                            {myResult?.correct
                                ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
                                : canAnswer ? <XCircle className="size-5 shrink-0 text-danger" aria-hidden="true" /> : <Eye className="size-5 shrink-0 text-muted" aria-hidden="true" />}
                            <div>
                                <p className="font-semibold">
                                    {!canAnswer ? 'Answer revealed' : myResult?.correct ? `Correct! +${myResult.points} points` : myChoice === null ? 'Time’s up!' : 'Not quite.'}
                                </p>
                                <p className="mt-0.5 text-muted">{reveal.explain}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
                    <p className="text-xs text-muted" role="status">
                        {revealed
                            ? `Next ${state.questionIndex + 1 < state.totalQuestions ? 'question' : 'up: final results'} in ${Math.max(0, secondsLeft)}s`
                            : !canAnswer ? 'You are watching this game.' : locked ? 'Answer locked in — waiting for the others.' : <span className="hidden sm:inline">Press 1–4 to choose, Enter to lock in</span>}
                    </p>
                    {canAnswer && !revealed && (
                        <button type="button" onClick={onSubmit} disabled={locked || selected === null || submitting} className="btn btn-primary">
                            {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : locked ? <Lock className="size-4" aria-hidden="true" /> : null}
                            {locked ? 'Locked in' : 'Lock in answer'}
                        </button>
                    )}
                </div>
                {answerError && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-danger" role="alert">
                        <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {answerError}
                    </p>
                )}
            </div>
        </div>
    );
};

// ---------- Final results ----------

const FinalResults = ({ state }) => {
    const myIndex = state.players.findIndex((p) => p.id === state.me?.id);
    const winner = state.players[0];
    const title = !state.me ? `${winner?.nickname ?? 'Nobody'} wins!` : myIndex === 0 ? 'You win!' : `You finished #${myIndex + 1}`;
    return (
        <div className="space-y-6">
            <div className="card overflow-hidden text-center">
                <div className="bg-gradient-to-br from-brand/15 via-transparent to-fuchsia-500/10 px-6 pt-10 pb-8">
                    <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                        <Trophy className="size-10" aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-3xl font-extrabold">{title}</h2>
                    <p className="mt-2 text-muted">
                        {winner ? `${winner.nickname} took the crown with ${winner.score} points.` : 'Game over.'}
                    </p>
                </div>
            </div>

            {state.review && (
                <section className="card p-5 sm:p-6" aria-labelledby="room-review-title">
                    <h2 id="room-review-title" className="mb-4 text-lg font-bold">Your answers</h2>
                    <ol className="space-y-3">
                        {state.review.map((a, i) => (
                            <li key={i} className="flex gap-3 rounded-xl border border-line p-4">
                                {a.correct
                                    ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
                                    : <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />}
                                <div className="min-w-0 flex-1 text-sm">
                                    <p className="font-semibold">{i + 1}. {a.question}</p>
                                    <p className="mt-1.5 text-muted">
                                        Your answer: <span className={`font-medium ${a.correct ? 'text-success' : 'text-danger'}`}>{a.chosen === null ? 'No answer' : a.options[a.chosen]}</span>
                                        {!a.correct && (<><span className="mx-2 text-line">|</span>Correct: <span className="font-medium text-success">{a.options[a.answer]}</span></>)}
                                    </p>
                                </div>
                                <span className="shrink-0 text-sm font-semibold tabular-nums text-muted">+{a.points}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </div>
    );
};

// ---------- Page ----------

const Room = () => {
    const { code: rawCode = '' } = useParams();
    const code = rawCode.toUpperCase();
    const validCode = ROOM_CODE_PATTERN.test(code);
    const navigate = useNavigate();

    const [session, setSession] = useState(() => loadRoomSession(code));
    const [state, setState] = useState(null);
    const [fatal, setFatal] = useState(null); // room missing / expired
    const [offline, setOffline] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const [offset, setOffset] = useState(0); // server clock minus local clock
    const token = session?.token;

    const [selected, setSelected] = useState(null);
    const [localAnswer, setLocalAnswer] = useState(null); // { index, choice } until the server confirms
    const [submitting, setSubmitting] = useState(false);
    const [answerError, setAnswerError] = useState('');
    const [joining, setJoining] = useState(false);
    const [lobbyError, setLobbyError] = useState('');
    const [starting, setStarting] = useState(false);

    useDocumentTitle(validCode ? `Room ${code}` : 'Room');

    const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

    // Short polling: serverless functions cannot hold websockets open, so the client asks for the room
    // state every ~1.5s, plus right when the current phase is due to end so transitions feel instant.
    useEffect(() => {
        if (!validCode) return undefined;
        let cancelled = false;
        let timer;
        let offsetMs = 0;
        const controller = new AbortController();
        const poll = async () => {
            const sentAt = Date.now();
            try {
                const data = await apiFetch(`/api/rooms/${code}`, { token, signal: controller.signal });
                if (cancelled) return;
                const receivedAt = Date.now();
                const measured = receivedAt - sentAt < 2000 ? data.serverNow - (sentAt + receivedAt) / 2 : offsetMs;
                offsetMs = measured;
                setOffset(measured);
                setState(data);
                setOffline(false);
                if (token && !data.me) {
                    // Our seat is gone (e.g. the room was recreated); fall back to joining afresh.
                    saveRoomSession(code, null);
                    setSession(null);
                }
                if (data.phase === 'finished') return;
                let delay = document.hidden ? HIDDEN_POLL_MS : POLL_MS;
                if (data.phaseEndsAt) {
                    const untilEnd = data.phaseEndsAt - (Date.now() + offsetMs);
                    if (untilEnd > 0 && untilEnd < delay) delay = untilEnd + 150;
                }
                timer = setTimeout(poll, delay);
            } catch (err) {
                if (cancelled || controller.signal.aborted) return;
                if ([400, 404, 410].includes(err.status)) {
                    setFatal(err);
                    return;
                }
                setOffline(true);
                timer = setTimeout(poll, RETRY_MS);
            }
        };
        poll();
        return () => {
            cancelled = true;
            controller.abort();
            clearTimeout(timer);
        };
    }, [code, validCode, refreshKey, token]);

    // Local clock for countdowns between polls.
    const live = state && ['countdown', 'question', 'reveal'].includes(state.phase);
    useEffect(() => {
        if (!live) return undefined;
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, [live]);

    // New question: clear the previous selection.
    const questionIndex = state?.questionIndex ?? null;
    const [seenIndex, setSeenIndex] = useState(questionIndex);
    if (questionIndex !== seenIndex) {
        setSeenIndex(questionIndex);
        setSelected(null);
        setAnswerError('');
    }

    const serverAnswer = state?.me?.answer;
    const myChoice = serverAnswer ? serverAnswer.choice : localAnswer && localAnswer.index === questionIndex ? localAnswer.choice : null;

    const submitAnswer = useCallback(async (choice) => {
        if (choice === null || submitting || !session) return;
        setSubmitting(true);
        setAnswerError('');
        try {
            await apiFetch(`/api/rooms/${code}/answer`, { method: 'POST', token: session.token, body: { questionIndex, choice } });
            setLocalAnswer({ index: questionIndex, choice });
        } catch (err) {
            if (err.code === 'already_answered') setLocalAnswer({ index: questionIndex, choice });
            else setAnswerError(err.message);
        } finally {
            setSubmitting(false);
            refresh();
        }
    }, [code, questionIndex, session, submitting, refresh]);

    // Keyboard: 1-4 / A-D to pick, Enter to lock in.
    const canAnswer = Boolean(session && state?.me);
    const answering = state?.phase === 'question' && canAnswer && myChoice === null;
    useEffect(() => {
        if (!answering) return undefined;
        const onKey = (e) => {
            if (e.target.closest?.('input, textarea, select')) return;
            const key = e.key.toUpperCase();
            const pick = ['1', '2', '3', '4'].indexOf(key) !== -1 ? Number(key) - 1 : ['A', 'B', 'C', 'D'].indexOf(key);
            if (pick >= 0 && pick < (state.question?.options.length ?? 0)) setSelected(pick);
            else if (e.key === 'Enter' && selected !== null) submitAnswer(selected);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answering, selected, state, submitAnswer]);

    // Keep finished room games in local history, once.
    useEffect(() => {
        if (state?.phase !== 'finished' || !state.review || !session || session.saved) return;
        const me = state.players.find((p) => p.id === state.me.id);
        saveResult({
            id: `${Date.now()}`,
            topicId: state.topic.id,
            topicName: state.topic.name,
            roomCode: state.code,
            difficulty: state.difficulty,
            correct: state.review.filter((a) => a.correct).length,
            total: state.review.length,
            score: me?.score ?? 0,
            missed: state.review.filter((a) => !a.correct).map((a) => a.question),
            date: new Date().toISOString(),
        });
        const next = { ...session, saved: true };
        saveRoomSession(code, next);
        setSession(next);
    }, [state, session, code]);

    const join = async (nickname) => {
        const check = validateNickname(nickname);
        if (!check.ok) {
            setLobbyError(check.error);
            return;
        }
        saveNickname(check.value);
        setJoining(true);
        setLobbyError('');
        try {
            const joined = await apiFetch(`/api/rooms/${code}/join`, { method: 'POST', body: { nickname: check.value } });
            const next = { token: joined.token, playerId: joined.playerId };
            saveRoomSession(code, next);
            setSession(next);
        } catch (err) {
            setLobbyError(err.message);
        } finally {
            setJoining(false);
        }
    };

    const start = async () => {
        setStarting(true);
        setLobbyError('');
        try {
            const data = await apiFetch(`/api/rooms/${code}/start`, { method: 'POST', token: session.token });
            setState(data);
            refresh();
        } catch (err) {
            setLobbyError(err.message);
        } finally {
            setStarting(false);
        }
    };

    if (!validCode || fatal) {
        const expired = fatal?.status === 410;
        return (
            <EmptyState
                icon={AlertCircle}
                tone="danger"
                title={expired ? 'This room has expired' : 'Room not found'}
                description={fatal?.message || 'Room codes are 6 letters or numbers. Check the code or ask your friend for a new invite.'}
                action={<Link to="/quiz" className="btn btn-primary">Create or join a room <ArrowRight className="size-4" aria-hidden="true" /></Link>}
            />
        );
    }

    if (!state) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted" role="status">
                <Loader2 className="size-8 animate-spin text-brand" aria-hidden="true" />
                <p className="text-sm font-medium">{offline ? 'Reconnecting to the game server…' : `Loading room ${code}…`}</p>
            </div>
        );
    }

    const topic = roomTopicMeta(state.topic.id) || state.topic;
    const level = getDifficulty(state.difficulty);
    const serverNow = now + offset;
    const remainingMs = state.phaseEndsAt ? Math.max(0, state.phaseEndsAt - serverNow) : 0;
    const startedWithoutMe = !canAnswer && state.phase !== 'lobby';

    return (
        <div className="mx-auto max-w-5xl animate-fade-up">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <TopicIcon topic={topic} size="sm" />
                    <div className="min-w-0">
                        <h1 className="truncate font-sans text-base font-semibold tracking-normal">{state.topic.name}</h1>
                        <p className="truncate text-xs text-muted">Room <span className="font-mono font-semibold">{state.code}</span> · {level.label} · {state.totalQuestions} questions</p>
                    </div>
                </div>
                <button type="button" onClick={() => navigate('/quiz')} className="btn btn-ghost btn-sm">
                    <LogOut className="size-4" aria-hidden="true" /> <span className="hidden sm:inline">Leave</span>
                </button>
            </div>

            {offline && (
                <p className="mb-4 flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning" role="status">
                    <WifiOff className="size-4 shrink-0" aria-hidden="true" /> Connection lost — reconnecting…
                </p>
            )}
            {startedWithoutMe && state.phase !== 'finished' && (
                <p className="mb-4 flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted" role="status">
                    <Eye className="size-4 shrink-0" aria-hidden="true" /> This game started before you joined — you are watching live.
                </p>
            )}

            {/* Progress */}
            {state.phase !== 'lobby' && state.phase !== 'finished' && (
                <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-muted">
                            Question <span className="text-fg">{state.questionIndex + 1}</span> of {state.totalQuestions}
                        </span>
                        {state.me && (
                            <span className="badge bg-surface-2 tabular-nums text-fg">
                                {state.players.find((p) => p.id === state.me.id)?.score ?? 0} pts
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1.5" aria-hidden="true">
                        {Array.from({ length: state.totalQuestions }, (_, i) => (
                            <span key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i < state.questionIndex || (i === state.questionIndex && state.phase === 'reveal') ? 'bg-brand' : i === state.questionIndex ? 'bg-brand/50' : 'bg-line'}`} />
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
                <div className="min-w-0">
                    {state.phase === 'lobby' && (
                        <Lobby state={state} session={session} onStart={start} starting={starting} onJoin={join} joining={joining} error={lobbyError} />
                    )}
                    {state.phase === 'countdown' && (
                        <div className="card flex flex-col items-center px-6 py-16 text-center" role="status" aria-live="assertive">
                            <p className="eyebrow">Get ready</p>
                            <p key={Math.ceil(remainingMs / 1000)} className="mt-3 animate-pop font-display text-7xl font-extrabold text-brand tabular-nums">{Math.max(1, Math.ceil(remainingMs / 1000))}</p>
                            <p className="mt-3 text-muted">First question coming up…</p>
                        </div>
                    )}
                    {(state.phase === 'question' || state.phase === 'reveal') && (
                        <QuestionView
                            state={state}
                            remainingMs={remainingMs}
                            myChoice={myChoice}
                            selected={selected}
                            setSelected={setSelected}
                            onSubmit={() => submitAnswer(selected)}
                            submitting={submitting}
                            canAnswer={canAnswer}
                            answerError={answerError}
                        />
                    )}
                    {state.phase === 'finished' && <FinalResults state={state} />}
                </div>

                <div className="space-y-4 lg:sticky lg:top-24">
                    <Scoreboard state={state} meId={state.me?.id} title={state.phase === 'lobby' ? 'Players' : state.phase === 'finished' ? 'Final standings' : 'Live scoreboard'} />
                    {state.phase === 'finished' && (
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/quiz" className="btn btn-primary"><Users className="size-4" aria-hidden="true" /> New room</Link>
                            <Link to="/leaderboard" className="btn btn-secondary"><Trophy className="size-4" aria-hidden="true" /> Leaderboard</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Room;
