'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');

fs.mkdirSync(config.storage.tmp, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.storage.tmp),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, crypto.randomBytes(16).toString('hex') + ext);
  },
});

// fieldSize permite colar HTML grande no campo de texto (não só arquivo)
const limits = { fileSize: config.maxUploadBytes, files: 1, fieldSize: config.maxUploadBytes };

const gameUpload = multer({
  storage,
  limits,
  fileFilter: (req, file, cb) => {
    if (!file.originalname) return cb(null, false); // campo de arquivo vazio: ignora (vão colar o HTML)
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.zip', '.html', '.htm'].includes(ext)) cb(null, true);
    else cb(Object.assign(new Error('Envie um arquivo .zip ou .html'), { status: 400 }));
  },
});

const photoUpload = multer({
  storage,
  limits,
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(Object.assign(new Error('Envie uma imagem JPG, PNG, GIF ou WEBP'), { status: 400 }));
  },
});

module.exports = { gameUpload, photoUpload };
