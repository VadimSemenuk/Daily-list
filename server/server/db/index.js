const { Pool } = require('pg');
const db = require('../config').db;
const named = require('node-postgres-named');

const pool = new Pool({
    user    : db.user,
    host    : db.host,
    database: db.database,
    password: db.password,
    port    : db.port
});

let _pool = {
    query : pool.query.bind(pool),
    client: async function () {
        let client;
        client = await pool.connect();
        named.patch(client);
        return client;
    }
};

named.patch(_pool);

module.exports = _pool;