'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const db = require('./db');
const util = require('./lib/util');

const app = express();

// Atrás de um proxy reverso (Nginx/Traefik) — necessário p/ cookies "secure" e IP real
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

util.ensureDirs();

// Versão dos assets estáticos → quebra o cache do navegador quando css/js mudam
const assetVer = (() => {
  try {
    const files = ['css/style.css', 'js/app.js'].map((f) =>
      fs.statSync(path.join(__dirname, '..', 'public', f)).mtimeMs);
    return Math.floor(Math.max(...files)).toString(36);
  } catch (_) { return Date.now().toString(36); }
})();

app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

// ---- Arquivos crus dos jogos (SEM o CSP do app; rodam em iframe sandbox) ----
app.use('/g', require('./routes/play'));

// ---- Segurança do restante do app ----
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'media-src': ["'self'", 'https:'],
      'frame-src': ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com',
        ...(config.gamesOrigin ? [config.gamesOrigin] : [])],
      'connect-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'frame-ancestors': ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

app.use(express.urlencoded({ extended: false }));

// Estáticos do site e imagens enviadas
app.use('/static', express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' }));
app.use('/m/fotos', express.static(config.storage.photos, { index: false, maxAge: '7d' }));

app.use(session({
  name: 'mwtech.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

// Variáveis disponíveis em todas as views
app.use((req, res, next) => {
  res.locals.isAdmin = !!(req.session && req.session.isAdmin);
  res.locals.gamesOrigin = config.gamesOrigin;
  res.locals.ver = assetVer;
  next();
});

app.use(rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

// ---- Rotas ----
app.use('/', require('./routes/pages'));
app.use('/jogos', require('./routes/games'));
app.use('/fotos', require('./routes/photos'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('mensagem', {
    title: 'Não encontrado', active: null,
    heading: '404', text: 'Página não encontrada.', backLink: '/',
  });
});

// Tratamento de erros
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[erro]', err.message);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
  const text = err.code === 'LIMIT_FILE_SIZE'
    ? `Arquivo grande demais. Limite: ${config.maxUploadBytes / (1024 * 1024)} MB.`
    : (err.message || 'Erro inesperado.');
  res.status(status).render('mensagem', {
    title: 'Erro', active: null, heading: 'Ops!', text, backLink: '/',
  });
});

async function start() {
  try {
    await db.init();
    console.log('[db] conectado e schema pronto');
  } catch (e) {
    console.warn('[db] AVISO: não foi possível inicializar o banco:', e.message);
    console.warn('     Configure o PostgreSQL no .env — jogos/fotos falharão até lá. Páginas estáticas funcionam.');
  }
  app.listen(config.port, config.bindHost, () =>
    console.log(`MW Tech rodando em http://${config.bindHost}:${config.port}`));
}

start();
