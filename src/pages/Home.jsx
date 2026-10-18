import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Trophy, Zap, Users, Target, Crown, CheckCircle2, Timer } from 'lucide-react';
import { TOPICS } from '../data/quizData';
import { LEADERBOARD } from '../data/socialData';
import { loadHistory, getStats } from '../utils/storage';
import TopicIcon from '../components/TopicIcon';
import Avatar from '../components/Avatar';
import useDocumentTitle from '../utils/useDocumentTitle';

const STEPS = [
    { icon: Target, title: 'Pick a topic', desc: 'Five categories, from science to geography, with new sets on the way.' },
    { icon: Zap, title: 'Answer fast', desc: 'Every question is timed. Quicker correct answers earn bonus points.' },
    { icon: Trophy, title: 'Climb the board', desc: 'Track your history, beat your best and challenge friends in rooms.' },
];

const PreviewCard = () => (
    <div className="relative mx-auto mb-6 w-full max-w-md" aria-hidden="true">
        <div className="absolute inset-0 -z-10 rounded-[2rem] sm:-inset-6 bg-gradient-to-tr from-brand/25 via-fuchsia-400/15 to-sky-400/20 blur-2xl" />
        <div className="card p-5 shadow-lift sm:p-6">
            <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-medium text-muted">Question 3 of 5</span>
                <span className="badge bg-warning-soft text-warning"><Timer className="size-3.5" /> 0:12</span>
            </div>
            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full w-3/5 rounded-full bg-brand" />
            </div>
            <p className="mb-4 font-display text-lg font-bold">Which planet is known as the Red Planet?</p>
            <div className="space-y-2.5">
                {['Venus', 'Mars', 'Jupiter'].map((opt, i) => (
                    <div
                        key={opt}
                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium ${i === 1 ? 'border-success bg-success-soft text-fg' : 'border-line'}`}
                    >
                        <span className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${i === 1 ? 'bg-success text-white' : 'bg-surface-2 text-muted'}`}>
                            {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                        {i === 1 && <CheckCircle2 className="ml-auto size-5 text-success" />}
                    </div>
                ))}
            </div>
        </div>
        <div className="card absolute -right-4 -bottom-10 hidden items-center gap-3 px-4 py-3 shadow-lift sm:flex">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-400/20 text-amber-500"><Crown className="size-5" /></span>
            <div className="text-sm">
                <p className="font-semibold">+180 pts</p>
                <p className="text-muted">Speed bonus</p>
            </div>
        </div>
    </div>
);

