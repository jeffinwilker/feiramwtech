'use strict';
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');

function ensureDirs() {
  for (const d of [config.storage.dir, config.storage.games, config.storage.photos, config.storage.tmp]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'jogo';
}

function randomId(n = 8) {
  return crypto.randomBytes(Math.ceil(n / 2)).toString('hex').slice(0, n);
}

function hashIp(ip) {
  return crypto.createHmac('sha256', config.ipSalt).update(String(ip || '')).digest('hex').slice(0, 32);
}

function rmrf(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch (_) { /* ignora */ }
}

function readMagic(p, n = 12) {
  const fd = fs.openSync(p, 'r');
  try {
    const b = Buffer.alloc(n);
    fs.readSync(fd, b, 0, n, 0);
    return b;
  } finally {
    fs.closeSync(fd);
  }
}

// Confere assinatura de arquivo ZIP (PK\x03\x04 etc.)
function isZip(p) {
  const b = readMagic(p, 4);
  return b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07);
}

// Detecta o tipo real da imagem pelos bytes (não confia no mimetype enviado)
function imageType(p) {
  const b = readMagic(p, 12);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png', mime: 'image/png' };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { ext: 'gif', mime: 'image/gif' };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { ext: 'webp', mime: 'image/webp' };
  return null;
}

module.exports = { ensureDirs, slugify, randomId, hashIp, rmrf, isZip, imageType };
