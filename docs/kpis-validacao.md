# KPIs: o que precisamos da EVO

Investigação de 12/10/2026 para saber se os dados sustentam o dashboard do [`kpis.md`](kpis.md).

## Resumo

A chave da API da EVO hoje só acessa **vendas** (`/api/v2/sales`). Com vendas já dá para montar
a faixa de sync e as **entradas**. Todo o resto (saídas, saldo, churn, vencimentos e previsão
de saídas) depende da **data de fim do contrato**. As vendas não trazem essa data, e a rota
da EVO que traz responde `403` (sem permissão) para a nossa chave.

**Pedido para a EVO:** liberar leitura (`GET`) nestas rotas:

| Prioridade | Rota | Para quê |
| --- | --- | --- |
| **Essencial** | `/api/v3/membermembership` | Lista os contratos com fim, cancelamento e status |
| Importante | `/api/v3/membership` | Cadastro dos planos, com a duração de cada um |
| Opcional | `/api/v1/membermembership/{idMemberMembership}` | Um contrato em detalhe: trancamentos, renovação automática, próxima cobrança |

Só a essencial já destrava o dashboard inteiro.

## Campos de cada rota

Nomes exatamente como no Swagger da EVO. **Essencial** = o dashboard precisa; Útil = pode
servir agora ou depois; Ignorar = não vamos guardar.

### 1. `GET /api/v3/membermembership` (lista de contratos): essencial

Filtros: `idMember`, `idMembership`, `registerDateStart/End`, `cancelDateStart/End`,
`statusMemberMembership` (1 ativo, 2 cancelado, 3 vencido, 4 trancado, 5 na fila), `take` (até
10.000) e `skip`. Não há filtro por data de fim: buscamos os contratos e filtramos no banco.

| Prioridade | Campo | Para que serve |
| --- | --- | --- |
| **Essencial** | `idMemberMemberShip` | ID do contrato. É o mesmo `idMemberMembership` que já temos nas vendas (a EVO escreve com "S" maiúsculo aqui) |
| **Essencial** | `idMember`, `name` | Liga o contrato ao aluno; o nome aparece na lista de vencimentos |
| **Essencial** | `idMembership`, `nameMembership` | O plano |
| **Essencial** | `membershipStart`, `membershipEnd` | Início e **fim**: base do churn, dos vencimentos e da previsão |
| **Essencial** | `cancelDate` | Cancelado antes do fim. Resolve as 76 multas de cancelamento que hoje não conseguimos ligar a nenhum contrato |
| **Essencial** | `statusMemberMembership` | Ativo, cancelado, vencido, trancado ou na fila |
| Útil | `reasonCancellation` | **Motivo do cancelamento**: por que as pessoas saem |
| Útil | `registerCancelDate` | Quando o cancelamento foi registrado (o `cancelDate` é quando ele vale) |
| Útil | `membershipSwapData` | Troca de plano. Hoje as trocas aparecem misturadas com as renovações |
| Útil | `membershipTrasnferData` | Transferência de contrato (a EVO escreve "Trasnfer" assim mesmo) |
| Útil | `idSale`, `saleDate`, `saleValue` | Liga o contrato à venda e mostra o valor |
| Útil | `numMembers` | Dependentes nos planos casal e família |
| Útil | `minPeriodStayMembership`, `cancellationFine` | Fidelidade mínima e multa |
| Ignorar | `memberDocument` | **CPF: não guardar** (LGPD; não precisamos dele) |
| Ignorar | `receivables`, `remainingValue` | Financeiro. Pode servir no futuro, não para o dashboard |
| Ignorar | `idMemberMigration`, `idSaleMigration`, `idBranch`, `idMembershipCategory` | Migração e unidade (a academia tem uma unidade só) |

### 2. `GET /api/v3/membership` (cadastro dos planos): importante

| Prioridade | Campo | Para que serve |
| --- | --- | --- |
| **Essencial** | `membershipType` | **Diz se o plano renova sozinho** ("recorrência mensal", "renovação automática"...). É de onde vem a coluna "Recorrência" |
| **Essencial** | `durationType`, `duration` | Duração do plano. Confere o fim dos contratos e resolve RESTRITO e VIP, que o nome não diz |
| **Essencial** | `idMembership`, `nameMembership` | Identificação |
| Útil | `inactive` | Plano que não é mais vendido |
| Útil | `value` | Preço de tabela |
| Útil | `contractSuspension`, `contractCancellation` | Regras de trancamento e cancelamento (vêm com `showSuspensionRules` e `showCancellationRules`) |
| Ignorar | `urlSale`, `htmlContract`, `turnstiles`, `accessBranches`, `activitiesGroups`, campos de promoção e de venda online | Não servem para o dashboard |

### 3. `GET /api/v1/membermembership/{idMemberMembership}` (um contrato em detalhe): opcional

Busca **um contrato por vez**: serve para investigar casos, não para o sync de todos.

