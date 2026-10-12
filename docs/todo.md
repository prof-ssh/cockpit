# Ajustar depois

Coisas que percebemos que precisam mudar, mas não agora. Cada item explica o problema e as
saídas possíveis; a decisão fica para quando formos atacar.

## [ ] Revisar o mecanismo de sync

### O problema

Hoje o sync faz tudo de uma vez, dentro da própria requisição HTTP:

```
POST /api/sync
  └─ busca TODAS as páginas da EVO  →  guarda tudo numa variável (memória)
  └─ confere tudo                   →  em memória
  └─ grava tudo                     →  numa transação só
  └─ responde
```

- **Memória:** o período inteiro fica na RAM. Um ano de vendas pode ser muito.
- **Requisição presa:** quem chamou espera até o fim. Um período grande pode estourar o tempo
  limite do navegador ou do servidor.
- **Nada no meio do caminho:** se a gravação falhar no fim, tudo que veio da EVO se perde e
  precisa ser buscado de novo.
- **Tudo ou nada:** uma transação só para o período inteiro vira um `INSERT` enorme.
- **Sem controle:** dá para disparar dois syncs ao mesmo tempo (não corrompe, mas repete trabalho).

### Saídas possíveis (da mais simples para a mais robusta)

1. **Processar por página.** Buscar uma página → conferir → gravar → próxima. A memória fica
   limitada a uma página (1000 vendas). Mudança pequena, mas a requisição continua presa.
2. **Sync em segundo plano (job).** A rota só registra o pedido e responde na hora
   (`202` + id da coleta); um worker processa; a tela consulta o andamento
   (`GET /api/coletas/:id`). Fila no próprio Postgres (ex.: `pg-boss`) ou no Redis (ex.: BullMQ).
3. **Tabela de chegada (staging).** Gravar o JSON cru da EVO numa tabela e processar a partir
   dela. Reprocessar não exige buscar de novo. Cuidado: o JSON cru tem dados pessoais (LGPD).
4. **Fluxo por eventos.** Cada etapa publica um evento ("página buscada", "venda recebida") e
   consumidores independentes tratam cada um, com tentativas por mensagem; o que falhar de vez
   cai numa fila de falhas. Mais robusto e escalável, e também o mais complexo (precisa de um
   broker: Redis, RabbitMQ…).

Dá para combinar: por exemplo, 1 + 2 já resolvem memória e requisição presa sem infra nova.

## [ ] Limpar e gerir as falhas do sync (`coleta_falhas`)

Desenho da tabela no [`plan.md`](plan.md). O que falta decidir:

- **Reprocessar:** como disparar (rota, botão na tela, junto do próximo sync?) usando
  `GET /api/v2/sales/{idSale}` da EVO e o mesmo caminho de conversão e gravação.
- **Limpeza:** se e quando apagar registros antigos, para a tabela não crescer para sempre.
  Opções: nunca apagar falha `pendente` e apagar as `resolvida` depois de X dias; apagar
  coletas antigas inteiras (as falhas vão junto); ou só manualmente.
- **Exportar:** como gerar a planilha com os IDs que falharam.
