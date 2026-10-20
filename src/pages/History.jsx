import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { History as HistoryIcon, Trophy, Target, Gamepad2, Trash2, ArrowRight, Users } from 'lucide-react';
import { loadHistory, clearHistory, getStats, formatDate } from '../utils/storage';
import { topicMeta } from '../data/quizData';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import TopicIcon from '../components/TopicIcon';
import useDocumentTitle from '../utils/useDocumentTitle';

const StatCard = ({ icon, label, value }) => {
    const Icon = icon;
    return (
        <div className="card flex items-center gap-4 p-5">
            <span className="icon-tile"><Icon className="size-5" aria-hidden="true" /></span>
            <div>
                <p className="text-sm text-muted">{label}</p>
                <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
            </div>
        </div>
    );
};

const scoreTone = (pct) => (pct >= 80 ? 'bg-success-soft text-success' : pct >= 50 ? 'bg-warning-soft text-warning' : 'bg-danger-soft text-danger');

const History = () => {
    useDocumentTitle('History');
    const [history, setHistory] = useState(() => loadHistory());
    const stats = useMemo(() => getStats(history), [history]);
    const { hash, state } = useLocation();
    const highlightId = hash.startsWith('#game-') ? hash.slice('#game-'.length) : null;

    // Coming from search: bring the chosen game into view (after the app's scroll-to-top).
    useEffect(() => {
        if (!highlightId) return undefined;
        const id = setTimeout(() => {
            const row = document.getElementById(`game-${highlightId}`);
            row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            row?.focus({ preventScroll: true });
        }, 60);
        return () => clearTimeout(id);
    }, [highlightId, state]);

    const handleClear = () => {
        if (window.confirm('Clear your entire quiz history? This can’t be undone.')) {
            clearHistory();
            setHistory([]);
        }
    };

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="History"
                title="Your quiz history"
                description="Every game you finish shows up here, so you can see yourself improve."
                actions={history.length > 0 && (
                    <button type="button" onClick={handleClear} className="btn btn-secondary btn-sm text-danger">
                        <Trash2 className="size-4" aria-hidden="true" /> Clear history
                    </button>
                )}
            />

            {history.length === 0 ? (
                <EmptyState
                    icon={HistoryIcon}
                    title="No games yet"
                    description="Finish your first quiz and your score, accuracy and answers will be tracked here."
                    action={<Link to="/quiz" className="btn btn-primary">Play your first quiz <ArrowRight className="size-4" aria-hidden="true" /></Link>}
                />
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <StatCard icon={Gamepad2} label="Games played" value={stats.played} />
                        <StatCard icon={Trophy} label="Best score" value={stats.best} />
                        <StatCard icon={Target} label="Accuracy" value={`${stats.accuracy}%`} />
                    </div>

                    <div className="card overflow-hidden">
                        <div className="hidden grid-cols-[1fr_8rem_6rem_9rem] gap-4 border-b border-line bg-surface-2/60 px-5 py-3 text-xs font-semibold tracking-wide text-muted uppercase md:grid">
                            <span>Quiz</span><span>Result</span><span className="text-right">Score</span><span className="text-right">Played</span>
                        </div>
                        <ul>
                            {history.map((r) => {
                                const pct = Math.round((r.correct / r.total) * 100);
                                const topic = topicMeta(r.topicId);
                                const highlighted = r.id === highlightId;
                                return (
                                    <li
                                        key={r.id}
                                        id={`game-${r.id}`}
                                        tabIndex={highlighted ? -1 : undefined}
                                        aria-current={highlighted ? 'true' : undefined}
                                        className={`grid scroll-mt-24 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 transition-colors last:border-0 md:grid-cols-[1fr_8rem_6rem_9rem] ${highlighted ? 'bg-brand-soft shadow-[inset_3px_0_0_var(--brand)] outline-none' : ''}`}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <TopicIcon topic={topic} size="sm" />
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold">{r.topicName}</p>
                                                <p className="flex items-center gap-1 text-xs text-muted">
                                                    {r.roomCode ? <><Users className="size-3" aria-hidden="true" /> Room {r.roomCode}</> : 'Solo practice'}
                                                    <span className="md:hidden">· {formatDate(r.date)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`badge w-fit ${scoreTone(pct)}`}>{r.correct}/{r.total} · {pct}%</span>
                                        <span className="hidden text-right font-semibold tabular-nums md:block">{r.score}</span>
                                        <span className="hidden text-right text-sm text-muted md:block">{formatDate(r.date)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
