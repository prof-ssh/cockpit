# Contexto — TheSen5es Cockpit

Visão rápida do projeto. Detalhes em [`plan.md`](plan.md) (arquitetura e decisões) e
[`task.md`](task.md) (tarefas para executar) e [`todo.md`](todo.md) (o que ajustar depois).

## O que é

Um cockpit para acompanhar as vendas da academia. Os dados vêm da API EVO, ficam num banco
PostgreSQL e são exibidos numa interface web. Tudo roda com Docker.

## Ponto de partida

Existe um projeto anterior, `TheSen5es (gerador de arquivos)`: scripts Python que coletam as
vendas da EVO e geram `vendas.csv` e `itens_venda.csv`. **Não vamos seguir esse modelo.** O
cockpit é um projeto novo, sem CSVs nem scripts: o backend grava direto no banco.

Do projeto anterior aproveitamos só o conhecimento:

- como chamar a API EVO (Basic Auth, `dateSaleStart` / `dateSaleEnd`, paginação `take/skip`);
- os campos das entidades e as chaves: `idSale` (vendas) e `idSaleItem` (itens, com FK `idSale`);
- as regras de validação e a de "inserir se não existir, ignorar se existir".

## Decisões tomadas

- **Linguagem:** TypeScript.
- **Framework:** Next.js, com as telas e a API num projeto só.
- **Banco:** PostgreSQL, acessado pelo **Prisma** (ORM e migrations).
- **Cada máquina roda localmente** o seu próprio ambiente (Linux e Windows), com o seu próprio banco.
- **Sync = EVO → banco local.** O backend busca as vendas direto na EVO e grava no banco, sem
  arquivos intermediários. As máquinas não conversam entre si: como as chaves são os IDs da EVO,
  todas chegam aos mesmos dados.
- **O sync é manual e por período:** quem dispara escolhe as datas (qualquer intervalo).
- **Sem agendamento por enquanto.**
- **Repositório público no GitHub,** com a `main` protegida: tudo entra por Pull Request.

## Em aberto

1. Escopo do cockpit v1: o que mostrar (KPIs, gráficos, listagem com filtros, histórico dos syncs, login?).
2. Vendas alteradas ou removidas na EVO: hoje a regra ignora registros que já existem.