| Campo | Para que serve |
| --- | --- |
| `freezes`, `numberSuspensionTimes` | Trancamentos: explicam por que o fim mudou |
| `flRenewed`, `idMemberMembershipRenewed` | Se foi renovado e qual contrato veio depois |
| `nextCharge`, `valueNextMonth` | Próxima cobrança: confirma a recorrência na prática |
| `loyaltyEndDate` | Fim da fidelidade |
| `cancelDateOn`, `cancelCreationDate` | Detalhes do cancelamento |

## Métrica por métrica

| Métrica | Dado necessário | Já temos? | Rota da EVO |
| --- | --- | --- | --- |
| Sincronizar dados | `coletas` (data do último sync) | ✅ | já usamos |
| Entradas por tipo | `vendas.registrationKind`, `itens_venda.idMembership` | ✅ (ver ressalvas) | já usamos |
| Saídas | fim do contrato, cancelamento | ❌ | `/api/v3/membermembership` |
| Saldo | entradas − saídas | ❌ (falta saídas) | `/api/v3/membermembership` |
| Churn por vencimento | fim do contrato + contrato seguinte do aluno | ❌ | `/api/v3/membermembership` |
| Previsão de entradas | histórico de entradas | ✅ | já usamos |
| Previsão de saídas | vencimentos × churn médio | ❌ | `/api/v3/membermembership` |
| Vencimentos 30/60/90 | fim do contrato, status | ❌ | `/api/v3/membermembership` |
| Recorrência | se o contrato renova sozinho | ⚠️ parcial | `/api/v3/membership` (tipo do plano) |
| Nome do aluno | `vendas.member` → `firstName` + `lastName` | ✅ | já usamos (também vem em `name` nos contratos) |
| Nome do plano | `itens_venda.item` | ✅ | já usamos (também vem em `nameMembership` nos contratos) |

## Por que não calcular o fim só com as vendas

Testamos o cálculo `membershipStartDate + duração do plano`:

- **Planos mensais funcionam:** em 119 de 143 renovações do mesmo plano, o contrato seguinte
  começa exatamente no dia seguinte ao fim calculado.
- **Cancelamentos ficam invisíveis:** houve 76 vendas de "MULTA DE CANCELAMENTO DE CONTRATO"
  no período, e as vendas não dizem qual contrato foi cancelado nem quando. O cálculo trataria
  esses alunos como ativos até o fim original.
- **Trancamentos estendem o fim** e não aparecem nas vendas.
- **Duração desconhecida:** só sabemos a duração pelo nome do plano (MENSAL, SEMESTRAL, ANUAL).
  RESTRITO e VIP não dizem.

**Recomendação:** buscar o fim na EVO (`/api/v3/membermembership`). Calcular erraria justamente
os alunos que saíram antes do fim, que são os que o churn precisa contar.

## Ressalvas no que já temos

- **"Renovação" mistura três coisas:** das 353 vendas `renewal`, 52 são cobranças mensais
  automáticas de planos com recorrência (`idSaleRecurrency` preenchido), 40 são trocas de plano
  e o resto são renovações de verdade (ou cujo contrato anterior é de antes de julho). Decidir se
  as cobranças automáticas contam como entrada.
- **`idSaleRecurrency` não diz que o contrato é recorrente:** só aparece nas cobranças mensais
  automáticas, não na venda que abriu o contrato. Para saber se o contrato é recorrente, usar o
  `membershipType` do plano.
- **Vendas removidas:** a busca normal da EVO não traz vendas removidas (nenhuma entrou no banco),
  mas uma venda removida *depois* do sync continua no banco. Em 2026 a EVO tem 374 vendas
  removidas (`removed: true`, com `removalDate`). O sync precisa rever as remoções com o filtro
  `removalDateStart/End`.
- **`registrationKind` nulo:** 515 vendas, quase todas sem item de contrato (day use, produtos,
  multas). Só 2 vendas com contrato vêm sem tipo e cairiam em "Outras".
- **`idMembershipRenewed`** liga a renovação ao contrato anterior (`idMemberMembership`): todas
  as 184 ligações encontradas no banco são do mesmo aluno.
- **`member.diasRenovacao` = 45** em todas as vendas: é a janela de renovação configurada na
  academia, e bate com a janela de churn de 45 dias do `kpis.md`.

## Dados usados

Sync de 01/07 a 12/10/2026, um mês por vez:

| Período | Criadas | Já existiam | Falhas |
| --- | --- | --- | --- |
| Julho | 442 | 0 | 0 |
| Agosto | 466 | 0 | 0 |
| Setembro | 414 | 0 | 0 |
| Outubro (até 12) | 126 | 20 | 0 |

## Quando a EVO liberar

Rodar `node scripts/validar-contratos-evo.mjs`. Ele confere o acesso às rotas, lista os planos
com a duração, mostra um exemplo de contrato (dados pessoais mascarados) e compara o fim
calculado com o da EVO em 20 contratos, dizendo por que os diferentes não bateram (cancelamento,
trancamento ou ajuste).
