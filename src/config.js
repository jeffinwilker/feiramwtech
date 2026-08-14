'use strict';
const path = require('path');
require('dotenv').config();

const root = path.resolve(__dirname, '..');
const storageDir = path.isAbsolute(process.env.STORAGE_DIR || '')
  ? process.env.STORAGE_DIR
  : path.resolve(root, process.env.STORAGE_DIR || './storage');

module.exports = {
  root,
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3210', 10),
  bindHost: process.env.BIND_HOST || '127.0.0.1',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-troque-isto',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  ipSalt: process.env.IP_SALT || process.env.SESSION_SECRET || 'mwtech-salt',
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_MB || '50', 10) * 1024 * 1024,
  gamesOrigin: (process.env.GAMES_ORIGIN || '').replace(/\/+$/, ''),
  storage: {
    dir: storageDir,
    games: path.join(storageDir, 'games'),
    photos: path.join(storageDir, 'photos'),
    tmp: path.join(storageDir, 'tmp'),
  },
  db: {
    connectionString: process.env.DATABASE_URL || null,
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'mwtech',
    user: process.env.PGUSER || 'mwtech',
    password: process.env.PGPASSWORD || '',
  },
};
