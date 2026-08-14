-- =====================================================================
-- ISOLAMENTO DO BANCO — rode UMA vez como superusuário do PostgreSQL.
-- Ex.:  sudo -u postgres psql -f db/init.sql
--
-- Cria um banco e um usuário DEDICADOS ao MW Tech, sem misturar com o
-- Evolution ou qualquer outro projeto que já exista no mesmo PostgreSQL.
-- Troque a senha abaixo antes de rodar!
-- =====================================================================

-- 1) Usuário exclusivo do projeto
CREATE ROLE mwtech WITH LOGIN PASSWORD 'senha-forte-do-banco';

-- 2) Banco exclusivo, pertencente a esse usuário
CREATE DATABASE mwtech OWNER mwtech;

-- 3) Ninguém além do dono conecta neste banco
REVOKE ALL ON DATABASE mwtech FROM PUBLIC;
GRANT CONNECT ON DATABASE mwtech TO mwtech;

-- ---------------------------------------------------------------------
-- 4) (RECOMENDADO) Impedir que o usuário mwtech enxergue OUTROS bancos.
--    Por padrão o PostgreSQL deixa qualquer usuário CONECTAR em qualquer
--    banco. Para blindar os projetos existentes, revogue o CONNECT
--    público deles. Rode uma linha por banco que você já tem, ex.:
--
--    REVOKE CONNECT ON DATABASE evolution FROM PUBLIC;
--
--    (Os donos e superusuários continuam com acesso normal.)
-- ---------------------------------------------------------------------
