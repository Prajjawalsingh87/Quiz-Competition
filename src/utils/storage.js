// Tiny localStorage wrapper. Every access is guarded so private mode / blocked storage never crashes the app.
const HISTORY_KEY = 'aiquiz.history';
const USER_KEY = 'aiquiz.user';
const MISTAKES_KEY = 'aiquiz.mistakes';

const read = (key, fallback) => {
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const write = (key, value) => {
    try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage unavailable — keep running with in-memory state.
    }
};

export const loadHistory = () => {
    const list = read(HISTORY_KEY, []);
    return Array.isArray(list) ? list : [];
};

export const saveResult = (result) => {
    const next = [result, ...loadHistory()].slice(0, 50);
    write(HISTORY_KEY, next);
    return next;
};

export const clearHistory = () => write(HISTORY_KEY, null);

// Questions the player got wrong (or ran out of time on). A correct answer later removes it again.
export const loadMistakes = () => {
    const list = read(MISTAKES_KEY, []);
    return Array.isArray(list) ? list.filter((m) => m && typeof m.q === 'string' && typeof m.topicId === 'string') : [];
};

// answers: [{ question, topicId, correct }]
export const updateMistakes = (answers) => {
    const byQuestion = new Map(loadMistakes().map((m) => [m.q, m]));
    answers.forEach((a) => {
        if (!a.topicId) return;
        if (a.correct) byQuestion.delete(a.question);
        else byQuestion.set(a.question, { q: a.question, topicId: a.topicId, missedAt: new Date().toISOString() });
    });
    const next = [...byQuestion.values()].slice(-100);
    write(MISTAKES_KEY, next.length ? next : null);
    return next;
};

export const clearMistakes = () => write(MISTAKES_KEY, null);

export const loadUser = () => read(USER_KEY, null);
export const saveUser = (user) => write(USER_KEY, user);

export const getStats = (history) => {
    if (!history.length) return { played: 0, best: 0, accuracy: 0, totalScore: 0 };
    const correct = history.reduce((acc, r) => acc + r.correct, 0);
    const total = history.reduce((acc, r) => acc + r.total, 0);
    return {
        played: history.length,
        best: Math.max(...history.map((r) => r.score)),
        accuracy: total ? Math.round((correct / total) * 100) : 0,
        totalScore: history.reduce((acc, r) => acc + r.score, 0),
    };
};

export const formatDate = (iso) => {
    try {
        return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
    } catch {
        return '';
    }
};
