'use strict';
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Extrai um ZIP com proteção contra "zip-slip" (path traversal) e zip-bomb.
function extractZip(zipPath, destDir, opts = {}) {
  const maxFiles = opts.maxFiles || 3000;
  const maxTotalBytes = opts.maxTotalBytes || 300 * 1024 * 1024;

  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  if (entries.length > maxFiles) {
    throw Object.assign(new Error('O ZIP tem arquivos demais.'), { status: 400 });
  }

  let total = 0;
  for (const entry of entries) {
    if (entry.isDirectory) continue;

    total += entry.header.size;
    if (total > maxTotalBytes) {
      throw Object.assign(new Error('O conteúdo descompactado do ZIP é grande demais.'), { status: 400 });
    }

    // Normaliza e bloqueia caminhos que tentam sair da pasta de destino
    const rel = path.normalize(entry.entryName).replace(/^([/\\])+/, '');
    const target = path.join(destDir, rel);
    const within = path.relative(destDir, target);
    if (within.startsWith('..') || path.isAbsolute(within)) {
      throw Object.assign(new Error('Entrada de ZIP insegura: ' + entry.entryName), { status: 400 });
    }

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, entry.getData());
  }
}

function walk(dir, baseDir, out) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp, baseDir, out);
    else out.push(path.relative(baseDir, fp).split(path.sep).join('/'));
  }
  return out;
}

// Descobre o arquivo de entrada: prioriza index.html mais raso; senão, o .html mais raso.
function findEntry(destDir) {
  const files = walk(destDir, destDir, []);
  const htmls = files.filter((f) => /\.html?$/i.test(f));
  if (!htmls.length) return null;
  const indexes = htmls.filter((f) => /(^|\/)index\.html?$/i.test(f));
  const pool = indexes.length ? indexes : htmls;
  pool.sort((a, b) => a.split('/').length - b.split('/').length || a.length - b.length);
  return pool[0];
}

// Procura uma capa opcional na mesma pasta do arquivo de entrada
function findCover(destDir, entry) {
  const dir = path.posix.dirname(entry);
  const names = ['cover.png', 'cover.jpg', 'cover.jpeg', 'thumbnail.png', 'thumbnail.jpg', 'capa.png', 'capa.jpg'];
  for (const n of names) {
    const rel = dir === '.' ? n : `${dir}/${n}`;
    if (fs.existsSync(path.join(destDir, rel.split('/').join(path.sep)))) return rel;
  }
  return null;
}

module.exports = { extractZip, findEntry, findCover };
