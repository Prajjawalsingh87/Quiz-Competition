import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, LogOut, Trophy, Target, Gamepad2, Award, Flame, Star, Lock, Mail, CalendarDays } from 'lucide-react';
import { loadHistory, getStats, formatDate } from '../utils/storage';
import { TOPICS } from '../data/quizData';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import TopicIcon from '../components/TopicIcon';
import useDocumentTitle from '../utils/useDocumentTitle';

const Profile = ({ user, onLogout }) => {
    useDocumentTitle('Profile');
    const history = useMemo(() => loadHistory(), []);
    const stats = getStats(history);

    if (!user) {
        return (
            <div className="mx-auto max-w-xl animate-fade-up pt-4">
                <EmptyState
                    icon={UserRound}
                    title="Sign in to see your profile"
                    description="Your profile keeps your stats, achievements and favourite topics in one place."
                    action={<><Link to="/login" className="btn btn-primary">Sign in</Link><Link to="/quiz" className="btn btn-secondary">Play as guest</Link></>}
                />
            </div>
        );
    }

    const perTopic = TOPICS.map((topic) => {
        const games = history.filter((r) => r.topicId === topic.id);
        const correct = games.reduce((acc, r) => acc + r.correct, 0);
        const total = games.reduce((acc, r) => acc + r.total, 0);
        return { topic, games: games.length, pct: total ? Math.round((correct / total) * 100) : 0 };
    });

    const achievements = [
        { icon: Star, title: 'First steps', desc: 'Finish your first quiz', earned: stats.played >= 1 },
        { icon: Flame, title: 'On a roll', desc: 'Play 5 quizzes', earned: stats.played >= 5 },
        { icon: Trophy, title: 'High scorer', desc: 'Score 500+ in one game', earned: stats.best >= 500 },
        { icon: Award, title: 'Perfectionist', desc: 'Get every answer right', earned: history.some((r) => r.correct === r.total) },
    ];

    return (
        <div className="animate-fade-up space-y-6">
            <section className="card overflow-hidden">
                <div className="h-28 bg-gradient-to-r from-brand via-[#7c3aed] to-fuchsia-500 sm:h-36" aria-hidden="true" />
                <div className="flex flex-col gap-4 px-5 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="-mt-10 w-fit rounded-full border-4 border-surface">
                            <Avatar name={user.name} size="lg" />
                        </div>
                        <div className="sm:pb-1">
                            <h1 className="text-2xl font-bold capitalize">{user.name}</h1>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                                <span className="flex items-center gap-1.5"><Mail className="size-4" aria-hidden="true" /> {user.email}</span>
                                {user.joinedAt && <span className="flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden="true" /> Joined {formatDate(user.joinedAt).split(',')[0]}</span>}
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={onLogout} className="btn btn-secondary btn-sm w-fit">
                        <LogOut className="size-4" aria-hidden="true" /> Log out
                    </button>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { icon: Gamepad2, label: 'Games played', value: stats.played },
                    { icon: Trophy, label: 'Total points', value: stats.totalScore.toLocaleString() },
                    { icon: Target, label: 'Accuracy', value: `${stats.accuracy}%` },
                ].map((s) => (
                    <div key={s.label} className="card flex items-center gap-4 p-5">
                        <span className="icon-tile"><s.icon className="size-5" aria-hidden="true" /></span>
                        <div>
                            <p className="text-sm text-muted">{s.label}</p>
                            <p className="font-display text-2xl font-bold tabular-nums">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="card p-5 sm:p-6" aria-labelledby="topics-title">
                    <h2 id="topics-title" className="mb-5 text-lg font-bold">Topic mastery</h2>
                    <ul className="space-y-4">
                        {perTopic.map(({ topic, games, pct }) => (
                            <li key={topic.id} className="flex items-center gap-3">
                                <TopicIcon topic={topic} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1.5 flex justify-between gap-2 text-sm">
                                        <span className="truncate font-medium">{topic.name}</span>
                                        <span className="shrink-0 text-muted tabular-nums">{games ? `${pct}%` : 'Not played'}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-line/70">
                                        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, backgroundColor: topic.color }} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="card p-5 sm:p-6" aria-labelledby="ach-title">
                    <h2 id="ach-title" className="mb-5 text-lg font-bold">Achievements</h2>
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {achievements.map((a) => (
                            <li key={a.title} className={`flex items-center gap-3 rounded-xl border p-3 ${a.earned ? 'border-brand/30 bg-brand-soft' : 'border-line'}`}>
                                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${a.earned ? 'bg-brand text-white' : 'bg-surface-2 text-muted'}`}>
                                    {a.earned ? <a.icon className="size-5" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                                </span>
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold ${a.earned ? '' : 'text-muted'}`}>{a.title}</p>
                                    <p className="text-xs text-muted">{a.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default Profile;
