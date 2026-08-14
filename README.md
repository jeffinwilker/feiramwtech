# MW Tech

Portal da comunidade com 5 seções:

1. **Jogos** — qualquer pessoa envia um jogo em HTML (`.zip` com `index.html`, ou `.html` único) e ele aparece no catálogo público para todos jogarem.
2. **Fotos** — qualquer pessoa posta imagens numa galeria pública.
3. **Dicas de IA** — página estática com vídeo.
4. **Dicas de Realidade Virtual** — página estática.
5. **Dicas de Alexa** — página estática com vídeo.

Mais um **painel `/admin`** (com senha) para moderar/apagar jogos e fotos.

Stack: **Node.js + Express + EJS + PostgreSQL**. Feito para conviver no mesmo VPS que o Evolution API, **sem misturar os projetos** (banco e usuário dedicados).

---

## 1. Pré-requisitos

- Node.js 18+ (ou Docker)
- Um PostgreSQL acessível (pode ser o mesmo que o Evolution já usa)

## 2. Isolar o banco (importante)

Rode **uma vez**, como superusuário do Postgres, para criar um banco e um usuário exclusivos do MW Tech:

```bash
sudo -u postgres psql -f db/init.sql
```

> Edite a senha dentro de `db/init.sql` antes de rodar. O arquivo também mostra como
> **revogar o acesso público** aos outros bancos (ex.: `evolution`), blindando os projetos existentes.

O schema das tabelas (`games`, `photos`) é criado **automaticamente** na primeira inicialização do app.

## 3. Configurar

```bash
cp .env.example .env
```

Edite o `.env`:

- `SESSION_SECRET` — string aleatória grande.
- `ADMIN_PASSWORD` — senha do painel `/admin`.
- `PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD` — apontando para o banco `mwtech`.
- `MAX_UPLOAD_MB` — limite de tamanho por upload (padrão 50).
- `GAMES_ORIGIN` — (opcional, recomendado) subdomínio separado para servir os jogos, ex.: `https://jogos.seudominio.com`.

## 4. Rodar

### Opção A — Node direto

```bash
npm install
npm start
```

Acesse `http://localhost:3210`.

### Opção B — Docker

O `docker-compose.yml` sobe **apenas o app** e conecta no seu Postgres existente:

```bash
docker compose up -d --build
```

- Se o Postgres roda **no host** do VPS: no `.env` use `PGHOST=host.docker.internal`.
- Se o Postgres roda **em Docker** (junto do Evolution): descomente o bloco `networks` no `docker-compose.yml`, aponte para a rede do Postgres (veja com `docker network ls`) e no `.env` use `PGHOST=<nome-do-container-postgres>`.

## 5. Reverse proxy (Nginx)

Rode o MW Tech numa porta própria (`3210`) e publique num subdomínio, separado do Evolution:

```nginx
server {
    server_name mwtech.seudominio.com;

    client_max_body_size 60m;   # >= MAX_UPLOAD_MB

    location / {
        proxy_pass http://127.0.0.1:3210;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Depois habilite HTTPS (ex.: `certbot --nginx`). Com HTTPS, os cookies do admin já vão como `secure`.

## 6. Editar as páginas estáticas / vídeos

- Textos e vídeos ficam em `src/views/dicas-ia.ejs`, `dicas-vr.ejs`, `dicas-alexa.ejs`.
- Para o vídeo, troque `VIDEO_ID_AQUI` pelo ID do YouTube (em `https://youtu.be/XXXX`, o ID é o `XXXX`).

## 7. Segurança (resumo do que já vem pronto)

- Banco e usuário **isolados** do Evolution.
- Jogos enviados rodam dentro de um **`iframe` com `sandbox`** (origem nula) — não acessam cookies nem o resto do site.
- Upload com **limite de tamanho**, **checagem de tipo por magic bytes** e **proteção anti zip-slip**.
- **Rate limit** nos envios e no login do admin.
- Cabeçalhos de segurança via **Helmet/CSP**; senha do admin em sessão com cookie `httpOnly`.
- IP de quem posta é guardado só como **hash** (anti-spam), não em texto puro.

> **Recomendação forte para produção:** sirva os jogos de um **subdomínio separado** (`GAMES_ORIGIN`),
> ex.: `jogos.seudominio.com`. Assim o código enviado pelos usuários fica em outra origem,
> isolando de vez do domínio principal e do painel admin.

## Estrutura

```
src/
  server.js            # app Express, segurança, rotas
  config.js            # lê o .env
  db.js                # conexão PostgreSQL + schema
  routes/              # pages, games, photos, admin, play
  lib/                 # util, zipSafe (extração segura), uploads (multer)
  middleware/auth.js   # proteção do /admin
  views/               # telas EJS
public/                # css, js, favicon
db/                    # init.sql (isolamento) + schema.sql
storage/               # jogos e fotos enviados (fora do git)
```
