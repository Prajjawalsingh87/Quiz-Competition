import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Timer, ArrowRight, LogOut, Flame } from 'lucide-react';
import { SECONDS_PER_QUESTION } from '../../data/quizData';
import TopicIcon from '../TopicIcon';

const LETTERS = ['A', 'B', 'C', 'D'];

const optionClass = (state) => {
    switch (state) {
        case 'correct':
            return 'border-success bg-success-soft ring-2 ring-success/25';
        case 'wrong':
            return 'border-danger bg-danger-soft ring-2 ring-danger/25 animate-shake';
        case 'selected':
            return 'border-brand bg-brand-soft ring-2 ring-brand/25';
        case 'dimmed':
            return 'border-line opacity-60';
        default:
            return 'border-line bg-surface hover:border-brand/50 hover:bg-surface-2';
    }
};

const badgeClass = (state) => {
    switch (state) {
        case 'correct':
            return 'bg-success text-white';
        case 'wrong':
            return 'bg-danger text-white';
        case 'selected':
            return 'bg-brand text-white';
        default:
            return 'bg-surface-2 text-muted group-hover:text-fg';
    }
};

const QuizPlayer = ({ topic, questions, roomCode, onFinish, onQuit }) => {
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
    const [answers, setAnswers] = useState([]);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);

    const question = questions[index];
    const isLast = index === questions.length - 1;

    const reveal = useCallback((choice) => {
        const correct = choice === question.answer;
        const points = correct ? 100 + timeLeft * 5 : 0;
        setRevealed(true);
        setScore((s) => s + points);
        setStreak((s) => (correct ? s + 1 : 0));
        setAnswers((prev) => [...prev, { question: question.q, topicId: question.topicId || topic.id, options: question.options, answer: question.answer, chosen: choice, correct, points }]);
    }, [question, timeLeft, topic.id]);

    // Countdown — runs out to an automatic "no answer".
    useEffect(() => {
        if (revealed) return undefined;
        const id = setTimeout(() => {
            if (timeLeft <= 1) {
                setTimeLeft(0);
                reveal(null);
            } else {
                setTimeLeft((t) => t - 1);
            }
        }, 1000);
        return () => clearTimeout(id);
    }, [timeLeft, revealed, reveal]);

    const next = useCallback(() => {
        if (isLast) {
            onFinish({ answers, score });
            return;
        }
        setIndex((i) => i + 1);
        setSelected(null);
        setRevealed(false);
        setTimeLeft(SECONDS_PER_QUESTION);
    }, [isLast, onFinish, answers, score]);

    // Keyboard: 1-4 / A-D to pick, Enter to check or continue.
    useEffect(() => {
        const onKey = (e) => {
            if (e.target.closest?.('input, textarea')) return;
            const key = e.key.toUpperCase();
            const pick = ['1', '2', '3', '4'].indexOf(key) !== -1 ? Number(key) - 1 : LETTERS.indexOf(key);
            if (!revealed && pick >= 0 && pick < question.options.length) {
                setSelected(pick);
            } else if (e.key === 'Enter') {
                if (revealed) next();
                else if (selected !== null) reveal(selected);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [revealed, selected, question, next, reveal]);

    const stateFor = (i) => {
        if (!revealed) return selected === i ? 'selected' : 'idle';
        if (i === question.answer) return 'correct';
        if (i === selected) return 'wrong';
        return 'dimmed';
    };

    const lastAnswer = revealed ? answers[answers.length - 1] : null;
    const progress = ((index + (revealed ? 1 : 0)) / questions.length) * 100;
    const timePct = (timeLeft / SECONDS_PER_QUESTION) * 100;
    const timeTone = timeLeft <= 5 ? 'text-danger bg-danger-soft' : timeLeft <= 10 ? 'text-warning bg-warning-soft' : 'text-brand-ink bg-brand-soft';

    return (
        <div className="mx-auto max-w-3xl animate-fade-up">
            {/* Top bar */}
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <TopicIcon topic={topic} size="sm" />
                    <div className="min-w-0">
                        <p className="truncate font-semibold">{topic.name}</p>
                        <p className="text-xs text-muted">{roomCode ? `Room ${roomCode}` : topic.id === 'review' ? 'Practise what you missed' : 'Solo practice'}</p>
                    </div>
                </div>
                <button type="button" onClick={onQuit} className="btn btn-ghost btn-sm">
                    <LogOut className="size-4" aria-hidden="true" /> <span className="hidden sm:inline">Quit</span>
                </button>
            </div>

            {/* Progress */}
            <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-muted">
                        Question <span className="text-fg">{index + 1}</span> of {questions.length}
                    </span>
                    <div className="flex items-center gap-2">
                        {streak >= 2 && (
                            <span className="badge animate-pop bg-orange-500/15 text-orange-600 dark:text-orange-400">
                                <Flame className="size-3.5" aria-hidden="true" /> {streak} streak
                            </span>
                        )}
                        <span className="badge bg-surface-2 tabular-nums text-fg">{score} pts</span>
                    </div>
                </div>
                <div
                    className="flex gap-1.5"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={questions.length}
                    aria-valuenow={answers.length}
                    aria-label="Quiz progress"
                >
                    {questions.map((_, i) => {
                        const a = answers[i];
                        const tone = a ? (a.correct ? 'bg-success' : 'bg-danger') : i === index ? 'bg-brand/50' : 'bg-line';
                        return <span key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${tone}`} />;
                    })}
                </div>
                <span className="sr-only">{Math.round(progress)}% complete</span>
            </div>

            {/* Question card */}
            <div className="card overflow-hidden">
                <div className="h-1 bg-line/60" aria-hidden="true">
                    <div
                        className={`h-full transition-[width] duration-1000 ease-linear ${timeLeft <= 5 ? 'bg-danger' : timeLeft <= 10 ? 'bg-warning' : 'bg-brand'}`}
                        style={{ width: `${revealed ? 0 : timePct}%` }}
                    />
                </div>
                <div className="p-5 sm:p-8">
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <h2 key={index} className="animate-fade-up text-xl leading-snug font-bold sm:text-2xl">{question.q}</h2>
                        <span className={`badge shrink-0 tabular-nums ${revealed ? 'bg-surface-2 text-muted' : timeTone}`} aria-live="off">
                            <Timer className="size-3.5" aria-hidden="true" /> 0:{String(timeLeft).padStart(2, '0')}
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Answers">
                        {question.options.map((opt, i) => {
                            const state = stateFor(i);
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected === i}
                                    disabled={revealed}
                                    onClick={() => setSelected(i)}
                                    className={`group flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-all duration-150 disabled:cursor-default ${optionClass(state)}`}
                                >
                                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${badgeClass(state)}`}>
                                        {LETTERS[i]}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                    {state === 'correct' && <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Correct answer" />}
                                    {state === 'wrong' && <XCircle className="size-5 shrink-0 text-danger" aria-label="Your answer" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Feedback */}
                    <div aria-live="polite">
                        {lastAnswer && (
                            <div className={`mt-5 flex animate-fade-up gap-3 rounded-xl p-4 text-sm ${lastAnswer.correct ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                                {lastAnswer.correct
                                    ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
                                    : <XCircle className="size-5 shrink-0 text-danger" aria-hidden="true" />}
                                <div>
                                    <p className="font-semibold">
                                        {lastAnswer.correct
                                            ? `Correct! +${lastAnswer.points} points`
                                            : lastAnswer.chosen === null ? 'Time’s up!' : 'Not quite.'}
                                    </p>
                                    <p className="mt-0.5 text-muted">{question.explain}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
                        <p className="hidden text-xs text-muted sm:block">
                            Tip: press <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans">1</kbd>–<kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans">4</kbd> to choose, <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans">Enter</kbd> to confirm
                        </p>
                        {revealed ? (
                            <button type="button" onClick={next} className="btn btn-primary" autoFocus>
                                {isLast ? 'See results' : 'Next question'} <ArrowRight className="size-4" aria-hidden="true" />
                            </button>
                        ) : (
                            <button type="button" onClick={() => reveal(selected)} disabled={selected === null} className="btn btn-primary">
                                Check answer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizPlayer;
