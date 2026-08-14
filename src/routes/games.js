'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const config = require('../config');
const db = require('../db');
const util = require('../lib/util');
const { gameUpload } = require('../lib/uploads');
const { extractZip, findEntry, findCover } = require('../lib/zipSafe');

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitos envios em pouco tempo. Tente novamente mais tarde.',
});

// Catálogo (com ordenação: recentes | populares | todos)
router.get('/', async (req, res, next) => {
  try {
    const sort = ['recentes', 'populares', 'todos'].includes(req.query.sort) ? req.query.sort : 'recentes';
    const order = sort === 'populares' ? 'plays DESC, created_at DESC' : 'created_at DESC';
    const { rows } = await db.query(
      `SELECT id, title, author, slug, cover_path, kind, created_at
         FROM games WHERE hidden = false
         ORDER BY ${order} LIMIT 300`
    );
    res.render('jogos-lista', { title: 'Jogos', active: 'jogos', games: rows, sort });
  } catch (e) { next(e); }
});

// Formulário de envio
router.get('/enviar', (req, res) =>
  res.render('jogos-enviar', { title: 'Enviar jogo', active: 'jogos', maxMb: config.maxUploadBytes / (1024 * 1024) }));

// Recebe o envio
router.post('/enviar', uploadLimiter, (req, res, next) => {
  gameUpload.single('arquivo')(req, res, (err) => {
    if (err) return next(err);
    handleUpload(req, res, next);
  });
});

async function handleUpload(req, res, next) {
  const tmpPath = req.file && req.file.path;
  let destDir = null;
  try {
    if (!req.file) throw Object.assign(new Error('Selecione um arquivo .zip ou .html'), { status: 400 });

    const title = (req.body.titulo || '').trim();
    const author = (req.body.autor || '').trim() || null;
    const description = (req.body.descricao || '').trim() || null;
    if (!title) throw Object.assign(new Error('Informe o título do jogo'), { status: 400 });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const slug = `${util.slugify(title)}-${util.randomId(6)}`;
    destDir = path.join(config.storage.games, slug);
    fs.mkdirSync(destDir, { recursive: true });

    let entry = 'index.html';
    let kind = 'single';
    let cover = null;

    if (ext === '.zip') {
      if (!util.isZip(tmpPath)) throw Object.assign(new Error('Arquivo ZIP inválido.'), { status: 400 });
      extractZip(tmpPath, destDir);
      entry = findEntry(destDir);
      if (!entry) throw Object.assign(new Error('O ZIP precisa conter um index.html (ou algum arquivo .html).'), { status: 400 });
      cover = findCover(destDir, entry);
      kind = 'zip';
    } else {
      fs.copyFileSync(tmpPath, path.join(destDir, 'index.html'));
      entry = 'index.html';
      kind = 'single';
    }

    const coverPath = cover ? `/g/${slug}/${cover}` : null;
    await db.query(
      `INSERT INTO games (title, author, description, slug, entry_file, kind, storage_path, cover_path, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [title, author, description, slug, entry, kind, destDir, coverPath, util.hashIp(req.ip)]
    );

    res.redirect(`/jogos/${slug}`);
  } catch (e) {
    if (destDir) util.rmrf(destDir);
    next(e);
  } finally {
    if (tmpPath) fs.promises.unlink(tmpPath).catch(() => {});
  }
}

// Página de jogar
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM games WHERE slug = $1 AND hidden = false', [req.params.slug]);
    if (!rows.length) return next();
    const game = rows[0];
    db.query('UPDATE games SET plays = plays + 1 WHERE id = $1', [game.id]).catch(() => {});
    const origin = config.gamesOrigin || '';
    const gameUrl = `${origin}/g/${game.slug}/${game.entry_file}`;
    res.render('jogos-play', { title: game.title, active: 'jogos', game, gameUrl });
  } catch (e) { next(e); }
});

module.exports = router;
