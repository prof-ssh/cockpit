# Plano — Arquitetura e decisões

## Arquitetura

```
        navegador
            │
┌─ docker compose ─────────┐
│           ▼              │
│  app (Next.js)           │
│   ├ páginas (React)      │
│   └ rotas /api/* ────────┼──▶ API EVO
│           │ SQL          │   (internet)
│           ▼              │
│  db (PostgreSQL)         │
└──────────────────────────┘
   (um em cada máquina)
```

| Peça | Tecnologia | Responsabilidade |
| --- | --- | --- |
| `db` | PostgreSQL 16 (imagem oficial) | Guarda vendas, itens e o histórico dos syncs. |
| `app` | Next.js + TypeScript + Prisma | As telas do cockpit e as rotas de API (sync com a EVO e leitura dos dados). |

O Next substitui o par Express + Vite: um único servidor Node entrega as páginas (o que o Vite
fazia) e as rotas de API (o que o Express fazia).

## Princípios de engenharia

O projeto é pequeno, mas a ideia é aplicar e aprender boas práticas:

- **Separação de responsabilidades:** cada parte do sistema tem um único trabalho.
- **Baixo acoplamento:** as partes se conhecem o mínimo possível. Dá para trocar uma (o banco,
  a fonte de dados, o front) sem reescrever as outras.
- **Dependência num sentido só:**

```
frontend ──HTTP──▶ backend ──▶ database
```

- o **frontend** nunca importa do backend nem do banco; só chama a API;
- o **backend** usa o database;
- o **database** não conhece ninguém.

### Estrutura de pastas

```
cockpit/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── docs/                 # contexto, plano, setup e tarefas
└── src/
    ├── app/              # porta de
    │   ├── page.tsx      # entrada do Next
    │   └── api/sync/
    │       └── route.ts
    │
    ├── frontend/
    │   ├── components/
    │   └── services/     # chamadas à API
    │
    ├── backend/
    │   ├── sync/
    │   │   ├── sync.service.ts
    │   │   └── sync.schema.ts
    │   ├── evo/
    │   │   └── evo.client.ts
    │   └── config/env.ts
    │
    └── database/
        ├── schema.prisma
        ├── migrations/
        ├── client.ts     # conector
        └── repositories/
            ├── vendas.repository.ts
            └── coletas.repository.ts
```

| Pasta | Responsabilidade |
| --- | --- |
| `app/` | Exigida pelo Next para descobrir telas e rotas. Só faz a ponte: `page.tsx` usa o `frontend/`, `route.ts` chama o `backend/`. |
| `frontend/` | Componentes de tela e chamadas HTTP à API. |
| `backend/` | Regras de negócio (`*.service.ts`), validação de entrada com Zod (`*.schema.ts`), integração com a EVO e leitura do `.env` (o app não sobe se faltar variável). |
| `database/` | Schema e migrations do Prisma, o conector e os repositories, únicos que falam com o banco. |

O `schema.prisma` fica em `src/database/` em vez do padrão `prisma/` na raiz, configurado no
`package.json`, para tudo do banco ficar num lugar só.

## Rotas da API

| Método | Rota | O que faz | Situação |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Confirma que o app está no ar e conectado ao banco. | Definida |
| `POST` | `/api/sync` | Busca as vendas de um período na EVO e grava no banco. | Definida |
| `GET` | `/api/coletas` | Histórico dos syncs (quando, período, resultado). | Proposta |
| `GET` | `/api/vendas...` | Leitura dos dados para o cockpit. | A definir com o escopo da v1 |

### `POST /api/sync`

Disparada manualmente, pelo cockpit ou por uma chamada HTTP. Aceita qualquer período.

```
Requisição: { "de": "2026-01-01", "ate": "2026-09-30" }
Resposta:   { "criadas": 12, "existentes": 340, "falhas": 0 }
```

| Passo | Camada | O que acontece |
| --- | --- | --- |
| 1 | `sync.schema.ts` | Valida as datas: obrigatórias, `AAAA-MM-DD`, `de` não depois de `ate`. |
| 2 | `evo.client.ts` | Chama a EVO com `dateSaleStart` / `dateSaleEnd` e Basic Auth, paginando com `take/skip` até página vazia ou HTTP 204. |
| 3 | `sync.service.ts` | Valida os registros: chaves inteiras, sem duplicatas, `idSale` do item igual ao da venda. |
| 4 | repositories | Grava numa transação, vendas e depois itens, com `createMany({ skipDuplicates: true })` (no Postgres, `ON CONFLICT DO NOTHING`). |
| 5 | `coletas.repository.ts` | Registra o resultado em `coletas`. |

