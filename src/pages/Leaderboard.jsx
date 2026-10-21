import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trophy, RefreshCw, ArrowRight, AlertCircle, Clock3, Medal } from 'lucide-react';
import { TOPICS, getTopic } from '../data/quizData';
import { DIFFICULTIES } from '../shared/game';
import PageHeader from '../components/PageHeader';
import DifficultyPicker from '../components/DifficultyPicker';
import TopicIcon from '../components/TopicIcon';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import useDocumentTitle from '../utils/useDocumentTitle';
import useLeaderboard from '../utils/useLeaderboard';
import { formatDuration, colorForName, rankTone } from '../utils/format';

const TOPIC_FILTERS = [{ id: 'all', name: 'All topics' }, ...TOPICS];

const Leaderboard = () => {
    useDocumentTitle('Leaderboard');
    const [params, setParams] = useSearchParams();
    const topicId = getTopic(params.get('topic')) ? params.get('topic') : 'all';
    const difficulty = Object.hasOwn(DIFFICULTIES, params.get('difficulty') || '') ? params.get('difficulty') : 'all';
    const { entries, loading, error, retry } = useLeaderboard({ topicId, difficulty });

    const setFilter = (key, value) => {
        const next = new URLSearchParams(params);
        if (value === 'all') next.delete(key);
        else next.set(key, value);
        setParams(next, { replace: true });
    };

    const scope = [topicId === 'all' ? 'all topics' : getTopic(topicId).name, difficulty === 'all' ? 'every difficulty' : DIFFICULTIES[difficulty].label.toLowerCase()].join(' · ');

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Global"
                title="Leaderboard"
                description="The top 20 solo scores from players everywhere. Finish a solo round to post yours."
                actions={<Link to="/quiz" className="btn btn-primary">Play solo <ArrowRight className="size-4" aria-hidden="true" /></Link>}
            />

            <div className="card mb-6 space-y-4 p-4 sm:p-5">
                <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Topic">
                    <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                        {TOPIC_FILTERS.map((t) => {
                            const active = t.id === topicId;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setFilter('topic', t.id)}
                                    className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition ${active
                                        ? 'border-brand bg-brand-soft text-brand-ink'
                                        : 'border-line bg-surface text-muted hover:border-brand/40 hover:text-fg'}`}
                                >
                                    {t.id !== 'all' && <span className="size-2 rounded-full" style={{ background: t.color }} aria-hidden="true" />}
                                    {t.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <DifficultyPicker value={difficulty} onChange={(id) => setFilter('difficulty', id)} label="Difficulty filter" includeAll />
            </div>

            {error && !entries.length ? (
                <EmptyState
                    icon={AlertCircle}
                    tone="danger"
                    title="Couldn’t load the leaderboard"
                    description={error.message}
                    action={<button type="button" onClick={retry} className="btn btn-secondary"><RefreshCw className="size-4" aria-hidden="true" /> Try again</button>}
                />
            ) : !loading && !entries.length ? (
                <EmptyState
                    icon={Trophy}
                    title="No scores here yet"
                    description={`Nobody has posted a score for ${scope}. Be the first!`}
                    action={<Link to={`/quiz${topicId !== 'all' ? `?topic=${topicId}` : ''}`} className="btn btn-primary">Play now <ArrowRight className="size-4" aria-hidden="true" /></Link>}
                />
            ) : (
                <section className="card overflow-hidden" aria-labelledby="board-title" aria-busy={loading}>
                    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                        <h2 id="board-title" className="flex min-w-0 items-center gap-2 text-base font-bold">
                            <Trophy className="size-4 shrink-0 text-amber-500" aria-hidden="true" />
                            <span className="truncate">Top 20 · <span className="font-medium text-muted">{scope}</span></span>
                        </h2>
                        <span className="badge shrink-0 bg-success-soft text-success">
                            <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" /> Live
                        </span>
                    </div>
                    <ol>
                        {loading
                            ? Array.from({ length: 6 }, (_, i) => (
                                <li key={i} className="flex animate-pulse items-center gap-3 border-b border-line px-5 py-3.5 last:border-0" aria-hidden="true">
                                    <span className="h-4 w-5 rounded bg-surface-2" />
                                    <span className="size-9 rounded-full bg-surface-2" />
                                    <span className="h-4 flex-1 rounded bg-surface-2" />
                                    <span className="h-4 w-12 rounded bg-surface-2" />
                                </li>
                            ))
                            : entries.map((e, i) => {
                                const topic = getTopic(e.topicId);
                                return (
                                    <li key={`${e.nickname}-${e.rank}`} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                                        <span className={`flex w-6 justify-center font-display font-bold tabular-nums ${rankTone(i)}`}>
                                            {i < 3 ? <Medal className="size-5" aria-label={`Rank ${e.rank}`} /> : e.rank}
                                        </span>
                                        <Avatar name={e.nickname} color={colorForName(e.nickname)} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">{e.nickname}</p>
                                            <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-muted">
                                                <span className="hidden sm:inline-flex"><TopicIcon topic={topic} size="xs" /></span>
                                                <span className="truncate">{topic?.name ?? e.topicId} · {DIFFICULTIES[e.difficulty]?.label} · {e.correct}/{e.total}</span>
                                                <span className="hidden items-center gap-1 sm:inline-flex"><Clock3 className="size-3" aria-hidden="true" /> {formatDuration(e.durationMs)}</span>
                                            </p>
                                        </div>
                                        <span className="text-right text-sm font-bold tabular-nums">{e.score.toLocaleString()} <span className="font-normal text-muted">pts</span></span>
                                    </li>
                                );
                            })}
                    </ol>
                </section>
            )}
        </div>
    );
};

export default Leaderboard;
