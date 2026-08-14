'use strict';
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  let games = [];
  let photos = [];
  try {
    games = (await db.query(
      `SELECT id, title, author, slug, cover_path, kind, created_at
         FROM games WHERE hidden = false ORDER BY created_at DESC LIMIT 10`)).rows;
    photos = (await db.query(
      `SELECT caption, author, filename, created_at
         FROM photos WHERE hidden = false ORDER BY created_at DESC LIMIT 12`)).rows;
  } catch (e) {
    // Banco indisponível: a home ainda renderiza (estado inicial)
  }
  res.render('home', { title: 'MW Tech', active: 'home', games, photos });
});

router.get('/dicas/ia', (req, res) =>
  res.render('dicas-ia', { title: 'Dicas de IA', active: 'ia' }));

router.get('/dicas/vr', (req, res) =>
  res.render('dicas-vr', { title: 'Dicas de Realidade Virtual', active: 'vr' }));

router.get('/dicas/alexa', (req, res) =>
  res.render('dicas-alexa', { title: 'Dicas de Alexa', active: 'alexa' }));

module.exports = router;
