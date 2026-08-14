'use strict';
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('./config');

const pool = config.db.connectionString
  ? new Pool({ connectionString: config.db.connectionString })
  : new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
    });

pool.on('error', (err) => console.error('[db] erro no pool:', err.message));

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
}

module.exports = {
  pool,
  init,
  query: (text, params) => pool.query(text, params),
};
