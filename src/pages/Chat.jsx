import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, ArrowLeft, MessageCircle, Search as SearchIcon } from 'lucide-react';
import { FRIENDS, INITIAL_MESSAGES, STATUS_LABEL } from '../data/socialData';
import Avatar from '../components/Avatar';
import useDocumentTitle from '../utils/useDocumentTitle';

const nowTime = () => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date());

const Chat = () => {
    useDocumentTitle('Chat');
    const [searchParams, setSearchParams] = useSearchParams();
    const activeId = searchParams.get('u');
    const active = FRIENDS.find((f) => f.id === activeId);
    const [threads, setThreads] = useState(INITIAL_MESSAGES);
    const [draft, setDraft] = useState('');
    const [filter, setFilter] = useState('');
    const endRef = useRef(null);
    const inputRef = useRef(null);

    const messages = active ? threads[active.id] || [] : [];

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [messages.length, activeId]);

    const openThread = (id) => setSearchParams({ u: id });
    const closeThread = () => setSearchParams({});

    const send = (e) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || !active) return;
        setThreads((prev) => ({ ...prev, [active.id]: [...(prev[active.id] || []), { from: 'me', text, time: nowTime() }] }));
        setDraft('');
        inputRef.current?.focus();
    };

    const q = filter.trim().toLowerCase();
    const conversations = FRIENDS.filter((f) => !q || f.name.toLowerCase().includes(q));

    return (
        <div className="animate-fade-up">
            <h1 className="sr-only">Chat</h1>
            <div className="card grid grid-cols-1 h-[calc(100dvh-9rem)] min-h-[28rem] overflow-hidden sm:h-[calc(100dvh-10rem)] md:grid-cols-[18rem_1fr]">

                {/* Conversation list */}
                <aside className={`${active ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-line md:border-r`} aria-label="Conversations">
                    <div className="border-b border-line p-4">
                        <h2 className="mb-3 text-lg font-bold">Messages</h2>
                        <div className="relative">
                            <label htmlFor="chat-filter" className="sr-only">Search conversations</label>
                            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                            <input id="chat-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search" className="input h-10 pl-9 text-sm" />
                        </div>
                    </div>
                    <ul className="min-h-0 flex-1 overflow-y-auto p-2">
                        {conversations.map((f) => {
                            const last = (threads[f.id] || []).at(-1);
                            const isActive = f.id === activeId;
                            return (
                                <li key={f.id}>
                                    <button
                                        type="button"
                                        onClick={() => openThread(f.id)}
                                        className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${isActive ? 'bg-brand-soft' : 'hover:bg-surface-2'}`}
                                        aria-current={isActive ? 'true' : undefined}
                                    >
                                        <Avatar name={f.name} color={f.color} size="sm" status={f.status} />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-baseline justify-between gap-2">
                                                <span className="truncate text-sm font-semibold">{f.name}</span>
                                                {last && <span className="shrink-0 text-[11px] text-muted">{last.time}</span>}
                                            </span>
                                            <span className="block truncate text-xs text-muted">
                                                {last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'Say hi 👋'}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                        {conversations.length === 0 && <li className="p-6 text-center text-sm text-muted">No conversations match “{filter}”.</li>}
                    </ul>
                </aside>

                {/* Thread */}
                <section className={`${active ? 'flex' : 'hidden md:flex'} min-h-0 flex-col`} aria-label="Conversation">
                    {active ? (
                        <>
                            <header className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-5">
                                <button type="button" onClick={closeThread} className="btn btn-ghost size-9 px-0 md:hidden">
                                    <ArrowLeft className="size-5" aria-hidden="true" /><span className="sr-only">Back to conversations</span>
                                </button>
                                <Avatar name={active.name} color={active.color} size="sm" status={active.status} />
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{active.name}</p>
                                    <p className="text-xs text-muted">{STATUS_LABEL[active.status]}</p>
                                </div>
                            </header>

                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-2/40 px-3 py-5 sm:px-5" aria-live="polite">
                                {messages.length === 0 && (
                                    <p className="py-10 text-center text-sm text-muted">No messages yet. Start the conversation!</p>
                                )}
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-card ${m.from === 'me' ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md border border-line bg-surface'}`}>
                                            <p className="break-words whitespace-pre-wrap">{m.text}</p>
                                            <p className={`mt-1 text-right text-[11px] ${m.from === 'me' ? 'text-white/75' : 'text-muted'}`}>{m.time}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={endRef} />
                            </div>

                            <form onSubmit={send} className="flex gap-2 border-t border-line p-3 sm:p-4">
                                <label htmlFor="chat-input" className="sr-only">Message {active.name}</label>
                                <input
                                    id="chat-input"
                                    ref={inputRef}
                                    type="text"
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    placeholder={`Message ${active.name.split(' ')[0]}…`}
                                    className="input"
                                    autoComplete="off"
                                />
                                <button type="submit" disabled={!draft.trim()} className="btn btn-primary size-11 shrink-0 px-0">
                                    <Send className="size-4" aria-hidden="true" /><span className="sr-only">Send</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
                                <MessageCircle className="size-7" aria-hidden="true" />
                            </span>
                            <h2 className="text-xl font-bold">Your messages</h2>
                            <p className="mt-2 max-w-xs text-muted">Pick a conversation to trash-talk before your next quiz battle.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Chat;
