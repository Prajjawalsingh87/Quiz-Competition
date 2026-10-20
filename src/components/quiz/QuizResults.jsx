import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, LayoutGrid, History as HistoryIcon, CheckCircle2, XCircle, Trophy, Target, Zap } from 'lucide-react';

const verdict = (pct) => {
    if (pct === 100) return { title: 'Flawless victory!', note: 'Every single answer right. Legendary.' };
    if (pct >= 80) return { title: 'Brilliant run!', note: 'You clearly know this topic inside out.' };
    if (pct >= 60) return { title: 'Nice work!', note: 'Solid score — a couple more and you’re at the top.' };
    if (pct >= 40) return { title: 'Getting there', note: 'Review the answers below and go again.' };
    return { title: 'Keep practising', note: 'Every expert started here. Try another round!' };
};

const QuizResults = ({ topic, result, onReplay, replayLabel = 'Play again', onReview, mistakesLeft = 0, onExit }) => {
    const { answers, score } = result;
    const correct = answers.filter((a) => a.correct).length;
    const pct = Math.round((correct / answers.length) * 100);
    const { title, note } = verdict(pct);

    return (
        <div className="mx-auto max-w-3xl animate-fade-up space-y-6">
            <div className="card overflow-hidden text-center">
                <div className="bg-gradient-to-br from-brand/15 via-transparent to-fuchsia-500/10 px-6 pt-10 pb-8">
                    <div
                        className="mx-auto flex size-36 items-center justify-center rounded-full"
                        style={{ background: `conic-gradient(var(--brand) ${pct * 3.6}deg, var(--surface-2) 0deg)` }}
                        role="img"
                        aria-label={`${pct}% correct`}
                    >
                        <div className="flex size-28 flex-col items-center justify-center rounded-full bg-surface">
                            <span className="font-display text-3xl font-extrabold tabular-nums">{pct}%</span>
                            <span className="text-xs text-muted">correct</span>
                        </div>
                    </div>
                    <h1 className="mt-6 text-3xl font-extrabold">{title}</h1>
                    <p className="mt-2 text-muted">{note}</p>
                </div>

                <dl className="grid grid-cols-3 divide-x divide-line border-t border-line">
                    {[
                        { icon: Trophy, label: 'Score', value: score },
                        { icon: Target, label: 'Correct', value: `${correct}/${answers.length}` },
                        { icon: Zap, label: 'Topic', value: topic.id === 'review' ? 'Review' : topic.name.split(' ')[0] },
                    ].map((s) => (
                        <div key={s.label} className="px-2 py-5">
                            <dt className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted">
                                <s.icon className="size-3.5" aria-hidden="true" /> {s.label}
                            </dt>
                            <dd className="mt-1 truncate font-display text-xl font-bold tabular-nums sm:text-2xl">{s.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                {onReplay && (
                    <button type="button" onClick={onReplay} className="btn btn-primary btn-lg sm:flex-1">
                        <RotateCcw className="size-4" aria-hidden="true" /> {replayLabel}
                    </button>
                )}
                <button type="button" onClick={onExit} className="btn btn-secondary btn-lg sm:flex-1">
                    <LayoutGrid className="size-4" aria-hidden="true" /> New topic
                </button>
                <Link to="/history" className="btn btn-secondary btn-lg sm:flex-1">
                    <HistoryIcon className="size-4" aria-hidden="true" /> History
                </Link>
            </div>

            <section className="card p-5 sm:p-6" aria-labelledby="review-title">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="review-title" className="text-lg font-bold">Answer review</h2>
                    {onReview && (
                        <button type="button" onClick={onReview} className="btn btn-secondary btn-sm">
                            <RotateCcw className="size-4" aria-hidden="true" /> Practise mistakes ({mistakesLeft})
                        </button>
                    )}
                </div>
                <ol className="space-y-3">
                    {answers.map((a, i) => (
                        <li key={i} className="flex gap-3 rounded-xl border border-line p-4">
                            {a.correct
                                ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
                                : <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />}
                            <div className="min-w-0 flex-1 text-sm">
                                <p className="font-semibold">{i + 1}. {a.question}</p>
                                <p className="mt-1.5 text-muted">
                                    {a.correct ? (
                                        <>Your answer: <span className="font-medium text-success">{a.options[a.answer]}</span></>
                                    ) : (
                                        <>
                                            Your answer: <span className="font-medium text-danger">{a.chosen === null ? 'No answer' : a.options[a.chosen]}</span>
                                            <span className="mx-2 text-line">|</span>
                                            Correct: <span className="font-medium text-success">{a.options[a.answer]}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-muted">+{a.points}</span>
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
};

export default QuizResults;
