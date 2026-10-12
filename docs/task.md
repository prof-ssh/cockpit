# Tarefas

Ordem de execução. Contexto em [`context.md`](context.md), arquitetura em [`plan.md`](plan.md),
preparo das máquinas em [`setup.md`](setup.md).

## Etapa 1 — Preparar o Git e o ambiente

- [x] 1.1 Criar o projeto Next com TypeScript (`create-next-app`, App Router, pasta `src/`) e as pastas
      `frontend/`, `backend/` e `database/` (ver `plan.md`).
- [x] 1.2 Revisar o `.gitignore` gerado (`.env`, `node_modules`, `.next`) e criar `.gitattributes` e `.env.example`.
- [x] 1.3 Criar a conta no GitHub (com 2FA) e cadastrar a chave SSH de cada máquina (ver [`setup.md`](setup.md)).
- [x] 1.4 `git init`, primeiro commit, criar o repositório **público** no GitHub (com push protection) e fazer o push via SSH.
- [x] 1.5 Proteger a `main` com um ruleset: só entra por Pull Request (ver [`setup.md`](setup.md)).
- [ ] 1.6 Instalar o Docker em cada máquina (passo a passo por sistema em [`setup.md`](setup.md)). Linux: ok.
- [ ] 1.7 Criar o `docker-compose.yml` só com o `db` e validar nas duas máquinas, já no fluxo de branch + PR.

## Etapa 2 — Montar o banco

- [x] 2.1 Instalar o Prisma em `src/database/` (`DATABASE_URL` no `.env`) e criar o conector `client.ts`.
- [x] 2.2 Definir os tipos SQL dos campos a partir do JSON que a API EVO devolve.
- [x] 2.3 Modelar no `schema.prisma`: `vendas` (PK `idSale`), `itens_venda` (PK `idSaleItem`, FK `idSale`) e `coletas`.
- [ ] 2.4 Gerar a primeira migration (`prisma migrate dev`) e aplicar no container.
- [x] 2.5 Configurar o volume e testar que os dados sobrevivem a `docker compose down` / `up`.
- [ ] 2.6 Criar os repositories de `vendas` (vendas e itens, com `createMany({ skipDuplicates: true })`) e `coletas`.

## Etapa 3 — Montar o backend (rotas de API do Next)

- [ ] 3.1 `Dockerfile` do app no compose e `config/env.ts` validando o `.env`.
- [ ] 3.2 Rota `GET /api/health`, testando a conexão com o banco.
- [ ] 3.3 `evo.client.ts`: Basic Auth, `dateSaleStart` / `dateSaleEnd`, paginação `take/skip`.
- [ ] 3.4 `sync.schema.ts` (Zod): `periodoInicio` e `periodoFim` obrigatórios, `AAAA-MM-DD`, `periodoInicio` não depois de `periodoFim`.
- [ ] 3.5 `sync.service.ts`: orquestra EVO → validação dos registros → repositories (vendas → itens numa
      transação) e registra em `coletas`.
- [ ] 3.6 Rota `POST /api/sync`, respondendo `{ criadas, existentes, falhas }`.
- [ ] 3.7 Conferir um período conhecido: as quantidades no banco batem com as da EVO.
- [ ] 3.8 Rotas de leitura para o cockpit (depende da 4.1).

## Etapa 4 — Montar o front (páginas do Next)

- [ ] 4.1 Definir o escopo da v1 e rabiscar as telas (pode ser feito em paralelo com a etapa 2).
- [ ] 4.2 Layout base do cockpit (menu e página inicial).
- [ ] 4.3 Tela de sync: dois campos de data, botão "Sincronizar" e o resultado.
- [ ] 4.4 Demais telas da v1.
- [ ] 4.5 Teste completo nas duas máquinas: `docker compose up` do zero, sync e visualização.
