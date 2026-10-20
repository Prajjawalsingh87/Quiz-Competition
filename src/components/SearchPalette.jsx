import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, HelpCircle, History as HistoryIcon, CornerDownLeft, X } from 'lucide-react';
import { TOPICS, getTopic } from '../data/quizData';
import { loadHistory } from '../utils/storage';
import { createSearchIndex, searchAll, hrefFor } from '../utils/searchIndex';
import TopicIcon from './TopicIcon';

const TYPE_LABEL = { topic: 'Topic', question: 'Question', game: 'Past game' };

const ResultIcon = ({ hit }) => {
    if (hit.type === 'topic') return <TopicIcon topic={getTopic(hit.topicId)} size="sm" />;
    const Icon = hit.type === 'game' ? HistoryIcon : HelpCircle;
    return (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-brand-ink" aria-hidden="true">
            <Icon className="size-4" />
        </span>
    );
};

// Ctrl/⌘+K command palette. Mounted only while open, so the index always reflects the latest history.
const SearchPalette = ({ onClose }) => {
    const navigate = useNavigate();
    const listId = useId();
    const inputRef = useRef(null);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);

    const history = useMemo(() => loadHistory(), []);
    const index = useMemo(() => createSearchIndex(TOPICS, history), [history]);

    const results = useMemo(() => {
        if (query.trim()) return searchAll(index, query);
        // Empty query: show topics and the latest games as quick jumps.
        const topics = TOPICS.map((t) => ({ id: `topic:${t.id}`, type: 'topic', topicId: t.id, title: t.name, meta: `${t.questions.length} questions` }));
        const games = history.slice(0, 3).map((r) => ({
            id: `game:${r.id}`, type: 'game', gameId: r.id, topicId: r.topicId, title: r.topicName,
            meta: `${r.correct}/${r.total} correct · ${r.score} pts`,
        }));
        return [...topics, ...games];
    }, [index, history, query]);

    const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

    // Lock page scroll and restore focus to whatever opened the palette.
    useEffect(() => {
        const previous = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        inputRef.current?.focus();
        return () => {
            document.body.style.overflow = overflow;
            if (previous instanceof HTMLElement) previous.focus();
        };
    }, []);

    useEffect(() => {
        document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, listId]);

    const open = (hit) => {
        if (!hit) return;
        onClose();
        navigate(hrefFor(hit), { state: { jump: Date.now() } });
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((activeIndex + 1) % Math.max(results.length, 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((activeIndex - 1 + results.length) % Math.max(results.length, 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            open(results[activeIndex]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        } else if (e.key === 'Tab') {
            // Keep focus inside the dialog: the input is the only stop, results use arrow keys.
            e.preventDefault();
        }
    };

    const hasQuery = query.trim().length > 0;

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
            <div className="absolute inset-0 bg-fg/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Search"
                className="card relative flex max-h-[70vh] w-full max-w-xl animate-fade-up flex-col overflow-hidden shadow-lift"
            >
                <div className="flex items-center gap-3 border-b border-line px-4">
                    <SearchIcon className="size-5 shrink-0 text-muted" aria-hidden="true" />
                    <label htmlFor={`${listId}-input`} className="sr-only">Search topics, questions and your games</label>
                    <input
                        ref={inputRef}
                        id={`${listId}-input`}
                        type="text"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={`${listId}-list`}
                        aria-activedescendant={results.length ? `${listId}-${activeIndex}` : undefined}
                        aria-autocomplete="list"
                        autoComplete="off"
                        spellCheck="false"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                        onKeyDown={onKeyDown}
                        placeholder="Search topics, questions, past games…"
                        className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
                    />
                    <button type="button" onClick={onClose} className="btn btn-ghost size-9 shrink-0 px-0">
                        <X className="size-4" aria-hidden="true" /><span className="sr-only">Close search</span>
                    </button>
                </div>

                <div className="overflow-y-auto p-2">
                    {!hasQuery && <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">Jump to</p>}
                    {results.length === 0 ? (
                        <p className="px-3 py-10 text-center text-sm text-muted" role="status">
                            No results for “<span className="font-medium text-fg">{query}</span>”. Try a topic name or a word from a question.
                        </p>
                    ) : (
                        <ul id={`${listId}-list`} role="listbox" aria-label="Search results">
                            {results.map((hit, i) => {
                                const selected = i === activeIndex;
                                return (
                                    <li
                                        key={hit.id}
                                        id={`${listId}-${i}`}
                                        role="option"
                                        aria-selected={selected}
                                        onMouseMove={() => setActive(i)}
                                        onClick={() => open(hit)}
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${selected ? 'bg-brand-soft' : ''}`}
                                    >
                                        <ResultIcon hit={hit} />
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate text-sm font-semibold ${selected ? 'text-brand-ink' : ''}`}>{hit.title}</span>
                                            <span className="block truncate text-xs text-muted">{TYPE_LABEL[hit.type]} · {hit.meta}</span>
                                        </span>
                                        {selected && <CornerDownLeft className="size-4 shrink-0 text-brand-ink" aria-hidden="true" />}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="hidden items-center gap-4 border-t border-line bg-surface-2/60 px-4 py-2.5 text-xs text-muted sm:flex">
                    <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to move</span>
                    <span><kbd className="kbd">Enter</kbd> to open</span>
                    <span><kbd className="kbd">Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
};

export default SearchPalette;
