import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Swords, MessageCircle, UserPlus, UserX, CheckCircle2, AlertCircle } from 'lucide-react';
import { FRIENDS, STATUS_LABEL } from '../data/socialData';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import useDocumentTitle from '../utils/useDocumentTitle';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'online', label: 'Online' },
    { id: 'pending', label: 'Pending' },
];

const Friends = () => {
    useDocumentTitle('Friends');
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');
    const [invite, setInvite] = useState('');
    const [pending, setPending] = useState([]);
    const [notice, setNotice] = useState(null);

    const online = FRIENDS.filter((f) => f.status !== 'offline');
    const counts = { all: FRIENDS.length, online: online.length, pending: pending.length };

    const base = filter === 'online' ? online : filter === 'pending' ? pending : FRIENDS;
    const q = query.trim().toLowerCase();
    const visible = base.filter((f) => !q || f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q));

    const sendInvite = (e) => {
        e.preventDefault();
        const handle = invite.trim().replace(/^@?/, '@');
        if (handle.length < 3) {
            setNotice({ type: 'error', text: 'Enter a username with at least 2 characters.' });
            return;
        }
        if ([...FRIENDS, ...pending].some((f) => f.handle.toLowerCase() === handle.toLowerCase())) {
            setNotice({ type: 'error', text: `${handle} is already in your list.` });
            return;
        }
        setPending((prev) => [...prev, { id: handle, name: handle.slice(1), handle, status: 'pending', xp: 0, color: '#64748b' }]);
        setNotice({ type: 'success', text: `Friend request sent to ${handle}.` });
        setInvite('');
    };

    return (
        <div className="animate-fade-up">
            <PageHeader
                eyebrow="Friends"
                title="Your squad"
                description="See who’s online, send a challenge, or start a conversation."
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
                <section className="card overflow-hidden" aria-label="Friends list">
                    <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="tablist" aria-label="Filter friends">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={filter === f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition sm:flex-none ${filter === f.id ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg'}`}
                                >
                                    {f.label} <span className="ml-0.5 text-xs text-muted tabular-nums">{counts[f.id]}</span>
                                </button>
                            ))}
                        </div>
                        <div className="relative sm:w-56">
                            <label htmlFor="friend-search" className="sr-only">Search friends</label>
                            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                            <input id="friend-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search friends" className="input h-10 pl-9 text-sm" />
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-14 text-center">
                            <UserX className="mb-3 size-8 text-muted" aria-hidden="true" />
                            <p className="font-semibold">{filter === 'pending' && !q ? 'No pending requests' : 'No friends match'}</p>
                            <p className="mt-1 text-sm text-muted">{filter === 'pending' && !q ? 'Requests you send will show up here.' : 'Try a different name or filter.'}</p>
                        </div>
                    ) : (
                        <ul>
                            {visible.map((f) => (
                                <li key={f.id} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0 sm:px-5">
                                    <Avatar name={f.name} color={f.color} status={f.status === 'pending' ? undefined : f.status} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{f.name}</p>
                                        <p className="truncate text-sm text-muted">
                                            {f.handle} · {f.status === 'pending' ? 'Request sent' : STATUS_LABEL[f.status]}
                                        </p>
                                    </div>
                                    {f.status !== 'pending' && (
                                        <div className="flex shrink-0 gap-2">
                                            <button type="button" onClick={() => navigate(`/chat?u=${f.id}`)} className="btn btn-ghost size-9 px-0" title={`Message ${f.name}`}>
                                                <MessageCircle className="size-4" aria-hidden="true" /><span className="sr-only">Message {f.name}</span>
                                            </button>
                                            <Link to="/quiz" className="btn btn-secondary btn-sm" title={`Challenge ${f.name}`}>
                                                <Swords className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Challenge</span>
                                            </Link>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <aside className="space-y-6">
                    <section className="card p-5" aria-labelledby="add-title">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="icon-tile size-10"><UserPlus className="size-5" aria-hidden="true" /></span>
                            <h2 id="add-title" className="font-bold">Add a friend</h2>
                        </div>
                        <form onSubmit={sendInvite} noValidate className="space-y-3">
                            <label htmlFor="invite" className="sr-only">Username</label>
                            <input id="invite" type="text" value={invite} onChange={(e) => { setInvite(e.target.value); setNotice(null); }} placeholder="@username" className="input" autoComplete="off" />
                            <button type="submit" className="btn btn-primary w-full">Send request</button>
                        </form>
                        {notice && (
                            <p className={`mt-3 flex items-start gap-1.5 text-sm ${notice.type === 'error' ? 'text-danger' : 'text-success'}`} role="status">
                                {notice.type === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
                                {notice.text}
                            </p>
                        )}
                    </section>

                    <section className="card p-5" aria-labelledby="online-title">
                        <h2 id="online-title" className="mb-4 font-bold">Online now <span className="text-sm font-medium text-muted">({online.length})</span></h2>
                        <div className="flex -space-x-2">
                            {online.map((f) => (
                                <span key={f.id} className="rounded-full ring-2 ring-surface" title={f.name}><Avatar name={f.name} color={f.color} size="sm" /></span>
                            ))}
                        </div>
                        <Link to="/quiz" className="btn btn-secondary btn-sm mt-4 w-full">Create a room for everyone</Link>
                    </section>
                </aside>
            </div>

        </div>
    );
};

export default Friends;
