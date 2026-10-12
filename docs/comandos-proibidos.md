# Comandos proibidos

Comandos que apagam dados ou trabalho **sem volta**. Não rodar no dia a dia. Se um dia for
preciso, é de propósito, sabendo o que se perde.

## Banco (Docker)

| Comando | O que apaga | Use no lugar |
| --- | --- | --- |
| `docker compose down -v` | O volume `cockpit-db`: **todos os dados do banco**. | `docker compose down` (sem `-v`) |
| `docker volume rm cockpit-db` | O mesmo: o volume com os dados. | — |
| `docker volume prune` | Todos os volumes sem container ligado, inclusive o `cockpit-db` se o banco estiver parado. | — |
| `docker system prune --volumes` | Containers, imagens **e volumes** parados. | `docker system prune` (sem `--volumes`) |

## Banco (Prisma)

| Comando | O que apaga | Use no lugar |
| --- | --- | --- |
| `npx prisma migrate reset` | Apaga o banco inteiro e recria do zero. | `npx prisma migrate dev` |
| `npx prisma db push --force-reset` | O mesmo: apaga tudo para aplicar o schema. | `npx prisma migrate dev` |

## Git

| Comando | O que apaga | Use no lugar |
| --- | --- | --- |
| `git reset --hard` | Alterações ainda não commitadas. | `git stash` (guarda para depois) |
| `git clean -fd` | Arquivos novos ainda não adicionados ao Git. | Conferir antes com `git clean -n` |
| `git push --force` | Commits do remoto. Na `main` o GitHub já bloqueia. | `git push` |
| `git add .env` / `git add -f` | Não apaga, mas **publica segredos** (o repositório é público). | Só o `.env.example` vai para o Git |
