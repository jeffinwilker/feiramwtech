'use strict';
// Serve os ARQUIVOS CRUS dos jogos enviados pelos usuários.
// Montado ANTES do helmet: os jogos têm seus próprios scripts inline e rodam
// dentro de um iframe com sandbox (origem nula), então ficam isolados do app.
const path = require('path');
const express = require('express');
const config = require('../config');

const router = express.Router();

router.get('/:slug/*', (req, res) => {
  const slug = String(req.params.slug).replace(/[^a-z0-9-]/gi, '');
  if (!slug) return res.status(404).end('Jogo não encontrado');

  const rel = req.params[0] || 'index.html';
  const base = path.join(config.storage.games, slug);
  const target = path.resolve(base, rel);
  const within = path.relative(base, target);
  if (within.startsWith('..') || path.isAbsolute(within)) {
    return res.status(403).end('Caminho inválido');
  }

  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(target, (err) => {
    if (err) res.status(404).end('Arquivo não encontrado');
  });
});

// /g/:slug  ->  entrada padrão
router.get('/:slug', (req, res) => {
  const slug = String(req.params.slug).replace(/[^a-z0-9-]/gi, '');
  res.redirect(`/g/${slug}/index.html`);
});

module.exports = router;
