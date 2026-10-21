import pg from 'pg';

// A node-postgres client with the same surface the API uses from Neon's HTTP driver:
// sql`...` tagged templates (lazy, resolve to rows), sql.query(text, params) and sql.transaction([...]).
// Lets the tests run the real SQL against a local/CI Postgres.
export const createPgSql = (connectionString) => {
    const pool = new pg.Pool({ connectionString, max: 4 });

    const sql = (strings, ...values) => {
        const text = strings.reduce((acc, part, i) => `${acc}$${i}${part}`);
        return {
            text,
            values,
            then(resolve, reject) {
                return pool.query(text, values).then((r) => r.rows).then(resolve, reject);
            },
        };
    };

    sql.query = (text, params = []) => pool.query(text, params).then((r) => r.rows);

    sql.transaction = async (queries) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const results = [];
            for (const q of queries) results.push((await client.query(q.text, q.values)).rows);
            await client.query('COMMIT');
            return results;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    };

    sql.end = () => pool.end();
    return sql;
};
