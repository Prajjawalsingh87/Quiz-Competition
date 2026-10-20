import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowRight, SearchX, HelpCircle } from 'lucide-react';
import { TOPICS } from '../data/quizData';
import { FRIENDS, STATUS_LABEL } from '../data/socialData';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import TopicIcon from '../components/TopicIcon';
import Avatar from '../components/Avatar';
import useDocumentTitle from '../utils/useDocumentTitle';

const SUGGESTIONS = ['Science', 'Capital', 'React', 'Moon', 'Sara'];

const Search = () => {
    useDocumentTitle('Search');
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const q = query.trim().toLowerCase();

    const setQuery = (value) => setSearchParams(value ? { q: value } : {}, { replace: true });

    const results = useMemo(() => {
        if (!q) return { topics: [], questions: [], people: [] };
        return {
            topics: TOPICS.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
            questions: TOPICS.flatMap((t) => t.questions.filter((item) => item.q.toLowerCase().includes(q)).map((item) => ({ ...item, topic: t }))).slice(0, 6),
            people: FRIENDS.filter((f) => f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q)),
        };
    }, [q]);

    const total = results.topics.length + results.questions.length + results.people.length;

    return (
        <div className="animate-fade-up">
            <PageHeader eyebrow="Search" title="Find quizzes & players" description="Search across topics, questions and people." />

            <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mb-8">
                <label htmlFor="global-search" className="sr-only">Search</label>
                <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                    id="global-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Try “science”, “capital” or a friend’s name"
                    className="input h-14 rounded-2xl pr-12 pl-12 text-base shadow-card [&::-webkit-search-cancel-button]:hidden"
                    autoFocus
                />
                {query && (
                    <button type="button" onClick={() => setQuery('')} className="btn btn-ghost absolute top-1/2 right-2 size-10 -translate-y-1/2 px-0">
                        <X className="size-4" aria-hidden="true" /><span className="sr-only">Clear search</span>
                    </button>
                )}
            </form>

            {!q && (
                <div className="space-y-10">
                    <div>
                        <h2 className="mb-3 text-sm font-semibold text-muted">Popular searches</h2>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button key={s} type="button" onClick={() => setQuery(s)} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand/40 hover:text-brand-ink">
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="mb-4 text-lg font-bold">Browse topics</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {TOPICS.map((t) => (
                                <Link key={t.id} to={`/quiz?topic=${t.id}`} className="card card-hover flex items-center gap-4 p-4">
                                    <TopicIcon topic={t} />
                                    <div className="min-w-0">
                                        <p className="font-semibold">{t.name}</p>
                                        <p className="truncate text-sm text-muted">{t.questions.length} questions</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {q && total === 0 && (
                <EmptyState
                    icon={SearchX}
                    title={`No results for “${query}”`}
                    description="Check the spelling or try a broader term like a topic name."
                    action={<button type="button" onClick={() => setQuery('')} className="btn btn-secondary">Clear search</button>}
                />
            )}

            {q && total > 0 && (
                <div className="space-y-8" aria-live="polite">
                    <p className="text-sm text-muted">{total} result{total === 1 ? '' : 's'} for “<span className="font-medium text-fg">{query}</span>”</p>

                    {results.topics.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Topics</h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {results.topics.map((t) => (
                                    <Link key={t.id} to={`/quiz?topic=${t.id}`} className="card card-hover group flex items-center gap-4 p-4">
                                        <TopicIcon topic={t} />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">{t.name}</p>
                                            <p className="truncate text-sm text-muted">{t.description}</p>
                                        </div>
                                        <ArrowRight className="size-4 text-muted transition group-hover:translate-x-1" aria-hidden="true" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {results.questions.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Questions</h2>
                            <ul className="card divide-y divide-line">
                                {results.questions.map((item) => (
                                    <li key={item.q}>
                                        <Link to={`/quiz?topic=${item.topic.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2">
                                            <HelpCircle className="size-5 shrink-0 text-brand" aria-hidden="true" />
                                            <span className="min-w-0 flex-1 text-sm font-medium">{item.q}</span>
                                            <span className="hidden shrink-0 text-xs text-muted sm:block">{item.topic.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {results.people.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">People</h2>
                            <ul className="card divide-y divide-line">
                                {results.people.map((f) => (
                                    <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                                        <Avatar name={f.name} color={f.color} size="sm" status={f.status} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">{f.name}</p>
                                            <p className="truncate text-xs text-muted">{f.handle} · {STATUS_LABEL[f.status]}</p>
                                        </div>
                                        <Link to={`/chat?u=${f.id}`} className="btn btn-secondary btn-sm">Message</Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;
