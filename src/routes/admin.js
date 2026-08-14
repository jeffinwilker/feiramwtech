'use strict';
const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');

const config = require('../config');
const db = require('../db');
const util = require('../lib/util');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas de login. Aguarde alguns minutos.',
});

router.get('/login', (req, res) => res.render('admin-login', { title: 'Admin', active: null, error: null }));

router.post('/login', loginLimiter, (req, res) => {
  const senha = req.body.senha || '';
  if (senha && senha === config.adminPassword) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.status(401).render('admin-login', { title: 'Admin', active: null, error: 'Senha incorreta.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const games = (await db.query(
      'SELECT id, title, author, slug, created_at FROM games ORDER BY created_at DESC LIMIT 500')).rows;
    const photos = (await db.query(
      'SELECT id, caption, author, filename, created_at FROM photos ORDER BY created_at DESC LIMIT 500')).rows;
    res.render('admin-dashboard', { title: 'Painel', active: null, games, photos });
  } catch (e) { next(e); }
});

router.post('/jogos/:id/apagar', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT storage_path FROM games WHERE id = $1', [req.params.id]);
    if (rows.length) {
      util.rmrf(rows[0].storage_path);
      await db.query('DELETE FROM games WHERE id = $1', [req.params.id]);
    }
    res.redirect('/admin');
  } catch (e) { next(e); }
});

router.post('/fotos/:id/apagar', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT storage_path FROM photos WHERE id = $1', [req.params.id]);
    if (rows.length) {
      try { fs.unlinkSync(rows[0].storage_path); } catch (_) { /* já pode ter sumido */ }
      await db.query('DELETE FROM photos WHERE id = $1', [req.params.id]);
    }
    res.redirect('/admin');
  } catch (e) { next(e); }
});

module.exports = router;