const Home = ({ user }) => {
    useDocumentTitle();
    const stats = useMemo(() => getStats(loadHistory()), []);
    const firstName = user?.name;

    const scrollToBoard = () => document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="space-y-20 sm:space-y-28">

            {/* Hero */}
            <section className="grid grid-cols-1 items-center gap-12 pt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-8">
                <div className="animate-fade-up text-center lg:text-left">
                    <span className="badge mb-6 border border-brand/20 bg-brand-soft text-brand-ink">
                        <Sparkles className="size-3.5" aria-hidden="true" />
                        {firstName ? `Welcome back, ${firstName}` : 'Real-time quiz battles'}
                    </span>
                    <h1 className="text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-6xl">
                        Master any topic,{' '}
                        <span className="bg-gradient-to-r from-brand to-fuchsia-500 bg-clip-text text-transparent">beat your friends</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted lg:mx-0">
                        Fast, timed quizzes with instant feedback. Create a room, invite your friends and see who really knows their stuff.
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                        <Link to="/quiz" className="btn btn-primary btn-lg">
                            Start a quiz <ArrowRight className="size-5" aria-hidden="true" />
                        </Link>
                        <button type="button" onClick={scrollToBoard} className="btn btn-secondary btn-lg">
                            <Trophy className="size-5 text-amber-500" aria-hidden="true" /> View leaderboard
                        </button>
                    </div>

                    <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface/70 py-4 backdrop-blur lg:mx-0">
                        {[
                            { label: 'Played', value: stats.played },
                            { label: 'Best score', value: stats.best },
                            { label: 'Accuracy', value: `${stats.accuracy}%` },
                        ].map((s) => (
                            <div key={s.label} className="px-3 text-center">
                                <dt className="text-xs font-medium text-muted">{s.label}</dt>
                                <dd className="mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl">{s.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <PreviewCard />
            </section>

            {/* Topics */}
            <section aria-labelledby="topics-title">
                <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="eyebrow mb-2">Categories</p>
                        <h2 id="topics-title" className="text-2xl font-bold sm:text-3xl">Choose your arena</h2>
                    </div>
                    <Link to="/search" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-ink hover:underline">
                        Browse all <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {TOPICS.map((topic) => (
                        <Link key={topic.id} to={`/quiz?topic=${topic.id}`} className="card card-hover group flex items-start gap-4 p-5">
                            <TopicIcon topic={topic} size="lg" />
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold">{topic.name}</h3>
                                <p className="mt-1 text-sm text-muted">{topic.description}</p>
                                <p className="mt-3 text-xs font-medium text-muted">{topic.questions.length} questions · ~2 min</p>
                            </div>
                            <ArrowRight className="mt-1 size-5 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-brand" aria-hidden="true" />
                        </Link>
                    ))}
                    <Link to="/quiz" className="card card-hover flex flex-col justify-center gap-2 border-dashed bg-transparent p-5 text-center shadow-none">
                        <Users className="mx-auto size-6 text-brand" aria-hidden="true" />
                        <span className="font-semibold">Play with friends</span>
                        <span className="text-sm text-muted">Create a private room and share the code.</span>
                    </Link>
                </div>
            </section>

            {/* How it works + Leaderboard */}
            <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
                <div>
                    <p className="eyebrow mb-2">How it works</p>
                    <h2 className="text-2xl font-bold sm:text-3xl">Three steps to the top</h2>
                    <ol className="mt-8 space-y-6">
                        {STEPS.map((step, i) => (
                            <li key={step.title} className="flex gap-4">
                                <span className="icon-tile"><step.icon className="size-5" aria-hidden="true" /></span>
                                <div>
                                    <h3 className="font-semibold"><span className="text-muted">0{i + 1}.</span> {step.title}</h3>
                                    <p className="mt-1 text-muted">{step.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                <div id="leaderboard" className="card scroll-mt-24 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-line px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Trophy className="size-5 text-amber-500" aria-hidden="true" />
                            <h2 className="text-lg font-bold">Leaderboard</h2>
                        </div>
                        <span className="badge bg-surface-2 text-muted">This week</span>
                    </div>
                    <ol>
                        {LEADERBOARD.slice(0, 5).map((p, i) => (
                            <li key={p.id} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
                                <span className={`w-6 text-center font-display font-bold tabular-nums ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-muted'}`}>
                                    {i + 1}
                                </span>
                                <Avatar name={p.name} color={p.color} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">{p.name}</p>
                                    <p className="truncate text-xs text-muted">{p.handle}</p>
                                </div>
                                <span className="text-sm font-semibold tabular-nums">{p.xp.toLocaleString()} <span className="font-normal text-muted">XP</span></span>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* CTA */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[#7c3aed] px-6 py-12 text-center text-white sm:px-12">
                <div className="absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <h2 className="relative text-2xl font-bold text-white sm:text-3xl">Ready to play?</h2>
                <p className="relative mx-auto mt-3 max-w-lg text-white/85">Five questions, twenty seconds each. See how far you can push your score.</p>
                <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link to="/quiz" className="btn btn-lg bg-white text-[#4a3bd9] hover:bg-white/90">Play now <ArrowRight className="size-5" aria-hidden="true" /></Link>
                    {!user && <Link to="/login" className="btn btn-lg border border-white/30 text-white hover:bg-white/10">Create an account</Link>}
                </div>
            </section>
        </div>
    );
};

export default Home;
