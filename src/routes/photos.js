'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');

const config = require('../config');
const db = require('../db');
const util = require('../lib/util');
const { photoUpload } = require('../lib/uploads');

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitos envios em pouco tempo. Tente novamente mais tarde.',
});

// Galeria
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT caption, author, filename, created_at
         FROM photos WHERE hidden = false
         ORDER BY created_at DESC LIMIT 500`
    );
    res.render('fotos-lista', { title: 'Fotos', active: 'fotos', photos: rows });
  } catch (e) { next(e); }
});

// Formulário
router.get('/enviar', (req, res) =>
  res.render('fotos-enviar', { title: 'Enviar foto', active: 'fotos', maxMb: config.maxUploadBytes / (1024 * 1024) }));

// Recebe o envio
router.post('/enviar', uploadLimiter, (req, res, next) => {
  photoUpload.single('arquivo')(req, res, (err) => {
    if (err) return next(err);
    handleUpload(req, res, next);
  });
});

async function handleUpload(req, res, next) {
  let tmpPath = req.file && req.file.path;
  try {
    if (!req.file) throw Object.assign(new Error('Selecione uma imagem'), { status: 400 });

    const type = util.imageType(tmpPath);
    if (!type) throw Object.assign(new Error('O arquivo não é uma imagem válida (JPG, PNG, GIF ou WEBP).'), { status: 400 });

    const caption = (req.body.legenda || '').trim() || null;
    const author = (req.body.autor || '').trim() || null;

    const filename = `${util.randomId(24)}.${type.ext}`;
    const dest = path.join(config.storage.photos, filename);
    fs.renameSync(tmpPath, dest);
    tmpPath = null; // já movido

    await db.query(
      `INSERT INTO photos (caption, author, filename, storage_path, mime, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [caption, author, filename, dest, type.mime, util.hashIp(req.ip)]
    );

    res.redirect('/fotos');
  } catch (e) {
    next(e);
  } finally {
    if (tmpPath) fs.promises.unlink(tmpPath).catch(() => {});
  }
}

module.exports = router;
