import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Send, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { validateNickname, getDifficulty, NICKNAME_MAX } from '../../shared/game';
import { getTopic } from '../../data/quizData';
import { loadNickname, saveNickname, loadUser } from '../../utils/storage';
import { apiFetch } from '../../utils/api';

// "Post to the global leaderboard" panel on the solo results screen.
const LeaderboardSubmit = ({ submission }) => {
    const [nickname, setNickname] = useState(() => loadNickname() || loadUser()?.name?.slice(0, NICKNAME_MAX) || '');
    const [status, setStatus] = useState('idle'); // idle | pending | done
    const [error, setError] = useState('');
    const [rank, setRank] = useState(null);

    const topic = getTopic(submission.topicId);
    const level = getDifficulty(submission.difficulty);
    const boardLink = `/leaderboard?topic=${submission.topicId}&difficulty=${submission.difficulty}`;

    const submit = async (e) => {
        e.preventDefault();
        const check = validateNickname(nickname);
        if (!check.ok) {
            setError(check.error);
            return;
        }
        saveNickname(check.value);
        setError('');
        setStatus('pending');
        try {
            const res = await apiFetch('/api/leaderboard', { method: 'POST', body: { ...submission, nickname: check.value } });
            setRank(res.rank);
            setStatus('done');
        } catch (err) {
            setError(err.message);
            setStatus('idle');
        }
    };

    return (
        <section className="card p-5 sm:p-6" aria-labelledby="post-score-title">
            <div className="flex items-start gap-4">
                <span className="icon-tile bg-amber-500/15 text-amber-600 dark:text-amber-400"><Trophy className="size-5" aria-hidden="true" /></span>
                <div className="min-w-0 flex-1">
                    <h2 id="post-score-title" className="text-lg font-bold">
                        {status === 'done' ? `You’re #${rank} on the board` : 'Post to the global leaderboard'}
                    </h2>
                    <p className="text-sm text-muted">
                        {status === 'done'
                            ? `${topic?.name} · ${level.label}. Nice — see how you stack up.`
                            : `${submission.score} points in ${topic?.name} · ${level.label}. Pick a nickname everyone will see.`}
                    </p>
                </div>
            </div>

            {status === 'done' ? (
                <Link to={boardLink} className="btn btn-secondary mt-4 w-full sm:w-auto">
                    View leaderboard <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
            ) : (
                <form onSubmit={submit} noValidate className="mt-4 space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label htmlFor="board-nickname" className="sr-only">Nickname</label>
                        <input
                            id="board-nickname"
                            type="text"
                            value={nickname}
                            maxLength={NICKNAME_MAX}
                            onChange={(e) => { setNickname(e.target.value); setError(''); }}
                            className={`input sm:flex-1 ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}`}
                            placeholder="Your nickname"
                            autoComplete="nickname"
                            aria-invalid={!!error}
                            aria-describedby={error ? 'board-error' : undefined}
                        />
                        <button type="submit" disabled={status === 'pending'} className="btn btn-primary">
                            {status === 'pending'
                                ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Posting…</>
                                : <><Send className="size-4" aria-hidden="true" /> Post score</>}
                        </button>
                    </div>
                    {error && (
                        <p id="board-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
                            <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {error}
                        </p>
                    )}
                </form>
            )}
        </section>
    );
};

export default LeaderboardSubmit;
