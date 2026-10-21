import { neon } from '@neondatabase/serverless';

// One SQL client per function instance. Uses Neon's HTTP driver against the *pooled* DATABASE_URL,
// which suits short-lived serverless invocations (no socket to keep open).
// Tests swap in a node-postgres backed client with the same shape via setSql().
let sqlClient = null;
let schemaReady = null;

export const setSql = (client) => {
    sqlClient = client;
    schemaReady = null;
};

export const getSql = () => {
    if (!sqlClient) {
        const url = process.env.DATABASE_URL;
        if (!url) throw Object.assign(new Error('DATABASE_URL is not configured'), { status: 503, expose: true, publicMessage: 'The game server is not configured yet.' });
        sqlClient = neon(url);
    }
    return sqlClient;
};

// Idempotent schema, created on the first request each instance handles. Times are epoch milliseconds
// (BIGINT) taken from the function's clock so that all game timing uses a single time source.
const SCHEMA = [
    `CREATE TABLE IF NOT EXISTS rooms (
        code TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        questions JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'lobby',
        question_index INT NOT NULL DEFAULT 0,
        question_started_at BIGINT,
        reveal_at BIGINT,
        created_at BIGINT NOT NULL,
        expires_at BIGINT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS rooms_expires_idx ON rooms (expires_at)`,
    `CREATE TABLE IF NOT EXISTS room_players (
        id TEXT PRIMARY KEY,
        room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
        nickname TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        is_host BOOLEAN NOT NULL DEFAULT FALSE,
        joined_at BIGINT NOT NULL,
        last_seen BIGINT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS room_players_nickname_idx ON room_players (room_code, lower(nickname))`,
    `CREATE TABLE IF NOT EXISTS room_answers (
        room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
        player_id TEXT NOT NULL REFERENCES room_players(id) ON DELETE CASCADE,
        question_index INT NOT NULL,
        choice INT,
        correct BOOLEAN NOT NULL,
        points INT NOT NULL,
        answer_ms INT NOT NULL,
        PRIMARY KEY (room_code, player_id, question_index)
    )`,
    `CREATE TABLE IF NOT EXISTS scores (
        id BIGSERIAL PRIMARY KEY,
        nickname TEXT NOT NULL,
        topic_id TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        score INT NOT NULL,
        correct INT NOT NULL,
        total INT NOT NULL,
        duration_ms INT NOT NULL,
        ip_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS scores_rank_idx ON scores (score DESC, duration_ms ASC)`,
    `CREATE INDEX IF NOT EXISTS scores_filter_idx ON scores (topic_id, difficulty, score DESC)`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        window_start BIGINT NOT NULL,
        count INT NOT NULL
    )`,
];

// Two cold instances can race on CREATE ... IF NOT EXISTS (Postgres may then raise a duplicate
// catalog error). The loser simply retries once, by which time the objects exist.
const isCreateRace = (err) => ['23505', '42P07', '42710'].includes(err?.code);

const createSchema = async (sql) => {
    for (const statement of SCHEMA) {
        try {
            await sql.query(statement);
        } catch (err) {
            if (!isCreateRace(err)) throw err;
            await sql.query(statement);
        }
    }
};

export const db = async () => {
    const sql = getSql();
    if (!schemaReady) {
        schemaReady = createSchema(sql).catch((err) => {
            schemaReady = null;
            throw err;
        });
    }
    await schemaReady;
    return sql;
};