A gravação (passos 3 a 5) não depende da EVO. Outra fonte de dados (importar um arquivo, por
exemplo) poderia reaproveitá-la.

## Banco de dados

| Tabela | Chave primária | Observações |
| --- | --- | --- |
| `vendas` | `idSale` | ID da EVO. |
| `itens_venda` | `idSaleItem` | ID da EVO; FK `idSale` → `vendas`. |
| `coletas` | gerada pelo banco | Histórico dos syncs: quando rodou, período, status e quantidades criadas, existentes e com falha. |

- As chaves de vendas e itens **são sempre os IDs da EVO**, nunca um autoincremento. É isso que
  torna o sync idempotente (rodar duas vezes não duplica nada) e faz as máquinas chegarem aos mesmos dados.
- Campos que chegam como objeto (`member`, `prospect`) ficam como `JSONB` por enquanto.
- Os campos e tipos são definidos a partir do JSON que a API EVO devolve.
- Os dados ficam num **volume** do Docker, para sobreviverem quando o container é recriado.
  É um volume nomeado (`cockpit-db`), guardado pelo próprio Docker fora do projeto (no Linux, em
  `/var/lib/docker/volumes/`), então nunca vai para o Git. Foi escolhido em vez de uma pasta do
  projeto porque funciona igual no Windows. **Cuidado:** `docker compose down -v` apaga o volume
  (e os dados); o `down` normal não.

## Fluxo de trabalho no Git

A `main` é sempre a versão estável e **não recebe commit direto**: tudo entra por Pull Request,
e o merge é feito no GitHub (regra configurada em [`setup.md`](setup.md)).

```
main ──────●──────────────●──────▶
      \   / merge (PR)   /
       feat/1.7-compose /
              \        /
               feat/2.1-prisma
```

1. Criar um branch a partir da `main` atualizada, um por tarefa: `feat/<tarefa>-<resumo>`
   (ex.: `feat/2.1-prisma`). Correções usam `fix/`, documentação usa `docs/`.
2. Commits pequenos, cada um com uma mudança só.
3. `git push` do branch e abrir o PR para a `main`.
4. Revisar o diff no GitHub e clicar em **Merge**.
5. Voltar para a `main`, `git pull` e apagar o branch.

O repositório é **público**: nenhum segredo entra no Git, só no `.env`.

## Rodando nas duas máquinas

- O mesmo `docker compose up` precisa funcionar no Linux e no Windows.
- No Windows: **Docker Desktop + WSL2**.
- `.gitattributes` padroniza as quebras de linha (LF), senão os scripts quebram dentro do container.
- Cada máquina tem o seu `.env`, que nunca vai para o Git (só o `.env.example`).

## Ideias para depois

- **Agendamento:** um sync automático periódico, reaproveitando a mesma rota.
- **Importar arquivo:** uma rota de upload que usa o mesmo serviço de gravação do sync.
- **Atualizações:** tratar vendas alteradas ou removidas na EVO, em vez de só ignorar as existentes.

## Conceitos

- **Docker / container:** empacota o programa e tudo de que ele precisa, para rodar igual em qualquer máquina.
- **Imagem vs container:** a imagem é a receita (definida num `Dockerfile`); o container é a receita em execução.
- **docker compose:** descreve vários containers juntos; `docker compose up` sobe tudo.
- **Volume:** pasta persistente do Docker; sem ele, os dados do Postgres somem ao recriar o container.
- **`.env`:** senhas e configurações fora do código.
- **API REST:** URLs que devolvem JSON (ex.: `POST /api/sync`); as telas chamam essas URLs.
- **Next.js:** framework React fullstack. Cada `page.tsx` em `src/app/` vira uma tela, e cada
  `route.ts` em `src/app/api/` vira uma rota de API.
- **Prisma:** ORM do projeto. As tabelas são descritas no `schema.prisma`, e o Prisma gera as
  migrations e um cliente tipado para o TypeScript.
- **Migration:** arquivo versionado que cria ou altera tabelas, para todo mundo ter o banco igual
  (`prisma migrate dev` cria, `prisma migrate deploy` aplica).
- **Idempotente:** pode rodar várias vezes com o mesmo resultado (`ON CONFLICT DO NOTHING`).
