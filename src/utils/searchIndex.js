import MiniSearch from 'minisearch';
import { formatDate } from './storage';

// One MiniSearch index over topics, questions and the player's past games.
// Pure helpers so the ranking can be tested in Node without a browser.

// Topics edge out questions and past games when they match equally well.
const TYPE_BOOST = { topic: 1.5, question: 1, game: 0.9 };

const SEARCH_OPTIONS = {
    boost: { title: 3, topic: 1.5 },
    boostDocument: (_id, _term, stored) => TYPE_BOOST[stored?.type] ?? 1,
    prefix: true,
    fuzzy: 0.2,
};

export const buildDocuments = (topics, history = []) => {
    const docs = [];

    topics.forEach((t) => {
        docs.push({
            id: `topic:${t.id}`,
            type: 'topic',
            topicId: t.id,
            title: t.name,
            text: t.description,
            topic: '',
            meta: `${t.questions.length} questions`,
        });

        t.questions.forEach((item, i) => {
            docs.push({
                id: `question:${t.id}:${i}`,
                type: 'question',
                topicId: t.id,
                title: item.q,
                text: `${item.options.join(' ')} ${item.explain || ''}`,
                topic: t.name,
                meta: t.name,
            });
        });
    });

    history.forEach((r) => {
        if (!r || !r.id) return;
        const pct = r.total ? Math.round((r.correct / r.total) * 100) : 0;
        const where = r.roomCode ? `Room ${r.roomCode}` : 'Solo practice';
        docs.push({
            id: `game:${r.id}`,
            type: 'game',
            gameId: r.id,
            topicId: r.topicId,
            title: r.topicName || 'Quiz',
            text: `${where} ${r.score} points ${(r.missed || []).join(' ')}`,
            topic: '',
            meta: `${r.correct}/${r.total} · ${pct}% · ${formatDate(r.date)}`,
        });
    });

    return docs;
};

export const createSearchIndex = (topics, history = []) => {
    const index = new MiniSearch({
        fields: ['title', 'text', 'topic'],
        storeFields: ['type', 'topicId', 'gameId', 'title', 'meta'],
        searchOptions: SEARCH_OPTIONS,
    });
    index.addAll(buildDocuments(topics, history));
    return index;
};

// Every word must match first (precise); fall back to any word so typos in long queries still find something.
export const searchAll = (index, query, limit = 8) => {
    const q = query.trim();
    if (!q) return [];
    let hits = index.search(q, { combineWith: 'AND' });
    if (hits.length === 0) hits = index.search(q, { combineWith: 'OR' });
    return hits.slice(0, limit);
};

// Where a result should take the player.
export const hrefFor = (hit) => {
    if (hit.type === 'game') return `/history#game-${hit.gameId}`;
    return `/quiz?topic=${hit.topicId}`;
};
